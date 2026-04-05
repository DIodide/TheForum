# Spec: Collaborative Filtering Engine

## Overview
Train an implicit feedback ALS (Alternating Least Squares) model on user-item interaction data and serve personalized recommendations via FastAPI endpoints. Based on research from TIG-212 (Yubi) and TIG-215 (Emilio).

## Requirements

### P0
- ALS training pipeline in FastAPI using `implicit` library
- Nightly training job producing user and item latent vectors (dimension 64)
- FastAPI endpoint: `POST /recommendations/feed` returning ranked event IDs with scores
- FastAPI endpoint: `POST /recommendations/similar` returning similar events for a given event
- Hybrid scoring: `0.4×CF + 0.25×content + 0.15×popularity + 0.1×time + 0.1×context`
- Next.js integration: call FastAPI from `getFeedEvents()` with graceful fallback to SQL scoring

### P1
- Cold-start handling for new users (< 10 interactions): attribute-based + popularity fallback
- Cold-start handling for new events (< 5 interactions): content-based + org-based fallback
- `POST /recommendations/users` endpoint for friend suggestions based on similar taste vectors
- Model versioning: store model timestamp and version in DB

### P2
- Incremental model updates (hourly mini-batch instead of full nightly retrain)
- Contextual reranking: boost by time-of-day patterns, campus region proximity
- Exploration/exploitation balance: inject 10% random candidates to avoid filter bubbles

## Training Pipeline

```
backends/fastapi/app/train.py
```

1. **Extract**: Query `interactions` table for last 180 days, join with `events` for active items
2. **Transform**: Build sparse `user × item` CSR matrix; apply time decay (`0.95^age_days`); filter users with < 3 interactions
3. **Train**: `implicit.als.AlternatingLeastSquares(factors=64, regularization=0.1, iterations=15)`
4. **Export**: Write user vectors to `user_preference_vectors.latent_vector`, item vectors to new `item_features` rows
5. **Validate**: Compute Precision@10 on held-out 10% test set; log to `pipeline_logs`

**Schedule**: `0 3 * * *` (nightly at 3 AM via cron hitting `POST /train/run`)

**Estimated training time**: < 30 seconds for 6K users × 1K items matrix.

## API Endpoints

### `POST /recommendations/feed`
```json
Request:  { "user_id": "uuid", "limit": 20, "exclude_ids": ["uuid", ...] }
Response: { "items": [{ "event_id": "uuid", "score": 0.87, "reason": "cf" }, ...],
            "model_version": "2026-03-18T03:00:00Z" }
```

### `POST /recommendations/similar`
```json
Request:  { "event_id": "uuid", "limit": 8 }
Response: { "items": [{ "event_id": "uuid", "similarity": 0.92 }, ...] }
```

### `POST /recommendations/users`
```json
Request:  { "user_id": "uuid", "limit": 10 }
Response: { "users": [{ "user_id": "uuid", "similarity": 0.85 }, ...] }
```

## Cold Start Logic

**New users** (interaction_count < 10):
```python
def cold_start_recommendations(user_id, limit):
    profile = get_user_profile(user_id)  # class_year, major, interests
    candidates = get_upcoming_events()

    scores = []
    for event in candidates:
        tag_match = len(set(profile.interests) & set(event.tags)) / max(len(profile.interests), 1)
        popularity = math.log(event.rsvp_count + 1)
        time_score = time_proximity(event.datetime)
        attr_boost = 0.3 if matches_class_year(profile, event) else 0

        score = 0.4 * tag_match + 0.3 * popularity + 0.2 * time_score + 0.1 * attr_boost
        scores.append((event.id, score))

    return sorted(scores, reverse=True)[:limit]
```

**New events** (< 5 interactions):
- Use content-based scoring (tag similarity to user preferences)
- Boost if user follows the organizing org
- Inherit popularity estimate from similar past events by same org

## Next.js Integration

```typescript
// apps/web/src/actions/events.ts
async function getFeedEvents(params) {
  const variant = cookies().get("forum_rec_variant")?.value ?? "sql";

  if (variant === "cf") {
    try {
      const res = await fetch(`${env.RECOMMENDATION_API_URL}/recommendations/feed`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId, limit: 20 }),
      });
      if (res.ok) {
        const { items } = await res.json();
        // Fetch full event data for the returned IDs
        return enrichEventIds(items.map(i => i.event_id));
      }
    } catch {
      // Fallback to SQL scoring
    }
  }

  // SQL scoring (existing + enhanced)
  return sqlScoredFeed(params);
}
```

## Dependencies

- `implicit>=0.7.0` — ALS and BPR
- `scipy>=1.11` — Sparse matrices
- `numpy>=1.25` — Numerical ops
- `psycopg2-binary` — Direct DB access for training

## Files

- `backends/fastapi/app/train.py` — Training pipeline
- `backends/fastapi/app/routers/recommendations.py` — API endpoints
- `backends/fastapi/app/models/recommender.py` — Model loading and inference
- `apps/web/src/actions/events.ts` — Integration with fallback
- `apps/web/src/env.ts` — Add `RECOMMENDATION_API_URL` env var

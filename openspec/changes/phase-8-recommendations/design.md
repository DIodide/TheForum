## Design Decisions

### Interaction Logging — Server Actions + Postgres

Log all implicit feedback directly from Next.js server actions into a Postgres `interactions` table. No separate analytics service needed at campus scale (~6K users).

**Interaction types and weights** (per Emilio's research):

| Type | Weight | Trigger |
|------|--------|---------|
| view | 1.0 | Event card enters viewport (IntersectionObserver, 1s threshold) |
| click | 2.0 | Click on event card or expand icon |
| save | 3.0 | Toggle save/bookmark |
| rsvp | 5.0 | Toggle RSVP |
| share | 2.0 | Share action |
| hide | -1.0 | Dismiss/not-interested action |

**Metadata captured per interaction:**
```json
{
  "source": "feed" | "search" | "map" | "notification" | "similar" | "direct",
  "position": 3,           // rank position in feed (for position bias correction)
  "dwell_ms": 1200,        // time spent on event detail page (for views)
  "query": "free boba"     // search query context (for search clicks)
}
```

**Why not a dedicated analytics service?**
- Campus scale (~6K users, ~100 events/week) means ~10K interactions/day max
- Postgres handles this easily; no need for Kafka/ClickHouse
- Keeps the stack simple — same DB, same ORM, same deployment

### Tag Weight Aggregation — Nightly Batch Job

A FastAPI cron job (or GitHub Actions trigger) computes per-user tag preference weights:

```python
# Pseudocode for tag weight computation
for each user:
    interactions = get_interactions(user_id, last_90_days)
    tag_scores = defaultdict(float)
    for interaction in interactions:
        age_days = (now - interaction.created_at).days
        decay = 0.95 ** age_days  # exponential time decay
        weight = interaction.interaction_value * decay
        for tag in get_event_tags(interaction.item_id):
            tag_scores[tag] += weight
    # Normalize to 0-1
    max_score = max(tag_scores.values(), default=1)
    normalized = {tag: score / max_score for tag, score in tag_scores.items()}
    upsert_user_preference_vector(user_id, tag_weights=normalized)
```

**Time decay:** `0.95^days` — interactions from 2 weeks ago retain ~48% weight; 1 month ago ~22%; 3 months ago ~0.8%. This naturally adapts to changing interests.

**Blend with onboarding:** For users with < 10 interactions, blend:
```
effective_weights = 0.7 × onboarding_interests + 0.3 × interaction_weights
```
Gradually shifts to 100% interaction-based as data grows.

### Enhanced SQL Scoring — Incremental Upgrade

Modify `getFeedEvents()` to use computed tag weights instead of static onboarding interests:

```
score = (3.0 × behavioral_interest_overlap)  // from user_preference_vectors
      + (2.0 × time_proximity)
      + (4.0 × friend_rsvp_score)
      + (1.0 × recency_boost)
      + (0.5 × popularity_score)             // NEW: log(view_count + 1) * 0.5
      + (0.5 × org_affinity)                 // NEW: user follows/interacted with org
      + (0.3 × random_factor)                // reduced from 0.5
```

**Diversity constraint:** After scoring, deduplicate: max 3 events per org in the top 20 results.

**Item-item similarity for "Similar Events":**
```sql
-- Co-RSVP similarity: events that share RSVPs
SELECT b.event_id, COUNT(*) as co_rsvps
FROM rsvps a
JOIN rsvps b ON a.user_id = b.user_id AND a.event_id != b.event_id
WHERE a.event_id = $target_event_id
GROUP BY b.event_id
ORDER BY co_rsvps DESC
LIMIT 8
```

### Collaborative Filtering — Implicit ALS via FastAPI

**Algorithm choice: ALS (Alternating Least Squares) for implicit feedback**

Per Yubi's research, ALS is the best fit because:
- Designed for implicit feedback (no explicit ratings)
- Scalable to our data size (~6K users × ~1K items)
- Well-supported by the `implicit` Python library
- Produces latent vectors usable for both user-to-item and item-to-item similarity

**Training pipeline:**

```python
# backends/fastapi/app/train.py
from implicit.als import AlternatingLeastSquares
import scipy.sparse as sparse

def train_model():
    # 1. Build interaction matrix from Postgres
    interactions = fetch_interactions(last_180_days)
    user_ids, item_ids, values = zip(*[
        (i.user_id, i.item_id, i.interaction_value)
        for i in interactions
    ])
    matrix = sparse.csr_matrix((values, (user_ids, item_ids)))

    # 2. Train ALS model
    model = AlternatingLeastSquares(
        factors=64,          # latent dimension
        regularization=0.1,
        iterations=15,
        use_gpu=False,       # CPU is fine for campus scale
    )
    model.fit(matrix)

    # 3. Export vectors to Postgres
    for user_idx, user_id in enumerate(user_id_map):
        upsert_user_vector(user_id, model.user_factors[user_idx].tolist())
    for item_idx, item_id in enumerate(item_id_map):
        upsert_item_vector(item_id, model.item_factors[item_idx].tolist())
```

**Inference (online):**

```python
# backends/fastapi/app/routers/recommendations.py
@router.post("/recommendations/feed")
async def get_recommendations(user_id: str, limit: int = 20):
    user_vector = get_user_vector(user_id)
    if user_vector is None:
        return cold_start_recommendations(user_id, limit)

    # Score all candidate items
    candidate_items = get_upcoming_events()
    scores = []
    for item in candidate_items:
        cf_score = np.dot(user_vector, item.vector) if item.vector else 0
        content_score = tag_similarity(user_id, item.id)
        popularity = math.log(item.view_count + 1) * 0.15
        time_score = time_proximity(item.datetime)
        context = context_adjustment(user_id, item)

        final = (0.4 * cf_score
               + 0.25 * content_score
               + 0.15 * popularity
               + 0.1 * time_score
               + 0.1 * context)
        scores.append((item.id, final))

    # Apply diversity: max 3 per org
    return apply_diversity(sorted(scores, reverse=True), limit)
```

**Schedule:** Nightly at 3 AM via cron (`0 3 * * *`). Training takes ~seconds at campus scale.

### Cold Start Strategy (per Yubi's research)

**New students (< 10 interactions):**
1. Use onboarding interests as seed (treat as pseudo-interactions with weight 3.0)
2. Attribute-based filtering: boost events matching class year (freshmen → orientation events), major (COS → tech talks), residential college (Butler → Butler events)
3. Popularity fallback: fill remaining slots with most-RSVP'd upcoming events

**New events (< 5 interactions):**
1. Content-based: match event tags to user tag_weights
2. Org-based: boost for users who follow the organizing group
3. Creator-based: boost if friends with the event creator

### A/B Testing — Cookie-Based Split

```typescript
// middleware.ts
const AB_COOKIE = "forum_rec_variant";
if (!request.cookies.get(AB_COOKIE)) {
  const variant = Math.random() < 0.5 ? "sql" : "cf";
  response.cookies.set(AB_COOKIE, variant, { maxAge: 7 * 86400 });
}
```

In `getFeedEvents()`, read the cookie to decide scoring method:
- `"sql"` → enhanced SQL scoring (Phase 2)
- `"cf"` → FastAPI CF scoring (Phase 3)

Log the variant in interactions for offline metric computation.

### Privacy & User Controls

**Data separation** (per Yubi's spec):
- All interaction data uses internal `user_id` (UUID), never NetID
- NextAuth JWT already maps CAS → internal ID
- Recommendation service never receives PII

**User controls (in Settings page):**
- "Not interested" button on event cards → logs `hide` interaction
- "Reset my recommendations" → deletes interaction history, resets to onboarding interests
- "Turn off personalization" → flag in `users` table; feed falls back to popularity + time only
- "How recommendations work" → static explanation page

**Data retention:**
- Raw interactions: retained for 6 months
- Older than 6 months: aggregated into `user_preference_vectors`, raw logs deleted
- Nightly cleanup job alongside training

## Schema Changes

### New Tables

```sql
-- Implicit feedback log
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type VARCHAR(20) NOT NULL DEFAULT 'event',  -- 'event' | 'organization'
  interaction_type VARCHAR(20) NOT NULL,  -- 'view' | 'click' | 'rsvp' | 'save' | 'share' | 'hide'
  interaction_value FLOAT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_item ON interactions(item_id);
CREATE INDEX idx_interactions_created ON interactions(created_at);

-- Materialized user preference vectors
CREATE TABLE user_preference_vectors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tag_weights JSONB NOT NULL DEFAULT '{}',
  latent_vector FLOAT[] DEFAULT NULL,
  interaction_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### Modified Tables

- `users`: Add `personalization_enabled BOOLEAN DEFAULT true`

## Dependencies

### FastAPI (backends/fastapi)
- `implicit` — ALS and BPR collaborative filtering
- `scipy` — Sparse matrix operations
- `numpy` — Numerical computing
- `psycopg2-binary` — Direct Postgres access for training pipeline

### Next.js (apps/web)
- No new dependencies — uses existing Drizzle ORM and server actions

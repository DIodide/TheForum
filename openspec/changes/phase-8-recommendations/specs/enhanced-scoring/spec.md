# Spec: Enhanced Content-Based Scoring

## Overview
Improve the existing SQL-based feed ranking by incorporating behavioral signals from the interactions table, popularity metrics, org affinity, and diversity constraints. No new infrastructure needed — all changes are within `getFeedEvents()`.

## Requirements

### P0
- Replace static `interest_overlap` with `tag_weights` from `user_preference_vectors` table
- Blend onboarding interests with behavioral weights: `0.7 × onboarding + 0.3 × behavioral` for users with < 10 interactions, shifting to 100% behavioral as interaction count grows
- Add popularity score: `log(view_count + 1) * 0.5` where `view_count` is aggregated from `interactions`
- Updated scoring formula:
  ```
  score = (3.0 × behavioral_interest_overlap)
        + (2.0 × time_proximity)
        + (4.0 × friend_rsvp_score)
        + (1.0 × recency_boost)
        + (0.5 × popularity_score)
        + (0.5 × org_affinity)
        + (0.3 × random_factor)
  ```

### P1
- Org affinity score (0-1): 1.0 if user follows the org, 0.5 if user has interacted with org's past events, 0 otherwise
- Diversity constraint: max 3 events per org in top 20 results (post-scoring deduplication)
- "New events" boost: events < 24h old get +1.0 to recency_boost

### P2
- Co-RSVP item-item similarity for "Similar Events" endpoint
  ```sql
  SELECT b.event_id, COUNT(*) as co_rsvps
  FROM rsvps a JOIN rsvps b ON a.user_id = b.user_id AND a.event_id != b.event_id
  WHERE a.event_id = $target
  GROUP BY b.event_id ORDER BY co_rsvps DESC LIMIT 8
  ```
- Position bias correction: downweight items the user has seen before (interaction log lookup)

## Nightly Tag Weight Aggregation

A batch job (FastAPI cron or GitHub Actions) computes `user_preference_vectors.tag_weights`:

1. Fetch all interactions for user in last 90 days
2. Apply exponential time decay: `weight = interaction_value × 0.95^age_days`
3. Sum weights per tag (from event tags of interacted items)
4. Normalize to 0-1 range
5. Upsert into `user_preference_vectors`

Schedule: nightly at 2 AM, before the CF training job at 3 AM.

## Files Changed

- `apps/web/src/actions/events.ts` — `getFeedEvents()` and `getSimilarEvents()`
- `backends/fastapi/app/jobs/aggregate.py` — New tag weight aggregation job
- `apps/database/src/schema/index.ts` — `user_preference_vectors` table

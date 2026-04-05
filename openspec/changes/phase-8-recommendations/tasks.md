# Tasks — Phase 8: ML Recommendation System

## Phase 1: Interaction Logging (Week 1)
- [ ] Add `interactions` and `user_preference_vectors` tables to schema
- [ ] Run migration (`db:push`)
- [ ] Create `logInteraction` server action in `actions/interactions.ts`
- [ ] Wire `rsvp`, `save`, `share` interactions in EventCard toggle handlers
- [ ] Wire `click` interaction on event card link / expand icon
- [ ] Add IntersectionObserver to EventCard for `view` tracking (1s threshold)
- [ ] Add `hide`/dismiss button to EventCard
- [ ] Track `source` metadata (feed, search, map, notification)
- [ ] Test: verify interactions are logged for all event types

## Phase 2: Enhanced SQL Scoring (Week 2)
- [ ] Create `aggregate.py` job in FastAPI to compute tag weights
- [ ] Add cron trigger for nightly aggregation (2 AM)
- [ ] Modify `getFeedEvents()` to use `tag_weights` from `user_preference_vectors`
- [ ] Add popularity score from aggregated view counts
- [ ] Add org affinity score (follows + past interactions)
- [ ] Implement diversity constraint (max 3 per org in top 20)
- [ ] Upgrade `getSimilarEvents()` with co-RSVP similarity
- [ ] Test: compare feed quality before/after with seeded data

## Phase 3: Collaborative Filtering Engine (Weeks 3-4)
- [ ] Install `implicit`, `scipy`, `numpy` in FastAPI
- [ ] Build `train.py`: interaction matrix construction, ALS training, vector export
- [ ] Build `routers/recommendations.py`: `/feed`, `/similar`, `/users` endpoints
- [ ] Implement cold-start logic for new users (< 10 interactions)
- [ ] Implement cold-start logic for new events (< 5 interactions)
- [ ] Add hybrid scoring function (0.4 CF + 0.25 content + 0.15 pop + 0.1 time + 0.1 ctx)
- [ ] Integrate Next.js `getFeedEvents()` with FastAPI call + SQL fallback
- [ ] Add `RECOMMENDATION_API_URL` env var
- [ ] Set up nightly cron for training (3 AM)
- [ ] Test: end-to-end recommendation flow with seeded interactions

## Phase 4: Evaluation & Privacy (Week 4, parallel with Phase 3)
- [ ] Add `personalization_enabled` column to users table
- [ ] Implement A/B testing middleware (cookie-based split)
- [ ] Log A/B variant in interaction metadata
- [ ] Add evaluation metrics to training pipeline (Precision@10, NDCG@10)
- [ ] Build recommendation controls in Settings (toggle, reset, info)
- [ ] Implement `resetRecommendations()` server action
- [ ] Implement `togglePersonalization()` server action
- [ ] Add data retention cleanup job (delete interactions > 6 months)
- [ ] Add "How recommendations work" info section
- [ ] Test: A/B variant assignment, metric computation, user controls

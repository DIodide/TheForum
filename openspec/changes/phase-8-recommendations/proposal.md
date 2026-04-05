# Phase 8 — ML Recommendation System

## Summary

Build a progressive recommendation engine for The Forum that evolves from enhanced SQL scoring to full collaborative filtering. Leverages research from TIG-212 (Yubi — CF algorithms, data schema, cold-start, privacy) and TIG-215 (Emilio — user modeling, evaluation metrics, implementation libraries).

## Motivation

The MVP feed ranking uses a static weighted formula (`3×interest + 2×time + 4×friends + 1×recency + 0.5×random`) computed in Next.js server actions. This works for launch but has key limitations:

- **No behavioral learning** — the formula never adapts to what a student actually clicks, RSVPs to, or ignores
- **No collaborative signal** — "students like you attended X" doesn't exist yet
- **No item similarity** — "similar events" uses only tag overlap, missing co-attendance patterns
- **Cold start relies entirely on onboarding** — if a student picks wrong interests, the feed stays bad

Princeton has ~6,000 undergraduates and hundreds of events per week. Even modest personalization dramatically improves discovery — the difference between a student seeing the 3 events that matter vs. scrolling past 20 irrelevant ones.

## Approach

Four progressive phases, each deployable independently:

```
Phase 1: Interaction Logging        (foundation — start collecting signals)
    ↓
Phase 2: Enhanced SQL Scoring       (immediate feed improvement, no new infra)
    ↓
Phase 3: Collaborative Filtering    (FastAPI ML service, ALS matrix factorization)
    ↓
Phase 4: Evaluation & Privacy       (A/B testing, metrics, user controls)
```

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js 15                         │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  Explore   │  │  Server    │  │  Interaction   │  │
│  │  Feed UI   │  │  Actions   │  │  Logger        │  │
│  └─────┬──────┘  └─────┬──────┘  └───────┬───────┘  │
│        │               │                 │           │
│        └───────┬───────┘─────────────────┘           │
│           ┌────▼─────┐                               │
│           │ Drizzle  │                               │
│           │   ORM    │                               │
│           └────┬─────┘                               │
└────────────────┼─────────────────────────────────────┘
            ┌────▼─────┐         ┌──────────────────┐
            │ Postgres │◄────────│   FastAPI ML      │
            │ (+ interactions    │  ┌────────────┐  │
            │   table)  │        │  │ ALS Train  │  │
            └──────────┘         │  │ (nightly)  │  │
                                 │  └────────────┘  │
                                 │  ┌────────────┐  │
                                 │  │ /recommend │  │
                                 │  │  endpoints │  │
                                 │  └────────────┘  │
                                 └──────────────────┘
```

**Key design decisions:**
- **Interaction logging in Next.js** — no new service needed; server actions write directly to Postgres
- **ML training in FastAPI** — Python has the best ML ecosystem (`implicit`, `scipy`, `numpy`); FastAPI is already in the monorepo
- **Graceful fallback** — if FastAPI is down, Next.js falls back to enhanced SQL scoring
- **Privacy-first** — all recommendation data uses internal `user_id`, never NetID (per Yubi's auth separation pattern)

## Capabilities

### New Capabilities
- `interaction-logging`: Track implicit user signals (views, clicks, RSVPs, saves, hides) with weighted scoring and metadata
- `tag-weight-aggregation`: Nightly job to compute per-user tag preference weights from interaction history with time decay
- `collaborative-filtering`: ALS-based matrix factorization trained on interaction data, served via FastAPI endpoints
- `hybrid-scoring`: Blended ranking combining CF scores, content similarity, popularity, time proximity, and context
- `cold-start-fallback`: Attribute-based recommendations for new users (< 10 interactions) and content-based for new events (< 5 interactions)
- `recommendation-api`: FastAPI endpoints for personalized feed, similar events, and similar users
- `ab-testing`: Cookie-based A/B split between SQL scoring and CF model
- `user-controls`: Hide/dismiss events, opt-out of personalization, reset recommendation history

### Modified Capabilities
- `feed-ranking`: Enhanced with interaction-derived tag weights, popularity scores, org affinity, and diversity constraints
- `similar-events`: Upgraded from tag-only to co-RSVP item-item cosine similarity
- `events` schema: Add `interactions`, `user_preference_vectors` tables

## Impact

- `apps/database/src/schema/index.ts` — New tables: `interactions`, `user_preference_vectors`
- `apps/web/src/actions/interactions.ts` — New: interaction logging server action
- `apps/web/src/actions/events.ts` — Modified: enhanced `getFeedEvents` and `getSimilarEvents`
- `apps/web/src/components/events/event-card.tsx` — Modified: add IntersectionObserver view tracking, hide action
- `apps/web/src/app/(app)/explore/explore-client.tsx` — Modified: click tracking, source context
- `apps/web/src/app/(app)/settings/settings-client.tsx` — Modified: recommendation controls
- `backends/fastapi/app/routers/recommendations.py` — New: recommendation endpoints
- `backends/fastapi/app/train.py` — New: ALS training pipeline
- `backends/fastapi/app/jobs/aggregate.py` — New: tag weight aggregation job

## Non-goals

- Real-time model updates (nightly batch is sufficient for campus-scale)
- Deep learning recommenders (ALS is simpler and sufficient for ~6K users)
- Cross-platform recommendations (The Forum only)
- Content generation or summarization
- Social graph analysis beyond friend RSVPs

## Risks

| Risk | Mitigation |
|------|-----------|
| Insufficient interaction data at launch | Phase 2 enhanced SQL scoring works without CF; Phase 1 logging starts immediately |
| Cold start for new students | Onboarding interests + attribute-based filtering (class year, major, res college) |
| FastAPI service unavailability | Graceful fallback to SQL scoring in Next.js |
| Privacy concerns with behavioral tracking | Internal user_id only, opt-out controls, data retention limits, transparency page |
| Model quality degradation | Automated evaluation metrics (Precision@K, NDCG@K), A/B testing against baseline |

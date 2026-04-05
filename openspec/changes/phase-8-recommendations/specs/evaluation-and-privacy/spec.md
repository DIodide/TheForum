# Spec: Evaluation, Privacy & User Controls

## Overview
Measure recommendation quality with offline and online metrics, implement A/B testing infrastructure, add user-facing controls for transparency and opt-out, and enforce data retention policies.

## Requirements

### P0 — Evaluation Metrics
- Offline evaluation during training: compute Precision@10, Recall@10, NDCG@10, Hit Rate@10 on held-out test set
- Log metrics to `pipeline_logs` table after each training run
- Alert (Slack webhook or email) if Precision@10 drops below threshold (0.15)

### P0 — User Controls
- "Not interested" dismiss button on event cards → logs `hide` interaction with weight -1.0
- Settings toggle: "Personalized recommendations" (on/off) → stored as `personalization_enabled` on users table
- When disabled: feed falls back to popularity + time scoring only (no CF, no interest overlap)

### P1 — A/B Testing
- Cookie-based split: `forum_rec_variant` cookie, 50/50 between `sql` and `cf`
- Set on first visit, persists 7 days
- Variant logged in every interaction's metadata for offline analysis
- Dashboard query: compare Precision@10, click-through rate, RSVP rate between variants

### P1 — Privacy
- All interaction data keyed on internal `user_id` (UUID), never NetID
- Recommendation API never receives or returns PII
- "Reset my recommendations" button in Settings: deletes all rows from `interactions` and `user_preference_vectors` for that user
- "How recommendations work" info section in Settings explaining signals used

### P2 — Data Retention
- Interactions older than 6 months: aggregate into `user_preference_vectors.tag_weights`, then delete raw rows
- Nightly cleanup job runs after training: `DELETE FROM interactions WHERE created_at < now() - INTERVAL '180 days'`
- Latent vectors regenerated nightly; no stale vector accumulation

## Evaluation Metrics Detail

**Precision@K**: Of the top K recommended events, how many did the user actually interact with (click, RSVP, save) within the next 7 days?

**Recall@K**: Of all events the user interacted with in the next 7 days, how many were in the top K recommendations?

**NDCG@K**: Normalized discounted cumulative gain — higher-ranked relevant items score more. Captures ranking quality, not just set overlap.

**Hit Rate@K**: Binary — did the user interact with at least one of the top K recommendations?

**Online proxy metrics** (measured via interaction logs):
- Feed click-through rate: clicks / views per feed session
- RSVP conversion rate: RSVPs / clicks
- Session depth: average number of event cards viewed per session
- Return rate: % of users who visit the feed on consecutive days

## A/B Testing Implementation

```typescript
// apps/web/src/middleware.ts
import { NextResponse } from "next/server";

export function middleware(request) {
  const response = NextResponse.next();
  const variant = request.cookies.get("forum_rec_variant")?.value;

  if (!variant) {
    const assigned = Math.random() < 0.5 ? "sql" : "cf";
    response.cookies.set("forum_rec_variant", assigned, {
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = { matcher: ["/explore", "/events/:path*", "/map"] };
```

## User Controls UI (Settings Page)

```
┌─────────────────────────────────────────┐
│ ● Recommendations                        │
│                                          │
│ Personalized feed          [████ ON ]    │
│ Your feed is ranked based on your        │
│ interests, activity, and friends.        │
│                                          │
│ [Reset my recommendations]               │
│ Clears your activity history and         │
│ restarts from your onboarding interests. │
│                                          │
│ How it works ›                           │
│ Learn how Forum personalizes your feed.  │
└─────────────────────────────────────────┘
```

## Files Changed

- `apps/web/src/middleware.ts` — A/B cookie assignment
- `apps/web/src/app/(app)/settings/settings-client.tsx` — Recommendation controls UI
- `apps/web/src/actions/users.ts` — `resetRecommendations()`, `togglePersonalization()` actions
- `apps/web/src/components/events/event-card.tsx` — Hide/dismiss button
- `apps/database/src/schema/index.ts` — Add `personalization_enabled` to users table
- `backends/fastapi/app/jobs/cleanup.py` — Data retention cleanup job
- `backends/fastapi/app/train.py` — Evaluation metric computation and logging

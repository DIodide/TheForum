## Why

The Forum now covers the baseline event workflow, but it still feels like a browseable directory instead of a habit-forming product. Students do not yet get fast, trustworthy answers about what to do this week, organizers cannot clearly see that posting here works, and the current feed logic is too opaque to improve with confidence.

## What Changes

- Rework the Explore experience into a decision-oriented home with ranked shelves, recommendation reason chips, dismiss controls, and a real "My Week" rail.
- Add explicit engagement instrumentation for impressions, detail clicks, saves, RSVPs, shares, exports, and dismissals.
- Introduce a debuggable recommendation pipeline with aggregate feature tables, candidate generation, scoring, and reason outputs.
- Add organizer-facing success tooling: pre-publish event quality guidance and post-publish funnel analytics.
- Add retention surfaces that make the app feel alive after signup: weekly briefing, friend/follow activity, and stronger cold-start recommendations.

## Capabilities

### New Capabilities
- `feed-decisioning`: Decision-oriented feed UX with shelves, recommendation reasons, dismiss actions, and a "My Week" summary rail.
- `recommendation-pipeline`: Engagement logging, aggregate feature generation, candidate generation, scoring, and ranking diagnostics.
- `organizer-success`: Event quality guidance before publish and event analytics after publish.
- `retention-loops`: Weekly briefing, social/follow-driven re-engagement, and better cold-start activation.

### Modified Capabilities
- None.

## Impact

- `apps/web/src/app/(app)/explore/*` - shelf-based feed layout, briefing, right-rail UX, and feed explanations
- `apps/web/src/components/events/*` - card metadata, reason chips, dismiss controls, and analytics hooks
- `apps/web/src/actions/events.ts` - feed serving, interaction logging, and ranking reason payloads
- `apps/web/src/actions/notifications.ts` - re-engagement notifications and briefing delivery
- `apps/web/src/app/(app)/events/create/*` and `apps/web/src/app/(app)/events/[id]/edit/*` - organizer quality guidance
- `apps/web/src/app/(app)/events/[id]/*` - organizer analytics and downstream engagement tracking
- `apps/database/src/schema/index.ts` - raw interaction events, dismissals, aggregate feature tables, and ranking snapshots
- `backends/fastapi/app/*` - scheduled aggregation jobs, recommendation diagnostics, and ranking support endpoints

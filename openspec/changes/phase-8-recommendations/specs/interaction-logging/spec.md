# Spec: Interaction Logging

## Overview
Capture implicit user feedback (views, clicks, RSVPs, saves, shares, hides) into a structured `interactions` table. This is the foundation for all ML-based recommendations.

## Requirements

### P0
- New `interactions` table in Postgres with user_id, item_id, item_type, interaction_type, interaction_value, metadata, created_at
- Server action `logInteraction()` that writes to the table
- Log `rsvp` and `save` interactions from existing toggle handlers in event cards
- Log `click` when user navigates to event detail page
- Log `share` from existing share handler
- Interaction weights: view=1, click=2, save=3, rsvp=5, share=2, hide=-1

### P1
- Log `view` when event card enters viewport using IntersectionObserver (1s dwell threshold to avoid scroll-by noise)
- Track `source` metadata: feed, search, map, notification, similar, direct
- Track `position` in feed for position bias correction
- Add `hide`/dismiss button to event cards (negative signal)

### P2
- Track `dwell_ms` on event detail pages (time between mount and unmount)
- Track search `query` context for search-click interactions
- Batch logging: debounce rapid interactions client-side, send in batches

## Server Action

```typescript
// apps/web/src/actions/interactions.ts
export async function logInteraction(data: {
  itemId: string;
  itemType: "event" | "organization";
  interactionType: "view" | "click" | "rsvp" | "save" | "share" | "hide";
  metadata?: Record<string, unknown>;
}): Promise<void>
```

Non-blocking — fire-and-forget. Failures are silently dropped (logging should never break the UX).

## Frontend Integration Points

| Component | Interaction | Trigger |
|-----------|------------|---------|
| `EventCard` | view | IntersectionObserver, 1s threshold |
| `EventCard` | click | Link click to `/events/[id]` |
| `EventCard` | save | `onSaveToggle` handler |
| `EventCard` | rsvp | `onRsvpToggle` handler |
| `EventCard` | share | `onShare` handler |
| `EventCard` | hide | New dismiss button (P1) |
| `ExploreClient` | click | Source context = "feed" |
| `MapClient` | click | Source context = "map" |
| Event detail page | dwell | Mount/unmount timer (P2) |

## Schema

See design.md for full `interactions` table DDL.

Indexes: `user_id`, `item_id`, `created_at` for efficient aggregation queries.

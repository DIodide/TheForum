# Spec: Feed Ranking Algorithm

## Overview
The explore feed shows a personalized, ranked list of upcoming events. The MVP uses SQL-based weighted scoring — no ML infrastructure needed.

## Requirements

### P0
- Events ranked by composite score based on user signals
- Only show future events (datetime > now)
- Paginated results (20 per page, cursor-based)
- Filters: search query (title + description), tags, location, date range
- Score considers: interest overlap, time proximity, friend RSVPs, recency

### P1
- Diversity constraint: max 3 events per org in top 20
- "New events" boost for events < 24 hours old
- Track click-through for future signal refinement

## Scoring Formula

```
score = (3.0 × interest_overlap)
      + (2.0 × time_proximity)
      + (4.0 × friend_rsvp_score)
      + (1.0 × recency_boost)
      + (0.5 × random_factor)
```

### Signal Definitions

**interest_overlap** (0-1):
```
count(user_interests ∩ event_tags) / count(user_interests)
```
If user has no interests, defaults to 0.5.

**time_proximity** (0-1):
```
CASE
  WHEN days_until <= 0 THEN 0        -- past events filtered out
  WHEN days_until <= 1 THEN 1.0      -- today/tomorrow: max score
  WHEN days_until <= 3 THEN 0.8
  WHEN days_until <= 7 THEN 0.6
  WHEN days_until <= 14 THEN 0.3
  ELSE 0.1
END
```

**friend_rsvp_score** (0-1):
```
MIN(1.0, friend_rsvp_count / 3.0)
```
Caps at 3 friends. Having 3+ friends going = max score.

**recency_boost** (0-1):
```
CASE
  WHEN hours_since_created <= 24 THEN 1.0
  WHEN hours_since_created <= 72 THEN 0.5
  ELSE 0.0
END
```

**random_factor** (0-1):
```
random()  -- Postgres random() returns 0-1
```
Ensures feed isn't deterministic. Small weight (0.5) so it nudges, not dominates.

## Query Strategy

Use a Drizzle raw SQL query or `sql` template tag for the scoring subqueries. Wrap in a single query that:

1. Filters: `datetime > now()`, optional tag/location/date/search filters
2. Computes each signal as a subquery/lateral join
3. Sums weighted score
4. Orders by score DESC
5. Limits to 20, with cursor for pagination

Cursor: `(score, eventId)` — sort by score DESC, then eventId as tiebreaker.

## Filters (applied before scoring)

| Filter | Implementation |
|--------|---------------|
| Search | `WHERE title ILIKE '%q%' OR description ILIKE '%q%'` |
| Tags | `WHERE id IN (SELECT eventId FROM event_tags WHERE tag = ANY($tags))` |
| Location | `WHERE locationId = $locationId` |
| Date range | `WHERE datetime BETWEEN $start AND $end` |

Filters narrow the candidate set. Scoring ranks within the filtered set.

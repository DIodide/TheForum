## Context

The Forum MVP (Phases 0–4) is built with Next.js 16 (App Router, Server Actions, Drizzle ORM) + PostgreSQL. All business logic runs as `"use server"` actions — no REST API. The notification table, org membership tables, and event `externalLink` column already exist in the schema but lack business logic or UI in several places. Phase 5 closes these gaps without schema changes.

## Goals / Non-Goals

**Goals:**
- Complete all notification trigger logic (event reminders, org new events)
- Add GCal export and share link to event detail page
- Provide org owners with member management UI
- Surface org recommendations and friends' RSVP'd events
- Display external registration links on event detail

**Non-Goals:**
- Real-time/WebSocket notifications (polling is sufficient)
- Email/SMS notification delivery (DB + in-app only for now)
- Scheduled cron jobs for reminders (use on-demand check approach instead)
- ML-based recommendations (simple tag overlap scoring is sufficient)
- Changes to the database schema

## Decisions

### 1. Event reminders: on-demand vs. cron

**Decision:** On-demand generation when notifications are fetched.

When `getNotifications()` is called, check for RSVP'd events happening within the next 24 hours that don't already have a reminder notification. Generate them inline. This avoids needing a cron job or external scheduler.

**Alternative considered:** Scheduled cron job (e.g., Vercel Cron or `node-cron`). Rejected because it adds infrastructure complexity and the on-demand approach is sufficient for the user base.

### 2. Org new-event notifications: trigger point

**Decision:** Generate in `createEvent()` when `orgId` is provided.

When an event is created with an `orgId`, query `orgFollowers` for that org and batch-insert `org_new_event` notifications. This is synchronous but acceptable — follower counts are small (tens to hundreds, not thousands).

**Alternative considered:** Background job queue. Overkill for current scale.

### 3. GCal export: URL scheme vs. API

**Decision:** Use the public Google Calendar URL scheme (`https://calendar.google.com/calendar/render?action=TEMPLATE&...`).

No API key, no OAuth, no dependency. Just construct the URL with event details and open in a new tab.

### 4. Share link: implementation

**Decision:** Use `navigator.clipboard.writeText()` with a shadcn toast (sonner) for feedback.

Need to install `sonner` toast component via shadcn. Simple, no external deps.

### 5. Org recommendations: scoring approach

**Decision:** SQL-based scoring. For each org, count how many of its events' tags overlap with the user's interest tags. Rank by overlap count. Return top suggestions.

Query: join `organizations` → `events` → `eventTags` against `userInterests`, group by org, order by match count descending.

### 6. Friends' events: surface location

**Decision:** Add a "Friends Going" filter/section on the explore page.

Query: get event IDs where friends have RSVP'd, then fetch those events. Show as a toggleable section or filter pill on the explore feed.

## Risks / Trade-offs

- **On-demand reminder generation** — Could be slow if user has many RSVPs. Mitigation: limit check to next 24h window, use efficient indexed query.
- **Synchronous org follower notifications** — Could slow down event creation if org has many followers. Mitigation: acceptable at current scale (<1000 followers per org). Can move to background job later if needed.
- **No deduplication of reminders across sessions** — If `getNotifications()` is called multiple times, we need to check for existing reminders before creating duplicates. Mitigation: query for existing `event_reminder` with matching `eventId` in payload before inserting.

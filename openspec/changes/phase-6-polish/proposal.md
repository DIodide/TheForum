## Why

Several P0 and P1 PRD requirements remain unimplemented or broken. The global search bar is non-functional, explore filters are limited to tags only (missing org, location, date range), org leaders can't tie events to their organizations via the UI, and there's no report mechanism. These gaps block a polished launch experience.

## What Changes

- Wire the top-bar search input to actually trigger explore page search
- Add advanced explore filters: organization type, location, date range
- Add org selector to event creation form (backend already accepts `orgId`)
- Add event report/flag mechanism with textbox submission
- Add "Post an Event" organizer CTA to landing page
- Add clickable org name on event cards linking to org profile

## Capabilities

### New Capabilities
- `advanced-filters`: Organization type, location, and date range filters on explore page
- `event-reporting`: Report/flag button on event detail with textbox submission
- `org-event-creation`: Org selector in create event form for org leaders

### Modified Capabilities
- None

## Impact

- `apps/web/src/components/layout/top-bar.tsx` — wire search input
- `apps/web/src/components/events/event-filters.tsx` — add filter UI
- `apps/web/src/actions/events.ts` — extend `getFeedEvents` params
- `apps/web/src/app/(app)/events/create/create-event-form.tsx` — add org selector
- `apps/web/src/app/(app)/events/[id]/event-detail-client.tsx` — add report button
- `apps/web/src/app/(auth)/page.tsx` — add organizer CTA
- `apps/web/src/components/events/event-card.tsx` — clickable org name

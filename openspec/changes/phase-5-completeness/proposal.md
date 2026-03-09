## Why

The Forum MVP (Phases 0–4) is feature-complete but several capabilities are half-built: notification types exist in the DB enum but nothing generates them, the `externalLink` field on events is stored but never displayed, and key PRD P1 items (GCal export, share link, friends' events browsing) are missing. These gaps would make the product feel incomplete at launch. Phase 5 closes them.

## What Changes

- **Notification triggers**: Generate `event_reminder` (1 day before RSVP'd event) and `org_new_event` (when followed org posts) notifications. The enum values and notification table already exist — this adds the business logic.
- **GCal export**: "Add to Google Calendar" button on event detail page using the public `calendar.google.com` URL scheme (no API key needed).
- **Share link**: Copy-to-clipboard button on event detail page with toast confirmation.
- **Org member management**: UI for org owners to search/add officers, remove officers, and view membership from the org profile page.
- **Org recommendation feed**: Score and suggest organizations on the orgs page based on overlap between org event tags and user interest tags.
- **Friends' events browsing**: Show events friends have RSVP'd to — surface on the explore page as a "Friends Going" filter or section.
- **External registration link**: Display the `externalLink` field on event detail page when present (data already stored, just needs UI).

## Capabilities

### New Capabilities

- `notification-triggers`: Business logic to generate event_reminder and org_new_event notifications at the right moments
- `gcal-export`: Google Calendar URL generation and button on event detail
- `share-link`: Clipboard copy for event URLs with feedback toast
- `org-member-management`: UI + server actions for org owners to manage officers
- `org-recommendations`: Interest-based org scoring and suggestion feed
- `friends-events`: Surface events that friends have RSVP'd to in the explore flow

### Modified Capabilities

_(No existing specs to modify — this is the first use of OpenSpec specs)_

## Impact

- **Server actions**: New actions in `notifications.ts` (trigger generation), `orgs.ts` (member management), `friends.ts` or `events.ts` (friends' events query). Modifications to `orgs.ts` (recommendations).
- **UI components**: Changes to event detail page (`events/[id]`), org profile page (`orgs/[id]`), orgs list page (`orgs`), explore page (`explore`).
- **Database**: No schema changes — all tables/columns/enums already exist.
- **Dependencies**: May need a toast component from shadcn (`sonner` or `toast`) for share link feedback.

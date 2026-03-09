## 1. Notification Triggers

- [x] 1.1 Add on-demand event reminder generation to `getNotifications()` in `actions/notifications.ts` — check for RSVP'd events in next 24h, create `event_reminder` if not already exists
- [x] 1.2 Add `org_new_event` notification generation to `createEvent()` in `actions/events.ts` — query org followers, batch-insert notifications (exclude creator)
- [x] 1.3 Update `NotificationDropdown` component to render event_reminder and org_new_event notification types with appropriate icons and links

## 2. GCal Export

- [x] 2.1 Create `buildGCalUrl()` helper that generates Google Calendar URL from event title, description, datetime, endDatetime, and location name (default 1h duration if no end time)
- [x] 2.2 Add "Add to Calendar" button to event detail page (`events/[id]`) that opens the GCal URL in a new tab

## 3. Share Link

- [x] 3.1 Install sonner toast component via shadcn (`bunx shadcn@latest add sonner`) and add `<Toaster>` to app layout
- [x] 3.2 Add "Share" button to event detail page that copies event URL to clipboard with toast confirmation

## 4. Org Member Management

- [x] 4.1 Add server actions in `actions/orgs.ts`: `addOfficer(orgId, userId)` and `removeOfficer(orgId, userId)` with ownership verification
- [x] 4.2 Add user search for adding officers — reuse `searchUsers()` from `actions/friends.ts` or create a shared variant
- [x] 4.3 Add member management UI to org profile page (`orgs/[id]`) — visible only to org owner: search to add officers, remove button on existing officers

## 5. Org Recommendations

- [x] 5.1 Add `getRecommendedOrgs()` server action in `actions/orgs.ts` — join orgs → events → eventTags against userInterests, rank by overlap count, exclude already-followed orgs, limit 6
- [x] 5.2 Add "Recommended for You" section to orgs page (`orgs/page.tsx`) — show recommended org cards, hide if empty

## 6. Friends' Events

- [x] 6.1 Add `getFriendsEvents()` server action in `actions/events.ts` — fetch events where accepted friends have RSVP'd, include friend count per event
- [x] 6.2 Add "Friends Going" filter pill to explore page — when active, feed shows only events with friend RSVPs

## 7. External Registration Link

- [x] 7.1 Add "Register" button to event detail page (`events/[id]`) that opens `externalLink` in a new tab when present

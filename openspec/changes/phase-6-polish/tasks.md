## 1. Global Search Bar

- [ ] 1.1 Wire top-bar search input to navigate to `/explore?search=<query>` on Enter/submit
- [ ] 1.2 Read `search` query param in explore page and pass to `ExploreClient` as `initialSearch`
- [ ] 1.3 Pre-populate search input in explore client from `initialSearch` and trigger feed refresh

## 2. Advanced Explore Filters

- [ ] 2.1 Extend `getFeedEvents()` params to accept `orgCategory`, `locationId`, and `dateRange` ("today"|"week"|"month")
- [ ] 2.2 Add filter UI row below tag filters — org category dropdown, location dropdown, date range pills
- [ ] 2.3 Wire filter state changes to `refreshEvents()` in explore client

## 3. Event Card Org Link

- [ ] 3.1 Add `orgId` to `FeedEvent` interface and populate it in `getFeedEvents()`, `getMyEvents()`, `getSavedEvents()`, `getFriendsEvents()`
- [ ] 3.2 Make org name on event cards a clickable `<Link>` to `/orgs/<orgId>`

## 4. Org Event Creation

- [x] 4.1 Add `getUserOrgs()` server action — return orgs where user is owner or officer
- [x] 4.2 Add org selector dropdown to create event form, populated by `getUserOrgs()`
- [x] 4.3 Pass selected `orgId` to `createEvent()` call

## 5. Event Reporting

- [ ] 5.1 Add `eventReports` table to database schema (id, eventId, reporterId, reason, createdAt)
- [ ] 5.2 Add `reportEvent(eventId, reason)` server action with duplicate check
- [ ] 5.3 Add report button + dialog with textarea to event detail page, with toast confirmation

## 6. Landing Page Organizer CTA

- [ ] 6.1 Add "Post an Event" secondary CTA button/link to landing page below sign-in button

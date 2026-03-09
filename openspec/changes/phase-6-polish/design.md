## Design Decisions

### Global Search
The top bar search input already exists but has no onChange handler. Wire it to navigate to `/explore?search=<query>` using `useRouter`. The explore page reads the search param on mount and triggers `getFeedEvents` with it.

### Advanced Filters
Add org category, location, and date range as optional params to `getFeedEvents()`. Render filter dropdowns in a collapsible "More Filters" row below the tag filters on the explore page. Use shadcn Select/Popover components.

### Org Event Creation
The `createEvent` action already accepts `orgId`. Add a Select dropdown to the create event form that lists orgs where the current user is an owner or officer (query `orgMembers`). Add a `getUserOrgs()` action that returns orgs the user can post events for.

### Event Reporting
Simple approach: add a `reports` table or use a lightweight mechanism (just email/log for MVP). For now, create a `reportEvent` server action that inserts into a new `event_reports` table (eventId, reporterId, reason, createdAt). Show a report dialog on event detail with a textarea.

### Landing Page Organizer CTA
Add a secondary "Post an Event" link/button below the main sign-in CTA on the landing page. Routes to `/events/create` (which will redirect to auth if not logged in).

### Clickable Org Name
Wrap the org name text in event cards with a `<Link>` to `/orgs/<orgId>`. Requires passing `orgId` to event cards (currently not in FeedEvent type — need to add it).

## Schema Changes
- New table: `event_reports` (id, eventId, reporterId, reason text, createdAt)
- No changes to existing tables

## Dependencies
- shadcn Select component (may need to install)
- No new packages required

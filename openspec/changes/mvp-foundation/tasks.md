# MVP Foundation — Tasks

## Phase 0: Foundation

### 0.1 Database Schema
- [ ] Replace placeholder `users` + `posts` schema with full schema (see design.md)
- [ ] Define all enums: tags, regions, friendship status, notification types, org categories, org roles
- [ ] Create `campus_locations` table with seed data (Princeton locations + lat/lng)
- [ ] Run `bun run db:push` to apply schema
- [ ] Verify with `bun run db:studio`

### 0.2 Auth — Microsoft EntraID
- [ ] Install `next-auth@beta` (Auth.js v5) and `@auth/drizzle-adapter`
- [ ] Create `src/auth.ts` with Azure AD provider config
  - Tenant: `2ff60116-7431-425d-b5af-077d7791bda4`
  - Scope: `User.Read`
- [ ] Create `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Implement `signIn` callback: upsert user in DB, extract NetID from UPN
- [ ] Implement `session` callback: attach userId, netId, onboarded flag
- [ ] Create `src/middleware.ts` with route protection + onboarding guard
- [ ] Add env vars: `AUTH_SECRET`, `AUTH_AZURE_AD_CLIENT_ID`, `AUTH_AZURE_AD_CLIENT_SECRET`, `AUTH_AZURE_AD_TENANT_ID`
- [ ] Update `src/env.ts` with new auth env vars
- [ ] Test login/logout flow end-to-end

### 0.3 S3 Upload Infrastructure
- [ ] Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- [ ] Create server action `src/actions/upload.ts` for presigned URL generation
- [ ] Add env vars: `AWS_S3_BUCKET`, `AWS_REGION` (creds from ~/.aws/credentials)
- [ ] Create reusable `ImageUpload` client component with drag-and-drop

### 0.4 shadcn Components
- [ ] Install core components: `button`, `card`, `input`, `dialog`, `badge`, `avatar`, `select`, `dropdown-menu`, `sheet`, `tabs`, `tooltip`, `separator`, `label`, `textarea`, `calendar`, `popover`, `command`, `scroll-area`, `skeleton`
- [ ] Verify Tailwind v4 compatibility

### 0.5 Layout Shell + Reusable Components
- [ ] Create `AppShell` layout (authenticated wrapper with sidebar + topbar)
- [ ] Extract `Sidebar` from /6 design (Home, My Events, Map, Friends nav)
- [ ] Extract `TopBar` from /6 design (search, filters, create event button, notifications, profile)
- [ ] Extract `EventCard` from /6 design
- [ ] Extract `AvatarStack` from /8 design
- [ ] Create authenticated layout at `src/app/(app)/layout.tsx`
- [ ] Move protected pages under `(app)` route group

---

## Phase 1: Onboarding + Explore Feed

### 1.1 Onboarding Flow
- [ ] Create `src/app/(app)/onboarding/page.tsx` — multi-step form
- [ ] Step 1: Interest tags (multi-select grid using tag enum)
- [ ] Step 2: Demographics (class year dropdown, major text input, campus regions multi-select)
- [ ] Step 3: Organization leader toggle
- [ ] Server action `src/actions/users.ts` — `completeOnboarding()`: save interests, demographics, set `onboarded=true`
- [ ] Redirect to `/explore` on completion
- [ ] Polish with frontend-design skill

### 1.2 Explore Page
- [ ] Create `src/app/(app)/explore/page.tsx` — main feed
- [ ] Implement feed query with scoring algorithm (see design.md)
- [ ] Category filter pills (from /6 design)
- [ ] Search bar with keyword search (title + description)
- [ ] EventCard grid (responsive 2-3 columns)
- [ ] Right panel: recently saved events + friends
- [ ] RSVP server action (`src/actions/events.ts`)
- [ ] Save server action (`src/actions/events.ts`)
- [ ] Pagination (cursor-based, load more button)
- [ ] Polish with frontend-design skill

---

## Phase 2: Event Creation + Detail

### 2.1 Create Event
- [ ] Create `src/app/(app)/events/create/page.tsx`
- [ ] Form fields: title, description, date/time (calendar picker), end time, location (select from campus_locations), tags (multi-select), flyer image upload
- [ ] Optional: external registration link
- [ ] Server action `createEvent()` — validate, save to DB
- [ ] Redirect to event detail page on success
- [ ] Polish with frontend-design skill

### 2.2 Event Detail Page
- [ ] Create `src/app/(app)/events/[id]/page.tsx` — from /8 design
- [ ] Event flyer display (large, gradient background)
- [ ] Event info: title, org name, date/time, location, description, tags
- [ ] RSVP button (toggle, shows count)
- [ ] Save button (toggle, private)
- [ ] Attendee list with friend avatars highlighted
- [ ] Share button (copy link)
- [ ] "Similar events" section (same tags, same org)
- [ ] Edit/delete buttons (visible only to event creator)
- [ ] Polish with frontend-design skill

### 2.3 Edit/Delete Event
- [ ] Create `src/app/(app)/events/[id]/edit/page.tsx` — reuse EventForm
- [ ] Server action `updateEvent()` — verify ownership
- [ ] Server action `deleteEvent()` — verify ownership, soft delete or hard delete
- [ ] "My Events" view (sidebar): list of user's created events + RSVP'd/saved events

---

## Phase 3: Social Features

### 3.1 Friend System
- [ ] Create friend search component (`FriendSearch`) — search by name or NetID
- [ ] Server action `sendFriendRequest()`
- [ ] Server action `acceptFriendRequest()` / `declineFriendRequest()`
- [ ] Friends sidebar panel with friend list
- [ ] "Friends attending" display on EventCard (avatar stack + count)
- [ ] "Friends attending" on event detail page

### 3.2 Notifications
- [ ] Create `NotificationDropdown` component (bell icon in TopBar)
- [ ] Server action `getNotifications()` — fetch unread + recent
- [ ] Server action `markNotificationRead()`
- [ ] Generate notifications on: friend request received, upcoming RSVP'd event (1 day before)
- [ ] Polling: fetch notifications every 60 seconds on explore page
- [ ] Unread badge count on bell icon

---

## Phase 4: Organizations + Map + Polish

### 4.1 Organizations
- [ ] Create `src/app/(app)/orgs/page.tsx` — org directory with search + category filters
- [ ] Create `src/app/(app)/orgs/[id]/page.tsx` — org profile (logo, desc, officers, events list)
- [ ] Create `src/app/(app)/orgs/create/page.tsx` — create org form (org leaders only)
- [ ] Follow/unfollow server action
- [ ] Org recommendation feed (based on user interests)
- [ ] Org event list on profile page

### 4.2 Campus Map
- [ ] Choose map library (Mapbox GL JS or Leaflet + OpenStreetMap)
- [ ] Create `CampusMap` component centered on Princeton campus
- [ ] Event pins at campus locations (from `campus_locations` table)
- [ ] Clickable pins → event preview popup
- [ ] Time navigation: date selector to show events on different days
- [ ] Create `src/app/(app)/map/page.tsx`

### 4.3 Account Settings
- [ ] Create `src/app/(app)/settings/page.tsx`
- [ ] Edit demographics (class year, major)
- [ ] Edit campus regions
- [ ] Edit interest tags
- [ ] Toggle org leader status

### 4.4 Landing Page
- [ ] Create `src/app/page.tsx` — public landing page
- [ ] Sign up / Log in CTA → Auth.js sign in
- [ ] Value proposition messaging
- [ ] Polish with frontend-design skill

---

## Cross-cutting

### Testing
- [ ] Set up Playwright for E2E tests (auth flow, create event, RSVP)
- [ ] Add basic server action unit tests with Vitest

### DevOps
- [ ] Verify Docker Compose works for local development
- [ ] Ensure `bun run dev` starts everything cleanly
- [ ] Document env var setup in README

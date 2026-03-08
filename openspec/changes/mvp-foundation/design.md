# MVP Foundation — Design

## System Architecture

```
Browser
  │
  ├─ Auth.js session cookie
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Middleware (src/middleware.ts)                   │    │
│  │  ├─ Check Auth.js session                        │    │
│  │  ├─ Redirect unauthenticated → /                 │    │
│  │  ├─ Redirect un-onboarded → /onboarding          │    │
│  │  └─ Pass through for public routes               │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  Pages (src/app/)                                        │
│  ├─ /                    Landing (public)                │
│  ├─ /onboarding          Multi-step setup                │
│  ├─ /explore             Main feed (protected)           │
│  ├─ /events/[id]         Event detail (protected)        │
│  ├─ /events/create       Create event (protected)        │
│  ├─ /events/[id]/edit    Edit event (protected, owner)   │
│  ├─ /orgs                Organization directory           │
│  ├─ /orgs/[id]           Org profile                     │
│  ├─ /orgs/create         Create org (org leaders)        │
│  ├─ /friends             Friend management               │
│  ├─ /map                 Campus map view                 │
│  ├─ /settings            Account settings                │
│  └─ /api/auth/[...nextauth]  Auth.js route handler       │
│                                                          │
│  Server Actions (src/actions/)                           │
│  ├─ events.ts            CRUD + RSVP + Save              │
│  ├─ users.ts             Profile + onboarding            │
│  ├─ friends.ts           Requests + list                 │
│  ├─ orgs.ts              CRUD + follow                   │
│  ├─ notifications.ts     Fetch + mark read               │
│  └─ upload.ts            S3 presigned URL generation     │
│                                                          │
│  Drizzle ORM (via @the-forum/database)                   │
└──────────────┬───────────────────────────────────────────┘
               │
          ┌────▼─────┐
          │ Postgres  │
          │ (Docker)  │
          └──────────┘
```

## Authentication Flow

```
┌────────┐     ┌──────────┐     ┌───────────────┐     ┌──────────────┐
│ User   │────▶│ Next.js  │────▶│ Microsoft     │────▶│ Microsoft    │
│ clicks │     │ /api/    │     │ login.micro-  │     │ Graph API    │
│ login  │     │ auth     │     │ softonline    │     │ /v1.0/me     │
└────────┘     └──────────┘     │ .com          │     └──────┬───────┘
                                └───────────────┘            │
                                                             ▼
                                                    ┌────────────────┐
                                                    │ Profile data:  │
                                                    │ - displayName  │
                                                    │ - mail         │
                                                    │ - UPN (NetID)  │
                                                    └────────┬───────┘
                                                             │
                                                             ▼
                                                    ┌────────────────┐
                                                    │ Auth.js        │
                                                    │ signIn callback│
                                                    │ → upsert user  │
                                                    │ → set session  │
                                                    └────────────────┘
```

**Auth.js config** (`src/auth.ts`):
- Provider: `AzureADProvider` (from `next-auth/providers/azure-ad`)
- Tenant: `2ff60116-7431-425d-b5af-077d7791bda4` (Princeton)
- Scope: `User.Read` (Microsoft Graph profile)
- Callbacks:
  - `signIn`: Upsert user in DB, extract NetID from `userPrincipalName`
  - `session`: Attach `userId`, `netId`, `onboarded` flag to session
  - `jwt`: Persist user ID in JWT token

**Middleware** (`src/middleware.ts`):
- Public routes: `/`, `/api/auth/*`
- Protected routes: everything else
- Onboarding guard: if `session.user.onboarded === false`, redirect to `/onboarding`

## Database Schema

```
┌─────────────┐       ┌──────────────────┐       ┌───────────────┐
│   users      │       │   events          │       │ organizations │
├─────────────┤       ├──────────────────┤       ├───────────────┤
│ id (uuid)    │──┐    │ id (uuid)         │   ┌──│ id (uuid)      │
│ netId        │  │    │ title             │   │  │ name           │
│ email        │  │    │ description       │   │  │ description    │
│ displayName  │  │    │ datetime          │   │  │ logo (url)     │
│ classYear    │  │    │ endDatetime       │   │  │ category       │
│ major        │  │    │ locationId (FK)   │───┤  │ creatorId (FK) │
│ avatarUrl    │  │    │ orgId (FK)        │───┘  │ createdAt      │
│ isOrgLeader  │  │    │ creatorId (FK)    │──┐   └───────────────┘
│ onboarded    │  │    │ flyerUrl          │  │
│ createdAt    │  │    │ externalLink      │  │
│ updatedAt    │  │    │ isPublic          │  │
└──────┬──────┘  │    │ createdAt         │  │
       │         │    │ updatedAt         │  │
       │         │    └──────────────────┘  │
       │         │                          │
       │    ┌────▼──────────┐    ┌─────────▼────────┐
       │    │ user_interests │    │   event_tags      │
       │    ├───────────────┤    ├──────────────────┤
       │    │ userId (FK)    │    │ eventId (FK)      │
       │    │ tag (enum)     │    │ tag (enum)         │
       │    └───────────────┘    └──────────────────┘
       │
       │    ┌───────────────┐    ┌──────────────────┐
       │    │ user_regions   │    │   rsvps            │
       │    ├───────────────┤    ├──────────────────┤
       ├───▶│ userId (FK)    │    │ userId (FK)        │
       │    │ region (enum)  │    │ eventId (FK)       │
       │    └───────────────┘    │ createdAt          │
       │                         └──────────────────┘
       │
       │    ┌───────────────┐    ┌──────────────────┐
       │    │ saved_events   │    │   friendships      │
       │    ├───────────────┤    ├──────────────────┤
       ├───▶│ userId (FK)    │    │ userId (FK)        │
       │    │ eventId (FK)   │    │ friendId (FK)      │
       │    │ createdAt      │    │ status (enum)      │
       │    └───────────────┘    │ createdAt          │
       │                         └──────────────────┘
       │
       │    ┌────────────────┐   ┌──────────────────┐
       │    │ org_followers   │   │  notifications     │
       │    ├────────────────┤   ├──────────────────┤
       ├───▶│ userId (FK)     │   │ id (uuid)          │
       │    │ orgId (FK)      │   │ userId (FK)        │
       │    │ createdAt       │   │ type (enum)        │
       │    └────────────────┘   │ payload (json)     │
       │                         │ read (bool)        │
       │    ┌────────────────┐   │ createdAt          │
       │    │ org_members     │   └──────────────────┘
       │    ├────────────────┤
       └───▶│ orgId (FK)      │
            │ userId (FK)     │
            │ role (enum)     │
            └────────────────┘

┌──────────────────┐
│ campus_locations  │
├──────────────────┤
│ id (varchar)      │  ← slug: "frist-campus-center"
│ name              │  ← "Frist Campus Center"
│ latitude          │
│ longitude         │
│ category          │  ← "academic", "residential", "athletic", etc.
└──────────────────┘
```

### Enums / Fixed Taxonomies

**Interest/Event Tags:**
```
free-food, workshop, performance, speaker, social, career,
sports, music, art, academic, cultural, community-service,
religious, political, tech, gaming, outdoor, wellness
```

**Campus Regions:**
```
central (Frist, Nassau), east (E-Quad, Bloomberg),
west (Wu, Forbes), south (athletic fields, Jadwin),
north (grad college, Lawrence), off-campus
```

**Campus Locations (seed data):**
```
Frist Campus Center, McCosh Hall, Richardson Auditorium,
Alexander Hall, Friend Center, Computer Science Building,
Prospect House, Terrace Club, Jadwin Gymnasium,
Princeton Stadium, Lewis Library, Mudd Library,
Robertson Hall, Whig Hall, Clio Hall, Nassau Hall,
Einstein Walkway, Chancellor Green, etc.
```

**Friendship Status:** `pending`, `accepted`, `declined`

**Notification Types:** `friend_request`, `event_reminder`, `org_new_event`

**Org Categories:** `career`, `affinity`, `performance`, `academic`, `athletic`, `social`, `cultural`, `religious`, `political`, `service`

**Org Member Roles:** `owner`, `officer`, `member`

## Image Upload Flow

```
┌────────┐    1. Request presigned URL    ┌──────────┐
│ Browser │──────────────────────────────▶│ Server   │
│         │◀──────────────────────────────│ Action   │
│         │    2. Return { url, key }     │          │
│         │                               └──────────┘
│         │    3. PUT image directly
│         │──────────────────────────────▶┌──────────┐
│         │◀──────────────────────────────│   S3     │
│         │    4. 200 OK                  │          │
│         │                               └──────────┘
│         │    5. Save event with imageUrl
│         │──────────────────────────────▶┌──────────┐
│         │                               │ Server   │
└────────┘                               │ Action   │
                                          └──────────┘
```

S3 bucket: `the-forum-uploads` (or similar)
Key pattern: `events/{eventId}/{uuid}.{ext}`
Max file size: 5MB
Allowed types: `image/jpeg`, `image/png`, `image/webp`

## Feed Ranking Algorithm (MVP)

SQL-based weighted scoring, computed at query time:

```
score = w1 * interest_overlap    -- how many of user's interests match event tags
      + w2 * time_proximity      -- inverse of days until event (closer = higher)
      + w3 * friend_rsvp_count   -- number of user's friends who RSVP'd
      + w4 * recency_boost       -- newer events get a small boost
      + w5 * random_factor       -- small random factor for exploration
```

Initial weights: `w1=3, w2=2, w3=4, w4=1, w5=0.5`

Friend RSVPs weighted highest — the PRD emphasizes social discovery. Interest match next, then time proximity.

Implemented as a Drizzle query with subqueries for each signal, ordered by computed score. Paginated (20 events per page, cursor-based).

## Component Architecture

```
src/components/
├── ui/                      # shadcn primitives (button, card, input, etc.)
├── layout/
│   ├── AppShell.tsx          # Authenticated layout wrapper
│   ├── Sidebar.tsx           # Left nav (Home, My Events, Map, Friends)
│   ├── TopBar.tsx            # Search bar, filters, create event, notifications, profile
│   └── RightPanel.tsx        # Recently saved + friends (explore page)
├── events/
│   ├── EventCard.tsx         # Feed card (from /6 design)
│   ├── EventFlyer.tsx        # Large flyer display (from /8 design)
│   ├── EventForm.tsx         # Create/edit event form
│   ├── EventFilters.tsx      # Category filter pills
│   └── SimilarEvents.tsx     # Grid of related events
├── social/
│   ├── AvatarStack.tsx       # Overlapping friend avatars
│   ├── FriendCard.tsx        # Friend list item
│   ├── FriendSearch.tsx      # Search + add friends
│   └── NotificationDropdown.tsx
├── orgs/
│   ├── OrgCard.tsx           # Organization list/grid item
│   ├── OrgProfile.tsx        # Full org page content
│   └── OrgForm.tsx           # Create/edit org
├── onboarding/
│   ├── InterestPicker.tsx    # Tag multi-select
│   ├── DemographicsForm.tsx  # Year, major, regions
│   └── OnboardingProgress.tsx
└── map/
    ├── CampusMap.tsx         # Map container
    └── EventPin.tsx          # Map marker
```

## Route Protection Strategy

```typescript
// Middleware matcher:
// - Public: /, /api/auth/*, /_next/*, /favicon.ico
// - Everything else: requires auth

// Onboarding guard (in middleware):
// If authenticated but !session.user.onboarded → redirect /onboarding
// If on /onboarding and already onboarded → redirect /explore

// Page-level guards:
// - /events/[id]/edit: verify event.creatorId === session.user.id
// - /orgs/create: verify session.user.isOrgLeader
// - /orgs/[id]/edit: verify org membership with owner role
```

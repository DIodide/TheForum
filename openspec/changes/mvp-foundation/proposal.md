# MVP Foundation — The Forum

## Summary

Build the complete MVP of The Forum: a campus event discovery platform for Princeton students. This change takes the codebase from boilerplate scaffolding to a working product with authentication, a real database schema, event CRUD, a personalized explore feed, social features, and organization management.

## Motivation

Students discover campus events through fragmented channels — listservs, group chats, Instagram. The Forum centralizes event discovery with personalization, social signals (friend RSVPs), and a polished UI. The PRD defines P0 requirements across onboarding, explore feed, event creation, social features, organizations, and notifications. None of these exist yet.

## Approach

**Next.js-first architecture.** All application logic lives in Next.js (App Router, Server Actions, Drizzle ORM). FastAPI is reserved for the recommendation algorithm later. This keeps the stack simple and avoids unnecessary API boundaries during MVP.

```
┌─────────────────────────────────────────────────┐
│                   Next.js 15                    │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐  │
│  │   Pages   │  │  Server   │  │   Auth.js   │  │
│  │ (App      │  │  Actions  │  │  (EntraID)  │  │
│  │  Router)  │  │  + API    │  │             │  │
│  └─────┬─────┘  └─────┬─────┘  └──────┬─────┘  │
│        │              │               │         │
│        └──────────┬───┘───────────────┘         │
│              ┌────▼─────┐                       │
│              │ Drizzle  │                       │
│              │   ORM    │                       │
│              └────┬─────┘                       │
└───────────────────┼─────────────────────────────┘
               ┌────▼─────┐     ┌──────────┐
               │ Postgres │     │    S3     │
               │   (DB)   │     │ (images)  │
               └──────────┘     └──────────┘
```

**Auth: Microsoft EntraID** via Auth.js (NextAuth v5) with the Azure AD provider. Princeton tenant: `2ff60116-7431-425d-b5af-077d7791bda4`. Users authenticate with their Princeton credentials; we extract NetID from the `userPrincipalName`.

**Image uploads: AWS S3** using presigned URLs. Flyer images upload directly from the browser to S3, and we store the URL in the database.

**Feed ranking (MVP):** SQL-based scoring. Weighted sum of interest-tag overlap, time proximity, friend RSVP count, and recency. No ML needed yet — this can be extracted to FastAPI later.

**UI:** Extract reusable components from the /6 (explore) and /8 (event detail) design mockups. Install shadcn/ui primitives. Use the frontend-design skill for high-fidelity polish.

## Phases

### Phase 0 — Foundation
- Database schema (all tables)
- Auth.js + Microsoft EntraID integration
- Install shadcn components
- Extract reusable UI components (EventCard, Sidebar, TopBar, etc.)
- Layout shell (authenticated app layout)

### Phase 1 — Onboarding + Explore Feed
- Multi-step onboarding flow (interests, demographics, org leader status)
- Explore page with personalized feed (the /6 design)
- Search + category filters
- RSVP + Save actions on event cards

### Phase 2 — Event Creation + Detail Page
- Create Event form (title, description, datetime, location, tags, flyer upload)
- S3 presigned URL upload flow
- Event detail page (the /8 design)
- Edit/delete own events
- "Similar events" section

### Phase 3 — Social Features
- Friend search (name/NetID)
- Send/accept friend requests
- Friend list in sidebar
- "Friends attending" on event cards + detail page
- Notification dropdown (friend requests, event reminders)
- Polling-based notification updates

### Phase 4 — Organizations + Map + Polish
- Organization profiles (logo, description, officers, events)
- Create organization (org leaders only)
- Follow organizations
- Org search + category filters
- Campus map with event pins (fixed location set)
- Time navigation on map
- Account settings page
- Landing page (unauthenticated)

## Non-goals

- Mobile app
- Private event coordination
- Analytics dashboard
- Real-time WebSocket notifications (polling is fine for MVP)
- ML-based recommendations (SQL scoring is sufficient)
- Email scraping / listserv integration (manual event creation only)

## Key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API architecture | Next.js Server Actions | Simpler than REST API for MVP; type-safe end-to-end |
| Auth | Auth.js v5 + Azure AD provider | Handles OAuth2 flow natively; Princeton EntraID compatible |
| Image storage | S3 presigned URLs | AWS creds already configured; direct browser upload |
| Feed ranking | SQL-weighted scoring | Good enough for MVP; no ML infrastructure needed |
| Locations | Fixed enum/lookup table | Enables map feature + consistent filtering |
| Tags | Fixed taxonomy (extensible later) | Better matching quality; simpler UI |
| Notifications | Polling | Avoids WebSocket complexity for MVP |
| Map library | TBD (Mapbox or Leaflet) | Need campus map tiles — investigate options |

## Risks

- **EntraID registration** — Need Azure AD app registration with Princeton tenant. Requires admin consent for `User.Read` scope.
- **Campus map tiles** — Need a good map source for Princeton campus. Mapbox has campus-level detail; could also use a static SVG map.
- **S3 bucket setup** — Need bucket creation, CORS config, IAM policy for presigned URLs.
- **Schema migrations** — First real schema push. Need to get Drizzle migrations working cleanly.

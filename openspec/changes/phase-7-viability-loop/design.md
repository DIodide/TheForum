## Context

The Forum has reached feature completeness for the core MVP loop, but the current product still lacks a compelling retention and trust story. The explore feed is served from inline logic in `apps/web/src/actions/events.ts`, the right rail in the web app still contains placeholder-level social value, and organizers can publish events without any real feedback on quality or reach. The repo also contains a minimal FastAPI backend that is currently unused for product intelligence work, which creates an opportunity to move aggregation and diagnostics out of the online request path without introducing a heavyweight recommendation platform.

## Goals / Non-Goals

**Goals:**
- Turn Explore into a decision-making surface that helps a student quickly decide what to attend this week.
- Collect explicit interaction signals that can improve ranking quality over time.
- Move ranking from an opaque heuristic to a debuggable pipeline with stored reasons and evaluation data.
- Give organizers confidence that posting on The Forum is worthwhile through pre-publish guidance and post-publish analytics.
- Add retention surfaces that create repeat value after onboarding.

**Non-Goals:**
- Building a full ML platform or external recommendation infrastructure in this phase.
- Launching a native mobile app.
- Building a full moderation/admin console.
- Building a broad outbound email platform; if briefing email is added later, it can build on the same summary payloads.

## Decisions

### 1. Serve a shelf-based feed from a shared scored candidate set
The explore page will shift from a flat grid to named shelves such as "Top Picks This Week", "Because Friends Are Going", "Near You", and "From Orgs You Follow". Each shelf will be assembled from a shared ranked candidate pool and filtered into purpose-specific sections, rather than running a separate query per shelf.

Why this approach:
- It gives the user clearer scanning and better decision support.
- It keeps the online serving path simple enough for the current monorepo.
- It lets multiple surfaces share the same scoring and explanation primitives.

Alternatives considered:
- Keep one flat feed and only improve ranking. Rejected because it does not solve the UX problem of cognitive overload.
- Build each shelf from unrelated queries. Rejected because it fragments ranking logic and makes explanations inconsistent.

### 2. Use append-only engagement logs plus derived aggregate tables
User interaction events will be stored as append-only records for impression, detail click, save, RSVP, share, export, and dismiss actions. Daily or hourly jobs will derive user, event, and organization aggregates from those records.

Why this approach:
- Raw events are flexible and future-proof.
- Aggregate tables make online ranking faster and easier to inspect.
- This creates a clean path to offline evaluation later.

Alternatives considered:
- Update counters directly on events and users. Rejected because it loses important context like surface, shelf, and reason.
- Skip raw logs and compute everything on demand. Rejected because it will not scale to experimentation or diagnostics.

### 3. Keep online feed serving in Next.js and move scheduled data work to FastAPI
The web app will continue to serve feed requests through server actions, while the FastAPI backend will own scheduled aggregation jobs and ranking/debug endpoints.

Why this approach:
- It avoids a large online architecture migration in the same phase as a major UX rewrite.
- It gives the dormant backend a clear purpose.
- It allows aggregation and diagnostics to evolve independently from the UI.

Alternatives considered:
- Do everything in the web app. Rejected because background data workflows and diagnostics will become harder to maintain there.
- Move the full ranking request path to FastAPI immediately. Rejected because it adds more integration risk than Phase 7 needs.

### 4. Make recommendation reasons structured, not decorative
Each served recommendation will include machine-readable reason codes such as `friend_attendance`, `interest_match`, `nearby`, `followed_org`, or `trending`. The UI will translate those into user-facing explanation chips.

Why this approach:
- Reasons build trust in the feed.
- Structured reasons can be audited and evaluated.
- They let the team inspect why an event ranked and which reasons actually convert.

Alternatives considered:
- Generate free-form explanatory strings inline in the UI. Rejected because they are harder to test and audit.

### 5. Treat organizer trust as a product surface, not a reporting afterthought
The create/edit flow will include a quality checklist and score before publish, while organizer-facing event pages will show funnel metrics after publish.

Why this approach:
- It helps organizers improve events before they underperform.
- It makes The Forum feel like a distribution channel, not just a posting form.
- It creates a second core habit loop: organizers return to improve and repost.

Alternatives considered:
- Build analytics only. Rejected because it arrives too late to influence event quality.
- Build only a checklist. Rejected because it does not prove value after publishing.

### 6. Start retention with in-app briefing and notification payloads
Phase 7 will deliver a weekly briefing module in the web app and produce reusable notification payloads for relevant org/friend activity. Email can be layered on later if needed, but it is not required to get the loop working.

Why this approach:
- It fits the current stack.
- It avoids blocking on outbound delivery infra.
- It still lets the product create a recurring "what should I do this week?" moment.

Alternatives considered:
- Email-first weekly digest. Rejected for this phase because the repo has no existing delivery infrastructure.

## Risks / Trade-offs

- [Risk] Complex feed UX adds too many simultaneous changes to Explore. -> Mitigation: roll out shelves behind a feature flag and keep the current flat feed as a fallback during development.
- [Risk] Engagement logging creates noisy or duplicated events. -> Mitigation: define canonical event names, surface identifiers, and idempotency rules before wiring analytics.
- [Risk] FastAPI introduces operational complexity before it provides value. -> Mitigation: start with one or two scheduled aggregation jobs and a simple diagnostics endpoint.
- [Risk] Recommendation reasons could feel generic if not tied to visible value. -> Mitigation: only expose reasons that map to real ranking features and measurable user actions.
- [Risk] Organizer analytics may look weak in low-volume periods. -> Mitigation: include qualitative guidance and benchmarks alongside raw counts.

## Migration Plan

1. Add new schema objects for interaction logs, event dismissals, aggregate features, and ranking snapshots.
2. Start writing raw interaction events from the current web surfaces without changing the feed UI.
3. Build aggregation jobs and backfill enough history to support scoring and diagnostics.
4. Implement the new shelf-based Explore experience behind a feature flag using the new ranking payloads.
5. Launch organizer quality scoring and analytics once event-level funnel data is populated.
6. Switch Explore to the new experience after validation, leaving the current `getFeedEvents()` path as a rollback target until the phase stabilizes.

Rollback:
- Disable the new feed flag and fall back to the existing flat feed served from the current heuristic query.
- Keep raw interaction logging enabled even if the new feed is rolled back, since the data remains useful.

## Open Questions

- Should the weekly briefing live only on Explore, or also have a dedicated home/dashboard route?
- Should dismissing an event be reversible from the UI in Phase 7, or only through future settings work?
- Do organizer analytics live on the event detail page, a dedicated organizer dashboard, or both?
- How much of the ranking diagnostics should be exposed in-app versus kept as backend/debug tooling?

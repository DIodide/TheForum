## 1. Feed Experience

- [x] 1.1 Redesign Explore into named recommendation shelves and a "My Week" rail
- [x] 1.2 Add recommendation reason chips and summary metadata to event cards and shelf headers
- [x] 1.3 Add a dismiss/not-interested action and remove dismissed events from active feed surfaces

## 2. Engagement Logging

- [x] 2.1 Add database tables for raw interaction events, dismissed events, aggregate features, and ranking snapshots
- [x] 2.2 Log impressions, detail opens, saves, RSVPs, shares, exports, and dismissals from web app surfaces
- [x] 2.3 Normalize interaction context payloads so each event records surface, shelf, reason codes, and timestamps

## 3. Recommendation Pipeline

- [x] 3.1 Add FastAPI job modules for scheduled aggregate generation and diagnostics endpoints
- [x] 3.2 Build user, event, and organization feature aggregates from onboarding and interaction data
- [x] 3.3 Refactor feed serving to use candidate generation, scoring, and structured explanation reasons

## 4. Ranking Evaluation

- [x] 4.1 Persist ranking snapshots for served recommendations and shelf assignments
- [x] 4.2 Add an internal diagnostics surface or endpoint to inspect ranking reasons for a user and event
- [x] 4.3 Add evaluation queries or scripts for CTR, save rate, RSVP rate, hide rate, and shelf performance

## 5. Organizer Success

- [x] 5.1 Add event quality scoring and pre-publish guidance to create and edit event flows
- [x] 5.2 Capture organizer funnel metrics for impressions, detail opens, saves, RSVPs, and exports
- [x] 5.3 Build organizer-facing event insights with actionable follow-up recommendations

## 6. Retention Loops

- [x] 6.1 Generate and render a weekly briefing module for upcoming high-confidence events
- [x] 6.2 Add follow-driven and friend-driven notification payloads for new relevant events and upcoming commitments
- [x] 6.3 Improve cold-start Explore states with starter shelves, suggested orgs, and stronger first-session recommendations

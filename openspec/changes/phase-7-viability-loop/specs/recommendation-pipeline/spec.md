## ADDED Requirements

### Requirement: Engagement event logging
The system SHALL record raw engagement events for recommendation surfaces and downstream event actions.

#### Scenario: Feed card is shown to a user
- **WHEN** a recommendation card is rendered in a ranked feed shelf
- **THEN** the system stores an impression event with user, event, shelf, reason codes, and timestamp context

#### Scenario: User interacts with an event
- **WHEN** the user clicks into details, saves, RSVPs, shares, exports, or dismisses an event
- **THEN** the system stores a corresponding engagement event linked to the originating recommendation context when available

### Requirement: Aggregate feature generation
The system SHALL derive ranking features from raw engagement, onboarding, social, and event metadata on a scheduled basis.

#### Scenario: Scheduled aggregation job runs
- **WHEN** the aggregation workflow executes
- **THEN** the system updates user, event, and organization feature tables used by the ranking service

### Requirement: Candidate generation and scoring
The feed service SHALL rank events from a candidate pool using explicit signals rather than a single opaque heuristic.

#### Scenario: User requests Explore recommendations
- **WHEN** the feed service handles a recommendation request
- **THEN** it generates candidate events, scores them with user, social, temporal, and quality signals, and returns a ranked response with explanation reasons

### Requirement: Ranking diagnostics
The system SHALL persist enough ranking metadata to inspect why an event was recommended.

#### Scenario: Team member investigates a ranking decision
- **WHEN** an internal diagnostics view or endpoint is used for a user and event
- **THEN** the system returns the event's shelf placement, ranking inputs, and explanation reasons for that recommendation

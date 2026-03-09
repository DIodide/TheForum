## ADDED Requirements

### Requirement: Pre-publish event quality guidance
The create and edit event flows SHALL provide organizers with a quality score and actionable guidance before publishing.

#### Scenario: Organizer has missing event details
- **WHEN** an organizer is preparing an event with weak or incomplete metadata
- **THEN** the form shows the current quality score and specific suggestions such as adding a flyer, clarifying the description, or selecting stronger tags

#### Scenario: Organizer reaches a strong quality threshold
- **WHEN** the event draft meets the configured quality criteria
- **THEN** the form indicates that the event is ready for publish without blocking submission

### Requirement: Organizer event analytics
Organizers SHALL be able to see a funnel view of how their event is performing after publish.

#### Scenario: Organizer opens an event insight view
- **WHEN** the organizer views analytics for one of their events
- **THEN** the system shows impressions, detail opens, saves, RSVPs, and exports for that event

### Requirement: Actionable organizer recommendations
The organizer experience SHALL surface concrete next steps based on event quality and engagement patterns.

#### Scenario: Event underperforms after publish
- **WHEN** an event has low conversion or missing quality signals
- **THEN** the organizer sees targeted suggestions for improving discoverability or event detail quality

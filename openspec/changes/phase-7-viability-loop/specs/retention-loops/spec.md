## ADDED Requirements

### Requirement: Weekly briefing
The product SHALL present a recurring weekly briefing that summarizes upcoming high-confidence events for the user.

#### Scenario: User returns during a new planning window
- **WHEN** the user opens the app during a new weekly cycle
- **THEN** the system shows a briefing module with the strongest upcoming events and why they matter

### Requirement: Social and follow-driven re-engagement
The system SHALL notify users when new events become relevant because of friend or organization activity.

#### Scenario: Followed organization posts a relevant event
- **WHEN** an organization the user follows publishes a new event
- **THEN** the system generates a re-engagement notification or briefing item for that event

#### Scenario: Friend activity increases event relevance
- **WHEN** a user's accepted friends save or RSVP to an event that is otherwise relevant
- **THEN** the system highlights that social momentum in the user's notification or briefing surfaces

### Requirement: Stronger cold-start activation
Newly onboarded users SHALL see starter recommendations even before rich behavioral history exists.

#### Scenario: New user finishes onboarding
- **WHEN** a user with little or no interaction history lands on Explore
- **THEN** the system shows starter shelves and suggestions derived from onboarding interests, campus regions, and candidate organizations to follow

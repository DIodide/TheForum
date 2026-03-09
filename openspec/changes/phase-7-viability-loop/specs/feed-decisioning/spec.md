## ADDED Requirements

### Requirement: Shelf-based explore feed
The Explore experience SHALL present events in distinct recommendation shelves that help a student decide what to attend this week.

#### Scenario: User opens Explore with multiple strong candidates
- **WHEN** the user opens the Explore page
- **THEN** the system shows non-empty shelves such as top picks, social picks, nearby events, or followed-organization events instead of a single undifferentiated list

#### Scenario: Shelf has no meaningful content
- **WHEN** a recommendation shelf has no qualifying events for the current user
- **THEN** the system hides that shelf rather than rendering an empty section

### Requirement: Recommendation explanations
Each recommended event SHALL include structured explanation reasons that the UI can render as concise trust-building cues.

#### Scenario: Event is recommended because of social and interest signals
- **WHEN** an event is returned with reason codes such as friend attendance or interest match
- **THEN** the event card shows corresponding explanation chips or labels to the user

### Requirement: Explicit dismiss control
The feed SHALL allow a user to dismiss an irrelevant event and use that action as a negative personalization signal.

#### Scenario: User hides an event
- **WHEN** the user chooses not interested or hide on a feed card
- **THEN** the event is removed from the current feed surface and excluded from future recommendation responses unless the user resets that preference

### Requirement: My Week summary rail
The Explore experience SHALL include a summary rail for the user's near-term commitments and activity context.

#### Scenario: User has saved or RSVP'd events
- **WHEN** the user has upcoming saved or RSVP'd events
- **THEN** the rail shows those upcoming commitments alongside relevant friend or organization activity

#### Scenario: User has no commitments yet
- **WHEN** the user has no saved or RSVP'd upcoming events
- **THEN** the rail shows starter guidance that directs the user toward recommendations, social discovery, or organization follows

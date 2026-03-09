## ADDED Requirements

### Requirement: Friends' events browsing
The explore page SHALL offer a way to view events that the user's friends have RSVP'd to.

#### Scenario: User filters by friends' events
- **WHEN** the user activates the "Friends Going" filter on the explore page
- **THEN** the feed shows only events where at least one accepted friend has RSVP'd, with friend count visible

#### Scenario: User has no friends
- **WHEN** the user has no accepted friends
- **THEN** the "Friends Going" filter is hidden or disabled

#### Scenario: No friends attending any events
- **WHEN** the user has friends but none have RSVP'd to any upcoming events
- **THEN** the feed shows an empty state message

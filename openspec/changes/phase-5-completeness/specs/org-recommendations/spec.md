## ADDED Requirements

### Requirement: Org recommendation feed
The orgs page SHALL display a "Recommended for You" section showing organizations whose events match the user's interest tags, ranked by overlap count.

#### Scenario: User has matching interests
- **WHEN** the user views the orgs page and has interest tags that overlap with event tags of organizations they don't already follow
- **THEN** the system displays up to 6 recommended organizations ranked by tag overlap count

#### Scenario: User already follows all matching orgs
- **WHEN** all recommended organizations are already followed by the user
- **THEN** the "Recommended for You" section is hidden

#### Scenario: User has no interests set
- **WHEN** the user has no interest tags in their profile
- **THEN** the "Recommended for You" section is hidden

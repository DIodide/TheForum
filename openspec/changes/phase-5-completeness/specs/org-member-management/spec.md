## ADDED Requirements

### Requirement: Org owner can add officers
The org profile page SHALL allow org owners to search for users and add them as officers.

#### Scenario: Owner adds an officer
- **WHEN** the org owner searches for a user by name or NetID and clicks "Add Officer"
- **THEN** the user is added to `orgMembers` with role `officer` and the member list updates

#### Scenario: Non-owner cannot manage members
- **WHEN** a user who is not the org owner views the org profile
- **THEN** the member management UI (add/remove officers) SHALL NOT be visible

### Requirement: Org owner can remove officers
The org profile page SHALL allow org owners to remove officers from the organization.

#### Scenario: Owner removes an officer
- **WHEN** the org owner clicks "Remove" on an officer in the member list
- **THEN** the officer's `orgMembers` row is deleted and the member list updates

### Requirement: External registration link display
The event detail page SHALL display the `externalLink` field as a clickable button when present.

#### Scenario: Event has external link
- **WHEN** an event has a non-null `externalLink`
- **THEN** the event detail page displays a "Register" button that opens the link in a new tab

#### Scenario: Event has no external link
- **WHEN** an event has a null `externalLink`
- **THEN** no registration button is displayed

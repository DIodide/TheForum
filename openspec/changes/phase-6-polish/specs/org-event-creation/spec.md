## ADDED Requirements

### Requirement: Org selector in event creation
The event creation form SHALL allow org members to associate an event with their organization.

#### Scenario: Org member creates event for org
- **WHEN** the user is an owner or officer of an organization
- **THEN** the create event form shows a dropdown to select which org the event belongs to

#### Scenario: User with no org memberships
- **WHEN** the user is not a member of any organization
- **THEN** no org selector is shown

### Requirement: Landing page organizer CTA
The landing page SHALL include a secondary CTA encouraging organizers to post events.

#### Scenario: Visitor sees organizer CTA
- **WHEN** an unauthenticated user views the landing page
- **THEN** a "Post an Event" call-to-action is visible alongside the main sign-in button

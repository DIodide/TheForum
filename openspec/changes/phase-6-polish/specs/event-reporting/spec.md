## ADDED Requirements

### Requirement: Report event
The event detail page SHALL allow users to report inappropriate or inaccurate events.

#### Scenario: User reports an event
- **WHEN** the user clicks the "Report" button on the event detail page and submits a reason
- **THEN** the report is stored for admin review and a confirmation toast is shown

#### Scenario: Duplicate report prevention
- **WHEN** the user has already reported an event
- **THEN** the report button indicates the event has been reported

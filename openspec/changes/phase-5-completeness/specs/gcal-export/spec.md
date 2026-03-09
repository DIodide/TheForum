## ADDED Requirements

### Requirement: Google Calendar export button
The event detail page SHALL display an "Add to Calendar" button that opens a Google Calendar event creation URL in a new tab.

#### Scenario: User exports event to Google Calendar
- **WHEN** the user clicks "Add to Calendar" on an event detail page
- **THEN** a new tab opens with a Google Calendar URL pre-filled with the event title, description, start datetime, end datetime (if available), and location name

#### Scenario: Event without end time
- **WHEN** the event has no `endDatetime`
- **THEN** the Google Calendar URL SHALL default to a 1-hour duration from the start time

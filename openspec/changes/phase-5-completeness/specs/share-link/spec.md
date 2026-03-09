## ADDED Requirements

### Requirement: Copy event link
The event detail page SHALL display a "Share" button that copies the event URL to the user's clipboard.

#### Scenario: Successful copy
- **WHEN** the user clicks the "Share" button on an event detail page
- **THEN** the event URL (`/events/{id}`) is copied to the clipboard and a toast notification confirms "Link copied"

#### Scenario: Clipboard API unavailable
- **WHEN** the browser does not support `navigator.clipboard`
- **THEN** the system SHALL fall back to selecting text in a hidden input and executing `document.execCommand('copy')`

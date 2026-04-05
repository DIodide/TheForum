## ADDED Requirements

### Requirement: Full HTML body extraction
The system SHALL fetch the complete HTML body for each new email by requesting the A2 message page, finding the text/html A3 attachment link, and fetching the raw HTML content.

#### Scenario: Successful body fetch
- **WHEN** the A2 page contains a text/html A3 attachment link
- **THEN** the system SHALL fetch the HTML attachment (without `&header=1`), store the full HTML as `body_html`, and derive `body_text` by stripping HTML tags

#### Scenario: No HTML attachment available
- **WHEN** the A2 page has no text/html A3 link (plain-text-only email)
- **THEN** the system SHALL use the RSS description as `body_html` and mark `body_complete` as false

### Requirement: HoagieMail sender extraction
The system SHALL parse the full HTML body for the HoagieMail footer pattern `Email composed by {name} ({email})` and extract the sender's real name and email.

#### Scenario: HoagieMail footer present
- **WHEN** the HTML body contains the HoagieMail footer
- **THEN** the system SHALL extract and store `hoagiemail_sender_name` and `hoagiemail_sender_email`

#### Scenario: HoagieMail footer absent but author is hoagie@princeton.edu
- **WHEN** the author email is `hoagie@PRINCETON.EDU` but no footer is found
- **THEN** the system SHALL set `is_hoagiemail` to true but leave sender name/email as null

### Requirement: Rate limiting
The system SHALL enforce a minimum delay of 150ms between HTTP requests to the LISTSERV server to avoid overloading it.

#### Scenario: Burst of new messages
- **WHEN** 50 new messages are detected in a single poll cycle
- **THEN** the system SHALL process body fetches sequentially with at least 150ms between each request, completing in approximately 15 seconds

### Requirement: Session-aware fetching
The system SHALL detect LISTSERV session expiry during body fetching and re-authenticate automatically.

#### Scenario: Session expires mid-batch
- **WHEN** an A2 or A3 page fetch returns "Login Required"
- **THEN** the system SHALL re-login, obtain fresh session credentials, and retry the failed request

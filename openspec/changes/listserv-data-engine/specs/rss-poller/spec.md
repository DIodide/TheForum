## ADDED Requirements

### Requirement: Periodic RSS feed polling
The system SHALL poll each enabled listserv's RSS feed at its configured interval (default 5 minutes). The poll SHALL fetch recent messages using `?RSS&L={listname}&v=2.0&LIMIT=100` and compare against `last_message_id` to identify new emails.

#### Scenario: New messages detected
- **WHEN** the RSS feed contains messages with IDs not matching `last_message_id`
- **THEN** the system SHALL extract message metadata (title, link, description, author, pubDate) and pass new messages to the body fetcher, and update `last_message_id` to the most recent message ID

#### Scenario: No new messages
- **WHEN** the RSS feed contains no messages newer than `last_message_id`
- **THEN** the system SHALL update `last_polled_at` and take no further action

#### Scenario: RSS feed unavailable
- **WHEN** the RSS feed request fails (timeout, 5xx, network error)
- **THEN** the system SHALL log the error, increment an error counter, and retry at the next poll interval without crashing

### Requirement: Authenticated RSS access
The system SHALL authenticate to LISTSERV before polling RSS feeds. The authentication SHALL use the LISTSERV email/password login flow to obtain a WALOGIN cookie and session token.

#### Scenario: Session expiry during poll
- **WHEN** the RSS feed returns a "Login Required" HTML page instead of XML
- **THEN** the system SHALL re-authenticate automatically and retry the RSS fetch

#### Scenario: Login credentials invalid
- **WHEN** the LISTSERV login fails (bad email/password)
- **THEN** the system SHALL log a critical error, disable all polling jobs, and surface the error via the status API

### Requirement: Per-listserv poll intervals
The system SHALL support configurable poll intervals per listserv. The interval MUST be at minimum 60 seconds and default to 300 seconds (5 minutes).

#### Scenario: High-traffic listserv
- **WHEN** a listserv is configured with `poll_interval_seconds: 120`
- **THEN** the system SHALL poll that listserv's RSS feed every 120 seconds

#### Scenario: Interval update at runtime
- **WHEN** an admin updates a listserv's poll interval via the API
- **THEN** the scheduler SHALL apply the new interval without restarting the service

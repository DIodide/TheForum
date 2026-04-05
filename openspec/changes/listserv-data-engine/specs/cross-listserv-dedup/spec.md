## ADDED Requirements

### Requirement: Exact message_id dedup at ingestion
The system SHALL reject emails with a message_id already present in the listserv_emails table via the unique constraint.

#### Scenario: Same HoagieMail on two listservs
- **WHEN** the same email (same message_id) appears on WHITMANWIRE and ROCKYWIRE
- **THEN** the system SHALL store the first occurrence and skip the duplicate with a log entry

### Requirement: Fuzzy sender + title dedup
The system SHALL detect near-duplicate emails from the same sender with similar subjects within a 72-hour window using pg_trgm trigram similarity (threshold 0.6).

#### Scenario: Reminder email
- **WHEN** the same hoagiemail_sender_email sends "Free Food Friday!" then "[REMINDER] Free Food Friday!" within 72 hours
- **THEN** the system SHALL flag the second as a duplicate of the first and link them in pipeline_logs

#### Scenario: Different events from same sender
- **WHEN** the same sender sends "Concert Tonight" and "Auditions Tomorrow" within 72 hours
- **THEN** the system SHALL treat them as separate emails (trigram similarity below threshold)

### Requirement: Post-classification event dedup
After metadata extraction, the system SHALL compare the extracted event title + datetime against existing events using fuzzy matching (token_set_ratio > 0.75 within ±24 hours).

#### Scenario: Same event extracted from different email wording
- **WHEN** two emails produce events with title "Spring Concert" at the same datetime
- **THEN** the system SHALL create only one event and log the second as `duplicate`

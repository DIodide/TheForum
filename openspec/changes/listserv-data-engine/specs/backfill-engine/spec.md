## ADDED Requirements

### Requirement: Backfill via API
The system SHALL expose `POST /engine/backfill` to trigger a bulk historical import for a listserv, accepting `list_name` and `limit` parameters.

#### Scenario: Backfill a new listserv
- **WHEN** `POST /engine/backfill` with `{ "list_name": "BUTLERBUZZ", "limit": 20000 }`
- **THEN** the system SHALL start a background task that fetches the RSS feed with the given limit, fetches full bodies, and inserts into listserv_emails

#### Scenario: Backfill already running
- **WHEN** a backfill is requested for a listserv that already has a backfill in progress
- **THEN** the system SHALL reject the request with a 409 Conflict

### Requirement: Checkpointed progress
The system SHALL save progress every 500 messages during backfill so the job can be resumed if interrupted.

#### Scenario: Backfill interrupted
- **WHEN** the service restarts during a backfill at message 2500/10000
- **THEN** the system SHALL resume from message 2500 on restart, skipping already-fetched bodies

### Requirement: Backfill status tracking
The system SHALL expose `GET /engine/backfill/{job_id}/status` returning total messages, completed count, errors, and estimated time remaining.

#### Scenario: Check backfill progress
- **WHEN** `GET /engine/backfill/{job_id}/status`
- **THEN** the system SHALL return `{ "total": 20000, "completed": 8500, "errors": 3, "eta_minutes": 77 }`

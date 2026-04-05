## ADDED Requirements

### Requirement: CRUD for listserv scrape jobs
The system SHALL expose API endpoints to create, read, update, and delete listserv scrape jobs. Each job stores: list_name, poll_interval_seconds, enabled, last_polled_at, last_message_id.

#### Scenario: Add a new listserv
- **WHEN** `POST /engine/jobs` with `{ "list_name": "ROCKYWIRE", "poll_interval_seconds": 300 }`
- **THEN** the system SHALL create the job, start polling at the specified interval, and return the job config

#### Scenario: Disable a listserv
- **WHEN** `PATCH /engine/jobs/{id}` with `{ "enabled": false }`
- **THEN** the system SHALL stop polling that listserv without deleting its data

#### Scenario: Delete a listserv job
- **WHEN** `DELETE /engine/jobs/{id}`
- **THEN** the system SHALL stop polling and remove the job config (ingested emails remain in the database)

### Requirement: Engine status endpoint
The system SHALL expose `GET /engine/status` returning aggregate stats: total jobs, active jobs, messages processed, events created, errors, and last poll time per job.

#### Scenario: Status check
- **WHEN** `GET /engine/status`
- **THEN** the system SHALL return a JSON object with per-job and aggregate statistics

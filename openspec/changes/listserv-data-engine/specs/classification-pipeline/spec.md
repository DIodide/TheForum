## ADDED Requirements

### Requirement: Pluggable classifier interface
The system SHALL define a Python protocol for event classification and tag classification. Default implementations SHALL use the existing Gemini/OpenRouter LLM. Team-built classifiers SHALL be swappable without engine code changes.

#### Scenario: LLM classifier (default)
- **WHEN** no custom classifier is configured
- **THEN** the system SHALL use Gemini Flash Lite via OpenRouter to classify emails as event/not-event and assign tags

#### Scenario: Custom classifier plugged in
- **WHEN** a Python class implementing the EventClassifier protocol is registered
- **THEN** the system SHALL use that class for classification instead of the LLM default

### Requirement: Pipeline orchestration
The system SHALL process each new email through: (1) event binary classification, (2) if event: tag classification + metadata extraction, (3) write to events table. Processing SHALL be async and not block the poller.

#### Scenario: Email classified as event
- **WHEN** the classifier returns `is_event: true`
- **THEN** the system SHALL run tag classification, extract metadata (title, datetime, location, description), and insert into the events table with `source='listserv'`

#### Scenario: Email classified as not-event
- **WHEN** the classifier returns `is_event: false`
- **THEN** the system SHALL log the result in pipeline_logs with status `skipped_not_event` and take no further action

#### Scenario: Classifier error
- **WHEN** the classifier raises an exception or times out
- **THEN** the system SHALL log the error in pipeline_logs with status `error` and continue processing the next email

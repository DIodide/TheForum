## Capability: Listserv Ingestion

### Overview
Automated pipeline that polls a Gmail inbox subscribed to Princeton listservs, extracts structured event data via LLM, deduplicates against existing events, and auto-publishes to The Forum's feed.

### Email Ingestion
- **Source**: Gmail API polling a dedicated inbox (e.g. `theforum-pipeline@g.princeton.edu`)
- **Frequency**: Every 10–15 minutes via external cron
- **Scope**: Configurable per-listserv via `listserv_configs` table
- **Target listservs (initial)**: WHITMANWIRE@Princeton.EDU, freefood@Princeton.EDU
- **Process**: Fetch unread → mark as read → enqueue for processing

### HoagieMail Parsing
- Detect HoagieMail footer via regex: `Email composed by (.+?) \((.+?@princeton\.edu)\)`
- Extract sender display name and princeton.edu email
- Use sender email to match against `users` (by netId/email) and `organizations` (via `listserv_configs.org_id` or name fuzzy match)

### LLM Extraction
- **Model**: Gemini 3.1 Flash Lite via OpenRouter (`google/gemini-flash-lite-3.1`) with `response_format: { type: "json_object" }`
- **Input**: Preprocessed email (subject + plain text body + link list + attachment descriptions)
- **Output schema**:
  ```json
  {
    "is_event": true,
    "title": "Spring Fling Concert",
    "description": "Join us for live music...",
    "datetime": "2026-04-15T19:00:00-04:00",
    "end_datetime": "2026-04-15T22:00:00-04:00",
    "location_name": "Frist Campus Center",
    "tags": ["music", "social"]
  }
  ```
- **Non-events**: Emails where `is_event = false` (lost & found, general announcements, etc.) are logged but not inserted
- **Tag mapping**: LLM selects from the fixed `event_tag` enum values

### Location Resolution
- Fuzzy-match `location_name` against `campus_locations.name` using token-set ratio
- Threshold: 70% similarity → match, else fall back to a generic "Other" location
- Common aliases handled (e.g. "Frist" → "Frist Campus Center", "McCosh 50" → "McCosh Hall")

### Deduplication
- **Layer 1 — Exact**: `source_message_id` unique constraint prevents reprocessing
- **Layer 2 — Fuzzy**: Before insert, query events where `datetime` is within ±24 hours. Compute normalized title similarity (token-set ratio via `thefuzz`). Skip if similarity > 0.75
- **Logging**: All skipped duplicates recorded in `pipeline_logs` with `status = "duplicate"`

### Auto-Publishing
- Events with `is_event = true` that pass dedup are inserted directly into the `events` table
- `source` set to `"listserv"`, `sourceMessageId` set to Gmail message ID
- `orgId` set from `listserv_configs.org_id` or HoagieMail sender match
- `creatorId` set from sender email match against `users`, or the system "The Forum Bot" pipeline user (netId: `_pipeline`)
- `isPublic` set to `true`

### Pipeline Logging
- Every processed email produces a `pipeline_logs` entry with status: `"success"`, `"skipped_not_event"`, `"duplicate"`, `"error"`
- Error entries include `error_text` for debugging
- Success entries link to the created event via `extracted_event_id`

### Admin Panel
- **Dashboard**: Poll status, email throughput, error rate
- **Event Review**: Browse/search/edit/delete pipeline-created events
- **Listserv Config**: Add/remove/toggle listserv subscriptions, set org mappings
- **Dedup Log**: Inspect skipped duplicates, manually override if needed

### Extensibility
- Adding a new listserv requires only a row in `listserv_configs` + subscribing the Gmail inbox to that list
- The extraction prompt and tag enum can be updated without code changes (prompt stored as constant, enum comes from DB schema)
- Future: image/flyer extraction from email attachments (OCR), webhook-based push ingestion

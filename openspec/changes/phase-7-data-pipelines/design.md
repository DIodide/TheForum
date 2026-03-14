## Design Decisions

### Email Ingestion — Pull Model via Gmail API

Use the Gmail API (not IMAP) to poll a Gmail inbox subscribed to Princeton listservs. A FastAPI background task or cron-triggered endpoint runs every 10–15 minutes, fetches unread messages, processes them, and marks them as read.

**Account strategy:** Use a personal Google Workspace account for initial development and testing. Migrate to a dedicated service account before production deployment.

**Why Gmail API over IMAP?**
- OAuth2 is more secure than stored passwords
- Gmail API supports label/query filtering natively
- Better rate limits and reliability than raw IMAP
- Google Workspace is standard at Princeton (g.princeton.edu)

**Why not SMTP push (like listflow)?**
- Requires DNS/MX record setup and a publicly-reachable SMTP server
- More infrastructure burden for the same result
- Pull model is simpler to deploy alongside the existing FastAPI backend

### LLM Extraction Pipeline

Each email goes through a structured extraction pipeline using **Gemini 3.1 Flash Lite via OpenRouter** (OpenAI-compatible API) with JSON mode:

1. **Preprocess**: Convert HTML to plain text (via `beautifulsoup4`), extract links and attachment metadata
2. **HoagieMail detection**: Check for HoagieMail footer pattern; if present, extract sender name and email from the structured footer (`Email composed by First.Last (first.last@princeton.edu)`)
3. **Event extraction**: Single LLM call with JSON schema enforcement to extract:
   - `title` (string) — event name
   - `description` (string) — event details
   - `datetime` (ISO 8601) — start time
   - `end_datetime` (ISO 8601 | null) — end time if mentioned
   - `location_name` (string) — raw location text
   - `tags` (string[]) — from our `event_tag` enum
   - `is_event` (boolean) — whether the email describes an actual event (vs. announcements, lost & found, etc.)
4. **Location resolution**: Fuzzy-match `location_name` against our `campus_locations` table using string similarity. Fall back to a "TBD" / generic location if no match above threshold.
5. **Deduplication check** (see below)
6. **Insert** into `events` table with `source = "listserv"` and `sourceMessageId` set to the Gmail message ID

### HoagieMail Footer Parsing

HoagieMail emails include a structured footer:
```
This email was instantly sent to all college listservs with Hoagie Mail.
Email composed by First.Last (first.last@princeton.edu) — if you believe ...
```

Parse this with a regex to extract `sender_name` and `sender_email`. Cross-reference against:
1. `organizations` table (by name fuzzy match or a `listserv_configs` mapping)
2. `users` table (by email/netId) to set `creatorId`

If no org match, the event is created as an individual post attributed to a system "The Forum Bot" pipeline user (a dedicated row in the `users` table with a reserved netId like `_pipeline`).

### Deduplication Strategy

Aggressive dedup using a two-layer approach:

1. **Exact dedup**: `sourceMessageId` uniqueness constraint prevents reprocessing the same email
2. **Fuzzy dedup**: Before inserting, query events within ±24 hours of the extracted datetime. Compare titles using normalized Levenshtein similarity (via `thefuzz` library). If similarity > 0.75, skip insertion and log the duplicate.

This catches cases where an event is both emailed to a listserv and manually created on The Forum.

### Listserv Configuration

New `listserv_configs` table to make the system extensible:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| address | varchar | Listserv email address (e.g. `WHITMANWIRE@Princeton.EDU`) |
| label | varchar | Display name (e.g. "Whitman Wire") |
| org_id | uuid? | FK to organizations — auto-associate events from this list |
| gmail_label | varchar | Gmail label/filter to identify these emails |
| enabled | boolean | Toggle ingestion on/off |
| created_at | timestamp | |

### Events Schema Changes

Add two columns to the `events` table:
- `source` — `varchar`, default `"manual"`. Values: `"manual"`, `"listserv"`
- `sourceMessageId` — `varchar`, nullable, unique. Gmail message ID for dedup

No existing data is affected (all current events get `source = "manual"` by default).

### Admin Panel (`apps/admin-web`)

Minimal Vite + React app (no SSR needed) that talks directly to FastAPI endpoints:

**Pages:**
1. **Pipeline Dashboard** — Recent ingested emails, success/failure counts, last poll timestamp
2. **Event Review** — List of pipeline-created events with inline edit/delete. Filter by status, date, listserv source
3. **Listserv Config** — CRUD table for managing listserv subscriptions and org mappings
4. **Dedup Log** — Shows skipped duplicates for debugging

**Auth:** Protect with a simple API key or admin token in FastAPI (no CAS needed for internal tool).

**Stack:** Vite 6, React 19, Tailwind CSS, shadcn/ui (standalone install), TanStack Query for data fetching.

### FastAPI Endpoints (new)

```
POST   /pipeline/poll              — Trigger email poll (cron or manual)
GET    /pipeline/status            — Last poll time, counts, errors
GET    /pipeline/events            — List pipeline-created events (paginated)
PATCH  /pipeline/events/{id}       — Edit a pipeline event
DELETE /pipeline/events/{id}       — Delete a pipeline event
GET    /pipeline/duplicates        — List skipped duplicates
GET    /pipeline/configs           — List listserv configs
POST   /pipeline/configs           — Create listserv config
PATCH  /pipeline/configs/{id}      — Update listserv config
DELETE /pipeline/configs/{id}      — Delete listserv config
```

### Cron / Scheduling

Use a simple approach: a GitHub Actions cron (like Today does) or an external cron service that hits `POST /pipeline/poll` every 10–15 minutes. No in-process scheduler needed — keeps the FastAPI app stateless.

## Schema Changes

- `events` table: Add `source varchar default 'manual'`, `source_message_id varchar unique`
- New table: `listserv_configs` (id, address, label, org_id FK, gmail_label, enabled, created_at)
- New table: `pipeline_logs` (id, message_id, listserv_config_id FK, status enum, error_text, extracted_event_id FK nullable, created_at)

## Dependencies

### FastAPI (backends/fastapi)
- `google-api-python-client` + `google-auth-oauthlib` — Gmail API access
- `openai` — OpenRouter client (OpenAI-compatible SDK, pointed at `https://openrouter.ai/api/v1`)
- `beautifulsoup4` — HTML parsing
- `thefuzz[speedup]` — Fuzzy string matching for dedup and location resolution

### Admin panel (apps/admin-web)
- `vite`, `react`, `react-dom`, `react-router-dom`
- `tailwindcss`, `@tailwindcss/vite`
- `@tanstack/react-query`
- `shadcn/ui` components (standalone)

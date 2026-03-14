## Why

The Forum currently depends entirely on manual event creation. Most Princeton events are announced via residential college listservs and services like Hoagie Mail — hundreds of emails per week that never make it into our platform. Without automated ingestion, the feed will always be incomplete and students will miss events.

## What Changes

- Add a listserv email ingestion pipeline in the FastAPI backend that polls a Gmail/Google Workspace inbox subscribed to Princeton listservs
- Use LLM extraction (Gemini 3.1 Flash Lite via OpenRouter) to parse unstructured emails into structured event data matching our schema (title, description, datetime, location, tags)
- Parse HoagieMail structured footers to extract sender org identity
- Auto-publish extracted events to the main feed with `source = "listserv"` provenance tracking
- Aggressive deduplication using title similarity + datetime proximity to prevent duplicates with manually-created events
- Build a lightweight admin panel (`apps/admin-web`) for reviewing, editing, and managing pipeline-ingested events
- Design the system to support any listserv — initial targets are one residential college listserv (e.g. WHITMANWIRE) and freefood@princeton.edu

## Capabilities

### New Capabilities
- `listserv-ingestion`: Poll email inbox, extract structured events via LLM, auto-publish to feed
- `deduplication`: Title + datetime similarity matching to prevent duplicate events
- `hoagiemail-parsing`: Extract sender org from HoagieMail structured footers
- `admin-panel`: Vite + React admin dashboard for managing pipeline-ingested events
- `listserv-config`: CRUD for managing which listservs are ingested and their org mappings

### Modified Capabilities
- `events` schema: Add `source` and `sourceMessageId` fields for provenance tracking

## Impact

- `backends/fastapi/app/` — New pipeline modules: email polling, LLM extraction, dedup, auto-publish
- `apps/database/src/schema/index.ts` — Add `source`, `sourceMessageId` to events table; add `listserv_configs` table
- `apps/admin-web/` — New Vite + React app for pipeline management
- `backends/fastapi/pyproject.toml` — Add dependencies: `google-api-python-client`, `openai` (for OpenRouter), `thefuzz`

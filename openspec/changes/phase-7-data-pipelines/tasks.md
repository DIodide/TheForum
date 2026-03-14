## 1. Database Schema Extensions

- [x] 1.1 Add `source` (varchar, default `"manual"`) and `sourceMessageId` (varchar, nullable, unique) columns to `events` table
- [x] 1.2 Create `listserv_configs` table (id, address, label, org_id FK, gmail_label, enabled, created_at)
- [x] 1.3 Create `pipeline_logs` table (id, message_id, listserv_config_id FK, status enum, error_text, extracted_event_id FK nullable, created_at)
- [x] 1.4 Generate and apply migration, seed initial listserv configs for WHITMANWIRE and freefood
- [x] 1.5 Seed a system pipeline user ("The Forum Bot", netId: `_pipeline`) in the users table for unmatched event attribution

## 2. Gmail API Integration

- [x] 2.1 Add `google-api-python-client`, `google-auth-oauthlib` to FastAPI dependencies
- [x] 2.2 Implement Gmail OAuth2 credential setup (service account or OAuth flow) with token persistence
- [x] 2.3 Implement `fetch_unread_emails(label)` — fetch unread messages matching a Gmail label/query, return list of raw email data, mark as read
- [x] 2.4 Add env vars (`GMAIL_CREDENTIALS_JSON`, `GMAIL_TOKEN_PATH`, `OPENROUTER_API_KEY`) to FastAPI config

## 3. Email Parsing & Preprocessing

- [x] 3.1 Add `beautifulsoup4` dependency, implement `html_to_text(html)` and `extract_links(html)` utilities
- [x] 3.2 Implement HoagieMail footer detection and parsing — extract sender name and email via regex
- [x] 3.3 Implement `preprocess_email(raw)` — returns structured dict with subject, body_text, sender, links, hoagiemail_sender, timestamp, message_id

## 4. LLM Event Extraction

- [x] 4.1 Add `openai` dependency, implement OpenRouter client wrapper (base_url `https://openrouter.ai/api/v1`, model `google/gemini-flash-lite-3.1`) with JSON mode
- [x] 4.2 Design and implement extraction prompt — input: preprocessed email text; output: JSON with title, description, datetime, end_datetime, location_name, tags[], is_event
- [x] 4.3 Implement `extract_event(preprocessed_email)` — calls LLM, validates output against schema, returns structured event or None (if `is_event = false`)
- [x] 4.4 Implement `resolve_location(location_name)` — fuzzy-match against `campus_locations` table, return location_id or fallback

## 5. Deduplication

- [x] 5.1 Add `thefuzz[speedup]` dependency
- [x] 5.2 Implement `check_duplicate(title, datetime)` — query events within ±24h window, compute title similarity, return True if match > 0.75 threshold
- [x] 5.3 Implement `sourceMessageId` uniqueness check to prevent reprocessing same email

## 6. Pipeline Orchestration

- [x] 6.1 Implement `run_pipeline()` — orchestrates: fetch emails → preprocess → extract → dedup → insert event → log result
- [x] 6.2 Handle org matching: cross-reference HoagieMail sender and listserv_config.org_id to set event's orgId
- [x] 6.3 Handle creator attribution: match sender email to users table for creatorId, fall back to a system pipeline user
- [x] 6.4 Wire up `POST /pipeline/poll` endpoint that triggers `run_pipeline()`
- [x] 6.5 Add `GET /pipeline/status` endpoint — last poll time, success/fail counts

## 7. Pipeline CRUD Endpoints

- [x] 7.1 Implement `GET /pipeline/events` — list pipeline-created events (paginated, filterable by listserv source and date)
- [x] 7.2 Implement `PATCH /pipeline/events/{id}` — edit pipeline event fields
- [x] 7.3 Implement `DELETE /pipeline/events/{id}` — delete pipeline event
- [x] 7.4 Implement `GET /pipeline/duplicates` — list skipped duplicates from pipeline_logs
- [x] 7.5 Implement CRUD for `/pipeline/configs` — list, create, update, delete listserv configs

## 8. Admin Panel — Project Setup

- [x] 8.1 Scaffold `apps/admin-web` with Vite 6 + React 19 + TypeScript
- [x] 8.2 Install and configure Tailwind CSS v4 and shadcn/ui (standalone)
- [x] 8.3 Add react-router-dom with shell layout (sidebar nav, header)
- [x] 8.4 Add TanStack Query provider and API client pointing to FastAPI backend
- [x] 8.5 Add admin-web to Turborepo config and root dev script

## 9. Admin Panel — Pages

- [x] 9.1 Pipeline Dashboard page — last poll time, email count, success/failure stats, manual "Poll Now" button
- [x] 9.2 Event Review page — table of pipeline events with inline edit (title, datetime, location, tags), delete, and link to live event
- [x] 9.3 Listserv Config page — CRUD table for managing listserv subscriptions and org mappings
- [x] 9.4 Dedup Log page — table of skipped duplicates showing original vs matched event

## 10. Scheduling & Deployment

- [x] 10.1 Add cron trigger (GitHub Actions workflow or external) to hit `POST /pipeline/poll` every 15 minutes
- [x] 10.2 Add admin panel auth middleware — simple API key or bearer token check
- [x] 10.3 Document env vars and setup steps for Gmail API credentials, OpenAI key, and admin auth

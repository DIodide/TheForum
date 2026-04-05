## Why

The Forum needs a continuous, automated pipeline to ingest event emails from Princeton listservs. Currently, event data comes from a Gmail-based pipeline (Phase 7) that requires a Gmail account and Google OAuth — which adds operational complexity and doesn't scale to multiple listservs. We have a working LISTSERV scraper that authenticates directly and fetches via RSS, but it's a manual batch script. We need to turn this into a persistent service that polls in near-realtime, runs classifier inference, and writes structured events to the database.

## What Changes

- **New backend service**: A persistent data engine that continuously polls Princeton LISTSERV RSS feeds, fetches full message bodies, and stores raw emails in `listserv_emails`.
- **Job management API**: CRUD endpoints for managing which listservs to poll, with per-list poll intervals and enable/disable controls.
- **Classification pipeline integration**: A pluggable interface where the binary event classifier (Task 1) and multi-label tag classifier (Task 2) slot in to process each new email.
- **Cross-listserv deduplication**: Message-ID exact dedup plus fuzzy title + sender matching within time windows to handle HoagieMail cross-posts and reminder emails.
- **Backfill support**: Ability to bulk-ingest historical emails when a new listserv is added, using chunked RSS fetches with checkpointing.
- **Session management**: Auto-login to LISTSERV with automatic re-authentication on session expiry.
- **Replaces Gmail pipeline**: The LISTSERV RSS poller replaces the Gmail API poller as the primary email ingestion method. **BREAKING** for the existing `backends/fastapi/app/pipeline/gmail.py` module (no longer the primary ingestion path).

## Capabilities

### New Capabilities
- `rss-poller`: Periodic RSS feed polling with configurable intervals per listserv, message dedup against last-seen ID, and session management with auto re-login.
- `body-fetcher`: Full message body extraction via A2 page → A3 HTML attachment fetching, with rate limiting, retry logic, and session expiry handling.
- `job-manager`: CRUD API for listserv scrape jobs — add/remove/enable/disable listservs, configure poll intervals, view job status and last-polled timestamps.
- `classification-pipeline`: Pluggable pipeline that runs incoming emails through the event binary classifier and tag classifier, extracts structured event metadata, and writes results to the database.
- `cross-listserv-dedup`: Multi-layer deduplication — exact message_id matching, fuzzy title + sender matching within time windows, and embedding-based similarity for edge cases.
- `backfill-engine`: Bulk historical email ingestion with chunked RSS fetches, incremental body fetching, checkpointing, and resume support.

### Modified Capabilities
(none — no existing specs)

## Impact

- **Database**: `listserv_emails` table already created. May need indexes on `(listserv, date)`, `(message_id)`, `(hoagiemail_sender_email, date)` for dedup queries.
- **`listserv_configs` table**: Needs new columns: `poll_interval_seconds`, `last_polled_at`, `last_message_id` for the poller state.
- **`backends/fastapi/`**: New router/endpoints for job management. Existing pipeline orchestrator will be refactored to use LISTSERV RSS instead of Gmail API.
- **`apps/listserv-scraper/`**: Core scraping logic (login, RSS fetch, body fetch) will be extracted into a shared library used by both the batch scraper and the data engine.
- **Environment variables**: `LISTSERV_EMAIL`, `LISTSERV_PASSWORD` (already added to `.env.example`).
- **Dependencies**: `apscheduler` or similar for periodic task scheduling, `thefuzz` for fuzzy dedup (already in fastapi deps), `psycopg2` for direct DB access.

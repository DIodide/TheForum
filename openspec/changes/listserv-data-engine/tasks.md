## 1. Project Setup & Database

- [ ] 1.1 Create `backends/fastapi/app/engine/` module directory with `__init__.py`
- [ ] 1.2 Add `apscheduler` dependency to FastAPI backend (`pyproject.toml` / `requirements.txt`)
- [ ] 1.3 Add `poll_interval_seconds` (int, default 300), `last_polled_at` (timestamptz), and `last_message_id` (varchar) columns to `listserv_configs` table
- [ ] 1.4 Add indexes on `listserv_emails`: `(listserv, date)`, `(hoagiemail_sender_email, date)` for dedup queries
- [ ] 1.5 Enable `pg_trgm` extension in Postgres for fuzzy string matching

## 2. Session Management

- [ ] 2.1 Create `engine/session.py` — LISTSERV login using email/password, returns cookie + session token
- [ ] 2.2 Store session state (cookie, auth_params) as module-level singleton, thread-safe
- [ ] 2.3 Implement `ensure_session()` that checks if session is valid, re-logins if expired
- [ ] 2.4 Add `LISTSERV_EMAIL` and `LISTSERV_PASSWORD` to FastAPI config/settings

## 3. RSS Poller

- [ ] 3.1 Create `engine/poller.py` — `poll_listserv(list_name)` function that fetches RSS, parses XML, returns list of new message stubs (id, title, link, author, date)
- [ ] 3.2 Implement new-message detection by comparing RSS items against `last_message_id` in DB
- [ ] 3.3 Handle "Login Required" response — call `ensure_session()` and retry
- [ ] 3.4 Update `last_polled_at` and `last_message_id` in `listserv_configs` after each poll

## 4. Body Fetcher

- [ ] 4.1 Create `engine/fetcher.py` — `fetch_full_body(msg_url)` that fetches A2 page, finds A3 text/html link, fetches raw HTML
- [ ] 4.2 Extract HoagieMail sender name/email from full HTML body
- [ ] 4.3 Extract links, images, and attachment URLs from full HTML body
- [ ] 4.4 Implement rate limiting (150ms between requests) and retry with exponential backoff
- [ ] 4.5 Handle session expiry mid-fetch — detect "Login Required", re-login, retry

## 5. Deduplication

- [ ] 5.1 Create `engine/dedup.py` — exact dedup via `message_id` unique constraint (ON CONFLICT DO NOTHING)
- [ ] 5.2 Implement fuzzy sender + title dedup using `pg_trgm` similarity query within 72-hour window
- [ ] 5.3 Implement post-classification event dedup using `thefuzz` token_set_ratio on extracted event title + datetime (±24 hours)

## 6. Classifier Interface

- [ ] 6.1 Create `engine/classifier.py` — define `EventClassifier` and `TagClassifier` Python protocols with `classify()` method
- [ ] 6.2 Implement `LLMEventClassifier` default using existing Gemini/OpenRouter extractor logic
- [ ] 6.3 Implement `LLMTagClassifier` default using existing tag extraction logic
- [ ] 6.4 Add classifier registry/config so implementations can be swapped via settings

## 7. Processing Pipeline

- [ ] 7.1 Create `engine/processor.py` — orchestrator that takes a raw email, runs dedup → classify → extract metadata → write to DB
- [ ] 7.2 Insert raw emails into `listserv_emails` table immediately on ingestion
- [ ] 7.3 Run event classifier; if event, run tag classifier and metadata extraction
- [ ] 7.4 Insert classified events into `events` table with `source='listserv'` and tags into `event_tags`
- [ ] 7.5 Log all processing results to `pipeline_logs` (success, skipped_not_event, duplicate, error)

## 8. Job Manager & Scheduler

- [ ] 8.1 Create `engine/scheduler.py` — APScheduler AsyncIOScheduler setup, integrated with FastAPI lifespan
- [ ] 8.2 On startup, load all enabled listserv_configs and schedule polling jobs at their intervals
- [ ] 8.3 Support dynamic add/remove/update of jobs at runtime without restart
- [ ] 8.4 Create `engine/router.py` — FastAPI endpoints: `POST/GET/PATCH/DELETE /engine/jobs`, `GET /engine/status`
- [ ] 8.5 Wire router into FastAPI app (`app/main.py`)

## 9. Backfill

- [ ] 9.1 Create `engine/backfill.py` — bulk RSS fetch + body enrichment as a background task, reusing poller + fetcher logic
- [ ] 9.2 Implement checkpointing every 500 messages (save progress to DB or file)
- [ ] 9.3 Add `POST /engine/backfill` endpoint with `list_name` and `limit` params
- [ ] 9.4 Add `GET /engine/backfill/{job_id}/status` endpoint for progress tracking
- [ ] 9.5 Prevent duplicate backfill jobs for the same listserv (409 Conflict)

## 10. Integration & Testing

- [ ] 10.1 Extract shared scraping logic from `apps/listserv-scraper/src/scrape_listserv.py` into importable functions used by both batch scraper and engine
- [ ] 10.2 Write integration test: add a listserv job → poll → verify emails in DB
- [ ] 10.3 Write unit tests for dedup logic (exact, fuzzy, post-classification)
- [ ] 10.4 Test session expiry and re-login flow end-to-end
- [ ] 10.5 Load test: simulate 50 new messages per poll cycle, verify throughput and memory usage on t4g.small

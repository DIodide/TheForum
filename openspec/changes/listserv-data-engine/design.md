## Context

The Forum currently has two separate systems for email ingestion:

1. **Phase 7 Gmail pipeline** (`backends/fastapi/app/pipeline/`) — polls a Gmail inbox via Google API, runs LLM extraction, writes events to Postgres. Works but requires Gmail OAuth, a dedicated Gmail account, and subscribing that account to listservs.

2. **Batch scraper** (`apps/listserv-scraper/`) — authenticates directly to Princeton LISTSERV, fetches RSS feeds, extracts full HTML bodies. Runs manually, outputs JSON files.

We need to combine these into a single persistent service that polls LISTSERV RSS feeds directly, processes emails through classifiers, and writes to the database — eliminating the Gmail middleman.

**Constraints:**
- LISTSERV sessions expire — the service must detect expiry and re-authenticate automatically.
- RSS feed descriptions are truncated — full body requires 2 additional HTTP requests per message (A2 page → A3 HTML attachment).
- Princeton LISTSERV has no documented rate limits, but we should be respectful (0.1-0.2s between requests).
- The classifiers (Tasks 1 & 2) are being built by other team members — the integration point must be pluggable.
- Must run on a t4g.small EC2 instance (2GB RAM) alongside the web app.

## Goals / Non-Goals

**Goals:**
- Near-realtime email ingestion (2-5 minute polling intervals)
- Dynamic listserv management without service restart
- Pluggable classifier interface so Task 1/2 can be swapped in without engine changes
- Reliable dedup across listservs (most emails are HoagieMail cross-posts)
- Backfill capability for historical data when a new listserv is added
- Observability — track messages processed, events created, errors, latency

**Non-Goals:**
- Building the classifiers themselves (Task 1 & 2 — other team members)
- Real-time WebSocket push to the frontend (polling is sufficient)
- Scraping non-LISTSERV email sources (e.g., direct email, Mailman lists)
- Full-text search indexing (can be added later)
- Multi-region deployment or horizontal scaling

## Decisions

### 1. Extend existing FastAPI backend vs. new service

**Decision:** Extend `backends/fastapi/` with new modules.

**Rationale:** The FastAPI backend already has the pipeline router, admin auth, DB access layer, and dedup logic. Creating a separate service adds deployment complexity (second process, second Docker container, inter-service communication) for no benefit at our scale. The data engine is just a new set of endpoints + a background scheduler.

**Alternative considered:** Standalone Go/Elixir service. Better concurrency model, but adds a second language to the stack and duplicates DB access, auth, and dedup logic.

### 2. Polling scheduler: APScheduler vs. background tasks vs. Celery

**Decision:** APScheduler with AsyncIOScheduler.

**Rationale:** APScheduler runs in-process with FastAPI, supports per-job intervals, dynamic job add/remove at runtime, and persistent job state. It's lightweight — no Redis/RabbitMQ dependency. Celery is overkill for polling 7 listservs every few minutes.

**Alternative considered:** Simple `asyncio.create_task` loops. Works but no built-in job management, persistence, or dynamic reconfiguration. Celery Beat — requires Redis, too heavy for this use case.

### 3. Classifier interface: Direct function call vs. HTTP API vs. message queue

**Decision:** Python protocol (abstract interface) with direct function call, HTTP fallback.

**Rationale:** The classifiers will likely be Python (scikit-learn, transformers, or LLM API calls). A Python protocol/interface is simplest:

```python
class EventClassifier(Protocol):
    def classify(self, email: ListservEmail) -> ClassificationResult: ...

class TagClassifier(Protocol):
    def classify(self, email: ListservEmail) -> list[TagResult]: ...
```

Default implementations can call the existing Gemini/OpenRouter LLM. When Task 1/2 teams ship their classifiers, they implement the same interface. If a classifier needs to run on a different host (e.g., GPU inference), the interface can be implemented as an HTTP client.

### 4. Dedup strategy

**Decision:** Three-layer dedup in the database.

- **Layer 1 — Exact:** `message_id` unique constraint on `listserv_emails`. Catches identical cross-posts.
- **Layer 2 — Sender + title fuzzy:** Same `hoagiemail_sender_email` + `pg_trgm` similarity > 0.6 on subject + within 72-hour window. Catches reminders and corrections.
- **Layer 3 — Post-classification event dedup:** After metadata extraction, compare event title + datetime + location against existing events. Existing `thefuzz` logic in `pipeline/dedup.py`.

Layer 1 happens at ingestion. Layers 2-3 happen during classification pipeline.

### 5. Session management

**Decision:** Shared session state with proactive re-login.

The LISTSERV login returns a `WALOGIN` cookie and session token `X=...`. These are stored as module-level state in the poller. On any "Login Required" response, the poller re-authenticates and retries. Session is shared across all listserv polls (single login works for all lists).

### 6. Backfill architecture

**Decision:** Reuse the existing batch scraper logic, triggered via API endpoint.

Backfill is a one-time operation per listserv. Rather than building MapReduce, we expose a `POST /engine/backfill` endpoint that runs the existing `scrape_listserv.py` logic (chunked RSS fetch + body enrichment) as a background task. Progress is tracked in the DB and queryable via `GET /engine/backfill/{job_id}/status`.

For the 7 known listservs, backfill of ~40k messages per list is a ~4 hour job per list. These can run sequentially overnight.

## Risks / Trade-offs

**[LISTSERV rate limiting]** → We have no documentation on Princeton LISTSERV rate limits. Mitigation: conservative 0.15s delay between requests, exponential backoff on errors, and monitoring for 429/503 responses. Can be tuned up if no issues observed.

**[Session expiry mid-batch]** → Already mitigated: the scraper detects "Login Required" and re-authenticates. The new service inherits this logic.

**[Classifier latency]** → If classifiers use LLM APIs, each email takes 1-2 seconds to classify. For 50 new emails per poll cycle, that's ~1-2 minutes of classification time. Mitigation: classification runs async after ingestion — emails are stored immediately, classified in a background queue. The forum shows events after classification completes.

**[Memory on t4g.small]** → 2GB RAM is tight. The RSS XML for 100 recent messages is ~200KB — fine. Backfill of 40k messages loads ~65MB XML. Mitigation: backfill streams the XML parser rather than loading into memory, or uses smaller batch sizes.

**[Duplicate events from different wording]** → Two clubs may independently promote the same event with different email text. Fuzzy dedup catches most cases but not all. Mitigation: accept some duplicates initially; can add embedding-based dedup (pgvector) later.

## Module Layout

```
backends/fastapi/app/
├── engine/                    # New — data engine modules
│   ├── __init__.py
│   ├── router.py              # FastAPI endpoints for job management + status
│   ├── scheduler.py           # APScheduler setup, job lifecycle
│   ├── poller.py              # RSS fetch + body enrichment per listserv
│   ├── session.py             # LISTSERV auth, cookie/token management
│   ├── classifier.py          # Classifier protocol + default LLM impl
│   ├── dedup.py               # Cross-listserv dedup logic
│   ├── processor.py           # Orchestrator: ingest → dedup → classify → write
│   └── backfill.py            # Bulk historical ingestion
├── pipeline/                  # Existing — keep for now, deprecate later
│   └── ...
```

## Open Questions

- Should we deprecate the Gmail pipeline immediately or keep it as a fallback?
- What's the desired SLA for email-to-event latency? (Currently assuming 2-5 minutes is acceptable.)
- Should the admin panel (`apps/admin-web/`) be extended with data engine controls, or is API-only management sufficient for now?

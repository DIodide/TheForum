"""Pipeline orchestrator — ties together ingestion, extraction, dedup, and storage."""

import logging

from dateutil import parser as dateparser

from . import db
from .dedup import is_exact_duplicate, is_fuzzy_duplicate
from .extractor import extract_event
from .gmail import fetch_unread_emails
from .location import resolve_location
from .parser import preprocess_email

logger = logging.getLogger(__name__)


def _match_config(email_to: str, configs: list[dict]) -> dict | None:
    """Match an email's 'to' address against enabled listserv configs."""
    to_lower = email_to.lower()
    for cfg in configs:
        if cfg["address"].lower() in to_lower:
            return cfg
    return None


def _resolve_creator(email: object, config: dict | None) -> tuple[str, str | None]:
    """Determine creator_id and org_id for the event.

    Returns (creator_id, org_id).
    """
    org_id = config["org_id"] if config else None

    # Try matching HoagieMail sender to a real user
    if email.hoagiemail_sender:
        user_id = db.find_user_by_email(email.hoagiemail_sender.email)
        if user_id:
            return user_id, org_id

    # Fall back to pipeline bot
    return db.get_pipeline_user_id(), org_id


def _empty_stats() -> dict:
    return {"processed": 0, "created": 0, "skipped": 0, "duplicates": 0, "errors": 0}


def process_raw_emails(raw_emails: list[dict]) -> dict:
    """Process a list of raw email dicts through the extraction pipeline.

    Works for both Gmail API-fetched emails and Apps Script-pushed emails.
    Returns a summary dict with counts.
    """
    configs = db.get_enabled_configs()
    stats = _empty_stats()

    for raw in raw_emails:
        stats["processed"] += 1
        gmail_id = raw.get("gmail_id", "")

        try:
            email = preprocess_email(raw)

            # Exact dedup by message ID
            if is_exact_duplicate(email.message_id):
                logger.debug("Skipping exact duplicate: %s", email.message_id)
                stats["duplicates"] += 1
                config = _match_config(email.to, configs)
                db.insert_log(
                    message_id=email.message_id,
                    listserv_config_id=str(config["id"]) if config else None,
                    status="duplicate",
                )
                continue

            # Match to a listserv config
            config = _match_config(email.to, configs)

            # LLM extraction
            extracted = extract_event(email)
            if not extracted:
                logger.debug("Not an event: %s", email.subject)
                stats["skipped"] += 1
                db.insert_log(
                    message_id=email.message_id,
                    listserv_config_id=str(config["id"]) if config else None,
                    status="skipped_not_event",
                )
                continue

            # Parse datetime
            try:
                event_dt = dateparser.parse(extracted.datetime_str)
                if event_dt is None:
                    raise ValueError("Could not parse datetime")
            except (ValueError, TypeError):
                logger.warning(
                    "Could not parse datetime '%s' for '%s'",
                    extracted.datetime_str,
                    extracted.title,
                )
                stats["errors"] += 1
                db.insert_log(
                    message_id=email.message_id,
                    listserv_config_id=str(config["id"]) if config else None,
                    status="error",
                    error_text=f"Unparseable datetime: {extracted.datetime_str}",
                )
                continue

            end_dt = None
            if extracted.end_datetime_str:
                try:
                    end_dt = dateparser.parse(extracted.end_datetime_str)
                except (ValueError, TypeError):
                    pass

            # Fuzzy dedup
            if is_fuzzy_duplicate(extracted.title, event_dt):
                logger.debug("Fuzzy duplicate: %s", extracted.title)
                stats["duplicates"] += 1
                db.insert_log(
                    message_id=email.message_id,
                    listserv_config_id=str(config["id"]) if config else None,
                    status="duplicate",
                )
                continue

            # Resolve location
            location_id = resolve_location(extracted.location_name)

            # Resolve creator and org
            creator_id, org_id = _resolve_creator(email, config)

            # Insert event
            event_id = db.insert_event(
                title=extracted.title,
                description=extracted.description,
                dt=event_dt,
                end_dt=end_dt,
                location_id=location_id,
                org_id=org_id,
                creator_id=creator_id,
                source_message_id=email.message_id,
                tags=extracted.tags,
            )

            stats["created"] += 1
            db.insert_log(
                message_id=email.message_id,
                listserv_config_id=str(config["id"]) if config else None,
                status="success",
                extracted_event_id=event_id,
            )
            logger.info("Created event '%s' (id=%s)", extracted.title, event_id)

        except Exception:
            stats["errors"] += 1
            logger.exception("Error processing email %s", gmail_id)
            db.insert_log(
                message_id=raw.get("message_id", gmail_id),
                listserv_config_id=None,
                status="error",
                error_text="Unexpected error — see server logs",
            )

    return stats


def run_pipeline() -> dict:
    """Run the full ingestion pipeline via Gmail API.

    Returns a summary dict with counts.
    """
    configs = db.get_enabled_configs()
    if not configs:
        logger.info("No enabled listserv configs found.")
        return _empty_stats()

    # Build Gmail query from config labels
    label_queries = []
    for cfg in configs:
        if cfg.get("gmail_label"):
            label_queries.append(f"label:{cfg['gmail_label']}")
    query = f"is:unread ({' OR '.join(label_queries)})" if label_queries else "is:unread"

    raw_emails = fetch_unread_emails(query)
    logger.info("Fetched %d unread emails", len(raw_emails))

    return process_raw_emails(raw_emails)

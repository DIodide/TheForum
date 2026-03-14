"""Pipeline API endpoints."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from . import db
from .config import settings
from .orchestrator import process_raw_emails, run_pipeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pipeline", tags=["pipeline"])


# ── Auth ──────────────────────────────────────────────────


def verify_admin_key(authorization: str = Header(...)) -> None:
    """Simple bearer token auth for admin endpoints."""
    expected = settings.admin_api_key
    if not expected:
        raise HTTPException(500, "ADMIN_API_KEY not configured")
    token = authorization.removeprefix("Bearer ").strip()
    if token != expected:
        raise HTTPException(401, "Invalid admin API key")


# ── Pipeline control ──────────────────────────────────────


@router.post("/poll")
async def poll(auth: None = Depends(verify_admin_key)) -> dict:
    """Trigger an email poll and processing run."""
    try:
        stats = run_pipeline()
        return {"ok": True, **stats}
    except Exception as e:
        logger.exception("Pipeline poll failed")
        raise HTTPException(500, str(e))


class IngestEmail(BaseModel):
    message_id: str
    subject: str
    sender: str
    to: str
    date: str = ""
    body_html: str = ""
    body_text: str = ""


class IngestRequest(BaseModel):
    emails: list[IngestEmail]


@router.post("/ingest")
async def ingest(body: IngestRequest, auth: None = Depends(verify_admin_key)) -> dict:
    """Accept pre-fetched emails (e.g. from Google Apps Script) and process them."""
    raw_emails = [e.model_dump() for e in body.emails]
    try:
        stats = process_raw_emails(raw_emails)
        return {"ok": True, **stats}
    except Exception as e:
        logger.exception("Ingest failed")
        raise HTTPException(500, str(e))


@router.get("/status")
async def status(auth: None = Depends(verify_admin_key)) -> dict:
    """Get pipeline status — last poll time, counts."""
    return db.get_pipeline_status()


# ── Pipeline events ───────────────────────────────────────


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    datetime: str | None = None
    location_id: str | None = None


@router.get("/events")
async def list_events(
    limit: int = 50,
    offset: int = 0,
    source_config_id: str | None = None,
    auth: None = Depends(verify_admin_key),
) -> list[dict[str, Any]]:
    """List pipeline-created events (paginated)."""
    return db.get_pipeline_events(limit=limit, offset=offset, source_config_id=source_config_id)


@router.patch("/events/{event_id}")
async def edit_event(
    event_id: str,
    body: EventUpdate,
    auth: None = Depends(verify_admin_key),
) -> dict:
    """Edit a pipeline event."""
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(400, "No fields to update")
    result = db.update_event(event_id, **fields)
    if not result:
        raise HTTPException(404, "Event not found or not a pipeline event")
    return result


@router.delete("/events/{event_id}")
async def remove_event(
    event_id: str,
    auth: None = Depends(verify_admin_key),
) -> dict:
    """Delete a pipeline event."""
    if not db.delete_event(event_id):
        raise HTTPException(404, "Event not found or not a pipeline event")
    return {"ok": True}


# ── Duplicates ────────────────────────────────────────────


@router.get("/duplicates")
async def list_duplicates(
    limit: int = 50,
    offset: int = 0,
    auth: None = Depends(verify_admin_key),
) -> list[dict[str, Any]]:
    """List duplicate log entries."""
    return db.get_duplicate_logs(limit=limit, offset=offset)


# ── Listserv configs ─────────────────────────────────────


class ConfigCreate(BaseModel):
    address: str
    label: str
    gmail_label: str | None = None
    org_id: str | None = None


class ConfigUpdate(BaseModel):
    address: str | None = None
    label: str | None = None
    gmail_label: str | None = None
    org_id: str | None = None
    enabled: bool | None = None


@router.get("/configs")
async def list_configs(auth: None = Depends(verify_admin_key)) -> list[dict[str, Any]]:
    """List all listserv configs."""
    return db.get_all_configs()


@router.post("/configs")
async def create_config_endpoint(
    body: ConfigCreate,
    auth: None = Depends(verify_admin_key),
) -> dict:
    """Create a new listserv config."""
    return db.create_config(
        address=body.address,
        label=body.label,
        gmail_label=body.gmail_label,
        org_id=body.org_id,
    )


@router.patch("/configs/{config_id}")
async def update_config_endpoint(
    config_id: str,
    body: ConfigUpdate,
    auth: None = Depends(verify_admin_key),
) -> dict:
    """Update a listserv config."""
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(400, "No fields to update")
    result = db.update_config(config_id, **fields)
    if not result:
        raise HTTPException(404, "Config not found")
    return result


@router.delete("/configs/{config_id}")
async def delete_config_endpoint(
    config_id: str,
    auth: None = Depends(verify_admin_key),
) -> dict:
    """Delete a listserv config."""
    if not db.delete_config(config_id):
        raise HTTPException(404, "Config not found")
    return {"ok": True}

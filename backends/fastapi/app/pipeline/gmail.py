"""Gmail API integration — fetch unread emails from subscribed listservs."""

import base64
import json
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from .config import settings

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]


def _get_credentials() -> Credentials:
    """Load or refresh Gmail OAuth2 credentials."""
    creds = None
    token_path = settings.gmail_token_path

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(token_path, "w") as f:
            f.write(creds.to_json())
    elif not creds or not creds.valid:
        if not settings.gmail_credentials_json:
            raise RuntimeError(
                "No valid Gmail token and GMAIL_CREDENTIALS_JSON is not set. "
                "Run the OAuth flow first."
            )
        creds_data = json.loads(settings.gmail_credentials_json)
        flow = InstalledAppFlow.from_client_config(creds_data, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(token_path, "w") as f:
            f.write(creds.to_json())

    return creds


def _get_service():
    """Build the Gmail API service."""
    creds = _get_credentials()
    return build("gmail", "v1", credentials=creds)


def fetch_unread_emails(query: str = "is:unread") -> list[dict]:
    """Fetch unread emails matching the query. Returns list of parsed email dicts.

    Each dict has: message_id, subject, sender, to, date, body_html, body_text
    """
    service = _get_service()
    results = (
        service.users()
        .messages()
        .list(userId="me", q=query, maxResults=50)
        .execute()
    )
    messages = results.get("messages", [])
    if not messages:
        return []

    emails = []
    for msg_meta in messages:
        msg = (
            service.users()
            .messages()
            .get(userId="me", id=msg_meta["id"], format="full")
            .execute()
        )
        email_data = _parse_message(msg)
        email_data["gmail_id"] = msg_meta["id"]
        emails.append(email_data)

        # Mark as read
        service.users().messages().modify(
            userId="me",
            id=msg_meta["id"],
            body={"removeLabelIds": ["UNREAD"]},
        ).execute()

    return emails


def _parse_message(msg: dict) -> dict:
    """Parse a Gmail API message into a flat dict."""
    headers = {h["name"].lower(): h["value"] for h in msg["payload"]["headers"]}

    body_html = ""
    body_text = ""
    _extract_parts(msg["payload"], body_parts := {"html": "", "text": ""})
    body_html = body_parts["html"]
    body_text = body_parts["text"]

    return {
        "message_id": headers.get("message-id", msg["id"]),
        "subject": headers.get("subject", ""),
        "sender": headers.get("from", ""),
        "to": headers.get("to", ""),
        "date": headers.get("date", ""),
        "body_html": body_html,
        "body_text": body_text,
    }


def _extract_parts(payload: dict, body_parts: dict) -> None:
    """Recursively extract text and html parts from a MIME payload."""
    mime_type = payload.get("mimeType", "")

    if mime_type == "text/html" and "body" in payload:
        data = payload["body"].get("data", "")
        if data:
            body_parts["html"] = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")
    elif mime_type == "text/plain" and "body" in payload:
        data = payload["body"].get("data", "")
        if data:
            body_parts["text"] = base64.urlsafe_b64decode(data).decode("utf-8", errors="replace")

    for part in payload.get("parts", []):
        _extract_parts(part, body_parts)

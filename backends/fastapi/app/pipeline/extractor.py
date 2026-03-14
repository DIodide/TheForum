"""LLM-based event extraction using Gemini 3.1 Flash Lite via OpenRouter."""

import json
import logging
from dataclasses import dataclass
from datetime import datetime

from openai import OpenAI

from .config import settings
from .parser import PreprocessedEmail

logger = logging.getLogger(__name__)

VALID_TAGS = [
    "free-food", "workshop", "performance", "speaker", "social", "career",
    "sports", "music", "art", "academic", "cultural", "community-service",
    "religious", "political", "tech", "gaming", "outdoor", "wellness",
]

EXTRACTION_PROMPT = """\
You are an event extraction assistant for a Princeton University campus events platform.
Given an email sent to a Princeton listserv, determine if it describes a specific event
(with a time and place), and if so extract structured data.

Emails that are NOT events: lost & found posts, general announcements without a specific
gathering time, job postings without an info session, surveys, newsletter digests.

Return a JSON object with these fields:
- "is_event": boolean — true if this email describes a specific event
- "title": string — concise event name (max 100 chars)
- "description": string — brief event description (max 500 chars)
- "datetime": string — ISO 8601 datetime with timezone (e.g. "2026-04-15T19:00:00-04:00")
- "end_datetime": string | null — end time if mentioned, else null
- "location_name": string — the venue/location as mentioned in the email
- "tags": string[] — relevant tags from this list: {tags}

If is_event is false, set all other fields to empty/null values.

Current date for reference: {current_date}
"""


@dataclass
class ExtractedEvent:
    title: str
    description: str
    datetime_str: str
    end_datetime_str: str | None
    location_name: str
    tags: list[str]


def _get_client() -> OpenAI:
    return OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
    )


def extract_event(email: PreprocessedEmail) -> ExtractedEvent | None:
    """Call the LLM to extract event data from a preprocessed email.

    Returns an ExtractedEvent if the email describes an event, or None if not.
    """
    client = _get_client()

    email_text = f"SUBJECT: {email.subject}\nFrom: {email.sender}\n\nBody:\n{email.body_text}"
    if email.links:
        email_text += "\n\nLinks:\n" + "\n".join(email.links[:10])

    current_date = datetime.now().strftime("%Y-%m-%d %H:%M %Z")

    response = client.chat.completions.create(
        model=settings.openrouter_model,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": EXTRACTION_PROMPT.format(
                    tags=", ".join(VALID_TAGS),
                    current_date=current_date,
                ),
            },
            {"role": "user", "content": email_text},
        ],
        temperature=0.1,
        max_tokens=1000,
    )

    content = response.choices[0].message.content
    if not content:
        logger.warning("Empty LLM response for message %s", email.message_id)
        return None

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        logger.error("Invalid JSON from LLM for message %s: %s", email.message_id, content[:200])
        return None

    if not data.get("is_event"):
        return None

    # Validate tags against allowed list
    raw_tags = data.get("tags", [])
    valid = [t for t in raw_tags if t in VALID_TAGS]

    return ExtractedEvent(
        title=data.get("title", "")[:200],
        description=data.get("description", "")[:2000],
        datetime_str=data.get("datetime", ""),
        end_datetime_str=data.get("end_datetime"),
        location_name=data.get("location_name", ""),
        tags=valid,
    )

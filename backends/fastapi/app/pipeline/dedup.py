"""Deduplication — fuzzy title matching + exact message ID check."""

from datetime import datetime

from thefuzz import fuzz

from .config import settings
from .db import find_similar_events, message_id_exists


def is_exact_duplicate(message_id: str) -> bool:
    """Check if this email message ID has already been processed."""
    return message_id_exists(message_id)


def is_fuzzy_duplicate(title: str, dt: datetime) -> bool:
    """Check if a similar event (by title) already exists within the time window.

    Uses token-set ratio from thefuzz for robust comparison
    (handles word reordering, extra words, etc.).
    """
    candidates = find_similar_events(
        title, dt, window_hours=settings.dedup_time_window_hours
    )
    threshold = int(settings.dedup_title_threshold * 100)

    for candidate in candidates:
        score = fuzz.token_set_ratio(title.lower(), candidate["title"].lower())
        if score >= threshold:
            return True

    return False

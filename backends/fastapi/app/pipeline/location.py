"""Location resolution — fuzzy-match extracted location names to campus_locations."""

from thefuzz import fuzz

from .db import get_campus_locations

# Fallback location ID for unmatched locations
FALLBACK_LOCATION_ID = "other"
MATCH_THRESHOLD = 70


def resolve_location(location_name: str) -> str:
    """Fuzzy-match a location name against the campus_locations table.

    Returns the best matching location_id, or the fallback if no match >= threshold.
    """
    if not location_name:
        return FALLBACK_LOCATION_ID

    locations = get_campus_locations()
    if not locations:
        return FALLBACK_LOCATION_ID

    best_score = 0
    best_id = FALLBACK_LOCATION_ID

    for loc in locations:
        score = fuzz.token_set_ratio(location_name.lower(), loc["name"].lower())
        if score > best_score:
            best_score = score
            best_id = loc["id"]

    return best_id if best_score >= MATCH_THRESHOLD else FALLBACK_LOCATION_ID

"""Email preprocessing — HTML to text, link extraction, HoagieMail footer parsing."""

import re
from dataclasses import dataclass, field

from bs4 import BeautifulSoup


@dataclass
class HoagieSender:
    name: str
    email: str


@dataclass
class PreprocessedEmail:
    message_id: str
    subject: str
    sender: str
    to: str
    body_text: str
    links: list[str] = field(default_factory=list)
    hoagiemail_sender: HoagieSender | None = None
    timestamp: str = ""
    gmail_id: str = ""


# Regex for HoagieMail footer: "Email composed by First.Last (first.last@princeton.edu)"
_HOAGIE_PATTERN = re.compile(
    r"Email composed by\s+(.+?)\s+\((\S+@princeton\.edu)\)", re.IGNORECASE
)


def html_to_text(html: str) -> str:
    """Convert HTML to readable plain text."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    # Remove script and style tags
    for tag in soup(["script", "style"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


def extract_links(html: str) -> list[str]:
    """Extract unique URLs from HTML."""
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    links: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith(("http://", "https://")):
            links.add(href)
    return list(links)


def detect_hoagiemail(text: str) -> HoagieSender | None:
    """Detect and parse the HoagieMail footer. Returns sender info or None."""
    match = _HOAGIE_PATTERN.search(text)
    if match:
        return HoagieSender(name=match.group(1).strip(), email=match.group(2).strip())
    return None


def preprocess_email(raw: dict) -> PreprocessedEmail:
    """Take a raw email dict (from gmail.py) and return a structured PreprocessedEmail."""
    html = raw.get("body_html", "")
    plain = raw.get("body_text", "")

    # Prefer HTML → text conversion, fall back to plain text
    body_text = html_to_text(html) if html else plain
    links = extract_links(html)
    hoagie = detect_hoagiemail(body_text)

    return PreprocessedEmail(
        message_id=raw.get("message_id", raw.get("gmail_id", "")),
        subject=raw.get("subject", ""),
        sender=raw.get("sender", ""),
        to=raw.get("to", ""),
        body_text=body_text,
        links=links,
        hoagiemail_sender=hoagie,
        timestamp=raw.get("date", ""),
        gmail_id=raw.get("gmail_id", ""),
    )

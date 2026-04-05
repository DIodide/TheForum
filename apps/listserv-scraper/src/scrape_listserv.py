"""
Scrape Princeton LISTSERV archives via RSS feed.

Usage:
    python3 src/scrape_listserv.py                                    # scrape WHITMANWIRE (RSS only)
    python3 src/scrape_listserv.py --list ROCKYWIRE                   # scrape a specific list
    python3 src/scrape_listserv.py --fetch-bodies                     # also fetch full HTML per message
    python3 src/scrape_listserv.py --fetch-bodies --batch-size 500    # save progress every 500 messages
    python3 src/scrape_listserv.py --fetch-bodies --resume            # resume from last checkpoint
    python3 src/scrape_listserv.py --all                              # scrape all known listservs
    python3 src/scrape_listserv.py --limit 5000                       # cap RSS fetch at 5000

Outputs JSON to data/<listname>_emails.json
Progress checkpoints saved to data/<listname>_progress.json

Required environment variables:
    LISTSERV_EMAIL       — LISTSERV login email (e.g. tigerapp@princeton.edu)
    LISTSERV_PASSWORD    — LISTSERV password
"""

import argparse
import html
import http.client
import json
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

BASE_URL = "https://lists.princeton.edu/cgi-bin/wa"

LISTSERV_EMAIL = os.environ.get("LISTSERV_EMAIL", "")
LISTSERV_PASSWORD = os.environ.get("LISTSERV_PASSWORD", "")

# Set by login()
COOKIE = ""
AUTH_PARAMS = ""

KNOWN_LISTS = [
    "WHITMANWIRE",
    "ROCKYWIRE",
    "BUTLERBUZZ",
    "MATHEYMAIL",
    "RE-INNFORMER",
    "WILSONWIRE",
    "FREEFOOD",
]

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def login() -> None:
    """Log in to LISTSERV and set global COOKIE and AUTH_PARAMS."""
    global COOKIE, AUTH_PARAMS

    if not LISTSERV_EMAIL or not LISTSERV_PASSWORD:
        raise RuntimeError(
            "LISTSERV_EMAIL and LISTSERV_PASSWORD environment variables are required"
        )

    print("Logging in to LISTSERV...", end=" ", flush=True)
    conn = http.client.HTTPSConnection("lists.princeton.edu")
    data = urllib.parse.urlencode({
        "LOGIN1": "",
        "Y": LISTSERV_EMAIL,
        "p": LISTSERV_PASSWORD,
        "e": "Log In",
        "X": "",
    })
    conn.request(
        "POST",
        "/cgi-bin/wa",
        body=data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "TheForum-Scraper/1.0",
        },
    )
    resp = conn.getresponse()
    body = resp.read().decode("utf-8", errors="replace")

    # Extract WALOGIN cookie
    cookie_val = None
    for header, value in resp.getheaders():
        if header.lower() == "set-cookie" and "WALOGIN=" in value:
            match = re.search(r"WALOGIN=([^;]+)", value)
            if match:
                cookie_val = match.group(1)

    # Extract session X token
    x_match = re.search(r"X=([A-F0-9]{16,})", body)

    if not cookie_val or not x_match:
        raise RuntimeError("Login failed — check LISTSERV_EMAIL/LISTSERV_PASSWORD")

    COOKIE = f"WALOGIN={cookie_val}"
    AUTH_PARAMS = f"X={x_match.group(1)}&Y={urllib.parse.quote(LISTSERV_EMAIL)}"
    print("OK")


def make_request(url: str, retries: int = 3) -> bytes:
    """Make an authenticated request with retries."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header("Cookie", COOKIE)
            req.add_header("User-Agent", "TheForum-Scraper/1.0")
            with urllib.request.urlopen(req, timeout=120) as resp:
                return resp.read()
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise e


def parse_hoagiemail(body_html: str) -> dict | None:
    """Extract HoagieMail sender info from email footer."""
    match = re.search(
        r"Email composed by\s+(.+?)\s+\((\S+@\S+)\)", body_html
    )
    if match:
        return {"name": match.group(1), "email": match.group(2)}
    return None


def strip_html(html_str: str) -> str:
    """Basic HTML to plain text conversion."""
    text = re.sub(r"<br\s*/?>", "\n", html_str, flags=re.IGNORECASE)
    text = re.sub(r"<p[^>]*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</p>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<li[^>]*>", "\n• ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_links(html_str: str) -> list[str]:
    """Extract unique URLs from HTML."""
    urls = re.findall(r'href="(https?://[^"]+)"', html_str)
    seen = set()
    unique = []
    for url in urls:
        if url not in seen and "lists.princeton.edu" not in url:
            seen.add(url)
            unique.append(url)
    return unique


def extract_images(html_str: str) -> list[str]:
    """Extract image URLs from HTML."""
    imgs = re.findall(r'<img[^>]+src="(https?://[^"]+)"', html_str)
    seen = set()
    unique = []
    for url in imgs:
        clean = re.sub(r"#https?://.*$", "", url)
        if clean not in seen:
            seen.add(clean)
            unique.append(clean)
    return unique


def fetch_rss(listname: str, limit: int = 5000) -> list[dict]:
    """Fetch and parse the RSS feed for a listserv."""
    url = f"{BASE_URL}?RSS&L={listname}&v=2.0&LIMIT={limit}&{AUTH_PARAMS}"
    print(f"  Fetching RSS feed (limit={limit})...", end=" ", flush=True)
    data = make_request(url)
    print(f"received {len(data):,} bytes")

    print(f"  Parsing XML...", end=" ", flush=True)
    root = ET.fromstring(data)
    items = root.findall(".//item")
    print(f"{len(items):,} messages")

    emails = []
    for item in items:
        title = item.findtext("title", "")
        link = item.findtext("link", "")
        description = item.findtext("description", "")
        author_raw = item.findtext("author", "")
        pub_date = item.findtext("pubDate", "")

        # Parse author: "Name <email>" format
        author_match = re.match(r"(.+?)\s*<(.+?)>", author_raw)
        author_name = author_match.group(1).strip() if author_match else author_raw
        author_email = author_match.group(2).strip() if author_match else ""

        # Extract message ID from link
        msg_id_match = re.search(r"A2=([^&]+)", link)
        msg_id = msg_id_match.group(1) if msg_id_match else ""

        # Parse the HTML description
        body_text = strip_html(description)
        links = extract_links(description)
        images = extract_images(description)
        hoagiemail = parse_hoagiemail(description)

        # Detect HoagieMail from author email as fallback
        is_hoagiemail = (
            author_email.upper() == "HOAGIE@PRINCETON.EDU"
            or hoagiemail is not None
        )

        # Parse date
        try:
            parsed_date = datetime.strptime(
                re.sub(r"\s+", " ", pub_date).strip(),
                "%a, %d %b %Y %H:%M:%S %z",
            )
            iso_date = parsed_date.isoformat()
        except (ValueError, TypeError):
            iso_date = pub_date

        emails.append(
            {
                "message_id": msg_id,
                "subject": title,
                "author_name": author_name,
                "author_email": author_email,
                "date": iso_date,
                "date_raw": pub_date,
                "body_html": description,
                "body_text": body_text,
                "links": links,
                "images": images,
                "is_hoagiemail": is_hoagiemail,
                "hoagiemail_sender_name": hoagiemail["name"] if hoagiemail else None,
                "hoagiemail_sender_email": hoagiemail["email"] if hoagiemail else None,
                "listserv_url": link,
            }
        )

    return emails


def fetch_full_message(msg_url: str) -> dict | None:
    """Fetch the full message page, extract attachments, and full HTML body."""
    try:
        sep = "&" if "?" in msg_url else "?"
        url = f"{msg_url}{sep}{AUTH_PARAMS}"
        data = make_request(url)
        page = data.decode("utf-8", errors="replace")

        # Detect session expiry — re-login and retry once
        if "Login Required" in page:
            login()
            url = f"{msg_url}{sep}{AUTH_PARAMS}"
            data = make_request(url)
            page = data.decode("utf-8", errors="replace")
            if "Login Required" in page:
                print("    [WARN] Re-login failed")
                return None

        result = {}

        # Find all A3 attachment links on the page
        a3_links = re.findall(
            r'href="(/cgi-bin/wa\?A3=[^"]+)"[^>]*>([^<]+)</a>', page
        )
        attachments = []
        html_attachment_url = None
        seen_urls = set()
        for link, label in a3_links:
            full_url = f"https://lists.princeton.edu{link}"
            if full_url not in seen_urls:
                seen_urls.add(full_url)
                attachments.append(
                    {"url": full_url, "type": label.strip()}
                )
                if "text/html" in label and html_attachment_url is None:
                    html_attachment_url = full_url

        result["attachments"] = attachments

        # Fetch the text/html attachment for the full rich body
        if html_attachment_url:
            try:
                clean_url = html_attachment_url.replace("&header=1", "")
                html_data = make_request(clean_url)
                result["body_html"] = html_data.decode(
                    "utf-8", errors="replace"
                )
            except Exception:
                pass

        # Fallback: fetch text/plain attachment if no HTML available
        if "body_html" not in result:
            plain_url = None
            for att in attachments:
                if "text/plain" in att["type"]:
                    plain_url = att["url"]
                    break
            if plain_url:
                try:
                    clean_url = plain_url.replace("&header=1", "")
                    plain_data = make_request(clean_url)
                    result["body_html"] = plain_data.decode(
                        "utf-8", errors="replace"
                    )
                except Exception:
                    pass

        if "body_html" not in result:
            return None

        return result
    except Exception as e:
        print(f"    [WARN] Failed to fetch {msg_url}: {e}")
        return None


def enrich_email(email: dict) -> None:
    """Fetch full body for a single email and update it in place."""
    if not email.get("listserv_url"):
        email["body_complete"] = False
        return

    full_msg = fetch_full_message(email["listserv_url"])
    if full_msg:
        if "body_html" in full_msg:
            email["body_html"] = full_msg["body_html"]
            email["body_text"] = strip_html(full_msg["body_html"])
            email["links"] = extract_links(full_msg["body_html"])
            email["images"] = extract_images(full_msg["body_html"])
            hoagiemail = parse_hoagiemail(full_msg["body_html"])
            if hoagiemail:
                email["hoagiemail_sender_name"] = hoagiemail["name"]
                email["hoagiemail_sender_email"] = hoagiemail["email"]
                email["is_hoagiemail"] = True
        if "attachments" in full_msg:
            email["attachments"] = full_msg["attachments"]
        email["body_complete"] = True
    else:
        email["body_complete"] = False


def load_progress(listname: str) -> dict | None:
    """Load progress checkpoint if it exists."""
    progress_file = DATA_DIR / f"{listname.lower()}_progress.json"
    if progress_file.exists():
        with open(progress_file, encoding="utf-8") as f:
            return json.load(f)
    return None


def save_progress(listname: str, emails: list[dict], completed_idx: int):
    """Save progress checkpoint."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    progress_file = DATA_DIR / f"{listname.lower()}_progress.json"
    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(
            {
                "listserv": listname,
                "saved_at": datetime.now().isoformat(),
                "total_messages": len(emails),
                "bodies_completed": completed_idx,
                "messages": emails,
            },
            f,
            ensure_ascii=False,
        )


def load_existing(listname: str) -> dict[str, dict]:
    """Load already-completed messages from the output file, keyed by message_id."""
    filepath = DATA_DIR / f"{listname.lower()}_emails.json"
    if filepath.exists():
        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)
        return {
            m["message_id"]: m
            for m in data.get("messages", [])
            if m.get("body_complete")
        }
    return {}


def scrape_list(
    listname: str,
    limit: int = 5000,
    fetch_bodies: bool = False,
    batch_size: int = 200,
    resume: bool = False,
) -> dict:
    """Scrape a single listserv and return structured data."""
    print(f"\nScraping {listname}...")

    start_idx = 0
    emails = None

    # Check for in-progress resume first
    if resume and fetch_bodies:
        progress = load_progress(listname)
        if progress:
            emails = progress["messages"]
            start_idx = progress["bodies_completed"]
            print(
                f"  Resuming from checkpoint: {start_idx}/{len(emails)} bodies completed"
            )

    # Fetch RSS if not resuming from checkpoint
    if emails is None:
        emails = fetch_rss(listname, limit)

    # Load already-completed messages to skip re-fetching
    existing = load_existing(listname) if fetch_bodies else {}
    if existing:
        merged = 0
        for email in emails:
            if email["message_id"] in existing:
                email.update(existing[email["message_id"]])
                # Re-run HoagieMail extraction in case prior run missed it
                if not email.get("hoagiemail_sender_name") and email.get("body_html"):
                    hoagiemail = parse_hoagiemail(email["body_html"])
                    if hoagiemail:
                        email["hoagiemail_sender_name"] = hoagiemail["name"]
                        email["hoagiemail_sender_email"] = hoagiemail["email"]
                        email["is_hoagiemail"] = True
                merged += 1
        print(f"  Loaded {merged} already-fetched bodies from previous run")

    # Fetch full bodies in batches
    if fetch_bodies and emails:
        # Count how many still need fetching
        need_fetch = [
            i for i in range(start_idx, len(emails))
            if not emails[i].get("body_complete")
        ]

        if not need_fetch:
            print(f"  All {len(emails)} bodies already fetched")
        else:
            est_minutes = len(need_fetch) * 0.4 / 60
            print(
                f"  Fetching full bodies: {len(need_fetch)} remaining "
                f"(~{est_minutes:.0f} min)"
            )

            fetched = 0
            for i in range(start_idx, len(emails)):
                if emails[i].get("body_complete"):
                    continue

                enrich_email(emails[i])
                fetched += 1

                # Progress logging
                if fetched % 10 == 0:
                    print(
                        f"    [{fetched}/{len(need_fetch)}] — "
                        f"{emails[i]['subject'][:60]}",
                        flush=True,
                    )

                # Save checkpoint every batch_size messages
                if fetched % batch_size == 0:
                    save_progress(listname, emails, i + 1)
                    print(f"    ** Checkpoint saved ({fetched} new bodies) **")

                time.sleep(0.15)

            # Final checkpoint
            save_progress(listname, emails, len(emails))

    # Compute stats
    dates = [e["date"] for e in emails if e["date"]]
    hoagiemail_count = sum(1 for e in emails if e["is_hoagiemail"])
    unique_authors = len(set(e["author_name"] for e in emails))

    result = {
        "listserv": listname,
        "scraped_at": datetime.now().isoformat(),
        "total_messages": len(emails),
        "date_range": {
            "oldest": dates[-1] if dates else None,
            "newest": dates[0] if dates else None,
        },
        "unique_authors": unique_authors,
        "hoagiemail_messages": hoagiemail_count,
        "messages": emails,
    }

    return result


def save_result(result: dict, listname: str):
    """Save final scrape results to JSON file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    filepath = DATA_DIR / f"{listname.lower()}_emails.json"
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    size_mb = filepath.stat().st_size / (1024 * 1024)
    print(f"  Saved to {filepath} ({size_mb:.1f} MB)")

    # Clean up progress file
    progress_file = DATA_DIR / f"{listname.lower()}_progress.json"
    if progress_file.exists():
        progress_file.unlink()
        print(f"  Cleaned up progress checkpoint")


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Princeton LISTSERV archives"
    )
    parser.add_argument(
        "--list",
        default="WHITMANWIRE",
        help="Listserv name to scrape (default: WHITMANWIRE)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Scrape all known listservs",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5000,
        help="Max messages to fetch from RSS (default: 5000)",
    )
    parser.add_argument(
        "--fetch-bodies",
        action="store_true",
        help="Fetch full message bodies from individual pages",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=200,
        help="Save checkpoint every N messages (default: 200)",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume from last checkpoint (requires --fetch-bodies)",
    )
    args = parser.parse_args()

    lists_to_scrape = KNOWN_LISTS if args.all else [args.list.upper()]

    login()

    print(f"LISTSERV Scraper — {len(lists_to_scrape)} list(s) to scrape")
    print(f"RSS limit: {args.limit} | Batch size: {args.batch_size}")
    print(f"Fetch bodies: {args.fetch_bodies} | Resume: {args.resume}")

    all_stats = []
    for listname in lists_to_scrape:
        try:
            result = scrape_list(
                listname,
                args.limit,
                args.fetch_bodies,
                args.batch_size,
                args.resume,
            )
            save_result(result, listname)
            all_stats.append(
                {
                    "list": listname,
                    "messages": result["total_messages"],
                    "date_range": result["date_range"],
                    "unique_authors": result["unique_authors"],
                    "hoagiemail_pct": (
                        f"{result['hoagiemail_messages'] / result['total_messages'] * 100:.0f}%"
                        if result["total_messages"] > 0
                        else "0%"
                    ),
                }
            )
        except Exception as e:
            print(f"  [ERROR] Failed to scrape {listname}: {e}")
            all_stats.append({"list": listname, "error": str(e)})

    print("\n" + "=" * 60)
    print("Summary:")
    print("=" * 60)
    for stat in all_stats:
        if "error" in stat:
            print(f"  {stat['list']}: ERROR — {stat['error']}")
        else:
            print(
                f"  {stat['list']}: {stat['messages']:,} messages, "
                f"{stat['unique_authors']} authors, "
                f"{stat['hoagiemail_pct']} via HoagieMail, "
                f"range: {stat['date_range']['oldest'][:10] if stat['date_range']['oldest'] else '?'} → "
                f"{stat['date_range']['newest'][:10] if stat['date_range']['newest'] else '?'}"
            )
    print()


if __name__ == "__main__":
    main()

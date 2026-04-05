"""
Import scraped listserv JSON data into PostgreSQL listserv_emails table.

Usage:
    python3 src/import_to_postgres.py
    python3 src/import_to_postgres.py --input data/whitmanwire_emails.json

Requires: DATABASE_URL environment variable (or reads from root .env)
"""

import argparse
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import Json, execute_values
except ImportError:
    print("Install psycopg2: pip3 install psycopg2-binary")
    exit(1)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent


def get_database_url() -> str:
    """Get DATABASE_URL from env or root .env file."""
    url = os.environ.get("DATABASE_URL")
    if url:
        return url

    env_file = ROOT_DIR / ".env"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")

    raise RuntimeError("DATABASE_URL not found in environment or .env file")


def parse_date(date_str: str) -> datetime | None:
    """Parse ISO date string to datetime."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None


def main():
    parser = argparse.ArgumentParser(description="Import listserv data to Postgres")
    parser.add_argument(
        "--input",
        default=str(DATA_DIR / "whitmanwire_emails.json"),
        help="Input JSON file",
    )
    parser.add_argument(
        "--listserv",
        default="WHITMANWIRE",
        help="Listserv name to tag rows with",
    )
    args = parser.parse_args()

    json_path = Path(args.input)
    if not json_path.exists():
        print(f"Error: {json_path} not found")
        return

    # Load data
    print(f"Loading {json_path.name}...", end=" ", flush=True)
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)
    msgs = data["messages"]
    print(f"{len(msgs):,} messages")

    # Connect to Postgres
    db_url = get_database_url()
    print(f"Connecting to Postgres...", end=" ", flush=True)
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("OK")

    # Prepare rows
    rows = []
    for m in msgs:
        rows.append((
            m.get("message_id", ""),
            args.listserv,
            m.get("subject", ""),
            m.get("author_name"),
            m.get("author_email"),
            parse_date(m.get("date", "")),
            m.get("body_text"),
            m.get("body_html"),
            m.get("is_hoagiemail", False),
            m.get("hoagiemail_sender_name"),
            m.get("hoagiemail_sender_email"),
            Json(m.get("links", [])),
            Json(m.get("images", [])),
            Json(m.get("attachments", [])),
            m.get("listserv_url"),
        ))

    # Bulk insert with ON CONFLICT skip
    print(f"Inserting {len(rows):,} rows...", end=" ", flush=True)
    execute_values(
        cur,
        """
        INSERT INTO listserv_emails (
            message_id, listserv, subject, author_name, author_email,
            date, body_text, body_html, is_hoagiemail,
            hoagiemail_sender_name, hoagiemail_sender_email,
            links, images, attachments, listserv_url
        ) VALUES %s
        ON CONFLICT (message_id) DO NOTHING
        """,
        rows,
        page_size=500,
    )
    conn.commit()

    # Verify
    cur.execute("SELECT COUNT(*) FROM listserv_emails WHERE listserv = %s", (args.listserv,))
    count = cur.fetchone()[0]
    print(f"done")
    print(f"\nTotal rows in listserv_emails for {args.listserv}: {count:,}")

    cur.execute("""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_hoagiemail) as hoagiemail,
            COUNT(*) FILTER (WHERE hoagiemail_sender_name IS NOT NULL) as has_sender,
            MIN(date) as oldest,
            MAX(date) as newest
        FROM listserv_emails WHERE listserv = %s
    """, (args.listserv,))
    row = cur.fetchone()
    print(f"HoagieMail:    {row[1]:,} ({row[1]/row[0]*100:.0f}%)")
    print(f"Has sender:    {row[2]:,}")
    print(f"Date range:    {row[3]} → {row[4]}")

    cur.close()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()

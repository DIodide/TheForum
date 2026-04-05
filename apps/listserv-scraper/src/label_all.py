"""
Label all emails since June 2022 using Gemini 3.1 Flash Lite.
Runs concurrent requests for speed. Saves checkpoints.

Usage:
    python3 label_all.py --test          # test with 10 emails
    python3 label_all.py                 # full run
    python3 label_all.py --resume        # resume from checkpoint
    python3 label_all.py --workers 5     # concurrency level
"""

import argparse
import json
import re
import time
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

import httpx

OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
MODEL = "google/gemini-3.1-flash-lite-preview"
API_URL = "https://openrouter.ai/api/v1/chat/completions"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

SYSTEM_PROMPT = """You classify Princeton University listserv emails as EVENT or NOT_EVENT.

An EVENT is a specific physical or virtual GATHERING at a time and place that students can ATTEND:
- Talks, lectures, panels, speaker events
- Performances, concerts, shows, recitals
- Workshops, classes, tutorials
- Club meetings, info sessions, interest meetings (with a specific time/place)
- Parties, socials, mixers
- Food events, bake sales, free food giveaways
- Sports games, tournaments
- Hackathons, competitions
- Auditions, tryouts, open calls
- Study breaks, craft sessions
- Fundraiser events (bake sales, auctions)
- Movie screenings
- Career fairs, networking events (in-person)

NOT_EVENT:
- Service availability hours (hotlines, chat services saying "open tonight") — this is NOT a gathering
- Club recruitment/applications with NO specific gathering time
- Lost & found, selling items, rideshare requests
- Job/internship postings, application deadlines
- Surveys, petitions, announcements
- Newsletters, digests, weekly roundups
- Merch drops without a physical sale event
- General information (new club formed, new website launched)

KEY DISTINCTION: "We're open tonight from 8-12" for a chat/phone service is NOT an event.
"Come to Frist tonight at 8pm" for a gathering IS an event.

Respond with ONLY valid JSON:
{"is_event": true/false, "confidence": 0.0-1.0, "reason": "brief reason"}"""

# Thread-safe results
results_lock = Lock()
results = []
save_counter = 0


def classify_email(client, m):
    """Classify a single email. Returns result dict."""
    body = m.get("body_text", "")[:400]
    body = re.sub(r"This email was instantly sent.*", "", body, flags=re.DOTALL | re.I)
    body = re.sub(r"Email composed by.*", "", body, flags=re.DOTALL | re.I)

    email_text = f"Subject: {m.get('subject', '')}\nFrom: {m.get('author_name', '')}\nDate: {m.get('date', '')[:10]}\nBody: {body.strip()}"

    for attempt in range(3):
        try:
            resp = client.post(
                API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": email_text},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 200,
                },
                timeout=20,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]

            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                return {
                    "message_id": m["message_id"],
                    "subject": m["subject"][:120],
                    "date": m.get("date", "")[:10],
                    "author_name": m.get("author_name", ""),
                    "is_event": parsed.get("is_event"),
                    "confidence": parsed.get("confidence", 0),
                    "reason": parsed.get("reason", ""),
                }
        except Exception as e:
            if attempt < 2:
                time.sleep(2 ** attempt)
            else:
                return {
                    "message_id": m["message_id"],
                    "subject": m["subject"][:120],
                    "date": m.get("date", "")[:10],
                    "is_event": None,
                    "confidence": 0,
                    "reason": f"error: {str(e)[:80]}",
                }


def save_checkpoint(results, output_path):
    with open(output_path, "w") as f:
        json.dump(results, f, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Test with 10 emails")
    parser.add_argument("--resume", action="store_true", help="Resume from checkpoint")
    parser.add_argument("--workers", type=int, default=5, help="Concurrent workers")
    parser.add_argument("--since", default="2022-06", help="Label emails since this date")
    args = parser.parse_args()

    # Load emails
    print("Loading emails...", flush=True)
    with open(DATA_DIR / "whitmanwire_emails.json") as f:
        all_msgs = json.load(f)["messages"]

    to_label = [m for m in all_msgs if m.get("date", "") >= args.since]
    print(f"Emails since {args.since}: {len(to_label):,}", flush=True)

    if args.test:
        to_label = to_label[:10]
        print(f"TEST MODE: labeling {len(to_label)} emails", flush=True)

    output_path = DATA_DIR / "llm_labels_full.json"

    # Resume
    done_ids = set()
    existing = []
    if args.resume and output_path.exists():
        with open(output_path) as f:
            existing = json.load(f)
        done_ids = {r["message_id"] for r in existing}
        print(f"Resuming: {len(done_ids)} already done", flush=True)

    remaining = [m for m in to_label if m["message_id"] not in done_ids]
    print(f"Remaining: {len(remaining):,} | Workers: {args.workers}", flush=True)

    if not remaining:
        print("Nothing to do!")
        return

    results = list(existing)
    checkpoint_interval = 200
    client = httpx.Client(timeout=20)

    t0 = time.time()
    completed = 0
    events = sum(1 for r in results if r.get("is_event") is True)
    not_events = sum(1 for r in results if r.get("is_event") is False)
    errors = sum(1 for r in results if r.get("is_event") is None)

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(classify_email, client, m): m for m in remaining}

        for future in as_completed(futures):
            result = future.result()
            if result:
                with results_lock:
                    results.append(result)
                    completed += 1

                    if result["is_event"] is True:
                        events += 1
                    elif result["is_event"] is False:
                        not_events += 1
                    else:
                        errors += 1

                    if completed % 50 == 0:
                        elapsed = time.time() - t0
                        rate = completed / elapsed
                        eta = (len(remaining) - completed) / rate / 60 if rate > 0 else 0
                        print(
                            f"  [{completed}/{len(remaining)}] "
                            f"events={events} not={not_events} err={errors} "
                            f"({rate:.1f}/s, ~{eta:.0f}m left)",
                            flush=True,
                        )

                    if completed % checkpoint_interval == 0:
                        save_checkpoint(results, output_path)
                        print(f"  ** Checkpoint at {completed} **", flush=True)

    # Final save
    save_checkpoint(results, output_path)

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed/60:.1f} minutes", flush=True)
    print(f"Total: {len(results):,} labeled", flush=True)
    print(f"Events: {events:,} | Not-events: {not_events:,} | Errors: {errors}", flush=True)
    print(f"Saved to {output_path}", flush=True)


if __name__ == "__main__":
    main()

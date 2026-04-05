"""
Explore Gemini 3.1 Flash Lite via OpenRouter for:
1. Binary event classification (labeled dataset)
2. Multi-tag classification (unsupervised tag discovery → taxonomy)
3. LLM-enriched features for better clustering

Usage:
    python3 src/llm_explore.py --phase test      # test API connection
    python3 src/llm_explore.py --phase classify   # binary event classifier on sample
    python3 src/llm_explore.py --phase tags       # multi-tag classifier
    python3 src/llm_explore.py --phase features   # LLM feature extraction for clustering
    python3 src/llm_explore.py --phase all        # run everything
"""

import argparse
import json
import os
import re
import time
from pathlib import Path
from datetime import datetime

import httpx

OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
MODEL = "google/gemini-3.1-flash-lite-preview"  # $0.25/M in, $1.50/M out
API_URL = "https://openrouter.ai/api/v1/chat/completions"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Rate limiting
REQUEST_DELAY = 0.15  # seconds between requests
client = httpx.Client(timeout=30)


def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.1, max_tokens: int = 500) -> str | None:
    """Call Gemini Flash Lite via OpenRouter."""
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
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"    [ERR] {e}")
        return None


def load_emails(limit: int | None = None) -> list[dict]:
    """Load emails from JSON."""
    with open(DATA_DIR / "whitmanwire_emails.json") as f:
        msgs = json.load(f)["messages"]
    if limit:
        msgs = msgs[:limit]
    return msgs


def format_email_for_llm(m: dict, max_body: int = 400) -> str:
    """Format an email for LLM input."""
    body = m.get("body_text", "")[:max_body]
    # Strip hoagiemail footer
    body = re.sub(r"This email was instantly sent.*", "", body, flags=re.DOTALL | re.I)
    body = re.sub(r"Email composed by.*", "", body, flags=re.DOTALL | re.I)

    parts = [f"Subject: {m.get('subject', '')}"]
    if m.get("author_name"):
        parts.append(f"From: {m['author_name']}")
    if m.get("date"):
        parts.append(f"Date: {m['date'][:10]}")
    parts.append(f"Body: {body.strip()}")
    if m.get("links"):
        parts.append(f"Links: {len(m['links'])} link(s)")
    if m.get("images"):
        parts.append(f"Images: {len(m['images'])} image(s)")
    return "\n".join(parts)


# ── Phase: Test ──────────────────────────────────────────

def phase_test():
    """Test API connectivity and model response."""
    print("=== Phase: Test API ===")
    resp = call_llm(
        "You are a helpful assistant.",
        "Say 'API working' and nothing else.",
    )
    if resp and "working" in resp.lower():
        print(f"  API response: {resp.strip()}")
        print("  ✓ Connection OK")
    else:
        print(f"  ✗ Unexpected response: {resp}")
        return False

    # Test with a real email classification
    test_email = "Subject: FREE PIZZA IN FRIST TONIGHT\nFrom: PSEC\nBody: Come grab a slice at Frist MPR tonight from 8-10pm. All are welcome!"
    resp = call_llm(
        "Classify this email as 'event' or 'not_event'. Respond with just the label.",
        test_email,
    )
    print(f"  Test classification: {resp.strip()}")

    # Check model info
    resp2 = call_llm(
        "You are a helpful assistant.",
        "What model are you? One sentence.",
    )
    print(f"  Model: {resp2.strip() if resp2 else 'unknown'}")
    return True


# ── Phase: Binary Classification ─────────────────────────

CLASSIFY_SYSTEM = """You are classifying Princeton University listserv emails as either an EVENT or NOT_EVENT.

An EVENT is something with a specific time/place where people gather: talks, performances, workshops, meetings, parties, food events, sports games, etc.

NOT_EVENT includes: lost & found, selling items, rideshare requests, job/internship postings, club recruitment without a specific event, surveys, newsletters/digests, general announcements.

Respond with ONLY valid JSON:
{"is_event": true/false, "confidence": 0.0-1.0, "reason": "brief reason"}"""


def phase_classify(sample_size: int = 500):
    """Run binary event classification on a sample."""
    print(f"=== Phase: Binary Classification ({sample_size} emails) ===")

    msgs = load_emails()

    # Use a spread sample across the dataset
    import random
    random.seed(42)
    indices = sorted(random.sample(range(len(msgs)), min(sample_size, len(msgs))))
    sample = [(i, msgs[i]) for i in indices]

    results = []
    output_path = DATA_DIR / "llm_classify_results.json"

    # Resume from existing results
    if output_path.exists():
        with open(output_path) as f:
            results = json.load(f)
        done_ids = {r["message_id"] for r in results}
        sample = [(i, m) for i, m in sample if m["message_id"] not in done_ids]
        print(f"  Resuming: {len(results)} done, {len(sample)} remaining")

    for count, (idx, m) in enumerate(sample):
        email_text = format_email_for_llm(m)
        resp = call_llm(CLASSIFY_SYSTEM, email_text)

        if resp:
            # Parse JSON response
            try:
                # Extract JSON from response
                json_match = re.search(r"\{.*\}", resp, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                else:
                    parsed = {"is_event": None, "confidence": 0, "reason": "parse_error"}
            except json.JSONDecodeError:
                parsed = {"is_event": None, "confidence": 0, "reason": "json_error"}

            results.append({
                "message_id": m["message_id"],
                "index": idx,
                "subject": m["subject"],
                "date": m.get("date", "")[:10],
                "author_name": m.get("author_name", ""),
                "is_event": parsed.get("is_event"),
                "confidence": parsed.get("confidence", 0),
                "reason": parsed.get("reason", ""),
                "raw_response": resp.strip(),
            })
        else:
            results.append({
                "message_id": m["message_id"],
                "index": idx,
                "subject": m["subject"],
                "is_event": None,
                "confidence": 0,
                "reason": "api_error",
            })

        if (count + 1) % 20 == 0:
            events = sum(1 for r in results if r["is_event"] is True)
            not_events = sum(1 for r in results if r["is_event"] is False)
            print(f"  [{count+1}/{len(sample)}] events={events} not_events={not_events}")
            # Save checkpoint
            with open(output_path, "w") as f:
                json.dump(results, f, indent=2, ensure_ascii=False)

        time.sleep(REQUEST_DELAY)

    # Final save
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # Stats
    events = sum(1 for r in results if r["is_event"] is True)
    not_events = sum(1 for r in results if r["is_event"] is False)
    errors = sum(1 for r in results if r["is_event"] is None)
    high_conf = sum(1 for r in results if r.get("confidence", 0) >= 0.8)

    print(f"\n  Results: {events} events, {not_events} not-events, {errors} errors")
    print(f"  High confidence (≥0.8): {high_conf}")
    print(f"  Event rate: {events/(events+not_events)*100:.1f}%")
    print(f"  Saved to {output_path}")

    # Show some examples
    print("\n  Sample EVENTS:")
    for r in [r for r in results if r["is_event"] is True][:5]:
        print(f"    [{r['confidence']:.1f}] {r['subject'][:60]}")
    print("\n  Sample NOT-EVENTS:")
    for r in [r for r in results if r["is_event"] is False][:5]:
        print(f"    [{r['confidence']:.1f}] {r['subject'][:60]}")


# ── Phase: Multi-Tag Classification ──────────────────────

DISCOVER_TAGS_SYSTEM = """You are analyzing Princeton University event emails to discover natural categories/tags.

For this email, suggest 1-3 short tags (2-3 words max each) that describe what kind of event or content this is. Tags should be general enough to apply to other similar emails.

Respond with ONLY valid JSON:
{"tags": ["tag1", "tag2"], "primary_tag": "tag1"}"""

APPLY_TAGS_SYSTEM = """You are tagging Princeton University event emails with categories from this taxonomy:

{taxonomy}

Assign 1-3 tags from the list above. Also assign a confidence (0-1) for each.

Respond with ONLY valid JSON:
{{"tags": [{{"tag": "tag-name", "confidence": 0.9}}]}}"""


def phase_tags(discover_size: int = 200, apply_size: int = 500):
    """Phase 1: Discover tags from sample. Phase 2: Apply consolidated taxonomy."""
    print(f"=== Phase: Multi-Tag Discovery ({discover_size} emails) ===")

    msgs = load_emails()

    # --- Step 1: Discover tags from a sample ---
    discovery_path = DATA_DIR / "llm_tag_discovery.json"

    import random
    random.seed(42)

    if discovery_path.exists():
        with open(discovery_path) as f:
            discovery_results = json.load(f)
        print(f"  Loaded existing discovery: {len(discovery_results)} emails")
    else:
        # Use emails likely to be events (from classification results if available)
        classify_path = DATA_DIR / "llm_classify_results.json"
        if classify_path.exists():
            with open(classify_path) as f:
                classified = json.load(f)
            event_ids = {r["message_id"] for r in classified if r["is_event"] is True}
            event_msgs = [m for m in msgs if m["message_id"] in event_ids]
            other_msgs = [m for m in msgs if m["message_id"] not in event_ids]
            # Mix: 70% events, 30% non-events for discovery
            sample_events = random.sample(event_msgs, min(int(discover_size * 0.7), len(event_msgs)))
            sample_other = random.sample(other_msgs, min(int(discover_size * 0.3), len(other_msgs)))
            discover_sample = sample_events + sample_other
            random.shuffle(discover_sample)
        else:
            discover_sample = random.sample(msgs, min(discover_size, len(msgs)))

        discovery_results = []
        for count, m in enumerate(discover_sample):
            email_text = format_email_for_llm(m)
            resp = call_llm(DISCOVER_TAGS_SYSTEM, email_text)

            if resp:
                try:
                    json_match = re.search(r"\{.*\}", resp, re.DOTALL)
                    parsed = json.loads(json_match.group()) if json_match else {}
                except json.JSONDecodeError:
                    parsed = {}

                discovery_results.append({
                    "message_id": m["message_id"],
                    "subject": m["subject"][:80],
                    "tags": parsed.get("tags", []),
                    "primary_tag": parsed.get("primary_tag", ""),
                })

            if (count + 1) % 20 == 0:
                print(f"  Discovery [{count+1}/{len(discover_sample)}]")

            time.sleep(REQUEST_DELAY)

        with open(discovery_path, "w") as f:
            json.dump(discovery_results, f, indent=2, ensure_ascii=False)
        print(f"  Saved discovery to {discovery_path}")

    # --- Step 2: Analyze discovered tags → taxonomy ---
    from collections import Counter
    all_tags = []
    for r in discovery_results:
        all_tags.extend([t.lower().strip() for t in r.get("tags", [])])

    tag_counts = Counter(all_tags)
    print(f"\n  Discovered {len(tag_counts)} unique tags from {len(discovery_results)} emails")
    print(f"  Top 30 tags:")
    for tag, count in tag_counts.most_common(30):
        print(f"    {count:>4}  {tag}")

    # --- Step 3: Ask LLM to consolidate tags into a taxonomy ---
    print("\n  Asking LLM to consolidate into taxonomy...")
    top_tags = [f"{tag} ({count})" for tag, count in tag_counts.most_common(60)]
    consolidate_resp = call_llm(
        "You are designing an event tagging system for a college campus events platform.",
        f"""Here are the most common tags discovered from analyzing {len(discovery_results)} Princeton listserv emails:

{chr(10).join(top_tags)}

Consolidate these into a clean taxonomy of 12-20 tags. Each tag should be:
- Kebab-case (e.g., "free-food")
- Distinct (no overlapping categories)
- Useful for students browsing events

Respond with ONLY valid JSON:
{{"taxonomy": [{{"tag": "tag-name", "description": "what it covers", "maps_from": ["original tags it absorbs"]}}]}}""",
        max_tokens=1500,
    )

    taxonomy = []
    if consolidate_resp:
        try:
            json_match = re.search(r"\{.*\}", consolidate_resp, re.DOTALL)
            parsed = json.loads(json_match.group()) if json_match else {}
            taxonomy = parsed.get("taxonomy", [])
        except json.JSONDecodeError:
            pass

    taxonomy_path = DATA_DIR / "llm_taxonomy.json"
    with open(taxonomy_path, "w") as f:
        json.dump(taxonomy, f, indent=2, ensure_ascii=False)

    print(f"\n  Consolidated taxonomy ({len(taxonomy)} tags):")
    for t in taxonomy:
        print(f"    {t['tag']:<25} {t.get('description', '')[:50]}")

    # --- Step 4: Apply taxonomy to a larger sample ---
    print(f"\n=== Phase: Apply Tags ({apply_size} emails) ===")
    taxonomy_str = "\n".join(f"- {t['tag']}: {t.get('description', '')}" for t in taxonomy)
    apply_prompt = APPLY_TAGS_SYSTEM.format(taxonomy=taxonomy_str)

    apply_path = DATA_DIR / "llm_tagged_results.json"
    tagged_results = []

    if apply_path.exists():
        with open(apply_path) as f:
            tagged_results = json.load(f)
        done_ids = {r["message_id"] for r in tagged_results}
        print(f"  Resuming: {len(tagged_results)} done")
    else:
        done_ids = set()

    apply_sample = random.sample(msgs, min(apply_size, len(msgs)))
    apply_sample = [m for m in apply_sample if m["message_id"] not in done_ids]

    for count, m in enumerate(apply_sample):
        email_text = format_email_for_llm(m)
        resp = call_llm(apply_prompt, email_text)

        if resp:
            try:
                json_match = re.search(r"\{.*\}", resp, re.DOTALL)
                parsed = json.loads(json_match.group()) if json_match else {}
            except json.JSONDecodeError:
                parsed = {}

            tagged_results.append({
                "message_id": m["message_id"],
                "subject": m["subject"][:80],
                "date": m.get("date", "")[:10],
                "author_name": m.get("author_name", ""),
                "tags": parsed.get("tags", []),
            })

        if (count + 1) % 20 == 0:
            print(f"  Tagging [{count+1}/{len(apply_sample)}]")
            with open(apply_path, "w") as f:
                json.dump(tagged_results, f, indent=2, ensure_ascii=False)

        time.sleep(REQUEST_DELAY)

    with open(apply_path, "w") as f:
        json.dump(tagged_results, f, indent=2, ensure_ascii=False)

    # Stats
    all_applied = []
    for r in tagged_results:
        for t in r.get("tags", []):
            tag_name = t["tag"] if isinstance(t, dict) else t
            all_applied.append(tag_name)

    applied_counts = Counter(all_applied)
    print(f"\n  Tag distribution across {len(tagged_results)} emails:")
    for tag, count in applied_counts.most_common():
        bar = "█" * (count // 5)
        print(f"    {tag:<25} {count:>4}  {bar}")
    print(f"  Saved to {apply_path}")


# ── Phase: LLM Feature Extraction for Clustering ────────

FEATURES_SYSTEM = """Analyze this Princeton listserv email and extract structured features for clustering.

Respond with ONLY valid JSON:
{"category": "one of: event-announcement, recruitment, lost-and-found, selling, rideshare, digest, social, academic, performance, career, activism, religious, wellness, sports, other",
 "urgency": "one of: happening-now, today, this-week, upcoming, timeless",
 "audience": "one of: all-students, specific-club, specific-year, grad-students, everyone",
 "has_food": true/false,
 "has_rsvp": true/false,
 "formality": "one of: casual, semi-formal, formal",
 "sentiment": "one of: excited, neutral, urgent, informational",
 "topic_keywords": ["keyword1", "keyword2", "keyword3"]}"""


def phase_features(sample_size: int = 500):
    """Extract structured LLM features for clustering improvement."""
    print(f"=== Phase: LLM Feature Extraction ({sample_size} emails) ===")

    msgs = load_emails()

    import random
    random.seed(42)
    sample = random.sample(msgs, min(sample_size, len(msgs)))

    features_path = DATA_DIR / "llm_features.json"
    results = []

    if features_path.exists():
        with open(features_path) as f:
            results = json.load(f)
        done_ids = {r["message_id"] for r in results}
        sample = [m for m in sample if m["message_id"] not in done_ids]
        print(f"  Resuming: {len(results)} done, {len(sample)} remaining")

    for count, m in enumerate(sample):
        email_text = format_email_for_llm(m)
        resp = call_llm(FEATURES_SYSTEM, email_text)

        if resp:
            try:
                json_match = re.search(r"\{.*\}", resp, re.DOTALL)
                parsed = json.loads(json_match.group()) if json_match else {}
            except json.JSONDecodeError:
                parsed = {}

            results.append({
                "message_id": m["message_id"],
                "subject": m["subject"][:80],
                "date": m.get("date", "")[:10],
                **parsed,
            })

        if (count + 1) % 20 == 0:
            print(f"  Features [{count+1}/{len(sample)}]")
            with open(features_path, "w") as f:
                json.dump(results, f, indent=2, ensure_ascii=False)

        time.sleep(REQUEST_DELAY)

    with open(features_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # Stats
    from collections import Counter
    cats = Counter(r.get("category", "unknown") for r in results)
    urgencies = Counter(r.get("urgency", "unknown") for r in results)
    food = sum(1 for r in results if r.get("has_food"))

    print(f"\n  Category distribution:")
    for cat, count in cats.most_common():
        print(f"    {cat:<25} {count:>4}")
    print(f"\n  Urgency: {dict(urgencies.most_common())}")
    print(f"  Has food: {food}/{len(results)} ({food/len(results)*100:.0f}%)")
    print(f"  Saved to {features_path}")


# ── Main ─────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="LLM exploration on listserv data")
    parser.add_argument("--phase", default="all", choices=["test", "classify", "tags", "features", "all"])
    parser.add_argument("--sample", type=int, default=500, help="Sample size for classification/features")
    parser.add_argument("--discover-size", type=int, default=200, help="Sample size for tag discovery")
    args = parser.parse_args()

    phases = ["test", "classify", "tags", "features"] if args.phase == "all" else [args.phase]

    for phase in phases:
        if phase == "test":
            if not phase_test():
                print("API test failed, aborting.")
                return
        elif phase == "classify":
            phase_classify(args.sample)
        elif phase == "tags":
            phase_tags(args.discover_size, args.sample)
        elif phase == "features":
            phase_features(args.sample)
        print()


if __name__ == "__main__":
    main()

"""
Export scraped listserv JSON data into ML-ready formats.

Outputs:
    data/whitmanwire.csv       — flat CSV for quick exploration
    data/whitmanwire.parquet   — compressed columnar format for pandas/ML
    data/whitmanwire_sample.csv — 200-row sample for labeling

Usage:
    python3 src/export_data.py
    python3 src/export_data.py --input data/whitmanwire_emails.json
"""

import argparse
import json
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_and_flatten(json_path: Path) -> pd.DataFrame:
    """Load scraped JSON and flatten into a DataFrame."""
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    msgs = data["messages"]
    print(f"Loaded {len(msgs):,} messages from {json_path.name}")

    df = pd.DataFrame(msgs)

    # Convert links/images arrays to counts + semicolon-joined strings
    df["link_count"] = df["links"].apply(lambda x: len(x) if isinstance(x, list) else 0)
    df["image_count"] = df["images"].apply(lambda x: len(x) if isinstance(x, list) else 0)
    df["links_joined"] = df["links"].apply(
        lambda x: ";".join(x) if isinstance(x, list) else ""
    )
    df["images_joined"] = df["images"].apply(
        lambda x: ";".join(x) if isinstance(x, list) else ""
    )

    # Body length features
    df["body_text_len"] = df["body_text"].fillna("").str.len()
    df["subject_len"] = df["subject"].fillna("").str.len()

    # Parse date as datetime
    df["date"] = pd.to_datetime(df["date"], utc=True, errors="coerce")

    # Clean up columns for export
    export_cols = [
        "message_id",
        "subject",
        "author_name",
        "author_email",
        "date",
        "body_text",
        "body_html",
        "is_hoagiemail",
        "hoagiemail_sender_name",
        "hoagiemail_sender_email",
        "link_count",
        "image_count",
        "links_joined",
        "images_joined",
        "body_text_len",
        "subject_len",
        "listserv_url",
    ]

    # Only include columns that exist
    export_cols = [c for c in export_cols if c in df.columns]
    df = df[export_cols]

    return df


def print_summary(df: pd.DataFrame):
    """Print dataset summary stats."""
    print(f"\n{'='*60}")
    print(f"Dataset Summary")
    print(f"{'='*60}")
    print(f"Rows:              {len(df):,}")
    print(f"Columns:           {len(df.columns)}")
    print(f"Date range:        {df['date'].min()} → {df['date'].max()}")
    print(f"HoagieMail:        {df['is_hoagiemail'].sum():,} ({df['is_hoagiemail'].mean()*100:.0f}%)")
    print(f"Has sender name:   {df['hoagiemail_sender_name'].notna().sum():,}")
    print(f"Avg body length:   {df['body_text_len'].mean():.0f} chars")
    print(f"Avg links/email:   {df['link_count'].mean():.1f}")
    print(f"Unique authors:    {df['author_name'].nunique():,}")
    print()
    print("Column types:")
    for col in df.columns:
        non_null = df[col].notna().sum()
        print(f"  {col:<30} {str(df[col].dtype):<15} {non_null:>5} non-null")
    print()


def main():
    parser = argparse.ArgumentParser(description="Export listserv data for ML")
    parser.add_argument(
        "--input",
        default=str(DATA_DIR / "whitmanwire_emails.json"),
        help="Input JSON file",
    )
    args = parser.parse_args()

    json_path = Path(args.input)
    if not json_path.exists():
        print(f"Error: {json_path} not found")
        return

    df = load_and_flatten(json_path)
    print_summary(df)

    # Export full CSV
    csv_path = DATA_DIR / "whitmanwire.csv"
    df.to_csv(csv_path, index=False)
    print(f"Saved CSV:     {csv_path} ({csv_path.stat().st_size / 1024 / 1024:.1f} MB)")

    # Export Parquet (much smaller, preserves types)
    parquet_path = DATA_DIR / "whitmanwire.parquet"
    df.to_parquet(parquet_path, index=False)
    print(f"Saved Parquet: {parquet_path} ({parquet_path.stat().st_size / 1024 / 1024:.1f} MB)")

    # Export 200-row sample for labeling
    sample = df.sample(n=min(200, len(df)), random_state=42).sort_values("date")
    sample_cols = [
        "message_id", "subject", "author_name", "date",
        "body_text", "is_hoagiemail", "hoagiemail_sender_name",
        "link_count", "image_count",
    ]
    sample_cols = [c for c in sample_cols if c in sample.columns]
    sample_path = DATA_DIR / "whitmanwire_sample.csv"
    sample[sample_cols].to_csv(sample_path, index=False)
    print(f"Saved sample:  {sample_path} ({len(sample)} rows for labeling)")

    print("\nDone. Load in Python with:")
    print('  import pandas as pd')
    print(f'  df = pd.read_parquet("{parquet_path}")')
    print(f'  df = pd.read_csv("{csv_path}")')


if __name__ == "__main__":
    main()

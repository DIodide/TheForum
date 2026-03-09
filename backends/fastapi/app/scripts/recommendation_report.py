import argparse
import json

from app.db import get_engine
from app.services.diagnostics import get_evaluation_summary
from app.services.feed_features import run_feed_feature_aggregation


def main() -> None:
    parser = argparse.ArgumentParser(
        description=("Run feed aggregation and print evaluation metrics.")
    )
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Lookback window for evaluation metrics.",
    )
    parser.add_argument(
        "--skip-aggregation",
        action="store_true",
        help="Print evaluation metrics without refreshing aggregate tables first.",
    )
    args = parser.parse_args()

    engine = get_engine()
    if engine is None:
        raise SystemExit("DATABASE_URL is not configured")

    payload: dict[str, object] = {}
    if not args.skip_aggregation:
        payload["aggregation"] = run_feed_feature_aggregation(engine).to_dict()

    payload["evaluation"] = get_evaluation_summary(engine, days=args.days)
    print(json.dumps(payload, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

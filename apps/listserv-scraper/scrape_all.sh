#!/bin/bash
# Continuous WHITMANWIRE scraper — runs in 5k increments until all messages are fetched.
# Each batch skips messages already fetched in previous runs.
# Safe to Ctrl+C — resume with: python3 src/scrape_listserv.py --fetch-bodies --resume

set -e
cd "$(dirname "$0")"

echo "=== WHITMANWIRE Continuous Scraper ==="
echo "Started at $(date)"
echo ""

# Wait for any existing scrape process to finish
EXISTING_PID=$(pgrep -f "scrape_listserv.py" 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
    echo "Waiting for existing scrape (PID $EXISTING_PID) to finish..."
    while kill -0 "$EXISTING_PID" 2>/dev/null; do
        sleep 10
    done
    echo "Previous scrape finished."
    echo ""
fi

LIMITS=(5000 10000 15000 20000 25000 30000 35000 40000)

for LIMIT in "${LIMITS[@]}"; do
    echo "============================================"
    echo "Batch: limit=$LIMIT — $(date)"
    echo "============================================"

    python3 src/scrape_listserv.py \
        --list WHITMANWIRE \
        --limit "$LIMIT" \
        --fetch-bodies \
        --batch-size 200

    echo ""
    echo "Batch limit=$LIMIT complete."
    echo ""
done

echo "=== All batches complete! ==="
echo "Finished at $(date)"

#!/bin/sh
# Serves the app locally and runs the browser run-through against it.
cd "$(dirname "$0")/.."
python3 -m http.server 8766 >/dev/null 2>&1 &
SRV=$!
sleep 1
timeout 170 python3 tests/e2e.py http://localhost:8766
CODE=$?
kill $SRV 2>/dev/null
exit $CODE

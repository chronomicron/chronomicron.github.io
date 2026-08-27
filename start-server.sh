#!/usr/bin/env bash
# Start a local web server for the personal profile site.
# Usage: ./start-server.sh   or double-click if your file manager allows it.

cd "$(dirname "$0")"

PORT=8000

echo "Serving $(pwd)"
echo "Open: http://localhost:${PORT}"
echo "Press Ctrl+C to stop."
echo

python3 -m http.server "$PORT"

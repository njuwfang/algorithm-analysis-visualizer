#!/usr/bin/env sh
set -eu

PORT="${PORT:-8080}"

printf 'Serving Analysis of Algorithms Lab at http://localhost:%s\n' "$PORT"
printf 'Press Ctrl+C to stop.\n'
python3 -m http.server "$PORT" --bind 0.0.0.0

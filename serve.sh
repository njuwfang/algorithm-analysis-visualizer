#!/usr/bin/env sh
set -eu
PORT="${1:-${PORT:-8080}}"
printf 'Analysis of Algorithms: http://localhost:%s\n' "$PORT"
python3 -m http.server "$PORT"

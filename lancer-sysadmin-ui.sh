#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8765

echo "=================================================================="
echo "  SENIOR SYSADMIN & DEVSECOPS — INTERFACE GRAPHIQUE INTERACTIVE"
echo "=================================================================="
echo "  Ouverture sur : http://127.0.0.1:$PORT"
echo "=================================================================="

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://127.0.0.1:$PORT" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:$PORT" >/dev/null 2>&1 &
fi

cd "$SCRIPT_DIR/docs"
python3 -m http.server "$PORT" --bind 127.0.0.1

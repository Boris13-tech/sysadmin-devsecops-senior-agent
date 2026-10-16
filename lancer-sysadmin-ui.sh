#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT=8765

echo "=================================================================="
echo "  SENIOR SYSADMIN & DEVSECOPS — INTERFACE GRAPHIQUE INTERACTIVE"
echo "=================================================================="
echo "  Lancement du relais local sur : http://127.0.0.1:$PORT"
echo "=================================================================="

if command -v python3 >/dev/null 2>&1; then
  python3 "$SCRIPT_DIR/server/start-ui-server.py"
else
  echo "Python 3 n'est pas détecté. Veuillez installer Python 3 pour exécuter le serveur local."
  exit 1
fi

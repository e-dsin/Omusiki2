#!/usr/bin/env bash
# scripts/setup.sh — équivalent macOS / Linux de scripts/setup.ps1
set -euo pipefail
cd "$(dirname "$0")/.."
PY=${PYTHON:-python3}
"$PY" -c 'import sys; assert sys.version_info >= (3, 11), "Python 3.11+ requis"'
[ -x backend/.venv/bin/python ] || "$PY" -m venv backend/.venv
backend/.venv/bin/python -m pip install --upgrade pip --quiet
backend/.venv/bin/python -m pip install -r backend/requirements.txt
npm install
npx playwright install chromium || echo "Navigateur Playwright non installé (relancer : npx playwright install chromium)"
(cd backend && .venv/bin/python -m pytest)
echo "Installation terminée. Démarrage : tâche VS Code « Tout démarrer » (Ctrl+Maj+B)."

#!/usr/bin/env bash
set -euo pipefail

echo "[orbis] Installing project dependencies..."

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Install Node.js (which includes npm) and retry."
  exit 1
fi

# Installs all runtime and development dependencies from lockfile.
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[orbis] Setup complete."

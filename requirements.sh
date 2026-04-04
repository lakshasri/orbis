#!/usr/bin/env bash
set -euo pipefail

echo "[orbis] Installing project dependencies..."

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Install Node.js (which includes npm) and retry."
  exit 1
fi

# Installs dependencies from package.json/package-lock.json.
npm install

echo "[orbis] Installing development dependencies..."
npm install -D \
  typescript \
  ts-node-dev \
  @types/node \
  @types/express \
  jest \
  ts-jest \
  @types/jest \
  supertest \
  @types/supertest \
  eslint \
  @eslint/js \
  typescript-eslint \
  prettier \
  globals

echo "[orbis] Setup complete."

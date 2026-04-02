#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting guessit-js server..."
exec npx tsx server.ts

#!/usr/bin/env bash
set -euo pipefail

# preview.sh - Start the development server with live reload
# Usage: ./bin/preview.sh [--port PORT] [--help]

print_help() {
  cat <<EOF
Usage: $(basename "$0") [options]

Start the Wrapped for LinkedIn development server with live reload.

Options:
  --port PORT   Dev server port (default: 5173)
  --help        Show this help and exit

Requirements:
  - Node.js 22.18+
  - npm dependencies installed (npm install in site/ directory)
EOF
}

PORT=5173
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      if [[ $# -lt 2 ]]; then
        echo "Error: --port needs a value" >&2
        exit 2
      fi
      PORT="$2"
      shift 2
      ;;
    --help) print_help; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

if ! command -v npm &> /dev/null; then
  echo "Error: npm not found. Install Node.js from https://nodejs.org/" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Starting development server on port $PORT..."
cd "$REPO_ROOT"
npm --prefix site run dev -- --port "$PORT" --strictPort

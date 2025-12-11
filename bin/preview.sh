#!/usr/bin/env zsh
set -euo pipefail

# preview.sh - Start the development server with hot reload
# Usage: ./bin/preview.sh [--port PORT] [--help]

print_help() {
  cat <<-EOF
Usage: $(basename "$0") [options]

Start the Wrapped for LinkedIn development server with live reload.

Options:
  --port PORT   Dev server port (default: 5173)
  --help        Show this help and exit

Requirements:
  - Node.js 20.19+ or 22.12+ or 23.x+
  - npm dependencies installed (npm install in site/ directory)
EOF
}

if [[ ${1:-} == "--help" ]]; then
  print_help
  exit 0
fi

# Parse arguments
PORT=5173
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --help) print_help; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

# Check for required tools
if ! command -v npm &> /dev/null; then
  echo "Error: npm not found. Install Node.js from https://nodejs.org/" >&2
  exit 1
fi

# Get repository root
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Start dev server
echo "Starting development server on port $PORT..."
cd "$REPO_ROOT"
PORT="$PORT" npm --prefix site run dev

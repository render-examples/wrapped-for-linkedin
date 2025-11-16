#!/usr/bin/env zsh
set -euo pipefail

# preview.sh - start frontend (Vite) and backend (uvicorn) with hot reload
# Usage: ./bin/preview.sh [--frontend-port PORT] [--backend-port PORT] [--help]

print_help() {
  cat <<-EOF
Usage: $(basename "$0") [options]

Options:
  --frontend-port PORT   Vite dev server port (default: 5173)
  --backend-port PORT    Uvicorn port for FastAPI (default: 8000)
  --help                 Show this help and exit

This script starts the frontend and backend concurrently with hot reload.
It expects to be placed in the repository `bin/` directory and run from the repo root.

Frontend: npm --prefix frontend run dev
Backend:  python -m uvicorn src.main:app --reload --port <port>

Before running, ensure you have installed frontend deps (npm install) and a Python
environment with requirements installed for the backend.
EOF
}


if [[ ${1:-} == "--help" ]]; then
  print_help
  exit 0
fi

# Defaults
FRONTEND_PORT=5173
BACKEND_PORT=8000

# parse args (very small parser)
while [[ $# -gt 0 ]]; do
  case "$1" in
    --frontend-port)
      FRONTEND_PORT="$2"; shift 2;;
    --backend-port)
      BACKEND_PORT="$2"; shift 2;;
    --auto-install)
      AUTO_INSTALL=true; shift 1;;
    --check)
      CHECK_ONLY=true; shift 1;;
    --help)
      print_help; exit 0;;
    *)
      echo "Unknown arg: $1" >&2; print_help; exit 2;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# helper to prefix logs
prefix_output() {
  local prefix="$1"
  sed -u "s/^/[$prefix] /"
}

# check commands existence
command -v npm >/dev/null 2>&1 || { echo "npm not found in PATH. Install Node/npm to run frontend." >&2; exit 2; }
command -v python >/dev/null 2>&1 || { echo "python not found in PATH. Activate Python environment to run backend." >&2; exit 2; }

# helper: check uvicorn import
uvicorn_available() {
  python - <<'PY'
try:
    # Import submodule explicitly to avoid AttributeError in environments
    # where `importlib` doesn't expose submodules as attributes until
    # they are imported.
    import importlib.util as _imp_util
    found = _imp_util.find_spec('uvicorn') is not None
except Exception:
    found = False
import sys
print('1' if found else '0')
PY
}

# helper: check node version meets Vite requirement (20.19+ or 22.12+)
node_version_ok() {
  if ! command -v node >/dev/null 2>&1; then
    return 2
  fi
  ver=$(node -v 2>/dev/null | sed 's/^v//')
  IFS='.' read -r major minor patch <<-EOF
${ver}
EOF
  major=${major:-0}
  minor=${minor:-0}
  # Accept >=23.x, or 22.x where minor>=12, or 20.x where minor>=19
  if [ "$major" -ge 23 ]; then
    return 0
  fi
  if [ "$major" -eq 22 ] && [ "$minor" -ge 12 ]; then
    return 0
  fi
  if [ "$major" -eq 20 ] && [ "$minor" -ge 19 ]; then
    return 0
  fi
  return 1
}

## AUTO_INSTALL and CHECK_ONLY are set by the top-level parser
AUTO_INSTALL=${AUTO_INSTALL:-false}
CHECK_ONLY=${CHECK_ONLY:-false}

# Preflight checks
echo "Performing preflight checks..."

node_version_ok
node_ok=$?
if [ "$node_ok" -eq 2 ]; then
  echo "Node.js not found in PATH. Install Node >=20.19 or >=22.12 to run the frontend." >&2
  exit 2
elif [ "$node_ok" -ne 0 ]; then
  echo "Your Node.js version is too old for Vite. Please upgrade to Node 20.19+ or 22.12+." >&2
  echo "Suggested tools: nvm (https://github.com/nvm-sh/nvm) or Volta (https://volta.sh/)." >&2
  exit 2
fi

# Check uvicorn availability
UVICORN_OK=$(uvicorn_available | tr -d '\n')
if [ "$UVICORN_OK" != "1" ]; then
  if [ "$AUTO_INSTALL" = true ]; then
    echo "uvicorn not found. Attempting to install backend requirements into current Python environment..."
    python -m pip install -r "$ROOT_DIR/backend/requirements.txt"
    # re-check
    UVICORN_OK=$(uvicorn_available | tr -d '\n')
  else
    echo "uvicorn (FastAPI server) is not installed in the current Python environment." >&2
    echo "Either activate your backend virtualenv or install requirements:" >&2
    echo "  python -m pip install -r backend/requirements.txt" >&2
    echo "Or re-run with --auto-install to attempt automatic installation into the current Python." >&2
    exit 2
  fi
fi

if [ "$CHECK_ONLY" = true ]; then
  echo "Preflight checks passed. (check only mode)"
  exit 0
fi

# start backend
echo "Starting backend on port $BACKEND_PORT..."
cd "$ROOT_DIR/backend"
# Run uvicorn using current python interpreter; leave in background
python -m uvicorn src.main:app --reload --host 127.0.0.1 --port "$BACKEND_PORT" 2>&1 | prefix_output backend &
BACKEND_PID=$!

# start frontend
echo "Starting frontend (Vite) on port $FRONTEND_PORT..."
# go back to repo root to run npm with prefix
cd "$ROOT_DIR"
# pass PORT env var to Vite
PORT="$FRONTEND_PORT" npm --prefix frontend run dev 2>&1 | prefix_output frontend &
FRONTEND_PID=$!

# ensure cleanup on exit
cleanup() {
  echo "Stopping processes..."
  kill -TERM "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

# wait for both
wait "$FRONTEND_PID" "$BACKEND_PID"

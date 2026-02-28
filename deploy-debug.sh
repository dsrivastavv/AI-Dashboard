#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-debug.sh — spin up the full stack (Django API + React dev server)
# for local debugging. Assumes Python deps are installed and Node is available.
#
# Usage:
#   ./deploy-debug.sh                 # run migrations, start backend + frontend
#   BACKEND_PORT=9000 ./deploy-debug.sh
#   SKIP_MIGRATIONS=1 ./deploy-debug.sh
#
# Stops both processes when you Ctrl+C or the script exits.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONT_DIR="$ROOT_DIR/frontend"

# Load .env if present (optional)
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

export DJANGO_ENV="${DJANGO_ENV:-debug}"
export DJANGO_DEBUG="${DJANGO_DEBUG:-1}"
export FRONTEND_APP_URL="${FRONTEND_APP_URL:-http://127.0.0.1:3000}"
export BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
export BACKEND_PORT="${BACKEND_PORT:-8000}"
export SKIP_MIGRATIONS="${SKIP_MIGRATIONS:-0}"

command -v python >/dev/null 2>&1 || { echo "python not found" >&2; exit 1; }

if command -v corepack >/dev/null 2>&1; then
  NPM_CMD=(corepack npm)
elif command -v npm >/dev/null 2>&1; then
  NPM_CMD=(npm)
else
  echo "npm not found (install Node.js or enable corepack)" >&2
  exit 1
fi

echo "==> AI Dashboard debug stack"
echo "    Backend: http://${BACKEND_HOST}:${BACKEND_PORT} (DJANGO_ENV=${DJANGO_ENV})"
echo "    Frontend: ${FRONTEND_APP_URL} (Vite dev server)"

# ── Migrations (optional) ───────────────────────────────────────────────────
if [[ "$SKIP_MIGRATIONS" != "1" ]]; then
  echo "==> Running Django migrations..."
  (cd "$ROOT_DIR" && python manage.py migrate)
else
  echo "==> Skipping migrations (SKIP_MIGRATIONS=1)"
fi

# ── Start backend ───────────────────────────────────────────────────────────
echo "==> Starting Django runserver..."
(cd "$ROOT_DIR" && python manage.py runserver "${BACKEND_HOST}:${BACKEND_PORT}") &
BACK_PID=$!

# ── Start frontend ─────────────────────────────────────────────────────────-
echo "==> Starting Vite dev server..."
if [[ ! -d "$FRONT_DIR/node_modules" ]]; then
  echo "    Installing frontend dependencies..."
  (cd "$FRONT_DIR" && "${NPM_CMD[@]}" install --silent)
fi
(cd "$FRONT_DIR" && "${NPM_CMD[@]}" run dev -- --host 127.0.0.1 --port 3000) &
FRONT_PID=$!

cleanup() {
  echo "\nShutting down..."
  kill "$BACK_PID" "$FRONT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "\n✓ Debug stack running. Open http://127.0.0.1:3000/dashboard"
echo "  Backend logs: attached to this shell"
echo "  Frontend logs: attached to this shell"

wait -n "$BACK_PID" "$FRONT_PID"

#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# deploy.sh – Build and collect all assets for production deployment.
#
# Usage:
#   ./backend/deploy.sh           # full build
#   ./backend/deploy.sh --no-npm  # skip frontend build (backend only)
#
# Expects:
#   - Conda installed and `conda activate ai-dashboard` already active,
#     OR the CONDA_DEFAULT_ENV variable is set to 'ai-dashboard'.
#   - Node/npm available for frontend build.
#   - Environment variables loaded (e.g. via .env or system env).
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SKIP_NPM=false
for arg in "$@"; do
  [[ "$arg" == "--no-npm" ]] && SKIP_NPM=true
done

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$BACKEND_DIR/.." && pwd)"

echo "==> AI Dashboard – Production Build"
echo "    Backend: $BACKEND_DIR"
echo "    Repo: $REPO_DIR"

# ── 1. Ensure we are inside the correct conda environment ────────────────────
if [[ "${CONDA_DEFAULT_ENV:-}" != "ai-dashboard" ]]; then
  echo "    Activating conda environment 'ai-dashboard'..."
  # shellcheck disable=SC1091
  source "$(conda info --base)/etc/profile.d/conda.sh"
  conda activate ai-dashboard
fi
echo "    Python: $(python --version)  (env: ${CONDA_DEFAULT_ENV})"

# ── 2. Install/upgrade Python dependencies ───────────────────────────────────
echo "==> Installing Python dependencies..."
conda env update --file "$BACKEND_DIR/environment.yml" --prune -q

# ── 3. Build React frontend ───────────────────────────────────────────────────
if [[ "$SKIP_NPM" == "false" ]]; then
  echo "==> Building React frontend..."
  cd "$REPO_DIR/frontend"
  npm ci --silent
  npm run build
  cd "$REPO_DIR"
  echo "    Frontend built to frontend/dist/"
else
  echo "==> Skipping frontend build (--no-npm)"
fi

# ── 4. Django: run migrations ────────────────────────────────────────────────
echo "==> Running Django migrations..."
python "$BACKEND_DIR/manage.py" migrate --noinput

# ── 5. Django: collect static files ─────────────────────────────────────────
echo "==> Collecting static files..."
python "$BACKEND_DIR/manage.py" collectstatic --noinput --clear

echo ""
echo "✓ Build complete. Start the server with:"
echo "  gunicorn --chdir backend config.wsgi:application --bind 0.0.0.0:8000 --workers 3"
echo "  (or: honcho start / heroku local)"

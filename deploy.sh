#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# deploy.sh – Build and collect all assets for production deployment.
#
# Usage:
#   ./deploy.sh           # full build
#   ./deploy.sh --no-npm  # skip frontend build (backend only)
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

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> AI Dashboard – Production Build"
echo "    Root: $ROOT_DIR"

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
conda env update --file "$ROOT_DIR/environment.yml" --prune -q

# ── 3. Build React frontend ───────────────────────────────────────────────────
if [[ "$SKIP_NPM" == "false" ]]; then
  echo "==> Building React frontend..."
  cd "$ROOT_DIR/frontend"
  npm ci --silent
  npm run build
  cd "$ROOT_DIR"
  echo "    Frontend built to frontend/dist/"
else
  echo "==> Skipping frontend build (--no-npm)"
fi

# ── 4. Django: run migrations ────────────────────────────────────────────────
echo "==> Running Django migrations..."
python "$ROOT_DIR/manage.py" migrate --noinput

# ── 5. Django: collect static files ─────────────────────────────────────────
echo "==> Collecting static files..."
python "$ROOT_DIR/manage.py" collectstatic --noinput --clear

echo ""
echo "✓ Build complete. Start the server with:"
echo "  gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3"
echo "  (or: honcho start / heroku local)"

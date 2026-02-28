# AI Workload Dashboard

Multi-server AI training system health dashboard with:

- central Django webapp (API + auth + storage)
- pip-installable agent for each monitored server
- React frontend (`frontend/`) built with Vite + Bootstrap
- Google login with allowlisted users
- per-server CPU / GPU / memory / disk / network telemetry
- bottleneck heuristics and time-series charts

## Documentation

- `docs/README.md` (documentation index)
- `docs/ARCHITECTURE.md`
- `docs/WEBAPP_SETUP.md`
- `docs/AGENT_GUIDE.md`
- `docs/API_REFERENCE.md`
- `docs/OPERATIONS.md`

## Quick Start (Django Backend + React Frontend)

### Choose a mode

- Development (default): `DJANGO_ENV=debug` (enables Django debug, relaxed cookies)
- Production: `DJANGO_ENV=production` (requires `DJANGO_SECRET_KEY`, enables secure cookies/redirects/HSTS)

### Fast debug start (end-to-end)

```bash
# one-time: conda env
conda env create -f environment.yml
conda activate ai-dashboard

# load local creds (created by us):
cp .env.example .env   # if you need a template
source .env

# run full stack (Django + Vite dev server)
./deploy-debug.sh

# open
open http://127.0.0.1:3000/dashboard
```

`deploy-debug.sh` will run migrations (unless `SKIP_MIGRATIONS=1`), start `manage.py runserver` on `BACKEND_PORT` (default 8000) and Vite on port 3000. Stop with Ctrl+C.

## 1. Start the Django Backend (Central Host)

```bash
conda env create -f environment.yml
conda activate ai-dashboard

export DJANGO_ENV=debug  # or production
export DJANGO_SECRET_KEY='replace-me-in-production'
export GOOGLE_CLIENT_ID='YOUR_GOOGLE_WEB_APP_CLIENT_ID'
export GOOGLE_CLIENT_SECRET='YOUR_GOOGLE_WEB_APP_CLIENT_SECRET'
export GOOGLE_ALLOWED_EMAILS='you@gmail.com'
export FRONTEND_APP_URL='http://127.0.0.1:3000'
export VITE_LOG_LEVEL='debug'  # frontend console logs (debug/info/warn/error)
export AI_DASHBOARD_LOG_LEVEL='info'  # agent logs (set DEBUG to troubleshoot)

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## 2. Start the React Frontend (Vite + Bootstrap)

```bash
cd frontend
corepack npm install
corepack npm run dev
```

Notes:

- The React app is configured with a Vite proxy to `http://127.0.0.1:8000`
- Open `http://127.0.0.1:3000/dashboard`
- Add Google OAuth callback URI for React dev proxy:
  - `http://127.0.0.1:3000/accounts/google/login/callback/`
  - `http://localhost:3000/accounts/google/login/callback/`
- Django is backend-only; OAuth success/deny redirects are sent back to `FRONTEND_APP_URL`

## 3. Register a Monitored Server (Generates Ingest Token)

```bash
python3 manage.py register_server gpu-box-01 --name "GPU Box 01"
```

Save the printed `INGEST_TOKEN`.

## 4. Install and Run the Agent on the Remote Server

```bash
cd agent_service
conda env create -f environment.yml
conda activate ai-dashboard-agent
pip install .

ai-dashboard-agent \
  --host http://<webapp-host>:8000 \
  --server-slug gpu-box-01 \
  --token 'YOUR_INGEST_TOKEN' \
  --interval 2
```

## 5. Open the Dashboard

- `http://127.0.0.1:3000/dashboard` (React frontend)
- Sign in with an allowlisted Google account
- Select a server from the dropdown

## Optional: Local Collector (Single-Host Mode)

You can still collect metrics directly on the Django host (backend machine):

```bash
python3 manage.py collect_metrics --interval 2
```

This stores metrics under a `local` monitored server entry.

## Common Commands

```bash
# Create / update conda environments
conda env create -f environment.yml
conda env update -f environment.yml --prune

# Register a server
python3 manage.py register_server gpu-box-01 --name "GPU Box 01"

# Rotate a server ingest token
python3 manage.py register_server gpu-box-01 --rotate-token

# Local one-shot sample (debug)
python3 manage.py collect_metrics --once

# Agent one-shot send (debug)
ai-dashboard-agent --host http://127.0.0.1:8000 --server-slug gpu-box-01 --token '...' --once
```

## Key Features

- Multi-server selector in dashboard UI
- React + Bootstrap dashboard interface
- Persistent time-series metrics
- Per-GPU and per-disk breakdowns
- GPU/CPU/IO bottleneck heuristics
- Google OAuth login + allowlist controls
- Token-authenticated remote ingest API

## Important Notes

- Use `django-allauth[socialaccount]` (already pinned in `requirements.txt`)
- Configure Google OAuth redirect URI:
  - `http://127.0.0.1:8000/accounts/google/login/callback/`
  - `http://localhost:8000/accounts/google/login/callback/`
- If using the React dev server proxy, also add:
  - `http://127.0.0.1:3000/accounts/google/login/callback/`
  - `http://localhost:3000/accounts/google/login/callback/`
- Do not commit secrets (Google client secret, ingest tokens)
- Backend root (`http://127.0.0.1:8000/`) returns JSON metadata; Django is backend-only

# AI Workload Dashboard

Multi-server AI training system health dashboard with:

- central Django webapp (dashboard + storage + ingest API)
- pip-installable agent for each monitored server
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

## Quick Start (Multi-Server)

## 1. Start the Webapp (Central Host)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export GOOGLE_CLIENT_ID='YOUR_GOOGLE_WEB_APP_CLIENT_ID'
export GOOGLE_CLIENT_SECRET='YOUR_GOOGLE_WEB_APP_CLIENT_SECRET'
export GOOGLE_ALLOWED_EMAILS='you@gmail.com'

python3 manage.py migrate
python3 manage.py runserver 0.0.0.0:8000
```

## 2. Register a Monitored Server (Generates Ingest Token)

```bash
python3 manage.py register_server gpu-box-01 --name "GPU Box 01"
```

Save the printed `INGEST_TOKEN`.

## 3. Install and Run the Agent on the Remote Server

```bash
cd agent_service
python3 -m venv .venv
source .venv/bin/activate
pip install .

ai-dashboard-agent \
  --host http://<webapp-host>:8000 \
  --server-slug gpu-box-01 \
  --token 'YOUR_INGEST_TOKEN' \
  --interval 2
```

## 4. Open the Dashboard

- `http://127.0.0.1:8000/`
- Sign in with an allowlisted Google account
- Select a server from the dropdown

## Optional: Local Collector (Single-Host Mode)

You can still collect metrics directly on the Django host:

```bash
python3 manage.py collect_metrics --interval 2
```

This stores metrics under a `local` monitored server entry.

## Common Commands

```bash
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
- Do not commit secrets (Google client secret, ingest tokens)


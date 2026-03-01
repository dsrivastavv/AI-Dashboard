# Webapp Setup (Central Dashboard)

This guide covers setting up the Django webapp that:

- receives metric samples from agents
- stores snapshots for multiple servers
- serves auth and JSON APIs for the dashboard UI

The dashboard frontend is now the React app in `frontend/` (Vite + Bootstrap).

All Django/backend commands in this doc should be run from `backend/` unless noted otherwise.

## Prerequisites

- Python 3.10+ (tested with Python 3.13)
- Network reachability from agents to the webapp host
- Google Cloud project (for Google OAuth login)

Optional but recommended for production:

- reverse proxy (Nginx / Caddy / Traefik)
- HTTPS termination
- PostgreSQL (instead of SQLite) for larger deployments

## 1. Install

```bash
git clone <your-repo-url> ai_dashboard
cd ai_dashboard

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Configure Environment Variables

At minimum:

```bash
export DJANGO_ENV=debug  # use production in real deployments
export DJANGO_SECRET_KEY='set-a-strong-secret-when-production'
export GOOGLE_CLIENT_ID='...apps.googleusercontent.com'
export GOOGLE_CLIENT_SECRET='GOCSPX-...'
export GOOGLE_ALLOWED_EMAILS='you@gmail.com,teammate@ucsd.edu'
```

Common optional settings:

```bash
export GOOGLE_ALLOWED_DOMAINS='yourcompany.com'
export DJANGO_ALLOWED_HOSTS='127.0.0.1,localhost,dashboard.internal'
export DJANGO_CSRF_TRUSTED_ORIGINS='https://dashboard.example.com,https://dashboard.internal'
export DJANGO_SECURE_BEHIND_PROXY='1'   # set if SSL is terminated by a proxy
export DJANGO_SECURE_SSL_REDIRECT='1'    # forces HTTPS (default when DJANGO_ENV=production)
export MONITORING_RETENTION_DAYS='14'
export MONITORING_DEFAULT_HISTORY_MINUTES='60'
export MONITORING_MAX_HISTORY_MINUTES='1440'
export VITE_LOG_LEVEL='info'             # frontend console log level (debug/info/warn/error)
export AI_DASHBOARD_LOG_LEVEL='info'     # agent log level (DEBUG recommended when diagnosing)
```

## 3. Google OAuth Setup (Required for Dashboard Login)

The dashboard UI requires Google login, and only allowlisted users can access it.

### Google Cloud Console Steps

1. Open Google Cloud Console
2. Create/select a project
3. Configure the OAuth consent screen
4. Create OAuth credentials
   - Type: `Web application`
5. Add authorized origins and redirect URIs

### Local Development URIs

Authorized JavaScript origins:

- `http://127.0.0.1:8000`
- `http://localhost:8000`

Authorized redirect URIs:

- `http://127.0.0.1:8000/accounts/google/login/callback/`
- `http://localhost:8000/accounts/google/login/callback/`

### Production URIs (Example)

If your dashboard is hosted at `https://dashboard.example.com`:

Authorized origin:

- `https://dashboard.example.com`

Authorized redirect URI:

- `https://dashboard.example.com/accounts/google/login/callback/`

## 4. Initialize Database

```bash
python3 manage.py migrate
```

## 5. Start the Django Backend

Development:

```bash
python3 manage.py runserver 0.0.0.0:8000
```

Then open:

- `http://127.0.0.1:8000/` (backend JSON metadata)
- React UI is typically run separately on `http://127.0.0.1:3000/dashboard`

## 6. Register Monitored Servers (Create Ingest Tokens)

Each remote agent needs a matching `MonitoredServer` entry and token.

### Create a New Server Entry

```bash
python3 manage.py register_server gpu-box-01 --name "GPU Box 01"
```

Example output:

```text
Server created: GPU Box 01 (gpu-box-01)
...
INGEST_TOKEN=...
```

Save the token immediately. The plaintext token is not stored and is not shown again.

### Rotate a Token

```bash
python3 manage.py register_server gpu-box-01 --rotate-token
```

### Add Metadata

```bash
python3 manage.py register_server gpu-box-02 \
  --name "GPU Box 02" \
  --hostname train02 \
  --description "8xA100 trainer"
```

## 7. Dashboard Access Model

- All dashboard endpoints require login
- Login uses Google OAuth (`django-allauth`)
- After login, user email/domain is checked against allowlists
- Non-allowlisted users are redirected to `access-denied`

## 8. React Frontend (Vite + Bootstrap)

From the project root:

```bash
cd frontend
corepack npm install
corepack npm run dev
```

Open:

- `http://127.0.0.1:3000/dashboard`

The React app is configured with a Vite proxy to `http://127.0.0.1:8000`, so it can reuse Django auth and API endpoints in development.

If using Google login through the React dev server proxy, add these callback URIs in Google Cloud Console too:

- `http://127.0.0.1:3000/accounts/google/login/callback/`
- `http://localhost:3000/accounts/google/login/callback/`

## 9. Local Collector (Optional)

If you also want to collect metrics directly on the webapp machine:

```bash
python3 manage.py collect_metrics --interval 2
```

This writes to a `MonitoredServer` with slug `local` by default.

Override local server identity:

```bash
export MONITORING_LOCAL_SERVER_SLUG='dashboard-host'
export MONITORING_LOCAL_SERVER_NAME='Dashboard Host'
python3 manage.py collect_metrics --interval 2
```

## 10. Production Deployment Notes

- Set `DJANGO_ENV=production` and a non-default `DJANGO_SECRET_KEY`
- Configure `DJANGO_ALLOWED_HOSTS` and (if applicable) `DJANGO_CSRF_TRUSTED_ORIGINS`
- HTTPS: enable `DJANGO_SECURE_SSL_REDIRECT=1` (default in production) and set `DJANGO_SECURE_BEHIND_PROXY=1` when behind a TLS-terminating proxy
- Logging: Django logs to stdout (DEBUG when `DJANGO_DEBUG=1`, else INFO); frontend logging level uses `VITE_LOG_LEVEL`; agent logging uses `AI_DASHBOARD_LOG_LEVEL` or `--log-level`.

## Reverse Proxy

If you deploy behind a reverse proxy:

- ensure `/api/ingest/` is reachable from agents
- preserve request bodies and headers
- if using TLS termination, run agents with `https://...`

## Database

SQLite is fine for low-to-medium volume, but move to PostgreSQL if:

- many servers are reporting frequently
- you need concurrent writes/read scalability
- you want safer backups/replication

## Retention

Retention cleanup runs during ingest/collection when samples are stored.

- Configure with `MONITORING_RETENTION_DAYS`
- Old snapshots are deleted per server

## 11. Security Checklist

- Do not commit secrets (`GOOGLE_CLIENT_SECRET`, ingest tokens)
- Use HTTPS in production
- Restrict `DJANGO_ALLOWED_HOSTS`
- Keep `GOOGLE_ALLOWED_EMAILS`/`GOOGLE_ALLOWED_DOMAINS` minimal
- Rotate ingest tokens for decommissioned servers
- Disable servers (`is_active=False`) to stop ingest without deleting history

## 12. Validation Commands

```bash
python3 manage.py check
python3 manage.py migrate
python3 manage.py register_server test-node --name "Test Node"
```

## 13. Common Startup Errors

### `Missing required parameter: client_id`

Cause: `GOOGLE_CLIENT_ID` is empty in the terminal running `runserver`.

Fix:

```bash
export GOOGLE_CLIENT_ID='...'
export GOOGLE_CLIENT_SECRET='...'
python3 manage.py runserver 0.0.0.0:8000
```

### `ModuleNotFoundError: No module named 'allauth'`

Cause: dependencies not installed in the active virtualenv.

Fix:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### `ModuleNotFoundError: No module named 'requests'` when starting Django

Cause: `django-allauth` was installed without socialaccount extras.

Fix: use the project requirements (which includes `django-allauth[socialaccount]`):

```bash
pip install -r requirements.txt
```

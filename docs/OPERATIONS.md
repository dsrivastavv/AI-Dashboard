# Operations, Maintenance, and Troubleshooting

This document focuses on day-2 operations after initial deployment.

All Django/backend commands in this doc should be run from `backend/` unless noted otherwise.

## Routine Operations

## Register a New Server

```bash
python3 manage.py register_server gpu-box-03 --name "GPU Box 03" --hostname train03
```

Distribute the printed `INGEST_TOKEN` securely to the corresponding host.

## Rotate a Server Token

Rotate if:

- a token is leaked
- a machine is reprovisioned
- an admin/user who had access is offboarded

```bash
python3 manage.py register_server gpu-box-03 --rotate-token
```

Update the agent configuration on that server and restart it.

## Disable a Server Without Deleting History

Use Django admin (`MonitoredServer.is_active = False`).

Effects:

- agent ingest is denied (`403`)
- historical snapshots remain visible

## Re-enable a Server

Set `is_active = True` in Django admin.

## Monitor Agent Liveness

The webapp tracks:

- `last_seen_at`
- `last_ip`
- `last_agent_version`
- `agent_info`

Use these fields to detect stale or misconfigured agents.

## Data Retention and Storage

Retention is controlled by:

- `MONITORING_RETENTION_DAYS` (default `14`)

Cleanup happens during sample writes (remote ingest or local collector). Old snapshots are deleted per server.

## Storage Planning

Storage grows with:

- number of servers
- sampling frequency
- number of GPUs per server
- number of tracked disks per server

To reduce storage growth:

- increase agent interval (e.g. `5s` instead of `2s`)
- reduce tracked disks using `--disks`
- shorten retention

## Backups

### SQLite (Current Default)

Back up:

- `db.sqlite3`

Best practice:

- stop writes briefly (or snapshot filesystem) for clean backups

### PostgreSQL (If You Migrate)

Use your normal `pg_dump` / managed backup flow.

## Upgrades

## Webapp Upgrade

1. Pull code updates
2. Activate venv
3. `pip install -r requirements.txt`
4. `python manage.py migrate`
5. Restart Django process

## Agent Upgrade

1. Install the newer Debian package version (`apt install ./ai-dashboard-agent_*_all.deb` or `apt upgrade ai-dashboard-agent`)
2. Verify `/etc/ai-dashboard-agent/agent.conf` values
3. Restart the agent process / systemd service (`systemctl restart ai-dashboard-agent`)

## Local Collector vs Remote Agent

You can run both:

- remote agents for compute servers
- local collector for the dashboard host itself

The local collector writes under the `local` server slug (or your override).

## Legacy Data Migration (Pre Multi-Server Split)

Older snapshots created before the `MonitoredServer` model may have `server=NULL`.

Current dashboard endpoints only return per-server snapshots. If you want old data visible in the dashboard:

- write a one-time migration/backfill script to attach old rows to a chosen server
- or keep them for historical reference only

## Troubleshooting

## Authentication / Login

### `Missing required parameter: client_id` (Google login)

Cause:

- `GOOGLE_CLIENT_ID` is not set in the terminal/process running Django

Fix:

```bash
export GOOGLE_CLIENT_ID='...'
export GOOGLE_CLIENT_SECRET='...'
python3 manage.py runserver 0.0.0.0:8000
```

### Logged in but redirected to Access Denied

Cause:

- email/domain not in allowlist

Fix:

- add user email to `GOOGLE_ALLOWED_EMAILS`
- or add domain to `GOOGLE_ALLOWED_DOMAINS`
- restart Django process after updating env vars

## Dependency Errors

### `ModuleNotFoundError: No module named 'allauth'`

Cause:

- webapp venv missing dependencies

Fix:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### `ModuleNotFoundError: No module named 'requests'` when starting Django

Cause:

- `django-allauth` installed without `socialaccount` extras

Fix:

```bash
pip install -r requirements.txt
```

(`requirements.txt` uses `django-allauth[socialaccount]`)

## Agent Ingest Issues

### `401 Invalid ingest token`

Cause:

- wrong token
- token rotated and agent still using old token

Fix:

- rotate token intentionally, update agent, restart agent

### `403 Server is disabled`

Cause:

- `MonitoredServer.is_active=False`

Fix:

- re-enable the server in admin

### `404` on ingest URL

Cause:

- wrong `--host`
- wrong `--server-slug`
- reverse proxy route missing

## Metrics / Data Issues

### Server appears in selector but shows no data

Cause:

- server is registered but no successful ingest yet

Checks:

- run agent with `--once`
- inspect webapp logs / network reachability
- verify token and slug

### GPU metrics missing

Checks:

- `nvidia-smi` works on agent host
- NVIDIA drivers installed
- agent process has access to GPU/NVML

### Disk utilization always zero

Possible causes:

- first sample after startup (no previous counters to diff)
- wrong disk names in `--disks`
- platform counters missing `busy_time`

## Observability of the Monitoring Stack

Recommended additions (future):

- webapp health endpoint
- ingest error counters
- stale server alerting based on `last_seen_at`
- agent systemd watchdog / metrics

## Security Practices

- Do not store secrets in repo files (tokens, client secrets)
- Prefer environment variables or secret managers
- Use HTTPS for webapp and ingest traffic
- Restrict inbound access to dashboard and ingest endpoints as appropriate
- Rotate tokens on decommission or incident response

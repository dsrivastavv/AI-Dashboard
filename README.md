# AI Workload System Health Dashboard (Django)

A Django dashboard for monitoring AI training system health with persistent metrics and time-series charts.

## What it tracks

- CPU usage, load average, CPU iowait
- GPU utilization, GPU memory usage, temperature, power (via NVML / `nvidia-smi`)
- RAM and swap usage
- Per-disk I/O throughput, IOPS, and utilization (great for NVMe dataset loaders)
- Network throughput
- Simple bottleneck classification (`gpu-bound`, `cpu-bound`, `io-bound`, `memory-pressure`, etc.)

## Open-source tools used

- Django (web app + persistence)
- psutil (CPU / memory / disk / network telemetry)
- NVIDIA NVML (`nvidia-ml-py`) with `nvidia-smi` fallback for GPU telemetry
- Chart.js (time-series charts)

## Quick Start

1. Install dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Initialize the database

```bash
python3 manage.py migrate
```

3. Configure Google OAuth and allowlisted users (required for dashboard access)

```bash
export GOOGLE_CLIENT_ID='your-google-oauth-client-id'
export GOOGLE_CLIENT_SECRET='your-google-oauth-client-secret'
export GOOGLE_ALLOWED_EMAILS='you@gmail.com,teammate@gmail.com'
# Optional: allow an entire Google Workspace domain
# export GOOGLE_ALLOWED_DOMAINS='example.com'
```

Google OAuth redirect URI to add in Google Cloud Console:

```text
http://127.0.0.1:8000/accounts/google/login/callback/
```

4. Start the collector (recommended in a separate terminal)

```bash
python3 manage.py collect_metrics --interval 2
```

5. Start Django

```bash
python3 manage.py runserver 0.0.0.0:8000
```

6. Open `http://127.0.0.1:8000/` and sign in with Google

## Important Environment Variables

- `MONITORING_DISKS`
  - Comma-separated block devices to track (recommended for your NVMe drives)
  - Example: `MONITORING_DISKS=nvme0n1,nvme1n1`
- `MONITORING_RETENTION_DAYS`
  - How long to keep historical samples in SQLite (default: `14`)
- `MONITORING_DEFAULT_HISTORY_MINUTES`
  - Default dashboard chart window (default: `60`)
- `MONITORING_MAX_HISTORY_MINUTES`
  - Max API history window (default: `1440`)
- `DJANGO_ALLOWED_HOSTS`
  - Optional override for host allowlist
- `GOOGLE_CLIENT_ID`
  - Google OAuth web app client ID
- `GOOGLE_CLIENT_SECRET`
  - Google OAuth web app client secret
- `GOOGLE_ALLOWED_EMAILS`
  - Comma-separated allowlist of specific Google users (recommended)
- `GOOGLE_ALLOWED_DOMAINS`
  - Optional domain allowlist (e.g. `yourcompany.com`)

## Notes

- If no samples exist, the `latest` API will auto-collect one sample so the dashboard can render.
- For continuous history, keep `collect_metrics` running (or run it from systemd/cron).
- GPU telemetry requires NVIDIA drivers and either NVML access or `nvidia-smi` available in `PATH`.
- Dashboard/API access is login-protected and restricted to the Google allowlist.
- The bottleneck status is a heuristic, not a profiler. It is meant to quickly highlight likely constraints.

## Useful Commands

```bash
# One-shot sample
python3 manage.py collect_metrics --once

# Faster sampling (more DB writes)
python3 manage.py collect_metrics --interval 1

# Override retention for this collector process
python3 manage.py collect_metrics --interval 2 --retention-days 7
```

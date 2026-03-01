# Agent Guide (Remote Monitoring Service)

This guide covers installing and running the monitoring agent on Linux and macOS.

## What the Agent Does

- Collects local system metrics (CPU, RAM, disk counters, network counters, GPU metrics)
- Sends them to the central webapp ingest API
- Does not require Django on the monitored server

The agent package lives in `agent_service/` and installs a CLI:

- `ai-dashboard-agent`

## Install

### Recommended: Install As a Boot-Time Service (Linux + macOS)

Linux:

```bash
cd agent_service
./build-deb.sh
sudo apt install ../ai-dashboard-agent_*_all.deb
sudo AI_DASHBOARD_HOST=https://dash.example.com \
     AI_DASHBOARD_USERNAME='<DASHBOARD_USERNAME>' \
     AI_DASHBOARD_PASSWORD='<DASHBOARD_PASSWORD>' \
     bash ./install.sh
```

macOS:

```bash
cd agent_service
conda env create -f environment.yml
conda activate ai-dashboard-agent
sudo AI_DASHBOARD_PYTHON="$(which python3)" \
     AI_DASHBOARD_HOST=https://dash.example.com \
     AI_DASHBOARD_USERNAME='<DASHBOARD_USERNAME>' \
     AI_DASHBOARD_PASSWORD='<DASHBOARD_PASSWORD>' \
     bash ./install.sh
```

Status / restart:

```bash
# Linux
sudo systemctl status ai-dashboard-agent
sudo systemctl restart ai-dashboard-agent

# macOS
sudo launchctl print system/com.ai-dashboard.agent
sudo launchctl kickstart -k system/com.ai-dashboard.agent
```

### Option A (Linux): Install From a Built `.deb` (Recommended)

```bash
# regular account
sudo apt install ./ai-dashboard-agent_*_all.deb

# if already root
apt install ./ai-dashboard-agent_*_all.deb
```

### Option B (Linux): Build and Install Debian Package From This Repository

```bash
cd agent_service
./build-deb.sh

# regular account
sudo apt install ../ai-dashboard-agent_*_all.deb

# if already root
apt install ../ai-dashboard-agent_*_all.deb
```

### Option C (macOS or Linux): Run From Source Without pip Install

```bash
cd agent_service
conda env create -f environment.yml
conda activate ai-dashboard-agent
chmod +x ./run-agent.sh
./run-agent.sh --help
```

## Required Inputs

You need three values from the webapp:

- `--host`: base URL of the Django webapp (e.g. `http://dashboard-host:8000`)
- `--server-slug`: the registered server slug (`register_server`)
- `--token`: ingest token printed by `register_server`

## Basic Usage

```bash
ai-dashboard-agent \
  --host http://dashboard-host:8000 \
  --server-slug gpu-box-01 \
  --token 'YOUR_INGEST_TOKEN' \
  --interval 2
```

If you are running directly from source (Option C), replace `ai-dashboard-agent`
with `./run-agent.sh`.

## CLI Options

## Connection / Identity

- `--host`
  - Webapp base URL
  - Example: `http://dashboard-host:8000`
- `--server-slug`
  - Registered server slug in Django
- `--token`
  - Ingest token for that server
- `--hostname`
  - Override hostname metadata sent to webapp

## Sampling / Timing

- `--interval`
  - Send interval in seconds (minimum enforced to `0.5`)
  - Default: `2`
- `--cpu-sample-interval`
  - CPU sampling interval used internally by `psutil.cpu_percent`
  - Default: `0.2`
- `--timeout`
  - HTTP request timeout in seconds
  - Default: `5`
- `--once`
  - Collect and send a single sample, then exit

## Disk Filtering

- `--disks`
  - Comma-separated block device names (recommended for dataset NVMe drives)
  - Example: `--disks nvme0n1,nvme1n1`

If omitted, the agent auto-detects common physical disks (e.g., `nvme*`, `sd*`, `vd*`).

## Logging / TLS

- `--quiet`
  - Suppress routine stdout logging
- `--insecure`
  - Disable TLS certificate verification (use only for testing)
- `--log-level`
  - One of `DEBUG, INFO, WARNING, ERROR, CRITICAL`
  - Default: `INFO` (or `WARNING` when `--quiet`)
- Env alternative: `AI_DASHBOARD_LOG_LEVEL=DEBUG` (useful for diagnosing connectivity issues)

## Metadata Labels

- `--label key=value` (repeatable)
  - Sends extra agent metadata for debugging/organization
  - Example:
    ```bash
    --label rack=r1 --label role=trainer --label cluster=lab-a
    ```

## Environment Variable Alternative

You can set defaults via environment variables:

```bash
export AI_DASHBOARD_HOST='http://dashboard-host:8000'
export AI_DASHBOARD_SERVER_SLUG='gpu-box-01'
export AI_DASHBOARD_TOKEN='YOUR_INGEST_TOKEN'
export AI_DASHBOARD_INTERVAL='2'
export AI_DASHBOARD_DISKS='nvme0n1,nvme1n1'

ai-dashboard-agent
```

## Example Commands

## Test a Single Send

```bash
ai-dashboard-agent \
  --host http://dashboard-host:8000 \
  --server-slug gpu-box-01 \
  --token 'YOUR_INGEST_TOKEN' \
  --once
```

## Production-ish Run With Disk Filter

```bash
ai-dashboard-agent \
  --host https://dashboard.example.com \
  --server-slug trainer-a100-01 \
  --token 'YOUR_INGEST_TOKEN' \
  --interval 2 \
  --disks nvme0n1,nvme1n1 \
  --label rack=r1 \
  --label role=trainer
```

## systemd Service Example

Create `/etc/systemd/system/ai-dashboard-agent.service`:

```ini
[Unit]
Description=AI Dashboard Monitoring Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
Environment="AI_DASHBOARD_HOST=https://dashboard.example.com"
Environment="AI_DASHBOARD_SERVER_SLUG=gpu-box-01"
Environment="AI_DASHBOARD_TOKEN=REPLACE_ME"
Environment="AI_DASHBOARD_INTERVAL=2"
ExecStart=/usr/bin/ai-dashboard-agent --disks nvme0n1,nvme1n1
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ai-dashboard-agent
sudo systemctl status ai-dashboard-agent
```

## GPU Collection Behavior

The agent tries GPU telemetry in this order:

1. NVML (`nvidia-ml-py` / `pynvml` import path)
2. `nvidia-smi` CSV parsing fallback

`nvidia-ml-py` is optional for runtime portability; if it is not installed, the
agent automatically falls back to `nvidia-smi`.

If neither works, GPU list is empty and the dashboard classifies bottlenecks without GPU data.

## Disk Metrics Behavior

The agent sends cumulative disk counters:

- `read_bytes_total`
- `write_bytes_total`
- `read_count_total`
- `write_count_total`
- `busy_time_ms_total`

The webapp computes per-interval rates and utilization based on the previous snapshot for the same server.

## Troubleshooting

### `401 Invalid ingest token`

- Wrong token
- Token rotated on webapp side
- Token copied with extra whitespace

Fix:

- Re-run `register_server <slug> --rotate-token`
- Update agent token

### `404` ingest endpoint

- Wrong `--host`
- Wrong `--server-slug`
- Reverse proxy not forwarding `/api/ingest/`

### TLS / certificate errors

- Use valid HTTPS certs in production
- For testing only, use `--insecure`

### No GPU metrics appear

- Confirm `nvidia-smi` works on the host
- Ensure NVIDIA drivers are installed
- Ensure the agent environment can access NVML

### Disk metrics are missing

- Check `--disks` names match actual block device names (`lsblk`)
- If auto-detecting, ensure devices look like physical disks (`nvme*`, `sd*`, `vd*`)

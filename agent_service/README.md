# AI Dashboard Agent

Lightweight system metrics agent that collects CPU/GPU/memory/disk/network telemetry and posts it to the central Django dashboard.

For full setup, systemd deployment, CLI options, and troubleshooting, see:

- `../docs/AGENT_GUIDE.md`
- `../docs/API_REFERENCE.md`

## Install (apt / .deb)

Linux only:

Build from this repository:

```bash
cd agent_service
./build-deb.sh
```

Install the generated package:

```bash
# regular account
sudo apt install ../ai-dashboard-agent_*_all.deb

# if already root
apt install ../ai-dashboard-agent_*_all.deb
```

Configure + install service (auto-start on boot):

```bash
sudo AI_DASHBOARD_HOST=https://dash.example.com \
     AI_DASHBOARD_USERNAME='<DASHBOARD_USERNAME>' \
     AI_DASHBOARD_PASSWORD='<DASHBOARD_PASSWORD>' \
     bash ./install.sh
```

`install.sh` enables and starts the service.

## macOS / cross-platform run (no pip)

Use a Python environment with dependencies installed (for example Conda using
`environment.yml`), then run directly from source:

```bash
cd agent_service
conda env create -f environment.yml
conda activate ai-dashboard-agent
chmod +x ./run-agent.sh
./run-agent.sh --help
```

`nvidia-ml-py` is optional. If unavailable, the agent will use `nvidia-smi`
fallback for GPU metrics.

## macOS service (auto-start on boot)

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

## Root vs normal-user behavior

- Running as `root` (for example via `sudo` or systemd):
  - default config: `/etc/ai-dashboard-agent/agent.conf`
  - default state: `/var/lib/ai-dashboard-agent/state.json`
- Running as a normal user:
  - default config: `~/.config/ai-dashboard-agent/agent.conf`
  - default state: `~/.local/share/ai-dashboard-agent/state.json`

## Run

```bash
ai-dashboard-agent \
  --host http://dashboard-host:8000 \
  --server-slug gpu-box-01 \
  --token 'YOUR_INGEST_TOKEN' \
  --interval 2
```

Optional disk filter:

```bash
ai-dashboard-agent ... --disks nvme0n1,nvme1n1
```

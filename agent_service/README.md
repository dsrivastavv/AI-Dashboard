# AI Dashboard Agent

Lightweight system metrics agent that collects CPU/GPU/memory/disk/network telemetry and posts it to the central Django dashboard.

For full setup, systemd deployment, CLI options, and troubleshooting, see:

- `../docs/AGENT_GUIDE.md`
- `../docs/API_REFERENCE.md`

## Install

```bash
pip install .
```

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

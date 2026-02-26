# Documentation Index

This project has two deployable parts:

1. `Webapp Backend` (Django): auth + ingest API + storage
2. `Agent` (pip-installable): runs on each monitored server and sends metrics to the webapp
3. `Frontend UI` (React + Bootstrap in `frontend/`): dashboard experience that consumes the Django APIs

## Read This First

- `README.md`: fast quickstart + common commands
- `docs/ARCHITECTURE.md`: end-to-end system design and data flow
- `docs/WEBAPP_SETUP.md`: production/dev setup for the Django webapp
- `frontend/`: Vite React frontend package
- `docs/AGENT_GUIDE.md`: install and run the remote monitoring agent
- `docs/API_REFERENCE.md`: ingest and dashboard API contract
- `docs/OPERATIONS.md`: token rotation, maintenance, troubleshooting, and upgrades

## Recommended Reading Paths

### I only want to try it locally

1. `README.md`
2. `docs/WEBAPP_SETUP.md`
3. `docs/AGENT_GUIDE.md`

### I want to deploy this on multiple GPU servers

1. `docs/ARCHITECTURE.md`
2. `docs/WEBAPP_SETUP.md`
3. `docs/AGENT_GUIDE.md`
4. `docs/OPERATIONS.md`

### I want to integrate a custom agent or another sender

1. `docs/API_REFERENCE.md`
2. `docs/ARCHITECTURE.md`

## Glossary

- `MonitoredServer`: registry record for a remote host (server slug + ingest token hash)
- `MetricSnapshot`: one timestamped rollup record for a single server
- `GpuMetric`: per-GPU row attached to a snapshot
- `DiskMetric`: per-disk row attached to a snapshot
- `Ingest Token`: secret used by agents to authenticate metric posts
- `Allowlist`: Google email/domain list allowed to log into the dashboard

# Architecture

Backend command examples assume you are in `backend/`.

## Overview

The system is split into:

1. A central Django webapp that stores metrics and serves auth + APIs
2. A lightweight agent that runs on each monitored host and pushes raw counters/telemetry to the webapp
3. A React frontend (Vite + Bootstrap) that renders the dashboard UI using the Django APIs

The webapp supports multiple servers and the dashboard can switch between them using a selector.

## Why This Split

This design solves the main scaling and usability problems of a single-host dashboard:

- You can monitor many training machines from one UI
- GPU servers do not need the Django app stack installed
- Metric persistence and rate computation are centralized
- Access control is centralized (Google login + allowlist)
- Agents can be deployed independently (Linux via `apt`, macOS via source runner)

## Component Diagram (Logical)

1. `Agent` on each server
   - Collects CPU, memory, disk, network, GPU metrics locally
   - Sends JSON payloads to the webapp ingest endpoint
2. `Django Webapp`
   - Authenticates dashboard users via Google OAuth (`django-allauth`)
   - Authenticates agents with per-server ingest token
   - Stores snapshots and child rows in SQLite (or another Django DB backend)
   - Computes rates and bottleneck heuristics on ingest
3. `Browser Dashboard (React + Bootstrap)`
   - Calls authenticated JSON APIs
   - Uses a server selector to switch hosts
   - Displays cards, charts, tables, and bottleneck labels

## Data Flow

### Remote Agent Flow

1. Admin registers a server in Django (`register_server` command)
2. Django stores a `MonitoredServer` record with a hashed ingest token
3. Agent collects local metrics
4. Agent sends `POST /api/ingest/servers/<slug>/metrics/` with token
5. Django validates token and server status
6. Django computes:
   - interval from previous snapshot for the same server
   - disk throughput / IOPS / utilization from disk counters
   - network throughput from byte counters
   - aggregate GPU and disk rollups
   - bottleneck heuristic classification
7. Dashboard APIs return current and historical data filtered by server

### Local Collector (Optional)

`python manage.py collect_metrics` still works and stores metrics under a local `MonitoredServer` entry (default slug `local`). This is useful for:

- quick testing
- single-host deployments
- migration from the original single-node design

## Security Model

### Dashboard Access (Human Users)

- Google OAuth login via `django-allauth`
- Access restricted to configured allowlist:
  - `GOOGLE_ALLOWED_EMAILS`
  - `GOOGLE_ALLOWED_DOMAINS` (optional)

### Ingest Access (Agents)

- Per-server shared secret token
- Token is stored hashed (`sha256`) in `MonitoredServer.api_token_hash`
- Agent sends token via:
  - `X-Monitoring-Token` header (preferred)
  - or `Authorization: Bearer <token>`

This separation avoids mixing UI auth and agent auth.

## Core Data Model

## `MonitoredServer`

Represents a host (physical/virtual machine) being monitored.

Key fields:

- `slug`: stable identifier used by agents and dashboard APIs
- `name`: human-friendly display name
- `hostname`: optional host metadata (often updated by agent)
- `api_token_hash`: hash of the ingest token
- `is_active`: if false, ingest is denied
- `last_seen_at`, `last_ip`, `last_agent_version`, `agent_info`: operational metadata

## `MetricSnapshot`

One aggregated sample for a specific server at a specific time.

Contains:

- CPU metrics
- memory/swap metrics
- disk and network rollups (rates/utilization)
- GPU rollups (max/avg util, memory)
- bottleneck heuristic result

## `GpuMetric`

Per-GPU metrics attached to a snapshot.

Contains:

- GPU utilization
- memory utilization and absolute memory values
- temperature and power

## `DiskMetric`

Per-disk metrics attached to a snapshot.

Stores both:

- cumulative counters from agent (`read_bytes_total`, etc.)
- server-computed rates (`read_bps`, `write_bps`, `IOPS`, utilization)

## Why Rates Are Computed on the Webapp

Agents send raw counters, not precomputed rates. This is intentional:

- rate derivation remains consistent across all agents
- agents stay simple
- dashboard can trust a single computation pipeline
- server can use the previous snapshot for the same `MonitoredServer`

This is especially important for:

- disk throughput / IOPS
- disk utilization (busy time deltas)
- network throughput

## Bottleneck Heuristics

Bottleneck labels are heuristic classifications based on a combination of:

- GPU utilization
- CPU utilization
- CPU iowait
- disk utilization
- memory/swap pressure

Possible labels include:

- `gpu-bound`
- `cpu-bound`
- `io-bound`
- `memory-pressure`
- `balanced`
- `idle`
- `underutilized`
- `mixed-*`

These labels are meant for triage, not precise profiling. Use PyTorch profiler / Nsight / dataloader tracing for root cause analysis.

## Frontend Model (Dashboard)

The dashboard pulls:

- `GET /api/servers/` for the server selector
- `GET /api/metrics/latest/?server=<slug>` for cards/tables/status
- `GET /api/metrics/history/?server=<slug>&minutes=<n>` for charts

The selected server is handled entirely client-side and passed as a query parameter.

In development, the React app can run on `:3000` with a CRA proxy forwarding `/api/*` and `/accounts/*` to Django on `:8000`.

## Scalability Notes

Current default persistence is SQLite, which is fine for:

- small teams
- a handful of servers
- moderate sampling intervals (e.g., 2s to 10s)

For larger deployments, move Django to PostgreSQL and consider:

- background ingestion queue
- retention compaction/downsampling
- archiving old snapshots

## Failure Handling

### Agent Failures

- Bad token -> `401`
- Disabled server -> `403`
- Invalid payload -> `400`
- Network error / timeout -> agent retries on next interval loop

### Dashboard Failures

If a selected server has no snapshots yet:

- latest endpoint returns an error payload with server metadata
- UI surfaces the error and keeps the server selector usable

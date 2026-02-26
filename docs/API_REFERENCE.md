# API Reference

This document describes the dashboard JSON APIs and the remote ingest API.

## Auth Modes

There are two independent authentication mechanisms:

1. Dashboard APIs (`/api/servers/`, `/api/metrics/*`)
   - Require Django login
   - Google OAuth + allowlisted email/domain
2. Ingest API (`/api/ingest/servers/<slug>/metrics/`)
   - Token-authenticated per server
   - Does not use Django session login

## Dashboard APIs

## `GET /api/servers/`

Returns the list of active monitored servers available to the logged-in user.

### Auth

- Django session (logged in)
- Allowlisted Google user

### Response (200)

```json
{
  "ok": true,
  "servers": [
    {
      "id": 1,
      "slug": "gpu-box-01",
      "name": "GPU Box 01",
      "hostname": "train01",
      "description": "",
      "is_active": true,
      "last_seen_at": "2026-02-26T02:37:49.120000+00:00",
      "last_agent_version": "0.1.0",
      "snapshot_count": 421,
      "latest_snapshot_at": "2026-02-26T02:37:49.120000+00:00"
    }
  ]
}
```

## `GET /api/metrics/latest/`

Returns the latest snapshot for a selected server.

### Query Parameters

- `server` (optional)
  - server `slug` or numeric `id`
  - if omitted, server selection falls back to:
    - server with snapshots
    - else first active server

### Response (200)

```json
{
  "ok": true,
  "servers": [...],
  "selected_server": { "...": "..." },
  "snapshot": {
    "id": 123,
    "server": { "...": "..." },
    "collected_at": "2026-02-26T02:37:49.120000+00:00",
    "age_seconds": 1.2,
    "interval_seconds": 2.0,
    "cpu": {
      "usage_percent": 42.1,
      "iowait_percent": 3.2,
      "load_1": 8.1,
      "load_5": 7.4,
      "load_15": 6.8
    },
    "memory": {
      "percent": 71.3,
      "swap_percent": 0.0
    },
    "disk": {
      "read_bps": 123456789.0,
      "write_bps": 9876543.0,
      "util_percent": 64.5,
      "devices": [
        {
          "device": "nvme0n1",
          "read_bps": 120000000.0,
          "write_bps": 5000000.0,
          "util_percent": 61.0
        }
      ]
    },
    "gpu": {
      "present": true,
      "count": 4,
      "top_util_percent": 98.0,
      "devices": [
        {
          "gpu_index": 0,
          "name": "NVIDIA A100",
          "utilization_gpu_percent": 98.0
        }
      ]
    },
    "bottleneck": {
      "label": "gpu-bound",
      "title": "Gpu Bound",
      "confidence": 0.9,
      "reason": "GPU 98% saturated while CPU 42% and disk 64% are lower"
    }
  }
}
```

### Error Cases

- `404` if no servers or no snapshots for selected server
- `403` if logged-in user is not allowlisted

## `GET /api/metrics/history/`

Returns a time series of snapshots for a selected server.

### Query Parameters

- `server` (optional): server `slug` or numeric `id`
- `minutes` (optional): history window in minutes
  - clamped to `1..MONITORING_MAX_HISTORY_MINUTES`

### Response (200)

```json
{
  "ok": true,
  "minutes": 60,
  "point_count": 240,
  "stride": 1,
  "servers": [...],
  "selected_server": { "...": "..." },
  "points": [
    {
      "collected_at": "2026-02-26T01:37:49.120000+00:00",
      "cpu_usage_percent": 31.5,
      "cpu_iowait_percent": 4.1,
      "memory_percent": 70.4,
      "swap_percent": 0.0,
      "disk_read_bps": 104857600.0,
      "disk_write_bps": 5242880.0,
      "disk_util_percent": 62.0,
      "gpu_top_util_percent": 97.0,
      "bottleneck": "gpu-bound",
      "gpus": [
        { "gpu_index": 0, "utilization_gpu_percent": 97.0, "memory_percent": 82.0, "temperature_c": 64.0 }
      ],
      "disks": [
        { "device": "nvme0n1", "read_bps": 104857600.0, "write_bps": 5242880.0, "util_percent": 62.0 }
      ]
    }
  ]
}
```

### Notes

- Large histories are downsampled by stride (server-side)
- The frontend uses this endpoint to render all charts

## Ingest API (Agent -> Webapp)

## `POST /api/ingest/servers/<server_slug>/metrics/`

Ingests one sample for a registered monitored server.

### Auth

Send one of:

- `X-Monitoring-Token: <token>` (recommended)
- `Authorization: Bearer <token>`

### Headers

- `Content-Type: application/json`
- `Accept: application/json` (recommended)

### URL Path Params

- `server_slug`: slug of a registered `MonitoredServer`

### Request Body

The ingest endpoint accepts either:

1. `{ "sample": { ... }, "agent": { ... } }` (recommended)
2. raw sample object `{ ... }` (minimal compatibility form)

### Request Body Schema (Recommended)

```json
{
  "sample": {
    "collected_at": "2026-02-26T02:37:49.120000+00:00",
    "cpu_usage_percent": 32.1,
    "cpu_user_percent": 21.0,
    "cpu_system_percent": 8.4,
    "cpu_iowait_percent": 2.7,
    "cpu_load_1": 6.2,
    "cpu_load_5": 5.8,
    "cpu_load_15": 5.1,
    "cpu_frequency_mhz": 2880.0,
    "cpu_count_logical": 64,
    "cpu_count_physical": 32,
    "memory_total_bytes": 274877906944,
    "memory_used_bytes": 198642237440,
    "memory_available_bytes": 76235669504,
    "memory_percent": 72.3,
    "swap_total_bytes": 0,
    "swap_used_bytes": 0,
    "swap_percent": 0.0,
    "network_rx_bytes_total": 123456789012,
    "network_tx_bytes_total": 23456789012,
    "process_count": 412,
    "disks": [
      {
        "device": "nvme0n1",
        "read_bytes_total": 111111111111,
        "write_bytes_total": 22222222222,
        "read_count_total": 1234567,
        "write_count_total": 456789,
        "busy_time_ms_total": 9876543
      }
    ],
    "gpus": [
      {
        "gpu_index": 0,
        "name": "NVIDIA A100-SXM4-80GB",
        "uuid": "GPU-xxxx",
        "utilization_gpu_percent": 98.0,
        "utilization_memory_percent": 71.0,
        "memory_total_bytes": 85899345920,
        "memory_used_bytes": 68719476736,
        "memory_percent": 80.0,
        "temperature_c": 64.0,
        "power_w": 311.0,
        "power_limit_w": 400.0
      }
    ]
  },
  "agent": {
    "version": "0.1.0",
    "hostname": "train01",
    "platform": "Linux-...",
    "python": "3.13.1",
    "labels": {
      "rack": "r1",
      "role": "trainer"
    }
  }
}
```

### Response (200)

```json
{
  "ok": true,
  "server": {
    "id": 1,
    "slug": "gpu-box-01",
    "name": "GPU Box 01",
    "hostname": "train01",
    "is_active": true
  },
  "snapshot": {
    "id": 1234,
    "collected_at": "2026-02-26T02:37:49.120000+00:00",
    "bottleneck": "gpu-bound",
    "cpu_usage_percent": 32.1,
    "top_gpu_util_percent": 98.0,
    "disk_util_percent": 64.5
  }
}
```

### Error Responses

- `401`: invalid or missing ingest token
- `403`: server exists but is disabled (`is_active=false`)
- `404`: unknown server slug
- `400`: invalid JSON or payload structure

## Token Management

Create or rotate a server token with:

```bash
python3 manage.py register_server gpu-box-01 --name "GPU Box 01"
python3 manage.py register_server gpu-box-01 --rotate-token
```

The plaintext token is only printed at creation/rotation time.


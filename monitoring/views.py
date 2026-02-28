from __future__ import annotations

import json
import math
from urllib.parse import urlencode
from datetime import timedelta
from typing import Any

from django.conf import settings
from django.contrib.auth import logout
from django.db.models import Count, Max
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from monitoring.auth import is_google_email_allowlisted
from monitoring.models import MetricSnapshot, MonitoredServer
from monitoring.services.collector import ingest_sample_for_server


def _label_to_title(label: str) -> str:
    return label.replace("-", " ").replace("_", " ").title()


def _server_queryset():
    return (
        MonitoredServer.objects.filter(is_active=True)
        .annotate(
            snapshot_count=Count("snapshots"),
            latest_snapshot_at=Max("snapshots__collected_at"),
        )
        .order_by("-latest_snapshot_at", "-last_seen_at", "name", "slug")
    )


def _serialize_server(server: MonitoredServer) -> dict[str, Any]:
    return {
        "id": server.id,
        "slug": server.slug,
        "name": server.name,
        "hostname": server.hostname,
        "description": server.description,
        "is_active": server.is_active,
        "last_seen_at": server.last_seen_at.isoformat() if server.last_seen_at else None,
        "last_agent_version": server.last_agent_version or "",
        "snapshot_count": getattr(server, "snapshot_count", None),
        "latest_snapshot_at": (
            getattr(server, "latest_snapshot_at").isoformat()
            if getattr(server, "latest_snapshot_at", None)
            else None
        ),
        "agent_info": server.agent_info or {},
    }


def _pick_server(servers: list[MonitoredServer], server_param: str | None) -> MonitoredServer | None:
    if not servers:
        return None

    normalized = (server_param or "").strip()
    if normalized:
        if normalized.isdigit():
            target_id = int(normalized)
            for server in servers:
                if server.id == target_id:
                    return server
        else:
            for server in servers:
                if server.slug == normalized:
                    return server

    for server in servers:
        if getattr(server, "snapshot_count", 0):
            return server
    return servers[0]


def _serialize_snapshot(snapshot: MetricSnapshot) -> dict[str, Any]:
    now = timezone.now()
    gpus = [
        {
            "gpu_index": gpu.gpu_index,
            "name": gpu.name,
            "uuid": gpu.uuid,
            "utilization_gpu_percent": gpu.utilization_gpu_percent,
            "utilization_memory_percent": gpu.utilization_memory_percent,
            "memory_total_bytes": gpu.memory_total_bytes,
            "memory_used_bytes": gpu.memory_used_bytes,
            "memory_percent": gpu.memory_percent,
            "temperature_c": gpu.temperature_c,
            "power_w": gpu.power_w,
            "power_limit_w": gpu.power_limit_w,
        }
        for gpu in snapshot.gpus.all()
    ]
    disks = [
        {
            "device": disk.device,
            "read_bps": disk.read_bps,
            "write_bps": disk.write_bps,
            "read_iops": disk.read_iops,
            "write_iops": disk.write_iops,
            "util_percent": disk.util_percent,
            "read_bytes_total": disk.read_bytes_total,
            "write_bytes_total": disk.write_bytes_total,
        }
        for disk in snapshot.disks.all()
    ]
    return {
        "id": snapshot.id,
        "server": _serialize_server(snapshot.server) if snapshot.server_id and snapshot.server else None,
        "collected_at": snapshot.collected_at.isoformat(),
        "age_seconds": max(0.0, (now - snapshot.collected_at).total_seconds()),
        "interval_seconds": snapshot.interval_seconds,
        "cpu": {
            "usage_percent": snapshot.cpu_usage_percent,
            "user_percent": snapshot.cpu_user_percent,
            "system_percent": snapshot.cpu_system_percent,
            "iowait_percent": snapshot.cpu_iowait_percent,
            "load_1": snapshot.cpu_load_1,
            "load_5": snapshot.cpu_load_5,
            "load_15": snapshot.cpu_load_15,
            "frequency_mhz": snapshot.cpu_frequency_mhz,
            "temperature_c": snapshot.cpu_temperature_c,
            "count_logical": snapshot.cpu_count_logical,
            "count_physical": snapshot.cpu_count_physical,
        },
        "memory": {
            "total_bytes": snapshot.memory_total_bytes,
            "used_bytes": snapshot.memory_used_bytes,
            "available_bytes": snapshot.memory_available_bytes,
            "percent": snapshot.memory_percent,
            "swap_total_bytes": snapshot.swap_total_bytes,
            "swap_used_bytes": snapshot.swap_used_bytes,
            "swap_percent": snapshot.swap_percent,
        },
        "disk": {
            "read_bps": snapshot.disk_read_bps,
            "write_bps": snapshot.disk_write_bps,
            "read_iops": snapshot.disk_read_iops,
            "write_iops": snapshot.disk_write_iops,
            "util_percent": snapshot.disk_util_percent,
            "avg_util_percent": snapshot.disk_avg_util_percent,
            "devices": disks,
        },
        "network": {
            "rx_bps": snapshot.network_rx_bps,
            "tx_bps": snapshot.network_tx_bps,
        },
        "process_count": snapshot.process_count,
        "gpu": {
            "present": snapshot.gpu_present,
            "count": snapshot.gpu_count,
            "top_util_percent": snapshot.top_gpu_util_percent,
            "avg_util_percent": snapshot.avg_gpu_util_percent,
            "top_memory_percent": snapshot.top_gpu_memory_percent,
            "avg_memory_percent": snapshot.avg_gpu_memory_percent,
            "devices": gpus,
        },
        "bottleneck": {
            "label": snapshot.bottleneck,
            "title": _label_to_title(snapshot.bottleneck),
            "confidence": snapshot.bottleneck_confidence,
            "reason": snapshot.bottleneck_reason,
        },
    }


def _deny_if_not_allowlisted(request):
    user = getattr(request, "user", None)
    user_email = getattr(user, "email", "")
    if is_google_email_allowlisted(user_email):
        return None

    if getattr(user, "is_authenticated", False):
        logout(request)
    return JsonResponse(
        {
            "ok": False,
            "error": "Access denied: your Google account is not in the allowlist.",
        },
        status=403,
    )


def _selected_server_and_list(request) -> tuple[MonitoredServer | None, list[MonitoredServer]]:
    servers = list(_server_queryset())
    selected = _pick_server(servers, request.GET.get("server"))
    return selected, servers


@require_GET
def api_root(request):
    return JsonResponse(
        {
            "ok": True,
            "service": "ai-dashboard-backend",
            "frontend_url": getattr(settings, "FRONTEND_APP_URL", ""),
            "routes": {
                "servers": "/api/servers/",
                "metrics_latest": "/api/metrics/latest/",
                "metrics_history": "/api/metrics/history/",
                "google_login": "/accounts/google/login/",
                "admin": "/admin/",
            },
        }
    )


def _api_auth_required_response(request) -> JsonResponse:
    login_path = getattr(settings, "LOGIN_URL", "/accounts/google/login/") or "/accounts/google/login/"
    query = urlencode({"next": request.get_full_path()})
    separator = "&" if "?" in login_path else "?"
    login_url = request.build_absolute_uri(f"{login_path}{separator}{query}")
    return JsonResponse(
        {
            "ok": False,
            "error": "Authentication required.",
            "auth_required": True,
            "login_url": login_url,
        },
        status=401,
    )


@require_GET
def api_servers(request):
    if not request.user.is_authenticated:
        return _api_auth_required_response(request)
    denied = _deny_if_not_allowlisted(request)
    if denied is not None:
        return denied
    servers = list(_server_queryset())
    return JsonResponse(
        {
            "ok": True,
            "servers": [_serialize_server(server) for server in servers],
        }
    )


@require_GET
def api_metrics_latest(request):
    if not request.user.is_authenticated:
        return _api_auth_required_response(request)
    denied = _deny_if_not_allowlisted(request)
    if denied is not None:
        return denied

    selected_server, servers = _selected_server_and_list(request)
    if selected_server is None:
        return JsonResponse(
            {
                "ok": False,
                "error": "No monitored servers registered yet. Register a server and start an agent.",
                "servers": [],
            },
            status=404,
        )

    snapshot = (
        MetricSnapshot.objects.filter(server=selected_server)
        .order_by("-collected_at")
        .prefetch_related("gpus", "disks", "server")
        .first()
    )
    if snapshot is None:
        return JsonResponse(
            {
                "ok": False,
                "error": f"No samples collected yet for server '{selected_server.slug}'.",
                "servers": [_serialize_server(server) for server in servers],
                "selected_server": _serialize_server(selected_server),
            },
            status=404,
        )

    return JsonResponse(
        {
            "ok": True,
            "servers": [_serialize_server(server) for server in servers],
            "selected_server": _serialize_server(selected_server),
            "snapshot": _serialize_snapshot(snapshot),
        }
    )


@require_GET
def api_metrics_history(request):
    if not request.user.is_authenticated:
        return _api_auth_required_response(request)
    denied = _deny_if_not_allowlisted(request)
    if denied is not None:
        return denied

    selected_server, servers = _selected_server_and_list(request)
    if selected_server is None:
        return JsonResponse(
            {
                "ok": True,
                "minutes": 0,
                "point_count": 0,
                "stride": 1,
                "servers": [],
                "selected_server": None,
                "points": [],
            }
        )

    try:
        minutes = int(request.GET.get("minutes", settings.MONITORING_DEFAULT_HISTORY_MINUTES))
    except ValueError:
        minutes = settings.MONITORING_DEFAULT_HISTORY_MINUTES

    minutes = max(1, min(minutes, settings.MONITORING_MAX_HISTORY_MINUTES))
    since = timezone.now() - timedelta(minutes=minutes)
    snapshots = list(
        MetricSnapshot.objects.filter(server=selected_server, collected_at__gte=since)
        .order_by("collected_at")
        .prefetch_related("gpus", "disks")
    )

    max_points = 1500
    stride = 1
    if len(snapshots) > max_points:
        stride = math.ceil(len(snapshots) / max_points)
        snapshots = snapshots[::stride]

    points: list[dict[str, Any]] = []
    for snap in snapshots:
        points.append(
            {
                "collected_at": snap.collected_at.isoformat(),
                "cpu_usage_percent": snap.cpu_usage_percent,
                "cpu_iowait_percent": snap.cpu_iowait_percent,
                "memory_percent": snap.memory_percent,
                "swap_percent": snap.swap_percent,
                "disk_read_bps": snap.disk_read_bps,
                "disk_write_bps": snap.disk_write_bps,
                "disk_util_percent": snap.disk_util_percent,
                "disk_avg_util_percent": snap.disk_avg_util_percent,
                "network_rx_bps": snap.network_rx_bps,
                "network_tx_bps": snap.network_tx_bps,
                "gpu_top_util_percent": snap.top_gpu_util_percent,
                "gpu_avg_util_percent": snap.avg_gpu_util_percent,
                "gpu_top_memory_percent": snap.top_gpu_memory_percent,
                "bottleneck": snap.bottleneck,
                "gpus": [
                    {
                        "gpu_index": gpu.gpu_index,
                        "utilization_gpu_percent": gpu.utilization_gpu_percent,
                        "memory_percent": gpu.memory_percent,
                        "temperature_c": gpu.temperature_c,
                    }
                    for gpu in snap.gpus.all()
                ],
                "disks": [
                    {
                        "device": disk.device,
                        "read_bps": disk.read_bps,
                        "write_bps": disk.write_bps,
                        "util_percent": disk.util_percent,
                    }
                    for disk in snap.disks.all()
                ],
            }
        )

    return JsonResponse(
        {
            "ok": True,
            "minutes": minutes,
            "point_count": len(points),
            "stride": stride,
            "servers": [_serialize_server(server) for server in servers],
            "selected_server": _serialize_server(selected_server),
            "points": points,
        }
    )


def _extract_ingest_token(request) -> str:
    direct = (request.headers.get("X-Monitoring-Token") or "").strip()
    if direct:
        return direct
    authz = (request.headers.get("Authorization") or "").strip()
    if authz.lower().startswith("bearer "):
        return authz[7:].strip()
    return ""


def _request_ip(request) -> str | None:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    addr = (request.META.get("REMOTE_ADDR") or "").strip()
    return addr or None


@csrf_exempt
@require_POST
def api_ingest_server_metrics(request, server_slug: str):
    server = get_object_or_404(MonitoredServer, slug=server_slug)
    if not server.is_active:
        return JsonResponse({"ok": False, "error": "Server is disabled."}, status=403)

    token = _extract_ingest_token(request)
    if not server.check_api_token(token):
        return JsonResponse({"ok": False, "error": "Invalid ingest token."}, status=401)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({"ok": False, "error": "Invalid JSON payload."}, status=400)

    if not isinstance(payload, dict):
        return JsonResponse({"ok": False, "error": "Payload must be a JSON object."}, status=400)

    try:
        snapshot = ingest_sample_for_server(server, payload, source_ip=_request_ip(request))
    except Exception as exc:  # pragma: no cover - defensive API path
        return JsonResponse({"ok": False, "error": f"Ingest failed: {exc}"}, status=400)

    return JsonResponse(
        {
            "ok": True,
            "server": _serialize_server(server),
            "snapshot": {
                "id": snapshot.id,
                "collected_at": snapshot.collected_at.isoformat(),
                "bottleneck": snapshot.bottleneck,
                "cpu_usage_percent": snapshot.cpu_usage_percent,
                "top_gpu_util_percent": snapshot.top_gpu_util_percent,
                "disk_util_percent": snapshot.disk_util_percent,
            },
        }
    )

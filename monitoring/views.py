from __future__ import annotations

import math
from datetime import timedelta
from typing import Any

from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from django.views.decorators.http import require_GET

from monitoring.auth import is_google_email_allowlisted
from monitoring.models import MetricSnapshot
from monitoring.services.collector import collect_and_store


def _label_to_title(label: str) -> str:
    return label.replace("-", " ").replace("_", " ").title()


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


def _deny_if_not_allowlisted(request, *, api: bool = False):
    user = getattr(request, "user", None)
    user_email = getattr(user, "email", "")
    if is_google_email_allowlisted(user_email):
        return None

    if getattr(user, "is_authenticated", False):
        logout(request)
    if api:
        return JsonResponse(
            {
                "ok": False,
                "error": "Access denied: your Google account is not in the allowlist.",
            },
            status=403,
        )
    messages.error(
        request,
        "Access denied: your Google account is not in the allowlist for this dashboard.",
    )
    return redirect("monitoring:access_denied")


@login_required
def dashboard(request):
    denied = _deny_if_not_allowlisted(request, api=False)
    if denied is not None:
        return denied
    return render(
        request,
        "monitoring/dashboard.html",
        {
            "default_history_minutes": settings.MONITORING_DEFAULT_HISTORY_MINUTES,
            "max_history_minutes": settings.MONITORING_MAX_HISTORY_MINUTES,
        },
    )


def access_denied(request):
    return render(
        request,
        "monitoring/access_denied.html",
        {
            "allowed_emails_count": len(getattr(settings, "GOOGLE_ALLOWED_EMAILS", set()) or []),
            "allowed_domains": sorted(getattr(settings, "GOOGLE_ALLOWED_DOMAINS", set()) or []),
            "google_oauth_configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
        },
    )


@require_GET
@login_required
def api_metrics_latest(request):
    denied = _deny_if_not_allowlisted(request, api=True)
    if denied is not None:
        return denied
    snapshot = (
        MetricSnapshot.objects.order_by("-collected_at")
        .prefetch_related("gpus", "disks")
        .first()
    )
    if snapshot is None:
        try:
            collect_and_store()
            snapshot = (
                MetricSnapshot.objects.order_by("-collected_at")
                .prefetch_related("gpus", "disks")
                .first()
            )
        except Exception as exc:  # pragma: no cover - defensive path
            return JsonResponse({"ok": False, "error": str(exc)}, status=500)

    if snapshot is None:
        return JsonResponse({"ok": False, "error": "No samples collected yet."}, status=404)

    return JsonResponse({"ok": True, "snapshot": _serialize_snapshot(snapshot)})


@require_GET
@login_required
def api_metrics_history(request):
    denied = _deny_if_not_allowlisted(request, api=True)
    if denied is not None:
        return denied
    try:
        minutes = int(request.GET.get("minutes", settings.MONITORING_DEFAULT_HISTORY_MINUTES))
    except ValueError:
        minutes = settings.MONITORING_DEFAULT_HISTORY_MINUTES

    minutes = max(1, min(minutes, settings.MONITORING_MAX_HISTORY_MINUTES))
    since = timezone.now() - timedelta(minutes=minutes)
    snapshots = list(
        MetricSnapshot.objects.filter(collected_at__gte=since)
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
            "points": points,
        }
    )

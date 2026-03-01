from __future__ import annotations

import hashlib
import json
import math
from urllib.parse import urlencode
from datetime import timedelta
from functools import wraps
from typing import Any
import logging

from django.conf import settings
from django.contrib.auth import logout
from django.core.cache import cache
from django.db import IntegrityError
from django.db.models import Count, Max
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from monitoring.auth import is_google_email_allowlisted
from monitoring.models import MetricSnapshot, MonitoredServer, Notification
from monitoring.services.collector import ingest_sample_for_server
from monitoring.version import BACKEND_VERSION, MIN_AGENT_VERSION

logger = logging.getLogger(__name__)

# ── Rate limiting ─────────────────────────────────────────────────────────────

def _rate_limit(max_requests: int, window_seconds: int):
    """Simple in-memory rate limiter keyed by IP address."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            ip = (request.META.get("REMOTE_ADDR") or "unknown").strip()
            hashed = hashlib.sha256(ip.encode()).hexdigest()[:20]
            cache_key = f"rl:{view_func.__name__}:{hashed}"
            count = cache.get(cache_key, 0)
            if count >= max_requests:
                logger.warning("Rate limit hit: view=%s ip=%s", view_func.__name__, ip)
                return JsonResponse(
                    {"ok": False, "error": "Too many requests. Please try again later."},
                    status=429,
                    headers={"Retry-After": str(window_seconds)},
                )
            cache.set(cache_key, count + 1, timeout=window_seconds)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


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
            "fan_speed_percent": gpu.fan_speed_percent,
            "power_w": gpu.power_w,
            "power_limit_w": gpu.power_limit_w,
        }
        for gpu in snapshot.gpus.all()
    ]
    fans = [
        {
            "label": fan.label,
            "speed_rpm": fan.speed_rpm,
        }
        for fan in snapshot.fans.all()
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
        "fans": {
            "count": snapshot.fan_count,
            "max_rpm": snapshot.fan_max_rpm,
            "avg_rpm": snapshot.fan_avg_rpm,
            "devices": fans,
        },
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


def _require_authenticated_allowlisted(request) -> JsonResponse | None:
    """Return an auth/allowlist error response or ``None`` when allowed."""
    if not request.user.is_authenticated:
        logger.debug("Auth required for path %s", request.path)
        return _api_auth_required_response(request)

    denied = _deny_if_not_allowlisted(request)
    if denied is not None:
        logger.info("Access denied for user %s on path %s", getattr(request.user, "email", None), request.path)
        return denied

    return None


def _selected_server_and_list(request) -> tuple[MonitoredServer | None, list[MonitoredServer]]:
    servers = list(_server_queryset())
    selected = _pick_server(servers, request.GET.get("server"))
    return selected, servers


@require_POST
@_rate_limit(max_requests=20, window_seconds=300)
def api_register_server(request):
    """Create a new MonitoredServer and return its one-time ingest token."""
    access_error = _require_authenticated_allowlisted(request)
    if access_error is not None:
        return access_error

    body, error_response = _load_json_dict(request)
    if error_response is not None:
        return error_response

    name = (body.get("name") or "").strip()
    slug_raw = (body.get("slug") or "").strip()
    hostname = (body.get("hostname") or "").strip()
    description = (body.get("description") or "").strip()

    if not name:
        return JsonResponse({"ok": False, "error": "Name is required."}, status=400)

    slug = slugify(slug_raw or name)[:64]
    if not slug:
        return JsonResponse({"ok": False, "error": "Slug could not be derived from name."}, status=400)

    ingest_token = MonitoredServer.generate_token()
    try:
        server = MonitoredServer.objects.create(
            name=name[:128],
            slug=slug,
            hostname=hostname[:255],
            description=description,
            api_token_hash=MonitoredServer.hash_token(ingest_token),
            is_active=True,
        )
    except IntegrityError:
        return JsonResponse({"ok": False, "error": "Slug already exists. Choose another."}, status=409)

    base_host = request.build_absolute_uri("/").rstrip("/")
    agent_cmd = (
        "ai-dashboard-agent "
        f"--host {base_host} "
        f"--server-slug {server.slug} "
        f"--token '{ingest_token}' "
        "--interval 2"
    )

    logger.info("Server registered via API: slug=%s user=%s", server.slug, getattr(request.user, "email", None))
    return JsonResponse(
        {
            "ok": True,
            "server": _serialize_server(server),
            "ingest_token": ingest_token,
            "agent_command": agent_cmd,
        },
        status=201,
    )


@require_GET
@ensure_csrf_cookie
def api_root(request):
    return JsonResponse(
        {
            "ok": True,
            "service": "ai-dashboard-backend",
            "backend_version": BACKEND_VERSION,
            "min_agent_version": MIN_AGENT_VERSION,
            "frontend_url": getattr(settings, "FRONTEND_APP_URL", ""),
            "routes": {
                "servers": "/api/servers/",
                "metrics_latest": "/api/metrics/latest/",
                "metrics_history": "/api/metrics/history/",
                "notifications": "/api/notifications/",
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


def _load_json_dict(request) -> tuple[dict[str, Any] | None, JsonResponse | None]:
    """Parse a JSON object request body and return (data, error_response)."""
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        logger.warning("Invalid JSON payload on %s", request.path)
        return None, JsonResponse({"ok": False, "error": "Invalid JSON payload."}, status=400)

    if not isinstance(body, dict):
        logger.warning("JSON payload is not an object on %s", request.path)
        return None, JsonResponse({"ok": False, "error": "Payload must be a JSON object."}, status=400)

    return body, None


@require_GET
def api_servers(request):
    access_error = _require_authenticated_allowlisted(request)
    if access_error is not None:
        return access_error
    logger.debug("Listing servers for user=%s", getattr(request.user, "email", None))
    servers = list(_server_queryset())
    return JsonResponse(
        {
            "ok": True,
            "servers": [_serialize_server(server) for server in servers],
        }
    )


@require_GET
def api_metrics_latest(request):
    access_error = _require_authenticated_allowlisted(request)
    if access_error is not None:
        return access_error

    selected_server, servers = _selected_server_and_list(request)
    if selected_server is None:
        logger.info("metrics_latest requested but no servers are registered")
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
        .prefetch_related("gpus", "disks", "fans", "server")
        .first()
    )
    if snapshot is None:
        logger.info("metrics_latest: no snapshots yet for server=%s", selected_server.slug)
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
            "backend_version": BACKEND_VERSION,
            "min_agent_version": MIN_AGENT_VERSION,
        }
    )


@require_GET
def api_notifications(request):
    access_error = _require_authenticated_allowlisted(request)
    if access_error is not None:
        return access_error

    logger.debug("Fetching notifications for user=%s", getattr(request.user, "email", None))
    qs = Notification.objects.select_related("server").order_by("-created_at")[:50]
    payload = [
        {
            "id": note.id,
            "level": note.level,
            "title": note.title,
            "message": note.message,
            "code": note.code,
            "is_read": note.is_read,
            "created_at": note.created_at.isoformat(),
            "server": _serialize_server(note.server) if note.server_id and note.server else None,
        }
        for note in qs
    ]
    return JsonResponse({"ok": True, "notifications": payload})


@require_POST
def api_notifications_mark_read(request):
    access_error = _require_authenticated_allowlisted(request)
    if access_error is not None:
        return access_error

    body, error_response = _load_json_dict(request)
    if error_response is not None:
        return error_response

    ids = body.get("ids") if isinstance(body, dict) else None
    if not isinstance(ids, list):
        return JsonResponse({"ok": False, "error": "ids must be a list."}, status=400)
    cleaned_ids = [int(i) for i in ids if isinstance(i, int) or (isinstance(i, str) and i.isdigit())]
    if not cleaned_ids:
        return JsonResponse({"ok": True, "updated": 0})

    with transaction.atomic():
        updated = Notification.objects.filter(id__in=cleaned_ids).update(is_read=True)
    logger.info("Marked notifications read: count=%s user=%s", updated, getattr(request.user, "email", None))
    return JsonResponse({"ok": True, "updated": updated})


@require_GET
def api_metrics_history(request):
    access_error = _require_authenticated_allowlisted(request)
    if access_error is not None:
        return access_error

    selected_server, servers = _selected_server_and_list(request)
    if selected_server is None:
        logger.info("metrics_history requested but no servers registered")
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
        .prefetch_related("gpus", "disks", "fans")
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
                "fan_count": snap.fan_count,
                "fan_max_rpm": snap.fan_max_rpm,
                "fan_avg_rpm": snap.fan_avg_rpm,
                "bottleneck": snap.bottleneck,
                "gpus": [
                    {
                        "gpu_index": gpu.gpu_index,
                        "utilization_gpu_percent": gpu.utilization_gpu_percent,
                        "memory_percent": gpu.memory_percent,
                        "temperature_c": gpu.temperature_c,
                        "fan_speed_percent": gpu.fan_speed_percent,
                    }
                    for gpu in snap.gpus.all()
                ],
                "fans": [
                    {
                        "label": fan.label,
                        "speed_rpm": fan.speed_rpm,
                    }
                    for fan in snap.fans.all()
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
            "backend_version": BACKEND_VERSION,
            "min_agent_version": MIN_AGENT_VERSION,
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
    # Only trust X-Forwarded-For when explicitly running behind a trusted reverse proxy.
    if settings.SECURE_PROXY_SSL_HEADER:
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
        logger.info("Ingest denied: server %s disabled", server_slug)
        return JsonResponse({"ok": False, "error": "Server is disabled."}, status=403)

    token = _extract_ingest_token(request)
    if not server.check_api_token(token):
        logger.warning("Invalid ingest token for server=%s from ip=%s", server_slug, _request_ip(request))
        return JsonResponse({"ok": False, "error": "Invalid ingest token."}, status=401)

    payload, error_response = _load_json_dict(request)
    if error_response is not None:
        return error_response

    try:
        snapshot = ingest_sample_for_server(server, payload, source_ip=_request_ip(request))
    except Exception:  # pragma: no cover - defensive API path
        logger.exception("Ingest failed for server=%s", server_slug)
        return JsonResponse({"ok": False, "error": "Ingest processing failed."}, status=400)

    logger.debug("Ingest OK server=%s snap_id=%s bottleneck=%s", server_slug, snapshot.id, snapshot.bottleneck)
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


# ── Agent self-enrollment ─────────────────────────────────────────────────────

@csrf_exempt
@require_POST
@_rate_limit(max_requests=30, window_seconds=60)
def api_agent_enroll(request):
    """Agent-initiated enrollment: authenticate with user credentials, obtain an ingest token.

    Flow
    ----
    1. Agent POSTs username + password + machine_id (from /etc/machine-id).
    2. We verify credentials and allowlist membership.
    3. We find-or-create a MonitoredServer keyed by machine_id, rotate its ingest
       token, and return slug + fresh plain token.
    4. The agent stores the returned token and uses it for subsequent metric ingest calls.

    Installing / uninstalling the agent N times on the same machine will always
    resolve to the same server record because machine_id is unique.
    """
    from django.contrib.auth import authenticate as django_authenticate

    body, error_response = _load_json_dict(request)
    if error_response is not None:
        return error_response

    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    machine_id = (body.get("machine_id") or "").strip()
    hostname = (body.get("hostname") or "").strip()
    platform_info = (body.get("platform") or "").strip()
    agent_version = (body.get("agent_version") or "").strip()

    if not username or not password:
        return JsonResponse({"ok": False, "error": "username and password are required."}, status=400)
    if not machine_id:
        return JsonResponse({"ok": False, "error": "machine_id is required."}, status=400)
    if not hostname:
        return JsonResponse({"ok": False, "error": "hostname is required."}, status=400)

    user = django_authenticate(request, username=username, password=password)
    if user is None:
        logger.info("Agent enroll: auth failed for username=%s", username)
        return JsonResponse({"ok": False, "error": "Invalid credentials."}, status=401)
    if not user.is_active:
        return JsonResponse({"ok": False, "error": "Account is disabled."}, status=403)

    user_email = getattr(user, "email", "")
    if not is_google_email_allowlisted(user_email):
        logger.warning("Agent enroll: allowlist check failed for user=%s email=%s", username, user_email)
        return JsonResponse({"ok": False, "error": "Account not in allowlist."}, status=403)

    # Sanitise machine_id to prevent injection – accept only hex/hyphen/alphanum up to 128 chars.
    import re as _re
    if not _re.fullmatch(r"[a-zA-Z0-9\-]{1,128}", machine_id):
        return JsonResponse({"ok": False, "error": "Invalid machine_id format."}, status=400)

    server, ingest_token = MonitoredServer.enroll_or_update(
        machine_id=machine_id,
        hostname=hostname,
        platform_info=platform_info,
        agent_version=agent_version,
        source_ip=_request_ip(request),
    )

    logger.info(
        "Agent enrolled: machine_id=%s server_slug=%s user=%s agent_version=%s",
        machine_id,
        server.slug,
        username,
        agent_version,
    )
    return JsonResponse(
        {
            "ok": True,
            "server_slug": server.slug,
            "ingest_token": ingest_token,
            "server": _serialize_server(server),
        },
        status=200,
    )


# ── Credential auth views ─────────────────────────────────────────────────────

@require_POST
@_rate_limit(max_requests=10, window_seconds=60)
def api_auth_login(request):
    """Authenticate with username + password and establish a session."""
    from django.contrib.auth import authenticate, login as auth_login

    body, error_response = _load_json_dict(request)
    if error_response is not None:
        return error_response

    username = (body.get("username") or "").strip()
    password = body.get("password") or ""

    if not username or not password:
        return JsonResponse({"ok": False, "error": "Username and password are required."}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        logger.info("Credential login failed for username=%s", username)
        return JsonResponse({"ok": False, "error": "Invalid username or password."}, status=401)

    if not user.is_active:
        logger.info("Credential login for disabled user=%s", username)
        return JsonResponse({"ok": False, "error": "This account is disabled."}, status=403)

    auth_login(request, user)
    logger.info("Credential login success for user=%s", username)
    return JsonResponse({
        "ok": True,
        "user": {
            "username": user.username,
            "email": user.email,
        },
    })


@require_POST
@_rate_limit(max_requests=5, window_seconds=300)
def api_auth_register(request):
    """Create a new user account with username, email, and password."""
    from django.contrib.auth import get_user_model
    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError
    from django.core.validators import validate_email

    User = get_user_model()

    body, error_response = _load_json_dict(request)
    if error_response is not None:
        return error_response

    username = (body.get("username") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not username or not email or not password:
        return JsonResponse({"ok": False, "error": "Username, email and password are required."}, status=400)

    # Validate email format
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({"ok": False, "error": "Enter a valid email address."}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({"ok": False, "error": "That username is already taken."}, status=409)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"ok": False, "error": "That email is already registered."}, status=409)

    # Credential accounts are subject to the same allowlist as Google accounts.
    if not is_google_email_allowlisted(email):
        logger.info("Register rejected: email not in allowlist email=%s", email)
        return JsonResponse(
            {"ok": False, "error": "Registration is restricted to authorized accounts."},
            status=403,
        )

    try:
        validate_password(password)
    except ValidationError as exc:
        return JsonResponse({"ok": False, "error": " ".join(exc.messages)}, status=400)

    user = User.objects.create_user(username=username, email=email, password=password)  # type: ignore[arg-type]
    logger.info("User registered username=%s email=%s", username, email)
    return JsonResponse({
        "ok": True,
        "user": {
            "username": user.username,
            "email": user.email,
        },
    }, status=201)


@require_POST
@_rate_limit(max_requests=5, window_seconds=300)
def api_auth_forgot_password(request):
    """Send a password-reset email (uses Django's built-in PasswordResetForm)."""
    from django.contrib.auth.forms import PasswordResetForm

    body, error_response = _load_json_dict(request)
    if error_response is not None:
        return error_response

    email = (body.get("email") or "").strip().lower()
    if not email:
        return JsonResponse({"ok": False, "error": "Email is required."}, status=400)

    form = PasswordResetForm(data={"email": email})
    if form.is_valid():
        form.save(
            request=request,
            use_https=request.is_secure(),
            email_template_name="registration/password_reset_email.html",
            subject_template_name="registration/password_reset_subject.txt",
            from_email=None,
        )

    # Always succeed to prevent email enumeration
    return JsonResponse({
        "ok": True,
        "message": "If that email address is registered, a reset link has been sent.",
    })

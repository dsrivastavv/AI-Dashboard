"""Command-line entry point for the AI Dashboard agent.

New authentication flow (v2)
-----------------------------
The agent now authenticates itself with the dashboard rather than requiring a
pre-generated token.  On startup it:

1. Reads ``/etc/machine-id`` (Linux) as a stable machine identifier.
2. POSTs credentials (username + password) + machine_id to
   ``POST /api/agent/enroll/``.
3. The server returns ``server_slug`` + a fresh ``ingest_token`` and
   creates/updates exactly one :class:`MonitoredServer` row per machine.
4. The agent persists the token in a state file and begins metric collection.
5. On a 401 from the ingest endpoint it re-enrolls once and retries.

Re-installing / uninstalling the agent on the same machine always maps to the
same server entry on the dashboard because ``machine_id`` is unique.

Legacy mode
-----------
If ``--token`` and ``--server-slug`` are both supplied (or the equivalent env
vars are set) the old direct-token ingest path is used -- no enrollment occurs.

Configuration
-------------
Config is read, in priority order, from:
  1. CLI flags
  2. Environment variables (``AI_DASHBOARD_*``)
  3. Config file at ``/etc/ai-dashboard-agent/agent.conf``
     (or ``~/.config/ai-dashboard-agent/agent.conf`` for non-root installs).
     Plain ``KEY=VALUE`` format; comments with ``#`` are supported.

State (cached slug + token) is written to:
  ``/var/lib/ai-dashboard-agent/state.json``  (root/systemd)
  ``~/.local/share/ai-dashboard-agent/state.json``  (user installs)
"""
from __future__ import annotations

import argparse
import getpass
import json
import logging
import os
import platform
import socket
import sys
import time
from pathlib import Path
from typing import Any

import requests

from . import __version__
from .client import EnrollmentError, IngestAuthError, enroll, post_sample
from .collector import collect_raw_metrics, collect_system_info

LOG_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"

# -- Paths --------------------------------------------------------------------

_SYSTEM_CONFIG = Path("/etc/ai-dashboard-agent/agent.conf")
_SYSTEM_STATE  = Path("/var/lib/ai-dashboard-agent/state.json")
_USER_CONFIG   = Path.home() / ".config" / "ai-dashboard-agent" / "agent.conf"
_USER_STATE    = Path.home() / ".local" / "share" / "ai-dashboard-agent" / "state.json"

# -- Machine identity ---------------------------------------------------------

def _read_machine_id() -> str:
    """Return the stable machine-id from /etc/machine-id or a locally generated UUID."""
    for path in ("/etc/machine-id", "/var/lib/dbus/machine-id"):
        try:
            value = Path(path).read_text().strip()
            if value:
                return value
        except OSError:
            pass

    # Generate and persist a UUID if none of the system paths exist.
    state_dir = _SYSTEM_STATE.parent if os.getuid() == 0 else _USER_STATE.parent
    mid_path = state_dir / "machine_id"
    try:
        state_dir.mkdir(parents=True, exist_ok=True)
        if mid_path.exists():
            return mid_path.read_text().strip()
        import uuid
        value = str(uuid.uuid4())
        mid_path.write_text(value)
        return value
    except OSError:
        import uuid
        return str(uuid.uuid4())


# -- Config file loading ------------------------------------------------------

def _load_config_file(path: Path) -> dict[str, str]:
    """Parse a simple KEY=VALUE config file; ignore blank lines and #-comments."""
    config: dict[str, str] = {}
    try:
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            config[key.strip()] = value.strip()
    except OSError:
        pass
    return config


def _get_config(key: str, config_file: dict[str, str], default: str = "") -> str:
    """Return value: env var > config file > default."""
    return os.environ.get(key) or config_file.get(key) or default


# -- State (cached token) -----------------------------------------------------

def _state_path() -> Path:
    return _SYSTEM_STATE if os.getuid() == 0 else _USER_STATE


def _load_state() -> dict[str, str]:
    try:
        data = json.loads(_state_path().read_text())
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def _save_state(state: dict[str, Any]) -> None:
    path = _state_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(state, indent=2))
    except OSError as exc:
        logging.getLogger("ai_dashboard_agent").warning(
            "Could not write state file %s: %s", path, exc
        )


# -- Misc helpers -------------------------------------------------------------

def _csv_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _parse_labels(entries: list[str]) -> dict[str, str]:
    labels: dict[str, str] = {}
    for item in entries:
        if "=" not in item:
            continue
        key, value = item.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key:
            labels[key] = value
    return labels


def _print(msg: str, quiet: bool = False) -> None:
    if not quiet:
        print(msg, flush=True)


def _resolve_agent_user() -> str:
    try:
        username = getpass.getuser().strip()
        if username:
            return username
    except Exception:
        pass
    return "root" if os.getuid() == 0 else ""


def _agent_metadata(
    hostname: str,
    agent_user: str,
    disk_filters: list[str],
    labels: dict[str, str],
) -> dict[str, Any]:
    system_info = collect_system_info()
    return {
        "version": __version__,
        "hostname": hostname,
        "user": agent_user,
        "platform": platform.platform(),
        "python": platform.python_version(),
        "pid": os.getpid(),
        "labels": labels,
        "disk_filters": disk_filters,
        "system_info": system_info,
    }


# -- Argument parser ----------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ai-dashboard-agent",
        description=(
            "Collect local system metrics and send them to the AI Dashboard. "
            "The agent authenticates with the dashboard using username + password "
            "and obtains its own ingest token (self-enrollment)."
        ),
    )
    # Connection
    parser.add_argument("--host", default="", help="Dashboard base URL (env: AI_DASHBOARD_HOST)")
    parser.add_argument(
        "--config",
        default="",
        help="Path to agent config file (default: /etc/ai-dashboard-agent/agent.conf)",
    )

    # Self-auth (new)
    parser.add_argument("--username", default="", help="Dashboard username (env: AI_DASHBOARD_USERNAME)")
    parser.add_argument("--password", default="", help="Dashboard password (env: AI_DASHBOARD_PASSWORD)")

    # Legacy direct-token mode (backward compat)
    parser.add_argument(
        "--server-slug",
        default="",
        help="[Legacy] Server slug when using a pre-generated token (env: AI_DASHBOARD_SERVER_SLUG)",
    )
    parser.add_argument(
        "--token",
        default="",
        help="[Legacy] Pre-generated ingest token (env: AI_DASHBOARD_TOKEN)",
    )

    # Agent behaviour
    parser.add_argument("--interval", type=float, default=0.0)
    parser.add_argument("--timeout", type=float, default=0.0)
    parser.add_argument("--disks", default="")
    parser.add_argument("--cpu-sample-interval", type=float, default=0.2)
    parser.add_argument("--hostname", default="")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--insecure", action="store_true", help="Disable TLS verification")
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument(
        "--log-level",
        default="",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
    )
    parser.add_argument(
        "--label",
        action="append",
        default=[],
        help="Agent label metadata as key=value (repeatable)",
    )
    return parser


# -- Enrollment helper --------------------------------------------------------

def _do_enroll(
    *,
    host: str,
    username: str,
    password: str,
    machine_id: str,
    hostname: str,
    agent_user: str,
    verify: bool,
    timeout: float,
    quiet: bool,
    session: requests.Session,
) -> tuple[str, str]:
    """Call enroll() and return (server_slug, ingest_token).  Exits on fatal auth errors."""
    logger = logging.getLogger("ai_dashboard_agent")
    _print(f"Enrolling with {host} as '{hostname}' ...", quiet=quiet)
    try:
        data = enroll(
            host=host,
            username=username,
            password=password,
            machine_id=machine_id,
            hostname=hostname,
            agent_user=agent_user,
            platform_info=platform.platform(),
            agent_version=__version__,
            timeout=timeout,
            verify=verify,
            session=session,
        )
    except EnrollmentError as exc:
        logger.error("Enrollment rejected (credentials/allowlist): %s", exc)
        _print(f"Enrollment failed: {exc}", quiet=False)
        raise SystemExit(1)
    except RuntimeError as exc:
        logger.error("Enrollment error: %s", exc)
        raise

    slug = data["server_slug"]
    token = data["ingest_token"]
    _print(f"Enrolled as server '{slug}'.", quiet=quiet)
    return slug, token


# -- Main run loop ------------------------------------------------------------

def run(args: argparse.Namespace) -> int:  # noqa: C901
    # Resolve config file
    config_path = Path(args.config) if args.config else (
        _SYSTEM_CONFIG if _SYSTEM_CONFIG.exists() else _USER_CONFIG
    )
    cfg = _load_config_file(config_path)

    # Build resolved settings (CLI > env > config file > default)
    host         = (args.host     or _get_config("AI_DASHBOARD_HOST",     cfg)).rstrip("/")
    username     = args.username  or _get_config("AI_DASHBOARD_USERNAME",  cfg)
    password     = args.password  or _get_config("AI_DASHBOARD_PASSWORD",  cfg)
    legacy_slug  = (args.server_slug or _get_config("AI_DASHBOARD_SERVER_SLUG", cfg)
                    or os.environ.get("AI_DASHBOARD_SERVER_SLUG", ""))
    legacy_token = (args.token    or _get_config("AI_DASHBOARD_TOKEN",     cfg)
                    or os.environ.get("AI_DASHBOARD_TOKEN", ""))
    interval     = args.interval  or float(_get_config("AI_DASHBOARD_INTERVAL",  cfg, "2"))
    timeout      = args.timeout   or float(_get_config("AI_DASHBOARD_TIMEOUT",   cfg, "5"))
    disks_raw    = args.disks     or _get_config("AI_DASHBOARD_DISKS",     cfg)
    hostname     = args.hostname  or _get_config("AI_DASHBOARD_HOSTNAME",  cfg) or socket.gethostname()
    log_level    = args.log_level or _get_config("AI_DASHBOARD_LOG_LEVEL", cfg, "INFO")

    if not host:
        raise SystemExit("Missing --host (or AI_DASHBOARD_HOST)")

    verify       = not args.insecure
    interval     = max(0.5, float(interval))
    disk_filters = _csv_list(disks_raw)
    labels       = _parse_labels(args.label)
    agent_user   = _resolve_agent_user()

    level_name = "WARNING" if args.quiet else log_level.upper()
    logging.basicConfig(level=level_name, format=LOG_FORMAT)
    logger = logging.getLogger("ai_dashboard_agent")

    session      = requests.Session()
    legacy_mode  = bool(legacy_slug and legacy_token)

    if legacy_mode:
        # Old direct-token mode
        server_slug  = legacy_slug
        ingest_token = legacy_token
        machine_id   = ""
        _print(
            f"[legacy] Agent {__version__} -> {host} server='{server_slug}' every {interval:.2f}s",
            quiet=args.quiet,
        )
    else:
        # Self-enrollment mode
        if not username:
            raise SystemExit("Missing --username (or AI_DASHBOARD_USERNAME in config)")
        if not password:
            raise SystemExit("Missing --password (or AI_DASHBOARD_PASSWORD in config)")

        machine_id = _read_machine_id()
        logger.debug("Machine-id: %s", machine_id)

        server_slug, ingest_token = _do_enroll(
            host=host,
            username=username,
            password=password,
            machine_id=machine_id,
            hostname=hostname,
            agent_user=agent_user,
            verify=verify,
            timeout=timeout,
            quiet=args.quiet,
            session=session,
        )
        _save_state({
            "server_slug":  server_slug,
            "ingest_token": ingest_token,
            "enrolled_at":  time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })
        _print(
            f"Agent {__version__} -> {host} server='{server_slug}' every {interval:.2f}s",
            quiet=args.quiet,
        )

    if disk_filters:
        _print(f"Tracking disks: {', '.join(disk_filters)}", quiet=args.quiet)
    logger.info("Agent starting interval=%.2fs verify_tls=%s legacy=%s", interval, verify, legacy_mode)

    agent = _agent_metadata(hostname, agent_user, disk_filters, labels)

    # Collect + post loop
    while True:
        started = time.monotonic()
        try:
            sample = collect_raw_metrics(
                disk_filters=disk_filters or None,
                cpu_sample_interval=max(0.0, float(args.cpu_sample_interval)),
            )
            result = post_sample(
                host=host,
                server_slug=server_slug,
                token=ingest_token,
                sample=sample,
                agent=agent,
                timeout=float(timeout),
                verify=verify,
                session=session,
            )
            snap = result.get("snapshot", {})
            _print(
                (
                    f"{snap.get('collected_at', '-')}"
                    f" | cpu={snap.get('cpu_usage_percent', '-')}"
                    f" gpu={snap.get('top_gpu_util_percent', '-')}"
                    f" disk={snap.get('disk_util_percent', '-')}"
                    f" bottleneck={snap.get('bottleneck', '-')}"
                ),
                quiet=args.quiet,
            )

        except IngestAuthError:
            if legacy_mode:
                logger.error(
                    "Ingest token rejected and legacy mode is active -- cannot re-enroll. Exiting."
                )
                return 1
            logger.warning("Ingest token rejected (401) -- re-enrolling ...")
            try:
                server_slug, ingest_token = _do_enroll(
                    host=host,
                    username=username,
                    password=password,
                    machine_id=machine_id,
                    hostname=hostname,
                    agent_user=agent_user,
                    verify=verify,
                    timeout=timeout,
                    quiet=args.quiet,
                    session=session,
                )
                _save_state({
                    "server_slug":  server_slug,
                    "ingest_token": ingest_token,
                    "enrolled_at":  time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                })
                agent = _agent_metadata(hostname, agent_user, disk_filters, labels)
            except SystemExit:
                return 1
            except Exception as exc:
                logger.exception("Re-enrollment failed: %s", exc)
                _print(f"Re-enrollment failed: {exc}", quiet=args.quiet)
                if args.once:
                    return 1
                time.sleep(min(60.0, interval * 5))

        except KeyboardInterrupt:
            _print("Agent stopped.", quiet=args.quiet)
            return 0

        except Exception as exc:
            logger.exception("Send failed")
            _print(f"Send failed: {exc}", quiet=args.quiet)
            if args.once:
                return 1

        if args.once:
            return 0

        elapsed = time.monotonic() - started
        time.sleep(max(0.0, interval - elapsed))


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return run(args)
    except SystemExit as exc:
        if isinstance(exc.code, int):
            return exc.code
        print(exc, file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

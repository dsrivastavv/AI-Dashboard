from __future__ import annotations

import argparse
import os
import platform
import socket
import sys
import time
from typing import Any

import requests

from . import __version__
from .client import post_sample
from .collector import collect_raw_metrics, collect_system_info


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


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ai-dashboard-agent",
        description="Collect local system metrics and send them to the AI dashboard webapp.",
    )
    parser.add_argument("--host", default=os.environ.get("AI_DASHBOARD_HOST", ""))
    parser.add_argument("--server-slug", default=os.environ.get("AI_DASHBOARD_SERVER_SLUG", ""))
    parser.add_argument("--token", default=os.environ.get("AI_DASHBOARD_TOKEN", ""))
    parser.add_argument("--interval", type=float, default=float(os.environ.get("AI_DASHBOARD_INTERVAL", "2")))
    parser.add_argument("--timeout", type=float, default=float(os.environ.get("AI_DASHBOARD_TIMEOUT", "5")))
    parser.add_argument("--disks", default=os.environ.get("AI_DASHBOARD_DISKS", ""))
    parser.add_argument("--cpu-sample-interval", type=float, default=0.2)
    parser.add_argument("--hostname", default=os.environ.get("AI_DASHBOARD_HOSTNAME", socket.gethostname()))
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--insecure", action="store_true", help="Disable TLS verification")
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument(
        "--label",
        action="append",
        default=[],
        help="Add agent label metadata as key=value (repeatable)",
    )
    return parser


def _validate_args(args: argparse.Namespace) -> None:
    if not args.host:
        raise SystemExit("Missing --host (or AI_DASHBOARD_HOST)")
    if not args.server_slug:
        raise SystemExit("Missing --server-slug (or AI_DASHBOARD_SERVER_SLUG)")
    if not args.token:
        raise SystemExit("Missing --token (or AI_DASHBOARD_TOKEN)")


def _agent_metadata(args: argparse.Namespace, disk_filters: list[str]) -> dict[str, Any]:
    system_info = collect_system_info()
    return {
        "version": __version__,
        "hostname": args.hostname,
        "platform": platform.platform(),
        "python": platform.python_version(),
        "pid": os.getpid(),
        "labels": _parse_labels(args.label),
        "disk_filters": disk_filters,
        "system_info": system_info,
    }


def _print(msg: str, quiet: bool = False) -> None:
    if not quiet:
        print(msg, flush=True)


def run(args: argparse.Namespace) -> int:
    _validate_args(args)
    verify = not args.insecure
    interval = max(0.5, float(args.interval))
    disk_filters = _csv_list(args.disks)
    agent = _agent_metadata(args, disk_filters)

    _print(
        f"Agent {__version__} sending to {args.host} as '{args.server_slug}' every {interval:.2f}s",
        quiet=args.quiet,
    )
    if disk_filters:
        _print(f"Tracking disks: {', '.join(disk_filters)}", quiet=args.quiet)

    session = requests.Session()
    while True:
        started = time.monotonic()
        try:
            sample = collect_raw_metrics(
                disk_filters=disk_filters or None,
                cpu_sample_interval=max(0.0, float(args.cpu_sample_interval)),
            )
            result = post_sample(
                host=args.host,
                server_slug=args.server_slug,
                token=args.token,
                sample=sample,
                agent=agent,
                timeout=float(args.timeout),
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
        except KeyboardInterrupt:
            _print("Agent stopped.", quiet=args.quiet)
            return 0
        except Exception as exc:
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


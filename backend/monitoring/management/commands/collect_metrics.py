from __future__ import annotations

import time

from django.core.management.base import BaseCommand

from monitoring.services.collector import collect_and_store


class Command(BaseCommand):
    help = "Continuously sample system health metrics and store them in the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--interval",
            type=float,
            default=2.0,
            help="Sampling interval in seconds (default: 2.0)",
        )
        parser.add_argument(
            "--once",
            action="store_true",
            help="Collect a single sample and exit",
        )
        parser.add_argument(
            "--retention-days",
            type=int,
            default=None,
            help="Override retention cleanup window in days",
        )

    def _print_snapshot(self, snapshot):
        self.stdout.write(
            (
                f"{snapshot.collected_at.isoformat()} | "
                f"cpu={snapshot.cpu_usage_percent:.1f}% "
                f"gpu={snapshot.top_gpu_util_percent if snapshot.top_gpu_util_percent is not None else 'n/a'} "
                f"mem={snapshot.memory_percent:.1f}% "
                f"disk_util={snapshot.disk_util_percent:.1f}% "
                f"bottleneck={snapshot.bottleneck}"
            )
        )

    def handle(self, *args, **options):
        interval = max(0.5, float(options["interval"]))
        retention_days = options["retention_days"]
        once = bool(options["once"])

        if once:
            snapshot = collect_and_store(retention_days=retention_days)
            self._print_snapshot(snapshot)
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"Collecting metrics every {interval:.2f}s. Press Ctrl+C to stop."
            )
        )

        try:
            while True:
                loop_started = time.monotonic()
                snapshot = collect_and_store(retention_days=retention_days)
                self._print_snapshot(snapshot)
                elapsed = time.monotonic() - loop_started
                sleep_for = max(0.0, interval - elapsed)
                time.sleep(sleep_for)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Collector stopped."))

from __future__ import annotations

import hashlib
import hmac
import secrets
from typing import TYPE_CHECKING

from django.db import models
from django.utils.text import slugify

if TYPE_CHECKING:
    from django.db.models.manager import RelatedManager


class MonitoredServer(models.Model):
    id: int
    slug = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    hostname = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    api_token_hash = models.CharField(max_length=64, db_index=True)
    is_active = models.BooleanField(default=True)

    # Stable machine identifier (from /etc/machine-id on Linux) used to
    # deduplicate servers across agent re-installs on the same machine.
    machine_id = models.CharField(max_length=128, blank=True, null=True, unique=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_seen_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_ip = models.GenericIPAddressField(null=True, blank=True)
    last_agent_version = models.CharField(max_length=64, blank=True)
    agent_info = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["name", "slug"]
        indexes = [
            models.Index(fields=["is_active", "name"]),
            models.Index(fields=["-last_seen_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.slug})"

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def set_api_token(self, token: str) -> None:
        self.api_token_hash = self.hash_token(token)

    def check_api_token(self, token: str) -> bool:
        if not token or not self.api_token_hash:
            return False
        return hmac.compare_digest(self.api_token_hash, self.hash_token(token))

    @property
    def token_hint(self) -> str:
        return f"{self.api_token_hash[:8]}..." if self.api_token_hash else ""

    @classmethod
    def ensure_local_server(
        cls, *, slug: str = "local", name: str = "Local Host", hostname: str = ""
    ) -> "MonitoredServer":
        base_slug = slugify(slug or "local")[:64] or "local"
        defaults = {
            "name": (name or "Local Host")[:128],
            "hostname": hostname[:255] if hostname else "",
            "api_token_hash": cls.hash_token(cls.generate_token()),
            "is_active": True,
        }
        server, created = cls.objects.get_or_create(slug=base_slug, defaults=defaults)
        if not created:
            changed = False
            if hostname and server.hostname != hostname:
                server.hostname = hostname[:255]
                changed = True
            if name and server.name != name:
                server.name = name[:128]
                changed = True
            if not server.api_token_hash:
                server.api_token_hash = cls.hash_token(cls.generate_token())
                changed = True
            if changed:
                server.save(update_fields=["hostname", "name", "api_token_hash", "updated_at"])
        return server

    @classmethod
    def enroll_or_update(
        cls,
        *,
        machine_id: str,
        hostname: str,
        platform_info: str = "",
        agent_version: str = "",
        source_ip: str | None = None,
    ) -> tuple["MonitoredServer", str]:
        """Find or create a server by stable machine_id; rotate and return a fresh ingest token.

        Returns (server, plain_token).  The plain_token is returned only once here;
        the server stores its hash.  The agent must persist it.
        Multiple installs/uninstalls on the same machine will always resolve to the
        same MonitoredServer row because machine_id is unique.
        """
        from django.utils import timezone

        new_token = cls.generate_token()
        token_hash = cls.hash_token(new_token)

        # Build a deterministic slug from the hostname, deduplicated by machine_id.
        base_slug = slugify(hostname or machine_id[:32] or "agent")[:60] or "agent"

        server = cls.objects.filter(machine_id=machine_id).first()
        if server is None:
            # First-ever enrollment for this machine – create a new server.
            # Pick a unique slug (append suffix if needed).
            slug = base_slug
            suffix = 1
            while cls.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{suffix}"
                suffix += 1
            server = cls.objects.create(
                machine_id=machine_id,
                slug=slug,
                name=hostname[:128] or slug,
                hostname=hostname[:255],
                api_token_hash=token_hash,
                is_active=True,
                last_agent_version=agent_version[:64],
                agent_info={"platform": platform_info},
                last_ip=source_ip,
                last_seen_at=timezone.now(),
            )
        else:
            # Existing machine – update metadata and rotate token.
            update_fields = ["api_token_hash", "updated_at", "last_seen_at", "last_agent_version", "agent_info"]
            server.api_token_hash = token_hash
            server.last_seen_at = timezone.now()
            server.last_agent_version = agent_version[:64]
            server.agent_info = {"platform": platform_info}
            if hostname and server.hostname != hostname[:255]:
                server.hostname = hostname[:255]
                update_fields.append("hostname")
            if not server.is_active:
                server.is_active = True
                update_fields.append("is_active")
            if source_ip:
                server.last_ip = source_ip
                update_fields.append("last_ip")
            server.save(update_fields=update_fields)

        return server, new_token


class MetricSnapshot(models.Model):
    id: int
    server_id: int | None
    gpus: RelatedManager[GpuMetric]
    fans: RelatedManager[FanMetric]
    disks: RelatedManager[DiskMetric]
    server = models.ForeignKey(
        MonitoredServer,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="snapshots",
    )
    collected_at = models.DateTimeField(db_index=True)
    interval_seconds = models.FloatField(null=True, blank=True)

    cpu_usage_percent = models.FloatField(default=0)
    cpu_user_percent = models.FloatField(null=True, blank=True)
    cpu_system_percent = models.FloatField(null=True, blank=True)
    cpu_iowait_percent = models.FloatField(null=True, blank=True)
    cpu_load_1 = models.FloatField(null=True, blank=True)
    cpu_load_5 = models.FloatField(null=True, blank=True)
    cpu_load_15 = models.FloatField(null=True, blank=True)
    cpu_frequency_mhz = models.FloatField(null=True, blank=True)
    cpu_temperature_c = models.FloatField(null=True, blank=True)
    cpu_count_logical = models.IntegerField(default=0)
    cpu_count_physical = models.IntegerField(null=True, blank=True)

    memory_total_bytes = models.BigIntegerField(default=0)
    memory_used_bytes = models.BigIntegerField(default=0)
    memory_available_bytes = models.BigIntegerField(default=0)
    memory_percent = models.FloatField(default=0)
    swap_total_bytes = models.BigIntegerField(default=0)
    swap_used_bytes = models.BigIntegerField(default=0)
    swap_percent = models.FloatField(default=0)

    disk_read_bps = models.FloatField(default=0)
    disk_write_bps = models.FloatField(default=0)
    disk_read_iops = models.FloatField(default=0)
    disk_write_iops = models.FloatField(default=0)
    disk_util_percent = models.FloatField(default=0)
    disk_avg_util_percent = models.FloatField(default=0)

    network_rx_bps = models.FloatField(default=0)
    network_tx_bps = models.FloatField(default=0)
    network_rx_bytes_total = models.BigIntegerField(default=0)
    network_tx_bytes_total = models.BigIntegerField(default=0)

    process_count = models.IntegerField(default=0)

    fan_count = models.IntegerField(default=0)
    fan_max_rpm = models.FloatField(null=True, blank=True)
    fan_avg_rpm = models.FloatField(null=True, blank=True)

    gpu_present = models.BooleanField(default=False)
    gpu_count = models.IntegerField(default=0)
    top_gpu_util_percent = models.FloatField(null=True, blank=True)
    avg_gpu_util_percent = models.FloatField(null=True, blank=True)
    top_gpu_memory_percent = models.FloatField(null=True, blank=True)
    avg_gpu_memory_percent = models.FloatField(null=True, blank=True)

    bottleneck = models.CharField(max_length=32, default="unknown")
    bottleneck_confidence = models.FloatField(default=0)
    bottleneck_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-collected_at"]
        indexes = [
            models.Index(fields=["-collected_at"]),
            models.Index(fields=["server", "collected_at"]),
            models.Index(fields=["bottleneck", "-collected_at"]),
        ]

    def __str__(self) -> str:
        server_slug = self.server.slug if self.server_id and self.server else "unassigned"
        return f"{server_slug} {self.collected_at.isoformat()} ({self.bottleneck})"


class GpuMetric(models.Model):
    snapshot = models.ForeignKey(MetricSnapshot, on_delete=models.CASCADE, related_name="gpus")
    gpu_index = models.IntegerField()
    name = models.CharField(max_length=200)
    uuid = models.CharField(max_length=128, blank=True)

    utilization_gpu_percent = models.FloatField(null=True, blank=True)
    utilization_memory_percent = models.FloatField(null=True, blank=True)
    memory_total_bytes = models.BigIntegerField(default=0)
    memory_used_bytes = models.BigIntegerField(default=0)
    memory_percent = models.FloatField(null=True, blank=True)

    temperature_c = models.FloatField(null=True, blank=True)
    fan_speed_percent = models.FloatField(null=True, blank=True)
    power_w = models.FloatField(null=True, blank=True)
    power_limit_w = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["gpu_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["snapshot", "gpu_index"], name="uniq_gpu_metric_per_snapshot_index"
            )
        ]

    def __str__(self) -> str:
        return f"GPU {self.gpu_index} @ {self.snapshot.collected_at.isoformat()}"


class DiskMetric(models.Model):
    snapshot = models.ForeignKey(MetricSnapshot, on_delete=models.CASCADE, related_name="disks")
    device = models.CharField(max_length=64)

    read_bytes_total = models.BigIntegerField(default=0)
    write_bytes_total = models.BigIntegerField(default=0)
    read_count_total = models.BigIntegerField(default=0)
    write_count_total = models.BigIntegerField(default=0)
    busy_time_ms_total = models.BigIntegerField(null=True, blank=True)

    read_bps = models.FloatField(default=0)
    write_bps = models.FloatField(default=0)
    read_iops = models.FloatField(default=0)
    write_iops = models.FloatField(default=0)
    util_percent = models.FloatField(default=0)

    class Meta:
        ordering = ["device"]
        constraints = [
            models.UniqueConstraint(
                fields=["snapshot", "device"], name="uniq_disk_metric_per_snapshot_device"
            )
        ]
        indexes = [
            models.Index(fields=["device", "snapshot"]),
        ]

    def __str__(self) -> str:
        return f"{self.device} @ {self.snapshot.collected_at.isoformat()}"


class Notification(models.Model):
    id: int
    server_id: int | None
    LEVEL_CHOICES = [
        ("info", "Info"),
        ("warning", "Warning"),
        ("critical", "Critical"),
    ]

    server = models.ForeignKey(
        MonitoredServer,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    level = models.CharField(max_length=16, choices=LEVEL_CHOICES, default="info")
    code = models.CharField(max_length=64, blank=True, db_index=True)
    title = models.CharField(max_length=128)
    message = models.CharField(max_length=512, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at", "is_read"]),
            models.Index(fields=["code", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.level})"


class FanMetric(models.Model):
    snapshot = models.ForeignKey(MetricSnapshot, on_delete=models.CASCADE, related_name="fans")
    label = models.CharField(max_length=64)
    speed_rpm = models.IntegerField(default=0)

    class Meta:
        ordering = ["label"]
        constraints = [
            models.UniqueConstraint(
                fields=["snapshot", "label"], name="uniq_fan_metric_per_snapshot_label"
            )
        ]

    def __str__(self) -> str:
        return f"{self.label} @ {self.snapshot.collected_at.isoformat()}"

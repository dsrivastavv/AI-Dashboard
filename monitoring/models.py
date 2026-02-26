from __future__ import annotations

import hashlib
import hmac
import secrets

from django.db import models
from django.utils.text import slugify


class MonitoredServer(models.Model):
    slug = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    hostname = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    api_token_hash = models.CharField(max_length=64, db_index=True)
    is_active = models.BooleanField(default=True)

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


class MetricSnapshot(models.Model):
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

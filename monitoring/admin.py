from django.contrib import admin

from .models import DiskMetric, GpuMetric, MetricSnapshot, MonitoredServer


@admin.register(MonitoredServer)
class MonitoredServerAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "hostname",
        "is_active",
        "last_seen_at",
        "last_agent_version",
        "token_hint",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "slug", "hostname", "description")
    readonly_fields = (
        "api_token_hash",
        "token_hint",
        "created_at",
        "updated_at",
        "last_seen_at",
        "last_ip",
        "last_agent_version",
        "agent_info",
    )
    fieldsets = (
        (None, {"fields": ("name", "slug", "hostname", "description", "is_active")}),
        ("Ingest Auth", {"fields": ("api_token_hash", "token_hint")}),
        ("Agent Status", {"fields": ("last_seen_at", "last_ip", "last_agent_version", "agent_info")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def has_add_permission(self, request):
        # Tokens are generated via the management command.
        return False


class GpuMetricInline(admin.TabularInline):
    model = GpuMetric
    extra = 0
    can_delete = False
    fields = (
        "gpu_index",
        "name",
        "utilization_gpu_percent",
        "utilization_memory_percent",
        "memory_percent",
        "temperature_c",
        "power_w",
    )
    readonly_fields = fields


class DiskMetricInline(admin.TabularInline):
    model = DiskMetric
    extra = 0
    can_delete = False
    fields = ("device", "read_bps", "write_bps", "read_iops", "write_iops", "util_percent")
    readonly_fields = fields


@admin.register(MetricSnapshot)
class MetricSnapshotAdmin(admin.ModelAdmin):
    date_hierarchy = "collected_at"
    list_display = (
        "collected_at",
        "server",
        "bottleneck",
        "cpu_usage_percent",
        "top_gpu_util_percent",
        "memory_percent",
        "disk_util_percent",
        "disk_read_bps",
        "disk_write_bps",
    )
    list_filter = ("server", "bottleneck", "gpu_present")
    search_fields = ("bottleneck_reason", "server__name", "server__slug")
    inlines = [GpuMetricInline, DiskMetricInline]
    readonly_fields = [field.name for field in MetricSnapshot._meta.fields]

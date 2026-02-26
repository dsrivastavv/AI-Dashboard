from django.contrib import admin

from .models import DiskMetric, GpuMetric, MetricSnapshot


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
        "bottleneck",
        "cpu_usage_percent",
        "top_gpu_util_percent",
        "memory_percent",
        "disk_util_percent",
        "disk_read_bps",
        "disk_write_bps",
    )
    list_filter = ("bottleneck", "gpu_present")
    search_fields = ("bottleneck_reason",)
    inlines = [GpuMetricInline, DiskMetricInline]
    readonly_fields = [field.name for field in MetricSnapshot._meta.fields]

# Register your models here.

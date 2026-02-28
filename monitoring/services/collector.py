from __future__ import annotations

import os
import re
import socket
import subprocess
import warnings
from datetime import datetime, timedelta
from typing import Any

import psutil
from django.conf import settings
from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.utils import timezone

from monitoring.models import DiskMetric, FanMetric, GpuMetric, MetricSnapshot, MonitoredServer


PHYSICAL_DISK_RE = re.compile(r"^(nvme\d+n\d+|sd[a-z]+|vd[a-z]+|xvd[a-z]+|md\d+)$")


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _clamp_pct(value: float | None) -> float:
    if value is None:
        return 0.0
    return max(0.0, min(100.0, float(value)))


def _parse_csv_number(raw: str) -> float | None:
    raw = (raw or "").strip()
    if raw in {"", "N/A", "[Not Supported]"}:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def _detect_tracked_disks(per_disk_counters: dict[str, Any]) -> list[str]:
    if settings.MONITORING_DISKS:
        return [name for name in settings.MONITORING_DISKS if name in per_disk_counters]
    detected = [name for name in per_disk_counters if PHYSICAL_DISK_RE.match(name)]
    return sorted(detected)


def _collect_gpu_metrics_nvml() -> list[dict[str, Any]] | None:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=FutureWarning)
        try:
            import pynvml  # type: ignore
        except Exception:
            return None

    try:
        pynvml.nvmlInit()
    except Exception:
        return None

    gpus: list[dict[str, Any]] = []
    try:
        count = pynvml.nvmlDeviceGetCount()
        for idx in range(count):
            handle = pynvml.nvmlDeviceGetHandleByIndex(idx)

            name = pynvml.nvmlDeviceGetName(handle)
            if isinstance(name, bytes):
                name = name.decode("utf-8", errors="replace")

            uuid = ""
            try:
                uuid = pynvml.nvmlDeviceGetUUID(handle)
                if isinstance(uuid, bytes):
                    uuid = uuid.decode("utf-8", errors="replace")
            except Exception:
                pass

            util_gpu = None
            util_mem = None
            try:
                util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                util_gpu = float(util.gpu)
                util_mem = float(util.memory)
            except Exception:
                pass

            mem_total = 0
            mem_used = 0
            mem_percent = None
            try:
                mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
                mem_total = int(mem.total)
                mem_used = int(mem.used)
                mem_percent = (mem_used / mem_total * 100.0) if mem_total else None
            except Exception:
                pass

            temperature_c = None
            try:
                temperature_c = float(
                    pynvml.nvmlDeviceGetTemperature(
                        handle, pynvml.NVML_TEMPERATURE_GPU
                    )
                )
            except Exception:
                pass

            power_w = None
            try:
                power_w = float(pynvml.nvmlDeviceGetPowerUsage(handle)) / 1000.0
            except Exception:
                pass

            power_limit_w = None
            try:
                power_limit_w = float(pynvml.nvmlDeviceGetEnforcedPowerLimit(handle)) / 1000.0
            except Exception:
                try:
                    power_limit_w = float(pynvml.nvmlDeviceGetPowerManagementLimit(handle)) / 1000.0
                except Exception:
                    pass

            fan_speed_percent = None
            try:
                fan_speed_percent = float(pynvml.nvmlDeviceGetFanSpeed(handle))
            except Exception:
                pass

            gpus.append(
                {
                    "gpu_index": idx,
                    "name": str(name),
                    "uuid": str(uuid),
                    "utilization_gpu_percent": util_gpu,
                    "utilization_memory_percent": util_mem,
                    "memory_total_bytes": mem_total,
                    "memory_used_bytes": mem_used,
                    "memory_percent": mem_percent,
                    "temperature_c": temperature_c,
                    "fan_speed_percent": fan_speed_percent,
                    "power_w": power_w,
                    "power_limit_w": power_limit_w,
                }
            )
    finally:
        try:
            pynvml.nvmlShutdown()
        except Exception:
            pass

    return gpus


def _collect_gpu_metrics_nvidia_smi() -> list[dict[str, Any]]:
    cmd = [
        "nvidia-smi",
        "--query-gpu=index,name,uuid,utilization.gpu,utilization.memory,memory.total,memory.used,temperature.gpu,fan.speed,power.draw,power.limit",
        "--format=csv,noheader,nounits",
    ]
    try:
        result = subprocess.run(
            cmd,
            check=False,
            capture_output=True,
            text=True,
            timeout=2,
        )
    except (OSError, subprocess.SubprocessError):
        return []

    if result.returncode != 0 or not result.stdout.strip():
        return []

    gpus: list[dict[str, Any]] = []
    for line in result.stdout.splitlines():
        parts = [part.strip() for part in line.split(",")]
        if len(parts) < 11:
            continue
        mem_total_mib = _parse_csv_number(parts[5]) or 0.0
        mem_used_mib = _parse_csv_number(parts[6]) or 0.0
        mem_total_bytes = int(mem_total_mib * 1024 * 1024)
        mem_used_bytes = int(mem_used_mib * 1024 * 1024)
        mem_percent = (mem_used_bytes / mem_total_bytes * 100.0) if mem_total_bytes else None
        gpus.append(
            {
                "gpu_index": _to_int(_parse_csv_number(parts[0])),
                "name": parts[1],
                "uuid": parts[2],
                "utilization_gpu_percent": _parse_csv_number(parts[3]),
                "utilization_memory_percent": _parse_csv_number(parts[4]),
                "memory_total_bytes": mem_total_bytes,
                "memory_used_bytes": mem_used_bytes,
                "memory_percent": mem_percent,
                "temperature_c": _parse_csv_number(parts[7]),
                "fan_speed_percent": _parse_csv_number(parts[8]),
                "power_w": _parse_csv_number(parts[9]),
                "power_limit_w": _parse_csv_number(parts[10]) if len(parts) > 10 else None,
            }
        )
    return gpus


def collect_gpu_metrics() -> list[dict[str, Any]]:
    metrics = _collect_gpu_metrics_nvml()
    if metrics is not None:
        return metrics
    return _collect_gpu_metrics_nvidia_smi()


def _collect_fan_speeds() -> list[dict[str, Any]]:
    # 1) Try psutil sensors
    try:
        sensors = psutil.sensors_fans()
    except (AttributeError, NotImplementedError):
        sensors = {}
    except Exception:
        sensors = {}

    fans: list[dict[str, Any]] = []
    if sensors:
        for name, entries in sensors.items():
            for entry in entries:
                current = getattr(entry, "current", None)
                if current is None:
                    continue
                label = (getattr(entry, "label", "") or name or "Fan").strip() or "Fan"
                try:
                    rpm = int(current)
                except Exception:
                    continue
                fans.append({"label": label[:64], "speed_rpm": rpm})
        if fans:
            return fans

    # 2) Fallback to in-band IPMI if available (passwordless via -I open)
    try:
        result = subprocess.run(
            ["ipmitool", "-I", "open", "sdr", "type", "Fan"],
            check=False,
            capture_output=True,
            text=True,
            timeout=3,
        )
    except (OSError, subprocess.SubprocessError, ValueError):
        return []

    if result.returncode != 0 or not result.stdout:
        return []

    for line in result.stdout.splitlines():
        # Expected format: NAME | id | status | xx.x | 1234 RPM
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 5:
            continue
        label = parts[0] or "Fan"
        reading = parts[-1]
        if "RPM" not in reading or "No Reading" in reading:
            continue
        num_part = reading.split("RPM", 1)[0].strip()
        try:
            rpm = int(float(num_part))
        except Exception:
            continue
        fans.append({"label": label[:64], "speed_rpm": rpm})

    return fans


def _safe_loadavg() -> tuple[float | None, float | None, float | None]:
    try:
        load1, load5, load15 = os.getloadavg()
        return float(load1), float(load5), float(load15)
    except (AttributeError, OSError):
        return None, None, None


def _read_cpu_temperature_c() -> float | None:
    """Best-effort CPU package temperature in Celsius.

    psutil may expose multiple sensors; prefer entries that look CPU-related
    and fall back to the hottest available reading. Returns None if not
    available on this platform.
    """

    try:
        readings = psutil.sensors_temperatures(fahrenheit=False)
    except (AttributeError, NotImplementedError):
        return None
    except Exception:
        return None

    if not readings:
        return None

    preferred: list[float] = []
    fallback: list[float] = []
    cpu_sensor_names = {"coretemp", "k10temp", "cpu-thermal", "cpu_thermal", "acpitz"}

    for name, entries in readings.items():
        sensor_name = (name or "").lower()
        for entry in entries:
            current = getattr(entry, "current", None)
            if current is None:
                continue
            value = float(current)
            label = (getattr(entry, "label", "") or "").lower()
            fallback.append(value)
            if (
                sensor_name in cpu_sensor_names
                or "cpu" in label
                or "package" in label
                or label.startswith("tctl")
            ):
                preferred.append(value)

    target = preferred or fallback
    if not target:
        return None
    return max(target)


def collect_raw_metrics() -> dict[str, Any]:
    # Short interval gives a meaningful CPU reading without slowing the loop much.
    cpu_usage_percent = float(psutil.cpu_percent(interval=0.2))
    cpu_times_pct = psutil.cpu_times_percent(interval=None)
    cpu_freq = psutil.cpu_freq()
    cpu_temperature_c = _read_cpu_temperature_c()
    vmem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    load1, load5, load15 = _safe_loadavg()

    per_disk_counters = psutil.disk_io_counters(perdisk=True, nowrap=True) or {}
    tracked_disks = _detect_tracked_disks(per_disk_counters)
    disk_rows: list[dict[str, Any]] = []
    for device in tracked_disks:
        counter = per_disk_counters.get(device)
        if not counter:
            continue
        disk_rows.append(
            {
                "device": device,
                "read_bytes_total": _to_int(getattr(counter, "read_bytes", 0)),
                "write_bytes_total": _to_int(getattr(counter, "write_bytes", 0)),
                "read_count_total": _to_int(getattr(counter, "read_count", 0)),
                "write_count_total": _to_int(getattr(counter, "write_count", 0)),
                "busy_time_ms_total": _to_int(getattr(counter, "busy_time", 0)),
            }
        )

    net = psutil.net_io_counters(nowrap=True)
    gpus = collect_gpu_metrics()
    fans = _collect_fan_speeds()

    return {
        "collected_at": timezone.now(),
        "cpu_usage_percent": cpu_usage_percent,
        "cpu_user_percent": _to_float(getattr(cpu_times_pct, "user", None)),
        "cpu_system_percent": _to_float(getattr(cpu_times_pct, "system", None)),
        "cpu_iowait_percent": _to_float(getattr(cpu_times_pct, "iowait", None)),
        "cpu_load_1": load1,
        "cpu_load_5": load5,
        "cpu_load_15": load15,
        "cpu_frequency_mhz": _to_float(getattr(cpu_freq, "current", None) if cpu_freq else None),
        "cpu_temperature_c": cpu_temperature_c,
        "cpu_count_logical": psutil.cpu_count(logical=True) or 0,
        "cpu_count_physical": psutil.cpu_count(logical=False),
        "memory_total_bytes": int(vmem.total),
        "memory_used_bytes": int(vmem.used),
        "memory_available_bytes": int(vmem.available),
        "memory_percent": float(vmem.percent),
        "swap_total_bytes": int(swap.total),
        "swap_used_bytes": int(swap.used),
        "swap_percent": float(swap.percent),
        "network_rx_bytes_total": _to_int(getattr(net, "bytes_recv", 0)),
        "network_tx_bytes_total": _to_int(getattr(net, "bytes_sent", 0)),
        "process_count": len(psutil.pids()),
        "disks": disk_rows,
        "gpus": gpus,
        "fans": fans,
    }


def _derive_disk_rates(
    current: dict[str, Any],
    previous: DiskMetric | None,
    interval_seconds: float | None,
) -> dict[str, float]:
    if not previous or not interval_seconds or interval_seconds <= 0:
        return {
            "read_bps": 0.0,
            "write_bps": 0.0,
            "read_iops": 0.0,
            "write_iops": 0.0,
            "util_percent": 0.0,
        }

    dt = interval_seconds
    delta_read_bytes = max(0, current["read_bytes_total"] - previous.read_bytes_total)
    delta_write_bytes = max(0, current["write_bytes_total"] - previous.write_bytes_total)
    delta_read_count = max(0, current["read_count_total"] - previous.read_count_total)
    delta_write_count = max(0, current["write_count_total"] - previous.write_count_total)

    util_percent = 0.0
    prev_busy = previous.busy_time_ms_total
    curr_busy = current.get("busy_time_ms_total")
    if prev_busy is not None and curr_busy is not None:
        delta_busy_ms = max(0, curr_busy - prev_busy)
        util_percent = _clamp_pct((delta_busy_ms / (dt * 1000.0)) * 100.0)

    return {
        "read_bps": delta_read_bytes / dt,
        "write_bps": delta_write_bytes / dt,
        "read_iops": delta_read_count / dt,
        "write_iops": delta_write_count / dt,
        "util_percent": util_percent,
    }


def _derive_network_rates(
    current_rx_total: int,
    current_tx_total: int,
    previous: MetricSnapshot | None,
    interval_seconds: float | None,
) -> tuple[float, float]:
    if not previous or not interval_seconds or interval_seconds <= 0:
        return 0.0, 0.0
    dt = interval_seconds
    rx_delta = max(0, current_rx_total - previous.network_rx_bytes_total)
    tx_delta = max(0, current_tx_total - previous.network_tx_bytes_total)
    return rx_delta / dt, tx_delta / dt


def _classify_bottleneck(
    *,
    cpu_usage_percent: float,
    cpu_iowait_percent: float | None,
    memory_percent: float,
    swap_percent: float,
    gpu_max_util_percent: float | None,
    disk_util_percent: float,
    disk_read_bps: float,
    disk_write_bps: float,
) -> tuple[str, float, str]:
    cpu = _clamp_pct(cpu_usage_percent)
    gpu = gpu_max_util_percent
    disk = _clamp_pct(disk_util_percent)
    mem = _clamp_pct(memory_percent)
    swap = _clamp_pct(swap_percent)
    iowait = _clamp_pct(cpu_iowait_percent)
    disk_mb_s = (disk_read_bps + disk_write_bps) / (1024 * 1024)

    if gpu is None:
        if mem >= 92 or swap >= 20 or (swap >= 5 and mem >= 80):
            return "memory-pressure", 0.82, f"Memory {mem:.0f}% / swap {swap:.0f}%"
        if disk >= 80 or iowait >= 20:
            return "io-bound", 0.74, f"Disk util {disk:.0f}% / iowait {iowait:.0f}%"
        if cpu >= 85:
            return "cpu-bound", 0.78, f"CPU {cpu:.0f}% with no GPU telemetry"
        if cpu < 15:
            return "idle", 0.9, "Low CPU and no GPU telemetry"
        return "balanced", 0.45, "No GPU telemetry available"

    gpu = _clamp_pct(gpu)
    if mem >= 95 or swap >= 20 or (swap >= 5 and mem >= 80):
        return "memory-pressure", 0.9, f"Memory {mem:.0f}% / swap {swap:.0f}%"

    if gpu < 55:
        if disk >= 70 or iowait >= 15:
            return "io-bound", 0.88, f"GPU {gpu:.0f}% low while disk {disk:.0f}% / iowait {iowait:.0f}%"
        if cpu >= 85:
            return "cpu-bound", 0.87, f"GPU {gpu:.0f}% low while CPU {cpu:.0f}% is high"
        if mem >= 88 or (swap >= 8 and mem >= 75):
            return "memory-pressure", 0.75, f"GPU {gpu:.0f}% low while memory {mem:.0f}% is high"
        if gpu < 20 and cpu < 30 and disk < 25:
            return "idle", 0.85, "GPU, CPU, and disk activity are all low"
        return "underutilized", 0.55, f"GPU {gpu:.0f}% below target; check dataloader or batch size"

    if gpu >= 90 and cpu < 80 and disk < 70 and iowait < 10:
        return "gpu-bound", 0.9, f"GPU {gpu:.0f}% saturated while CPU {cpu:.0f}% and disk {disk:.0f}% are lower"

    if cpu >= 90 and gpu >= 70:
        return "mixed-cpu-gpu", 0.72, f"CPU {cpu:.0f}% and GPU {gpu:.0f}% are both high"

    if disk >= 85 and gpu >= 60:
        return "mixed-io-gpu", 0.7, f"Disk util {disk:.0f}% and GPU {gpu:.0f}% are both high"

    if 55 <= gpu < 90 and cpu < 80 and disk < 70 and disk_mb_s < 2048:
        return "balanced", 0.65, f"GPU {gpu:.0f}% with CPU {cpu:.0f}% and disk util {disk:.0f}%"

    return "mixed", 0.5, f"CPU {cpu:.0f}%, GPU {gpu:.0f}%, disk {disk:.0f}%"


def _parse_collected_at(value: Any) -> datetime:
    if isinstance(value, datetime):
        dt = value
    else:
        dt = parse_datetime(str(value)) if value else None
    if dt is None:
        return timezone.now()
    if timezone.is_naive(dt):
        return timezone.make_aware(dt, timezone.get_current_timezone())
    return dt


def _normalize_raw_metrics(raw: dict[str, Any]) -> dict[str, Any]:
    raw = dict(raw or {})
    disks = raw.get("disks") or []
    gpus = raw.get("gpus") or []
    fans = raw.get("fans") or []
    normalized_disks: list[dict[str, Any]] = []
    for disk in disks:
        if not isinstance(disk, dict):
            continue
        device = str(disk.get("device", "")).strip()
        if not device:
            continue
        normalized_disks.append(
            {
                "device": device[:64],
                "read_bytes_total": _to_int(disk.get("read_bytes_total", 0)),
                "write_bytes_total": _to_int(disk.get("write_bytes_total", 0)),
                "read_count_total": _to_int(disk.get("read_count_total", 0)),
                "write_count_total": _to_int(disk.get("write_count_total", 0)),
                "busy_time_ms_total": _to_int(disk.get("busy_time_ms_total", 0)),
            }
        )

    normalized_gpus: list[dict[str, Any]] = []
    for gpu in gpus:
        if not isinstance(gpu, dict):
            continue
        normalized_gpus.append(
            {
                "gpu_index": _to_int(gpu.get("gpu_index", 0)),
                "name": str(gpu.get("name", "GPU"))[:200],
                "uuid": str(gpu.get("uuid", ""))[:128],
                "utilization_gpu_percent": _to_float(gpu.get("utilization_gpu_percent")),
                "utilization_memory_percent": _to_float(gpu.get("utilization_memory_percent")),
                "memory_total_bytes": _to_int(gpu.get("memory_total_bytes", 0)),
                "memory_used_bytes": _to_int(gpu.get("memory_used_bytes", 0)),
                "memory_percent": _to_float(gpu.get("memory_percent")),
                "temperature_c": _to_float(gpu.get("temperature_c")),
                "fan_speed_percent": _to_float(gpu.get("fan_speed_percent")),
                "power_w": _to_float(gpu.get("power_w")),
                "power_limit_w": _to_float(gpu.get("power_limit_w")),
            }
        )

    normalized_fans: list[dict[str, Any]] = []
    for fan in fans:
        if not isinstance(fan, dict):
            continue
        label = str(fan.get("label", "Fan")).strip() or "Fan"
        normalized_fans.append(
            {
                "label": label[:64],
                "speed_rpm": _to_int(fan.get("speed_rpm", 0)),
            }
        )

    return {
        "collected_at": _parse_collected_at(raw.get("collected_at")),
        "cpu_usage_percent": _to_float(raw.get("cpu_usage_percent")) or 0.0,
        "cpu_user_percent": _to_float(raw.get("cpu_user_percent")),
        "cpu_system_percent": _to_float(raw.get("cpu_system_percent")),
        "cpu_iowait_percent": _to_float(raw.get("cpu_iowait_percent")),
        "cpu_load_1": _to_float(raw.get("cpu_load_1")),
        "cpu_load_5": _to_float(raw.get("cpu_load_5")),
        "cpu_load_15": _to_float(raw.get("cpu_load_15")),
        "cpu_frequency_mhz": _to_float(raw.get("cpu_frequency_mhz")),
        "cpu_temperature_c": _to_float(raw.get("cpu_temperature_c")),
        "cpu_count_logical": _to_int(raw.get("cpu_count_logical", 0)),
        "cpu_count_physical": _to_int(raw.get("cpu_count_physical", 0)) or None,
        "memory_total_bytes": _to_int(raw.get("memory_total_bytes", 0)),
        "memory_used_bytes": _to_int(raw.get("memory_used_bytes", 0)),
        "memory_available_bytes": _to_int(raw.get("memory_available_bytes", 0)),
        "memory_percent": _to_float(raw.get("memory_percent")) or 0.0,
        "swap_total_bytes": _to_int(raw.get("swap_total_bytes", 0)),
        "swap_used_bytes": _to_int(raw.get("swap_used_bytes", 0)),
        "swap_percent": _to_float(raw.get("swap_percent")) or 0.0,
        "network_rx_bytes_total": _to_int(raw.get("network_rx_bytes_total", 0)),
        "network_tx_bytes_total": _to_int(raw.get("network_tx_bytes_total", 0)),
        "process_count": _to_int(raw.get("process_count", 0)),
        "disks": normalized_disks,
        "gpus": normalized_gpus,
        "fans": normalized_fans,
    }


def store_raw_metrics_for_server(
    server: MonitoredServer,
    raw_metrics: dict[str, Any],
    *,
    retention_days: int | None = None,
) -> MetricSnapshot:
    raw = _normalize_raw_metrics(raw_metrics)

    previous = (
        MetricSnapshot.objects.filter(server=server)
        .order_by("-collected_at")
        .prefetch_related("disks")
        .first()
    )
    interval_seconds: float | None = None
    if previous:
        delta = (raw["collected_at"] - previous.collected_at).total_seconds()
        if delta > 0:
            interval_seconds = delta

    previous_disks = {disk.device: disk for disk in (previous.disks.all() if previous else [])}

    disk_rows_to_create: list[DiskMetric] = []
    disk_read_bps_total = 0.0
    disk_write_bps_total = 0.0
    disk_read_iops_total = 0.0
    disk_write_iops_total = 0.0
    disk_utils: list[float] = []

    for disk_row in raw["disks"]:
        rates = _derive_disk_rates(disk_row, previous_disks.get(disk_row["device"]), interval_seconds)
        disk_read_bps_total += rates["read_bps"]
        disk_write_bps_total += rates["write_bps"]
        disk_read_iops_total += rates["read_iops"]
        disk_write_iops_total += rates["write_iops"]
        disk_utils.append(rates["util_percent"])
        disk_rows_to_create.append(
            DiskMetric(
                device=disk_row["device"],
                read_bytes_total=disk_row["read_bytes_total"],
                write_bytes_total=disk_row["write_bytes_total"],
                read_count_total=disk_row["read_count_total"],
                write_count_total=disk_row["write_count_total"],
                busy_time_ms_total=disk_row["busy_time_ms_total"],
                read_bps=rates["read_bps"],
                write_bps=rates["write_bps"],
                read_iops=rates["read_iops"],
                write_iops=rates["write_iops"],
                util_percent=rates["util_percent"],
            )
        )

    network_rx_bps, network_tx_bps = _derive_network_rates(
        raw["network_rx_bytes_total"],
        raw["network_tx_bytes_total"],
        previous,
        interval_seconds,
    )

    gpus = raw["gpus"]
    gpu_utils = [gpu["utilization_gpu_percent"] for gpu in gpus if gpu["utilization_gpu_percent"] is not None]
    gpu_mem_pcts = [gpu["memory_percent"] for gpu in gpus if gpu["memory_percent"] is not None]
    top_gpu_util = max(gpu_utils) if gpu_utils else None
    avg_gpu_util = (sum(gpu_utils) / len(gpu_utils)) if gpu_utils else None
    top_gpu_mem = max(gpu_mem_pcts) if gpu_mem_pcts else None
    avg_gpu_mem = (sum(gpu_mem_pcts) / len(gpu_mem_pcts)) if gpu_mem_pcts else None

    disk_max_util = max(disk_utils) if disk_utils else 0.0
    disk_avg_util = (sum(disk_utils) / len(disk_utils)) if disk_utils else 0.0

    fans = raw.get("fans", [])
    fan_speeds = [fan.get("speed_rpm") for fan in fans if fan.get("speed_rpm") is not None]
    fan_count = len(fans)
    fan_max_rpm = max(fan_speeds) if fan_speeds else None
    fan_avg_rpm = (sum(fan_speeds) / len(fan_speeds)) if fan_speeds else None

    bottleneck, confidence, reason = _classify_bottleneck(
        cpu_usage_percent=raw["cpu_usage_percent"],
        cpu_iowait_percent=raw["cpu_iowait_percent"],
        memory_percent=raw["memory_percent"],
        swap_percent=raw["swap_percent"],
        gpu_max_util_percent=top_gpu_util,
        disk_util_percent=disk_max_util,
        disk_read_bps=disk_read_bps_total,
        disk_write_bps=disk_write_bps_total,
    )

    with transaction.atomic():
        snapshot = MetricSnapshot.objects.create(
            server=server,
            collected_at=raw["collected_at"],
            interval_seconds=interval_seconds,
            cpu_usage_percent=raw["cpu_usage_percent"],
            cpu_user_percent=raw["cpu_user_percent"],
            cpu_system_percent=raw["cpu_system_percent"],
            cpu_iowait_percent=raw["cpu_iowait_percent"],
            cpu_load_1=raw["cpu_load_1"],
            cpu_load_5=raw["cpu_load_5"],
            cpu_load_15=raw["cpu_load_15"],
            cpu_frequency_mhz=raw["cpu_frequency_mhz"],
            cpu_temperature_c=raw["cpu_temperature_c"],
            cpu_count_logical=raw["cpu_count_logical"],
            cpu_count_physical=raw["cpu_count_physical"],
            memory_total_bytes=raw["memory_total_bytes"],
            memory_used_bytes=raw["memory_used_bytes"],
            memory_available_bytes=raw["memory_available_bytes"],
            memory_percent=raw["memory_percent"],
            swap_total_bytes=raw["swap_total_bytes"],
            swap_used_bytes=raw["swap_used_bytes"],
            swap_percent=raw["swap_percent"],
            disk_read_bps=disk_read_bps_total,
            disk_write_bps=disk_write_bps_total,
            disk_read_iops=disk_read_iops_total,
            disk_write_iops=disk_write_iops_total,
            disk_util_percent=disk_max_util,
            disk_avg_util_percent=disk_avg_util,
            network_rx_bps=network_rx_bps,
            network_tx_bps=network_tx_bps,
            network_rx_bytes_total=raw["network_rx_bytes_total"],
            network_tx_bytes_total=raw["network_tx_bytes_total"],
            process_count=raw["process_count"],
            fan_count=fan_count,
            fan_max_rpm=fan_max_rpm,
            fan_avg_rpm=fan_avg_rpm,
            gpu_present=bool(gpus),
            gpu_count=len(gpus),
            top_gpu_util_percent=top_gpu_util,
            avg_gpu_util_percent=avg_gpu_util,
            top_gpu_memory_percent=top_gpu_mem,
            avg_gpu_memory_percent=avg_gpu_mem,
            bottleneck=bottleneck,
            bottleneck_confidence=confidence,
            bottleneck_reason=reason,
        )

        for row in disk_rows_to_create:
            row.snapshot = snapshot
        if disk_rows_to_create:
            DiskMetric.objects.bulk_create(disk_rows_to_create)

        gpu_rows = [
            GpuMetric(
                snapshot=snapshot,
                gpu_index=gpu["gpu_index"],
                name=gpu["name"],
                uuid=gpu.get("uuid", "") or "",
                utilization_gpu_percent=gpu.get("utilization_gpu_percent"),
                utilization_memory_percent=gpu.get("utilization_memory_percent"),
                memory_total_bytes=gpu.get("memory_total_bytes", 0) or 0,
                memory_used_bytes=gpu.get("memory_used_bytes", 0) or 0,
                memory_percent=gpu.get("memory_percent"),
                temperature_c=gpu.get("temperature_c"),
                fan_speed_percent=gpu.get("fan_speed_percent"),
                power_w=gpu.get("power_w"),
                power_limit_w=gpu.get("power_limit_w"),
            )
            for gpu in gpus
        ]
        if gpu_rows:
            GpuMetric.objects.bulk_create(gpu_rows)

        fan_rows = [
            FanMetric(snapshot=snapshot, label=fan["label"], speed_rpm=fan.get("speed_rpm", 0))
            for fan in fans
        ]
        if fan_rows:
            FanMetric.objects.bulk_create(fan_rows)

        days = settings.MONITORING_RETENTION_DAYS if retention_days is None else retention_days
        if days and days > 0:
            cutoff = raw["collected_at"] - timedelta(days=days)
            MetricSnapshot.objects.filter(server=server, collected_at__lt=cutoff).delete()

    return snapshot


def _update_server_heartbeat(
    server: MonitoredServer,
    *,
    collected_at: datetime | None = None,
    source_ip: str | None = None,
    agent_info: dict[str, Any] | None = None,
) -> None:
    updates: list[str] = []
    if collected_at and server.last_seen_at != collected_at:
        server.last_seen_at = collected_at
        updates.append("last_seen_at")
    if source_ip and server.last_ip != source_ip:
        server.last_ip = source_ip
        updates.append("last_ip")
    if agent_info:
        hostname = str(agent_info.get("hostname", "") or "")[:255]
        agent_version = str(agent_info.get("version", "") or "")[:64]
        if hostname and server.hostname != hostname:
            server.hostname = hostname
            updates.append("hostname")
        if agent_version and server.last_agent_version != agent_version:
            server.last_agent_version = agent_version
            updates.append("last_agent_version")
        # Keep a compact copy of agent metadata for troubleshooting.
        sanitized = {str(k)[:64]: agent_info[k] for k in list(agent_info.keys())[:25]}
        if sanitized != (server.agent_info or {}):
            server.agent_info = sanitized
            updates.append("agent_info")
    if updates:
        server.save(update_fields=list(dict.fromkeys(updates + ["updated_at"])))


def ingest_sample_for_server(
    server: MonitoredServer,
    payload: dict[str, Any],
    *,
    source_ip: str | None = None,
) -> MetricSnapshot:
    sample = payload.get("sample") if isinstance(payload, dict) else None
    if not isinstance(sample, dict):
        sample = payload if isinstance(payload, dict) else {}
    agent_info = payload.get("agent") if isinstance(payload, dict) and isinstance(payload.get("agent"), dict) else {}
    retention_days = payload.get("retention_days") if isinstance(payload, dict) else None
    if not isinstance(retention_days, int):
        retention_days = None

    snapshot = store_raw_metrics_for_server(server, sample, retention_days=retention_days)
    _update_server_heartbeat(
        server,
        collected_at=snapshot.collected_at,
        source_ip=source_ip,
        agent_info=agent_info,
    )
    return snapshot


def _get_or_create_local_server() -> MonitoredServer:
    slug = os.environ.get("MONITORING_LOCAL_SERVER_SLUG", "local")
    name = os.environ.get("MONITORING_LOCAL_SERVER_NAME", "Local Host")
    hostname = socket.gethostname()
    return MonitoredServer.ensure_local_server(slug=slug, name=name, hostname=hostname)


def collect_and_store(
    *,
    retention_days: int | None = None,
    server: MonitoredServer | None = None,
) -> MetricSnapshot:
    target_server = server or _get_or_create_local_server()
    raw = collect_raw_metrics()
    snapshot = store_raw_metrics_for_server(target_server, raw, retention_days=retention_days)
    _update_server_heartbeat(
        target_server,
        collected_at=snapshot.collected_at,
        agent_info={"hostname": socket.gethostname(), "version": "django-local-collector"},
    )
    return snapshot

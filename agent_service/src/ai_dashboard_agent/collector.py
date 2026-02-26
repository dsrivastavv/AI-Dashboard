from __future__ import annotations

import os
import re
import subprocess
import warnings
from datetime import datetime, timezone
from typing import Any

import psutil


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


def _parse_csv_number(raw: str) -> float | None:
    raw = (raw or "").strip()
    if raw in {"", "N/A", "[Not Supported]"}:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def detect_tracked_disks(
    per_disk_counters: dict[str, Any], disk_filters: list[str] | None = None
) -> list[str]:
    if disk_filters:
        return [name for name in disk_filters if name in per_disk_counters]
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
                    pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
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
        "--query-gpu=index,name,uuid,utilization.gpu,utilization.memory,memory.total,memory.used,temperature.gpu,power.draw,power.limit",
        "--format=csv,noheader,nounits",
    ]
    try:
        result = subprocess.run(
            cmd, check=False, capture_output=True, text=True, timeout=2
        )
    except (OSError, subprocess.SubprocessError):
        return []

    if result.returncode != 0 or not result.stdout.strip():
        return []

    gpus: list[dict[str, Any]] = []
    for line in result.stdout.splitlines():
        parts = [part.strip() for part in line.split(",")]
        if len(parts) < 10:
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
                "power_w": _parse_csv_number(parts[8]),
                "power_limit_w": _parse_csv_number(parts[9]),
            }
        )
    return gpus


def collect_gpu_metrics() -> list[dict[str, Any]]:
    metrics = _collect_gpu_metrics_nvml()
    if metrics is not None:
        return metrics
    return _collect_gpu_metrics_nvidia_smi()


def _safe_loadavg() -> tuple[float | None, float | None, float | None]:
    try:
        load1, load5, load15 = os.getloadavg()
        return float(load1), float(load5), float(load15)
    except (AttributeError, OSError):
        return None, None, None


def collect_raw_metrics(
    *,
    disk_filters: list[str] | None = None,
    cpu_sample_interval: float = 0.2,
) -> dict[str, Any]:
    cpu_usage_percent = float(psutil.cpu_percent(interval=max(0.0, cpu_sample_interval)))
    cpu_times_pct = psutil.cpu_times_percent(interval=None)
    cpu_freq = psutil.cpu_freq()
    vmem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    load1, load5, load15 = _safe_loadavg()

    per_disk_counters = psutil.disk_io_counters(perdisk=True, nowrap=True) or {}
    tracked_disks = detect_tracked_disks(per_disk_counters, disk_filters)
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
    return {
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "cpu_usage_percent": cpu_usage_percent,
        "cpu_user_percent": _to_float(getattr(cpu_times_pct, "user", None)),
        "cpu_system_percent": _to_float(getattr(cpu_times_pct, "system", None)),
        "cpu_iowait_percent": _to_float(getattr(cpu_times_pct, "iowait", None)),
        "cpu_load_1": load1,
        "cpu_load_5": load5,
        "cpu_load_15": load15,
        "cpu_frequency_mhz": _to_float(getattr(cpu_freq, "current", None) if cpu_freq else None),
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
    }


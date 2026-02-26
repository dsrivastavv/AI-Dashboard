export interface ApiErrorResponse {
  ok: false;
  error: string;
  auth_required?: boolean;
  login_url?: string;
  [key: string]: unknown;
}

export interface ServerSummary {
  id: number;
  slug: string;
  name: string;
  hostname: string;
  description: string;
  is_active: boolean;
  last_seen_at: string | null;
  last_agent_version: string;
  snapshot_count?: number | null;
  latest_snapshot_at?: string | null;
}

export interface GpuDeviceMetric {
  gpu_index: number;
  name: string;
  uuid: string;
  utilization_gpu_percent: number | null;
  utilization_memory_percent: number | null;
  memory_total_bytes: number;
  memory_used_bytes: number;
  memory_percent: number | null;
  temperature_c: number | null;
  power_w: number | null;
  power_limit_w: number | null;
}

export interface DiskDeviceMetric {
  device: string;
  read_bps: number;
  write_bps: number;
  read_iops: number;
  write_iops: number;
  util_percent: number;
  read_bytes_total: number;
  write_bytes_total: number;
}

export interface MetricSnapshot {
  id: number;
  server: ServerSummary | null;
  collected_at: string;
  age_seconds: number;
  interval_seconds: number | null;
  cpu: {
    usage_percent: number;
    user_percent: number | null;
    system_percent: number | null;
    iowait_percent: number | null;
    load_1: number | null;
    load_5: number | null;
    load_15: number | null;
    frequency_mhz: number | null;
    count_logical: number;
    count_physical: number | null;
  };
  memory: {
    total_bytes: number;
    used_bytes: number;
    available_bytes: number;
    percent: number;
    swap_total_bytes: number;
    swap_used_bytes: number;
    swap_percent: number;
  };
  disk: {
    read_bps: number;
    write_bps: number;
    read_iops: number;
    write_iops: number;
    util_percent: number;
    avg_util_percent: number;
    devices: DiskDeviceMetric[];
  };
  network: {
    rx_bps: number;
    tx_bps: number;
  };
  process_count: number;
  gpu: {
    present: boolean;
    count: number;
    top_util_percent: number | null;
    avg_util_percent: number | null;
    top_memory_percent: number | null;
    avg_memory_percent: number | null;
    devices: GpuDeviceMetric[];
  };
  bottleneck: {
    label: string;
    title: string;
    confidence: number;
    reason: string;
  };
}

export interface ServersListResponse {
  ok: true;
  servers: ServerSummary[];
}

export interface LatestSnapshotResponse {
  ok: true;
  servers: ServerSummary[];
  selected_server: ServerSummary;
  snapshot: MetricSnapshot;
}

export interface LatestSnapshotNotFoundResponse extends ApiErrorResponse {
  servers?: ServerSummary[];
  selected_server?: ServerSummary;
}

export interface HistoryPointGpu {
  gpu_index: number;
  utilization_gpu_percent: number | null;
  memory_percent: number | null;
  temperature_c: number | null;
}

export interface HistoryPointDisk {
  device: string;
  read_bps: number;
  write_bps: number;
  util_percent: number;
}

export interface HistoryPoint {
  collected_at: string;
  cpu_usage_percent: number;
  cpu_iowait_percent: number | null;
  memory_percent: number;
  swap_percent: number;
  disk_read_bps: number;
  disk_write_bps: number;
  disk_util_percent: number;
  disk_avg_util_percent: number | null;
  network_rx_bps: number;
  network_tx_bps: number;
  gpu_top_util_percent: number | null;
  gpu_avg_util_percent: number | null;
  gpu_top_memory_percent: number | null;
  bottleneck: string;
  gpus: HistoryPointGpu[];
  disks: HistoryPointDisk[];
}

export interface HistoryMetricsResponse {
  ok: true;
  minutes: number;
  point_count: number;
  stride: number;
  servers: ServerSummary[];
  selected_server: ServerSummary | null;
  points: HistoryPoint[];
}

import Foundation

struct ApiErrorResponse: Codable {
    let ok: Bool
    let error: String
    let auth_required: Bool?
    let login_url: String?
}

struct SystemInfoPartition: Codable, Hashable {
    let device: String
    let mountpoint: String
    let fstype: String
    let total_bytes: Double
    let used_bytes: Double
    let free_bytes: Double
    let percent: Double
}

struct SystemInfoNetworkInterface: Codable, Hashable {
    let name: String
    let ipv4: String?
    let ipv6: String?
}

struct AgentSystemInfo: Codable {
    let os_name: String
    let os_release: String
    let os_version: String
    let machine: String
    let processor: String
    let cpu_model: String
    let hostname: String
    let cpu_count_logical: Int
    let cpu_count_physical: Int?
    let memory_total_bytes: Double
    let swap_total_bytes: Double
    let boot_time: String
    let uptime_seconds: Int
    let python_version: String
    let platform_full: String
    let partitions: [SystemInfoPartition]
    let interfaces: [SystemInfoNetworkInterface]
}

struct AgentInfo: Codable {
    let version: String?
    let hostname: String?
    let user: String?
    let platform: String?
    let python: String?
    let pid: Int?
    let labels: [String: String]?
    let disk_filters: [String]?
    let system_info: AgentSystemInfo?
}

struct ServerSummary: Codable, Identifiable {
    let id: Int
    let slug: String
    let name: String
    let hostname: String
    let agent_user: String?
    let description: String?
    let is_active: Bool
    let last_seen_at: String?
    let last_agent_version: String?
    let snapshot_count: Int?
    let latest_snapshot_at: String?
    let agent_info: AgentInfo?
}

struct GpuDeviceMetric: Codable, Hashable {
    let gpu_index: Int
    let name: String
    let uuid: String
    let utilization_gpu_percent: Double?
    let utilization_memory_percent: Double?
    let memory_total_bytes: Double
    let memory_used_bytes: Double
    let memory_percent: Double?
    let temperature_c: Double?
    let fan_speed_percent: Double?
    let power_w: Double?
    let power_limit_w: Double?
}

struct FanDeviceMetric: Codable, Hashable {
    let label: String
    let speed_rpm: Double
}

struct DiskDeviceMetric: Codable, Hashable {
    let device: String
    let read_bps: Double
    let write_bps: Double
    let read_iops: Double
    let write_iops: Double
    let util_percent: Double
    let read_bytes_total: Double
    let write_bytes_total: Double
}

struct MetricSnapshot: Codable {
    struct CPU: Codable {
        let usage_percent: Double
        let user_percent: Double?
        let system_percent: Double?
        let iowait_percent: Double?
        let load_1: Double?
        let load_5: Double?
        let load_15: Double?
        let frequency_mhz: Double?
        let temperature_c: Double?
        let count_logical: Int
        let count_physical: Int?
    }

    struct Memory: Codable {
        let total_bytes: Double
        let used_bytes: Double
        let available_bytes: Double
        let percent: Double
        let swap_total_bytes: Double
        let swap_used_bytes: Double
        let swap_percent: Double
    }

    struct Disk: Codable {
        let read_bps: Double
        let write_bps: Double
        let read_iops: Double
        let write_iops: Double
        let util_percent: Double
        let avg_util_percent: Double
        let devices: [DiskDeviceMetric]
    }

    struct Network: Codable {
        let rx_bps: Double
        let tx_bps: Double
    }

    struct Fans: Codable {
        let count: Int
        let max_rpm: Double?
        let avg_rpm: Double?
        let devices: [FanDeviceMetric]
    }

    struct GPU: Codable {
        let present: Bool
        let count: Int
        let top_util_percent: Double?
        let avg_util_percent: Double?
        let top_memory_percent: Double?
        let avg_memory_percent: Double?
        let devices: [GpuDeviceMetric]
    }

    struct Bottleneck: Codable {
        let label: String
        let title: String
        let confidence: Double
        let reason: String
    }

    let id: Int
    let server: ServerSummary?
    let collected_at: String
    let age_seconds: Double
    let interval_seconds: Double?
    let cpu: CPU
    let memory: Memory
    let disk: Disk
    let network: Network
    let process_count: Int
    let fans: Fans
    let gpu: GPU
    let bottleneck: Bottleneck
}

struct ServersListResponse: Codable {
    let ok: Bool
    let servers: [ServerSummary]
}

struct RegisterServerResponse: Codable {
    let ok: Bool
    let server: ServerSummary
    let ingest_token: String
    let agent_command: String
}

struct LatestSnapshotResponse: Codable {
    let ok: Bool
    let servers: [ServerSummary]
    let selected_server: ServerSummary
    let snapshot: MetricSnapshot
    let backend_version: String?
    let min_agent_version: String?
}

struct LatestSnapshotNotFoundResponse: Codable {
    let ok: Bool
    let error: String
    let auth_required: Bool?
    let login_url: String?
    let servers: [ServerSummary]?
    let selected_server: ServerSummary?
}

struct HistoryPointGpu: Codable, Hashable {
    let gpu_index: Int
    let utilization_gpu_percent: Double?
    let memory_percent: Double?
    let temperature_c: Double?
    let fan_speed_percent: Double?
}

struct HistoryPointDisk: Codable, Hashable {
    let device: String
    let read_bps: Double
    let write_bps: Double
    let util_percent: Double
}

struct HistoryPoint: Codable, Hashable, Identifiable {
    var id: String { collected_at }

    let collected_at: String
    let cpu_usage_percent: Double
    let cpu_iowait_percent: Double?
    let memory_percent: Double
    let swap_percent: Double
    let disk_read_bps: Double
    let disk_write_bps: Double
    let disk_util_percent: Double
    let disk_avg_util_percent: Double?
    let network_rx_bps: Double
    let network_tx_bps: Double
    let gpu_top_util_percent: Double?
    let gpu_avg_util_percent: Double?
    let gpu_top_memory_percent: Double?
    let fan_count: Int
    let fan_max_rpm: Double?
    let fan_avg_rpm: Double?
    let bottleneck: String
    let gpus: [HistoryPointGpu]
    let disks: [HistoryPointDisk]
    let fans: [FanDeviceMetric]
}

struct HistoryMetricsResponse: Codable {
    let ok: Bool
    let minutes: Int
    let point_count: Int
    let stride: Int
    let servers: [ServerSummary]
    let selected_server: ServerSummary?
    let points: [HistoryPoint]
    let backend_version: String?
    let min_agent_version: String?
}

enum NotificationLevel: String, Codable, CaseIterable {
    case info
    case warning
    case critical
}

struct NotificationItem: Codable, Identifiable {
    let id: Int
    let level: NotificationLevel
    let title: String
    let message: String
    let code: String?
    let is_read: Bool
    let created_at: String
    let server: ServerSummary?
}

struct NotificationsResponse: Codable {
    let ok: Bool
    let notifications: [NotificationItem]
}

struct MarkNotificationsReadResponse: Codable {
    let ok: Bool
    let updated: Int
}

struct AuthResponse: Codable {
    struct User: Codable {
        let username: String
        let email: String
    }

    let ok: Bool
    let user: User
}

struct ForgotPasswordResponse: Codable {
    let ok: Bool
    let message: String
}

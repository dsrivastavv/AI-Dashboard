import SwiftUI

struct SystemInfoPageView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                if let server = store.selectedServer {
                    if let sysInfo = server.agent_info?.system_info {
                        serverHeader(server: server, sysInfo: sysInfo)
                        osCard(sysInfo)
                        hardwareCard(sysInfo)
                        uptimeCard(server: server, sysInfo: sysInfo)
                        serverRecordCard(server: server)
                        partitionsCard(sysInfo.partitions)
                        interfacesCard(sysInfo.interfaces)
                    } else {
                        EmptyStateCard(
                            mode: store.mode,
                            title: "System info not yet available",
                            message: "The agent will send system information on its next heartbeat."
                        )
                    }
                } else {
                    EmptyStateCard(
                        mode: store.mode,
                        title: "No server selected",
                        message: "Open Settings and select a server to view its system information."
                    )
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .refreshable {
            await store.refreshAll()
        }
    }

    // MARK: – Header

    private func serverHeader(server: ServerSummary, sysInfo: AgentSystemInfo) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            HStack(spacing: 12) {
                Image(systemName: "display")
                    .font(.system(size: 26, weight: .light))
                    .foregroundStyle(DashboardPalette.cpu.opacity(0.85))
                    .frame(width: 44, height: 44)
                    .background(.primary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 3) {
                    Text(server.name)
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                    Text("\(sysInfo.hostname) · \(sysInfo.os_name) \(sysInfo.os_release)")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
                Spacer(minLength: 0)
            }
        }
    }

    // MARK: – OS card

    private func osCard(_ sysInfo: AgentSystemInfo) -> some View {
        infoCard(title: "Operating System", icon: "info.circle") {
            InfoRow(label: "OS", value: "\(sysInfo.os_name) \(sysInfo.os_release)")
            InfoRow(label: "Architecture", value: sysInfo.machine)
            InfoRow(label: "Kernel", value: sysInfo.os_version, mono: true)
            InfoRow(label: "Platform", value: sysInfo.platform_full, mono: true)
        }
    }

    // MARK: – Hardware card

    private func hardwareCard(_ sysInfo: AgentSystemInfo) -> some View {
        infoCard(title: "Hardware", icon: "cpu") {
            InfoRow(label: "CPU Model", value: sysInfo.cpu_model.isEmpty ? sysInfo.processor : sysInfo.cpu_model)
            InfoRow(label: "Logical cores", value: "\(sysInfo.cpu_count_logical)")
            InfoRow(label: "Physical cores", value: sysInfo.cpu_count_physical.map(String.init) ?? "-")
            InfoRow(label: "Total RAM", value: Formatters.bytes(sysInfo.memory_total_bytes))
            InfoRow(label: "Swap", value: sysInfo.swap_total_bytes > 0 ? Formatters.bytes(sysInfo.swap_total_bytes) : "None")
        }
    }

    // MARK: – Uptime card

    private func uptimeCard(server: ServerSummary, sysInfo: AgentSystemInfo) -> some View {
        infoCard(title: "Uptime & Agent", icon: "timer") {
            InfoRow(label: "Uptime", value: formatUptime(sysInfo.uptime_seconds))
            InfoRow(label: "Boot time", value: Formatters.dateTime(sysInfo.boot_time))
            InfoRow(label: "Last seen", value: Formatters.dateTime(server.last_seen_at))
            InfoRow(label: "Agent user", value: formatAgentUser(server))
            InfoRow(label: "Agent version", value: server.last_agent_version ?? server.agent_info?.version ?? "-", mono: true)
            InfoRow(label: "Backend version", value: store.backendVersion, mono: true)
            InfoRow(label: "Min agent", value: store.minAgentVersion ?? "-", mono: true)
            InfoRow(label: "Python (agent)", value: sysInfo.python_version, mono: true)
        }
    }

    // MARK: – Server record card

    private func serverRecordCard(server: ServerSummary) -> some View {
        infoCard(title: "Server Record", icon: "server.rack") {
            InfoRow(label: "Name", value: server.name)
            InfoRow(label: "Slug", value: server.slug, mono: true)
            InfoRow(label: "Hostname", value: server.hostname, mono: true)
            InfoRow(label: "Description", value: server.description?.isEmpty == false ? server.description! : "-")
            InfoRow(label: "Active", value: server.is_active ? "Yes" : "No")
            InfoRow(label: "Snapshots", value: server.snapshot_count.map(String.init) ?? "-")
            InfoRow(label: "Latest snapshot", value: Formatters.dateTime(server.latest_snapshot_at))
        }
    }

    // MARK: – Partitions card

    private func partitionsCard(_ partitions: [SystemInfoPartition]) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Disk Partitions", subtitle: "\(partitions.count) partition(s)", icon: "internaldrive")

                if partitions.isEmpty {
                    Text("No partition data available.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    VStack(spacing: 10) {
                        ForEach(partitions, id: \.device) { partition in
                            partitionRow(partition)
                            if partition.device != partitions.last?.device {
                                Divider()
                            }
                        }
                    }
                }
            }
        }
    }

    private func partitionRow(_ partition: SystemInfoPartition) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text(partition.mountpoint)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                    Text("\(partition.device) · \(partition.fstype)")
                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Text(Formatters.percent(partition.percent, digits: 0))
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(Formatters.utilizationColor(partition.percent))
            }
            MetricProgressBar(value: partition.percent, tint: DashboardPalette.disk)
            Text("\(Formatters.bytes(partition.used_bytes)) / \(Formatters.bytes(partition.total_bytes)) used")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)
        }
    }

    // MARK: – Network interfaces card

    private func interfacesCard(_ interfaces: [SystemInfoNetworkInterface]) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Network Interfaces", subtitle: "\(interfaces.count) interface(s)", icon: "network")

                if interfaces.isEmpty {
                    Text("No interface data available.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    VStack(spacing: 8) {
                        ForEach(interfaces, id: \.name) { iface in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(iface.name)
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                if let ipv4 = iface.ipv4 {
                                    InfoRow(label: "IPv4", value: ipv4, mono: true)
                                }
                                if let ipv6 = iface.ipv6 {
                                    InfoRow(label: "IPv6", value: ipv6, mono: true)
                                }
                            }
                            if iface.name != interfaces.last?.name {
                                Divider()
                            }
                        }
                    }
                }
            }
        }
    }

    // MARK: – Info card builder

    private func infoCard<Content: View>(title: String, icon: String, @ViewBuilder rows: () -> Content) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: title, subtitle: nil, icon: icon)
                rows()
            }
        }
    }

    // MARK: – Formatters

    private func formatUptime(_ seconds: Int) -> String {
        let days = seconds / 86400
        let hours = (seconds % 86400) / 3600
        let minutes = (seconds % 3600) / 60
        if days > 0 { return "\(days)d \(hours)h \(minutes)m" }
        if hours > 0 { return "\(hours)h \(minutes)m" }
        return "\(minutes)m"
    }

    private func formatAgentUser(_ server: ServerSummary) -> String {
        server.agent_user ?? server.agent_info?.user ?? "-"
    }
}

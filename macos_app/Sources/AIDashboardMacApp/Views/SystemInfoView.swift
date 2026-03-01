import SwiftUI

struct SystemInfoPageView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                if let server = store.selectedServer {
                    if let sysInfo = server.agent_info?.system_info {
                        header(server: server, sysInfo: sysInfo)

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            operatingSystemCard(sysInfo)
                            hardwareCard(sysInfo)
                            uptimeCard(server: server, sysInfo: sysInfo)
                            serverRecordCard(server: server)
                        }

                        partitionsCard(sysInfo.partitions)
                        interfacesCard(sysInfo.interfaces)
                    } else {
                        EmptyStateCard(
                            mode: store.mode,
                            title: "System information not yet available",
                            message: "The agent will send system information on its next heartbeat."
                        )
                    }
                } else {
                    EmptyStateCard(
                        mode: store.mode,
                        title: "No server selected",
                        message: "Select a server from the sidebar to view its system information."
                    )
                }
            }
            .padding(.bottom, 8)
        }
    }

    private func header(server: ServerSummary, sysInfo: AgentSystemInfo) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            HStack(spacing: 10) {
                Image(systemName: "display.2")
                    .font(.system(size: 14, weight: .semibold))
                    .frame(width: 34, height: 34)
                    .background(.primary.opacity(0.08), in: RoundedRectangle(cornerRadius: 9, style: .continuous))

                VStack(alignment: .leading, spacing: 2) {
                    Text(server.name)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                    Text("\(sysInfo.hostname.isEmpty ? server.hostname : sysInfo.hostname) · \(sysInfo.os_name) \(sysInfo.os_release) · \(sysInfo.machine)")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func operatingSystemCard(_ sysInfo: AgentSystemInfo) -> some View {
        infoCard(title: "Operating System", icon: "info.circle") {
            infoRow("OS", "\(sysInfo.os_name) \(sysInfo.os_release)")
            infoRow("Architecture", sysInfo.machine)
            infoRow("Kernel", sysInfo.os_version, mono: true)
            infoRow("Platform", sysInfo.platform_full, mono: true)
        }
    }

    private func hardwareCard(_ sysInfo: AgentSystemInfo) -> some View {
        infoCard(title: "Hardware", icon: "cpu") {
            infoRow("CPU Model", sysInfo.cpu_model.isEmpty ? sysInfo.processor : sysInfo.cpu_model)
            infoRow("Logical cores", "\(sysInfo.cpu_count_logical)")
            infoRow("Physical cores", sysInfo.cpu_count_physical.map(String.init) ?? "-")
            infoRow("Total RAM", Formatters.bytes(sysInfo.memory_total_bytes))
            infoRow("Swap", sysInfo.swap_total_bytes > 0 ? Formatters.bytes(sysInfo.swap_total_bytes) : "None")
        }
    }

    private func uptimeCard(server: ServerSummary, sysInfo: AgentSystemInfo) -> some View {
        infoCard(title: "Uptime & Agent", icon: "timer") {
            infoRow("Uptime", formatUptime(sysInfo.uptime_seconds))
            infoRow("Boot time", Formatters.dateTime(sysInfo.boot_time))
            infoRow("Last seen", Formatters.dateTime(server.last_seen_at))
            infoRow("Agent user", formatAgentUser(server))
            infoRow("Agent version", server.last_agent_version ?? server.agent_info?.version ?? "-", mono: true)
            infoRow("Backend version", store.backendVersion, mono: true)
            infoRow("Min supported agent", store.minAgentVersion ?? "-", mono: true)
            infoRow("Python (agent)", sysInfo.python_version, mono: true)
        }
    }

    private func serverRecordCard(server: ServerSummary) -> some View {
        infoCard(title: "Server Record", icon: "server.rack") {
            infoRow("Name", server.name)
            infoRow("Slug", server.slug, mono: true)
            infoRow("Hostname", server.hostname, mono: true)
            infoRow("Description", server.description?.isEmpty == false ? server.description! : "-")
            infoRow("Active", server.is_active ? "Yes" : "No")
            infoRow("Snapshots collected", server.snapshot_count.map(String.init) ?? "-")
        }
    }

    private func partitionsCard(_ partitions: [SystemInfoPartition]) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Disk Partitions", subtitle: nil, icon: "internaldrive")

                if partitions.isEmpty {
                    Text("No partition data available.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    Grid(alignment: .leading, horizontalSpacing: 8, verticalSpacing: 8) {
                        GridRow {
                            headerCell("Device")
                            headerCell("Mount")
                            headerCell("FS")
                            headerCell("Total")
                            headerCell("Used")
                            headerCell("Free")
                            headerCell("Usage")
                        }
                        ForEach(partitions, id: \.mountpoint) { partition in
                            Divider().gridCellColumns(7)
                            GridRow(alignment: .top) {
                                mono(partition.device)
                                mono(partition.mountpoint)
                                Text(partition.fstype.isEmpty ? "-" : partition.fstype)
                                Text(Formatters.bytes(partition.total_bytes))
                                Text(Formatters.bytes(partition.used_bytes))
                                Text(Formatters.bytes(partition.free_bytes))
                                HStack(spacing: 6) {
                                    MetricProgressBar(value: partition.percent, tint: usageColor(percent: partition.percent))
                                        .frame(width: 90)
                                    Text(Formatters.percent(partition.percent, digits: 0))
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private func interfacesCard(_ interfaces: [SystemInfoNetworkInterface]) -> some View {
        let visible = interfaces.filter { ($0.ipv4?.isEmpty == false) || ($0.ipv6?.isEmpty == false) }

        return GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Network Interfaces", subtitle: nil, icon: "network")

                if visible.isEmpty {
                    Text("No interface data available.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 220), spacing: 8)], spacing: 8) {
                        ForEach(visible, id: \.name) { iface in
                            GlassCard(mode: store.mode, padding: 10) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(iface.name)
                                        .font(.system(size: 12, weight: .bold, design: .rounded))
                                    if let ipv4 = iface.ipv4, !ipv4.isEmpty {
                                        HStack {
                                            Text("IPv4")
                                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                                .foregroundStyle(.secondary)
                                            mono(ipv4)
                                        }
                                    }
                                    if let ipv6 = iface.ipv6, !ipv6.isEmpty {
                                        HStack {
                                            Text("IPv6")
                                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                                .foregroundStyle(.secondary)
                                            mono(ipv6)
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                }
            }
        }
    }

    private func infoCard<Content: View>(title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 8) {
                SectionHeader(title: title, subtitle: nil, icon: icon)
                content()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    private func infoRow(_ label: String, _ value: String, mono: Bool = false) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
            Spacer(minLength: 8)
            if mono {
                Text(value)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .textSelection(.enabled)
            } else {
                Text(value)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
            }
        }
    }

    private func formatUptime(_ seconds: Int) -> String {
        if seconds < 60 { return "\(seconds)s" }
        let mins = seconds / 60
        if mins < 60 { return "\(mins)m" }
        let hrs = mins / 60
        let remMins = mins % 60
        if hrs < 24 { return "\(hrs)h \(remMins)m" }
        let days = hrs / 24
        let remHrs = hrs % 24
        return "\(days)d \(remHrs)h"
    }

    private func formatAgentUser(_ server: ServerSummary) -> String {
        let raw = (server.agent_user ?? server.agent_info?.user ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if raw.isEmpty { return "-" }
        return raw.lowercased() == "root" ? "Administrator" : raw
    }

    private func mono(_ text: String) -> some View {
        Text(text.isEmpty ? "-" : text)
            .font(.system(size: 11, weight: .medium, design: .monospaced))
            .textSelection(.enabled)
    }

    private func headerCell(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 10, weight: .bold, design: .rounded))
            .foregroundStyle(.secondary)
    }

    private func usageColor(percent: Double) -> Color {
        if percent >= 90 { return DashboardPalette.critical }
        if percent >= 75 { return DashboardPalette.warning }
        return DashboardPalette.network
    }
}

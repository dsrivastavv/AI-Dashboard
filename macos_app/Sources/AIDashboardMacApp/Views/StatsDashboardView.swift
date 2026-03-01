import Charts
import SwiftUI

struct StatsDashboardView: View {
    @EnvironmentObject private var store: AppStore

    private struct SystemSeriesPoint: Identifiable {
        let id = UUID()
        let timestamp: Date
        let series: String
        let value: Double
    }

    private struct ThroughputPoint: Identifiable {
        let id = UUID()
        let timestamp: Date
        let rxMBps: Double
        let txMBps: Double
        let diskUtil: Double
    }

    private var selectedSnapshot: MetricSnapshot? {
        store.latestSnapshot
    }

    private var historyPoints: [HistoryPoint] {
        store.historyPoints
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                if store.accessDenied {
                    ErrorStateCard(
                        mode: store.mode,
                        title: "Access denied",
                        message: "Your account is signed in but not allowlisted for this dashboard."
                    )
                }

                if let historyError = store.historyError {
                    ErrorStateCard(mode: store.mode, title: "History refresh failed", message: historyError)
                }

                if let latestError = store.latestError, selectedSnapshot == nil {
                    ErrorStateCard(mode: store.mode, title: "Failed to load dashboard", message: latestError)
                }

                if store.servers.isEmpty, selectedSnapshot == nil {
                    EmptyStateCard(
                        mode: store.mode,
                        title: "No monitored servers registered",
                        message: "Register a monitored server in Django and start the agent to send metrics."
                    )
                }

                if let latestNotFound = store.latestNotFoundMessage, selectedSnapshot == nil {
                    EmptyStateCard(
                        mode: store.mode,
                        title: "No samples collected yet",
                        message: latestNotFound
                    )
                }

                if let snapshot = selectedSnapshot {
                    summaryCards(snapshot: snapshot)
                    gpuTable(snapshot.gpu.devices)
                    diskTable(snapshot.disk.devices)

                    HStack(alignment: .top, spacing: 12) {
                        VStack(spacing: 12) {
                            systemChart
                            ioChart
                        }
                        .frame(maxWidth: .infinity)

                        VStack(spacing: 12) {
                            snapshotInsights(snapshot)
                            bottleneckPanel(snapshot.bottleneck)
                        }
                        .frame(width: 320)
                    }
                }
            }
            .padding(.bottom, 10)
        }
        .overlay {
            if store.isInitialLoading {
                ProgressView("Loading dashboard data…")
            }
        }
    }

    private func summaryCards(snapshot: MetricSnapshot) -> some View {
        let cards: [(String, String, String, Color, Double?)] = [
            (
                "CPU Usage",
                Formatters.percent(snapshot.cpu.usage_percent),
                "Load: \(Formatters.number(snapshot.cpu.load_1, digits: 2)) | \(snapshot.cpu.count_logical) threads",
                DashboardPalette.cpu,
                snapshot.cpu.usage_percent
            ),
            (
                "Memory",
                Formatters.percent(snapshot.memory.percent),
                "RAM: \(Formatters.bytes(snapshot.memory.used_bytes)) / \(Formatters.bytes(snapshot.memory.total_bytes))",
                DashboardPalette.memory,
                snapshot.memory.percent
            ),
            (
                "Disk Util",
                Formatters.percent(snapshot.disk.util_percent),
                "Read: \(Formatters.throughput(snapshot.disk.read_bps))",
                DashboardPalette.disk,
                snapshot.disk.util_percent
            ),
            (
                "Network",
                Formatters.throughput(snapshot.network.rx_bps + snapshot.network.tx_bps),
                "↓ \(Formatters.throughput(snapshot.network.rx_bps)) · ↑ \(Formatters.throughput(snapshot.network.tx_bps))",
                DashboardPalette.network,
                nil
            ),
            (
                "GPU Memory",
                snapshot.gpu.present ? Formatters.percent(snapshot.gpu.top_memory_percent) : "No GPU",
                snapshot.gpu.present ? "\(snapshot.gpu.count) GPU(s)" : "No accelerators",
                DashboardPalette.gpu,
                snapshot.gpu.top_memory_percent
            )
        ]

        return LazyVGrid(columns: Array(repeating: GridItem(.flexible(minimum: 160), spacing: 10), count: 5), spacing: 10) {
            ForEach(cards, id: \.0) { card in
                GlassCard(mode: store.mode, padding: 12) {
                    VStack(alignment: .leading, spacing: 9) {
                        Text(card.0)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                        Text(card.1)
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundStyle(card.3)

                        if let percent = card.4 {
                            MetricProgressBar(value: percent, tint: card.3)
                        }

                        Text(card.2)
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private func gpuTable(_ gpus: [GpuDeviceMetric]) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "GPU Devices", subtitle: nil, icon: "cpu")

                if gpus.isEmpty {
                    Text("No GPU metrics from this server.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    Grid(alignment: .leading, horizontalSpacing: 10, verticalSpacing: 8) {
                        GridRow {
                            headerCell("#")
                            headerCell("Name")
                            headerCell("Util")
                            headerCell("Mem")
                            headerCell("Temp")
                            headerCell("Power")
                        }

                        ForEach(gpus, id: \.uuid) { gpu in
                            Divider().gridCellColumns(6)
                            GridRow(alignment: .top) {
                                Text("\(gpu.gpu_index)")
                                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(gpu.name)
                                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                                    Text(gpu.uuid)
                                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                                        .foregroundStyle(.secondary)
                                }
                                Text(Formatters.percent(gpu.utilization_gpu_percent))
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                                    .foregroundStyle(Formatters.utilizationColor(gpu.utilization_gpu_percent))
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(Formatters.percent(gpu.memory_percent))
                                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                                    Text("\(Formatters.bytes(gpu.memory_used_bytes)) / \(Formatters.bytes(gpu.memory_total_bytes))")
                                        .font(.system(size: 10, weight: .medium, design: .rounded))
                                        .foregroundStyle(.secondary)
                                }
                                Text(gpu.temperature_c == nil ? "-" : "\(Formatters.number(gpu.temperature_c))°C")
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                                    .foregroundStyle(Formatters.temperatureColor(gpu.temperature_c))
                                Text(powerText(gpu))
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                            }
                        }
                    }
                }
            }
        }
    }

    private func diskTable(_ disks: [DiskDeviceMetric]) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Disk Devices", subtitle: nil, icon: "internaldrive")

                if disks.isEmpty {
                    Text("No disk metrics from this server.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    Grid(alignment: .leading, horizontalSpacing: 10, verticalSpacing: 8) {
                        GridRow {
                            headerCell("Device")
                            headerCell("Read")
                            headerCell("Write")
                            headerCell("Util")
                            headerCell("Read IOPS")
                            headerCell("Write IOPS")
                        }

                        ForEach(disks, id: \.device) { disk in
                            Divider().gridCellColumns(6)
                            GridRow(alignment: .top) {
                                Text(disk.device)
                                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                Text(Formatters.throughput(disk.read_bps))
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                                Text(Formatters.throughput(disk.write_bps))
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                                Text(Formatters.percent(disk.util_percent))
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                                    .foregroundStyle(Formatters.utilizationColor(disk.util_percent))
                                Text(Formatters.integer(disk.read_iops))
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                                Text(Formatters.integer(disk.write_iops))
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                            }
                        }
                    }
                }
            }
        }
    }

    private var systemChart: some View {
        let data = buildSystemSeries(points: filteredHistory(minutes: store.systemMinutes))

        return GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    SectionHeader(title: "System Trends", subtitle: "CPU, memory & GPU utilization over time", icon: "chart.line.uptrend.xyaxis")
                    RangeSelector(options: AppStore.timeRangeOptions, value: store.systemMinutes) { minutes in
                        store.setSystemMinutes(minutes)
                    }
                }

                if data.isEmpty {
                    Text("No samples for this time window.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    Chart(data) { item in
                        LineMark(
                            x: .value("Time", item.timestamp),
                            y: .value("Percent", item.value),
                            series: .value("Series", item.series)
                        )
                        .foregroundStyle(color(for: item.series))
                        .interpolationMethod(.catmullRom)
                    }
                    .chartYScale(domain: 0...100)
                    .frame(height: 220)
                }
            }
        }
    }

    private var ioChart: some View {
        let points = buildThroughputSeries(points: filteredHistory(minutes: store.ioMinutes))

        return GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    SectionHeader(title: "IO & Network", subtitle: "Disk utilization and network throughput", icon: "speedometer")
                    RangeSelector(options: AppStore.timeRangeOptions, value: store.ioMinutes) { minutes in
                        store.setIOMinutes(minutes)
                    }
                }

                if points.isEmpty {
                    Text("No samples for this time window.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    VStack(spacing: 8) {
                        Chart(points) { item in
                            LineMark(x: .value("Time", item.timestamp), y: .value("RX MB/s", item.rxMBps))
                                .foregroundStyle(DashboardPalette.network)
                                .interpolationMethod(.catmullRom)
                            LineMark(x: .value("Time", item.timestamp), y: .value("TX MB/s", item.txMBps))
                                .foregroundStyle(DashboardPalette.network.opacity(0.55))
                                .interpolationMethod(.catmullRom)
                        }
                        .frame(height: 126)

                        Chart(points) { item in
                            AreaMark(
                                x: .value("Time", item.timestamp),
                                y: .value("Disk Util", item.diskUtil)
                            )
                            .foregroundStyle(DashboardPalette.disk.opacity(0.24))

                            LineMark(
                                x: .value("Time", item.timestamp),
                                y: .value("Disk Util", item.diskUtil)
                            )
                            .foregroundStyle(DashboardPalette.disk)
                            .interpolationMethod(.catmullRom)
                        }
                        .chartYScale(domain: 0...100)
                        .frame(height: 104)
                    }
                }
            }
        }
    }

    private func snapshotInsights(_ snapshot: MetricSnapshot) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 9) {
                SectionHeader(title: "Snapshot Insights", subtitle: "Latest sample — operational context", icon: "scope")

                infoRow(icon: "clock", label: "Snapshot age", value: Formatters.relativeSeconds(snapshot.age_seconds))
                infoRow(icon: "calendar", label: "Collected at", value: Formatters.dateTime(snapshot.collected_at))
                infoRow(icon: "timer", label: "Sample interval", value: snapshot.interval_seconds == nil ? "-" : "\(Formatters.number(snapshot.interval_seconds))s")
                infoRow(icon: "square.3.layers.3d", label: "Processes", value: "\(snapshot.process_count)")
                infoRow(icon: "chart.line.uptrend.xyaxis", label: "CPU load (1m/5m)", value: "\(Formatters.number(snapshot.cpu.load_1, digits: 2)) / \(Formatters.number(snapshot.cpu.load_5, digits: 2))")
                infoRow(icon: "memorychip", label: "Swap usage", value: Formatters.percent(snapshot.memory.swap_percent))
                infoRow(icon: "internaldrive", label: "Disk throughput", value: "\(Formatters.throughput(snapshot.disk.read_bps)) read")
                infoRow(icon: "arrow.up.right", label: "Network egress", value: Formatters.throughput(snapshot.network.tx_bps))

                let confidence = Int((snapshot.bottleneck.confidence * 100).rounded())
                Divider()
                HStack {
                    Text("Bottleneck confidence")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                    Spacer(minLength: 0)
                    Text("\(confidence)%")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                }
            }
        }
    }

    private func bottleneckPanel(_ bottleneck: MetricSnapshot.Bottleneck) -> some View {
        let confidencePercent = max(0, min(100, Int((bottleneck.confidence * 100).rounded())))
        let entityColor = DashboardPalette.entity(bottleneck.entity)

        return GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Bottleneck Analysis", subtitle: nil, icon: "brain.head.profile")
                GlassPill(text: bottleneck.title.isEmpty ? Formatters.bottleneckTitle(bottleneck.label) : bottleneck.title, tint: entityColor)
                Text("\(confidencePercent)% confidence")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)

                MetricProgressBar(value: Double(confidencePercent), tint: entityColor)

                Text(bottleneck.reason.isEmpty ? "No bottleneck reason provided for this sample." : bottleneck.reason)
                    .font(.system(size: 12, weight: .medium, design: .rounded))

                HStack {
                    GlassPill(text: "Heuristic classification", tint: DashboardPalette.cpu)
                    GlassPill(text: "Triage signal only", tint: DashboardPalette.neutral)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func headerCell(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .bold, design: .rounded))
            .foregroundStyle(.secondary)
    }

    private func powerText(_ gpu: GpuDeviceMetric) -> String {
        guard let power = gpu.power_w else { return "-" }
        if let limit = gpu.power_limit_w {
            return "\(Formatters.number(power)) W / \(Formatters.number(limit)) W"
        }
        return "\(Formatters.number(power)) W"
    }

    private func filteredHistory(minutes: Int) -> [HistoryPoint] {
        let sorted = historyPoints.sorted { ($0.collected_at) < ($1.collected_at) }
        guard let latestDate = sorted.compactMap({ Formatters.parseDate($0.collected_at) }).last else {
            return []
        }

        let windowStart = latestDate.addingTimeInterval(-Double(minutes * 60))
        return sorted.filter { point in
            guard let date = Formatters.parseDate(point.collected_at) else { return false }
            return date >= windowStart && date <= latestDate
        }
    }

    private func buildSystemSeries(points: [HistoryPoint]) -> [SystemSeriesPoint] {
        let gpuIndices = Set(points.flatMap { $0.gpus.map(\.gpu_index) }).sorted()

        var samples: [SystemSeriesPoint] = []
        for point in points {
            guard let date = Formatters.parseDate(point.collected_at) else { continue }
            samples.append(.init(timestamp: date, series: "CPU %", value: point.cpu_usage_percent))
            samples.append(.init(timestamp: date, series: "Memory %", value: point.memory_percent))

            for index in gpuIndices {
                if let gpuValue = point.gpus.first(where: { $0.gpu_index == index })?.utilization_gpu_percent {
                    samples.append(
                        .init(
                            timestamp: date,
                            series: "GPU \(index) %",
                            value: gpuValue
                        )
                    )
                }
            }
        }
        return samples
    }

    private func color(for series: String) -> Color {
        if series == "CPU %" { return DashboardPalette.cpu }
        if series == "Memory %" { return DashboardPalette.memory }
        if series.hasPrefix("GPU ") {
            let rawIndex = series
                .replacingOccurrences(of: "GPU ", with: "")
                .replacingOccurrences(of: " %", with: "")
            let index = Int(rawIndex) ?? 0
            return DashboardPalette.gpu.opacity(0.45 + Double((index % 5)) * 0.1)
        }
        return DashboardPalette.neutral
    }

    private func buildThroughputSeries(points: [HistoryPoint]) -> [ThroughputPoint] {
        points.compactMap { point in
            guard let date = Formatters.parseDate(point.collected_at) else { return nil }
            return ThroughputPoint(
                timestamp: date,
                rxMBps: point.network_rx_bps / (1024 * 1024),
                txMBps: point.network_tx_bps / (1024 * 1024),
                diskUtil: point.disk_util_percent
            )
        }
    }

    private func infoRow(icon: String, label: String, value: String) -> some View {
        HStack {
            Label(label, systemImage: icon)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
            Spacer(minLength: 0)
            Text(value)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
        }
    }
}

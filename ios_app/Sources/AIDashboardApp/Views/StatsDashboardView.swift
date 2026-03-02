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

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
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

                if let latestError = store.latestError, store.latestSnapshot == nil {
                    ErrorStateCard(mode: store.mode, title: "Failed to load dashboard", message: latestError)
                }

                if store.servers.isEmpty, store.latestSnapshot == nil {
                    EmptyStateCard(
                        mode: store.mode,
                        title: "No monitored servers",
                        message: "Register a monitored server and start the agent to send metrics."
                    )
                }

                if let latestNotFound = store.latestNotFoundMessage, store.latestSnapshot == nil {
                    EmptyStateCard(
                        mode: store.mode,
                        title: "No samples collected yet",
                        message: latestNotFound
                    )
                }

                if let snapshot = store.latestSnapshot {
                    summaryGrid(snapshot: snapshot)
                    cpuMemCard(snapshot: snapshot)
                    networkCard(snapshot: snapshot)
                    gpuSection(snapshot.gpu.devices)
                    diskSection(snapshot.disk.devices)
                    systemChart
                    ioChart
                    snapshotInsights(snapshot)
                    bottleneckPanel(snapshot.bottleneck)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .refreshable {
            await store.refreshAll()
        }
        .overlay {
            if store.isInitialLoading {
                ProgressView("Loading…")
                    .padding(24)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
            }
        }
    }

    // MARK: – Summary grid (2 columns)

    private func summaryGrid(snapshot: MetricSnapshot) -> some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            summaryCard(
                title: "CPU",
                value: Formatters.percent(snapshot.cpu.usage_percent),
                subtitle: "Load \(Formatters.number(snapshot.cpu.load_1, digits: 2))",
                tint: DashboardPalette.cpu,
                percent: snapshot.cpu.usage_percent
            )
            summaryCard(
                title: "Memory",
                value: Formatters.percent(snapshot.memory.percent),
                subtitle: Formatters.bytes(snapshot.memory.used_bytes),
                tint: DashboardPalette.memory,
                percent: snapshot.memory.percent
            )
            summaryCard(
                title: "Disk Util",
                value: Formatters.percent(snapshot.disk.util_percent),
                subtitle: Formatters.throughput(snapshot.disk.read_bps),
                tint: DashboardPalette.disk,
                percent: snapshot.disk.util_percent
            )
            summaryCard(
                title: "Network",
                value: Formatters.throughput(snapshot.network.rx_bps + snapshot.network.tx_bps),
                subtitle: "↓\(Formatters.throughput(snapshot.network.rx_bps))",
                tint: DashboardPalette.network,
                percent: nil
            )
            summaryCard(
                title: "GPU Util",
                value: snapshot.gpu.present ? Formatters.percent(snapshot.gpu.top_util_percent) : "No GPU",
                subtitle: snapshot.gpu.present ? "\(snapshot.gpu.count) GPU(s)" : "No accelerators",
                tint: DashboardPalette.gpu,
                percent: snapshot.gpu.top_util_percent
            )
            summaryCard(
                title: "GPU Mem",
                value: snapshot.gpu.present ? Formatters.percent(snapshot.gpu.top_memory_percent) : "-",
                subtitle: snapshot.gpu.present ? "Top device" : "",
                tint: DashboardPalette.gpu.opacity(0.75),
                percent: snapshot.gpu.top_memory_percent
            )
        }
    }

    private func summaryCard(title: String, value: String, subtitle: String, tint: Color, percent: Double?) -> some View {
        GlassCard(mode: store.mode, padding: 12) {
            VStack(alignment: .leading, spacing: 7) {
                Text(title)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(tint)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                if let percent {
                    MetricProgressBar(value: percent, tint: tint)
                }
                Text(subtitle)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: – CPU + Memory compact card

    private func cpuMemCard(snapshot: MetricSnapshot) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "CPU & Memory", subtitle: nil, icon: "cpu")

                let rows: [(String, String, String)] = [
                    ("Logical cores", "\(snapshot.cpu.count_logical)", ""),
                    ("Frequency", snapshot.cpu.frequency_mhz == nil ? "-" : "\(Formatters.number(snapshot.cpu.frequency_mhz)) MHz", ""),
                    ("CPU temp", snapshot.cpu.temperature_c == nil ? "-" : "\(Formatters.number(snapshot.cpu.temperature_c))°C", ""),
                    ("IO wait", Formatters.percent(snapshot.cpu.iowait_percent), ""),
                    ("RAM total", Formatters.bytes(snapshot.memory.total_bytes), ""),
                    ("Swap", "\(Formatters.percent(snapshot.memory.swap_percent, digits: 0)) used", ""),
                ]

                VStack(spacing: 6) {
                    ForEach(rows, id: \.0) { row in
                        InfoRow(label: row.0, value: row.1)
                    }
                }
            }
        }
    }

    // MARK: – Network compact card

    private func networkCard(snapshot: MetricSnapshot) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Network", subtitle: nil, icon: "network")
                InfoRow(label: "Download", value: Formatters.throughput(snapshot.network.rx_bps))
                InfoRow(label: "Upload", value: Formatters.throughput(snapshot.network.tx_bps))
                InfoRow(label: "Processes", value: "\(snapshot.process_count)")
            }
        }
    }

    // MARK: – GPU section

    private func gpuSection(_ gpus: [GpuDeviceMetric]) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "GPU Devices", subtitle: nil, icon: "cpu")

                if gpus.isEmpty {
                    Text("No GPU metrics for this server.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    VStack(spacing: 10) {
                        ForEach(gpus, id: \.uuid) { gpu in
                            gpuRow(gpu)
                            if gpu.uuid != gpus.last?.uuid {
                                Divider()
                            }
                        }
                    }
                }
            }
        }
    }

    private func gpuRow(_ gpu: GpuDeviceMetric) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text("GPU \(gpu.gpu_index) · \(gpu.name)")
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .lineLimit(1)
                    Text(gpu.uuid)
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                Text(Formatters.percent(gpu.utilization_gpu_percent))
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(Formatters.utilizationColor(gpu.utilization_gpu_percent))
            }

            HStack(spacing: 12) {
                compactMetric("Mem", Formatters.percent(gpu.memory_percent), DashboardPalette.gpu)
                compactMetric("Temp", gpu.temperature_c == nil ? "-" : "\(Formatters.number(gpu.temperature_c))°C",
                              Formatters.temperatureColor(gpu.temperature_c))
                if let power = gpu.power_w {
                    compactMetric("Power", "\(Formatters.number(power)) W", DashboardPalette.neutral)
                }
            }

            if let memPercent = gpu.memory_percent {
                MetricProgressBar(value: memPercent, tint: DashboardPalette.gpu)
            }
        }
    }

    // MARK: – Disk section

    private func diskSection(_ disks: [DiskDeviceMetric]) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Disk Devices", subtitle: nil, icon: "internaldrive")

                if disks.isEmpty {
                    Text("No disk metrics for this server.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    VStack(spacing: 10) {
                        ForEach(disks, id: \.device) { disk in
                            diskRow(disk)
                            if disk.device != disks.last?.device {
                                Divider()
                            }
                        }
                    }
                }
            }
        }
    }

    private func diskRow(_ disk: DiskDeviceMetric) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(disk.device)
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .lineLimit(1)
                Spacer(minLength: 0)
                Text(Formatters.percent(disk.util_percent))
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(Formatters.utilizationColor(disk.util_percent))
            }

            HStack(spacing: 12) {
                compactMetric("R", Formatters.throughput(disk.read_bps), DashboardPalette.disk)
                compactMetric("W", Formatters.throughput(disk.write_bps), DashboardPalette.disk.opacity(0.7))
                compactMetric("RIOPS", Formatters.integer(disk.read_iops), DashboardPalette.neutral)
                compactMetric("WIOPS", Formatters.integer(disk.write_iops), DashboardPalette.neutral)
            }

            MetricProgressBar(value: disk.util_percent, tint: DashboardPalette.disk)
        }
    }

    // MARK: – System trend chart

    private var systemChart: some View {
        let data = buildSystemSeries(points: filteredHistory(minutes: store.systemMinutes))

        return GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "System Trends", subtitle: "CPU, memory & GPU utilization", icon: "chart.line.uptrend.xyaxis")

                RangeSelector(options: AppStore.timeRangeOptions, value: store.systemMinutes) { minutes in
                    store.setSystemMinutes(minutes)
                }

                if data.isEmpty {
                    Text("No samples for this time window.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                } else {
                    Chart(data) { item in
                        LineMark(
                            x: .value("Time", item.timestamp),
                            y: .value("Percent", item.value),
                            series: .value("Series", item.series)
                        )
                        .foregroundStyle(colorForSeries(item.series))
                        .interpolationMethod(.catmullRom)
                    }
                    .chartYScale(domain: 0...100)
                    .frame(height: 200)
                }
            }
        }
    }

    // MARK: – IO chart

    private var ioChart: some View {
        let points = buildThroughputSeries(points: filteredHistory(minutes: store.ioMinutes))

        return GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "IO & Network", subtitle: "Disk util and network throughput", icon: "speedometer")

                RangeSelector(options: AppStore.timeRangeOptions, value: store.ioMinutes) { minutes in
                    store.setIOMinutes(minutes)
                }

                if points.isEmpty {
                    Text("No samples for this time window.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
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
                        .frame(height: 120)

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
                        .frame(height: 100)
                    }
                }
            }
        }
    }

    // MARK: – Snapshot insights

    private func snapshotInsights(_ snapshot: MetricSnapshot) -> some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 9) {
                SectionHeader(title: "Snapshot Insights", subtitle: nil, icon: "scope")

                InfoRow(label: "Snapshot age", value: Formatters.relativeSeconds(snapshot.age_seconds))
                InfoRow(label: "Collected at", value: Formatters.dateTime(snapshot.collected_at))
                InfoRow(label: "Interval", value: snapshot.interval_seconds == nil ? "-" : "\(Formatters.number(snapshot.interval_seconds))s")
                InfoRow(label: "Processes", value: "\(snapshot.process_count)")
                InfoRow(label: "Load 1m / 5m", value: "\(Formatters.number(snapshot.cpu.load_1, digits: 2)) / \(Formatters.number(snapshot.cpu.load_5, digits: 2))")
                InfoRow(label: "Swap usage", value: Formatters.percent(snapshot.memory.swap_percent))
                InfoRow(label: "Disk read", value: Formatters.throughput(snapshot.disk.read_bps))
                InfoRow(label: "Net egress", value: Formatters.throughput(snapshot.network.tx_bps))

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

    // MARK: – Bottleneck panel

    private func bottleneckPanel(_ bottleneck: MetricSnapshot.Bottleneck) -> some View {
        let confidencePercent = max(0, min(100, Int((bottleneck.confidence * 100).rounded())))
        let entityColor = DashboardPalette.entity(bottleneck.entity)

        return GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Bottleneck Analysis", subtitle: nil, icon: "brain.head.profile")

                GlassPill(
                    text: bottleneck.title.isEmpty ? Formatters.bottleneckTitle(bottleneck.label) : bottleneck.title,
                    tint: entityColor
                )

                Text("\(confidencePercent)% confidence")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)

                MetricProgressBar(value: Double(confidencePercent), tint: entityColor)

                Text(bottleneck.reason.isEmpty ? "No bottleneck reason provided." : bottleneck.reason)
                    .font(.system(size: 13, weight: .medium, design: .rounded))

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        GlassPill(text: "Heuristic classification", tint: DashboardPalette.cpu)
                        GlassPill(text: "Triage signal only", tint: DashboardPalette.neutral)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: – Helpers

    private func compactMetric(_ label: String, _ value: String, _ tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label)
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
                .lineLimit(1)
        }
    }

    private func filteredHistory(minutes: Int) -> [HistoryPoint] {
        let sorted = store.historyPoints.sorted { $0.collected_at < $1.collected_at }
        guard let latestDate = sorted.compactMap({ Formatters.parseDate($0.collected_at) }).last else { return [] }
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
                    samples.append(.init(timestamp: date, series: "GPU \(index) %", value: gpuValue))
                }
            }
        }
        return samples
    }

    private func colorForSeries(_ series: String) -> Color {
        if series == "CPU %" { return DashboardPalette.cpu }
        if series == "Memory %" { return DashboardPalette.memory }
        if series.hasPrefix("GPU ") {
            let rawIndex = series.replacingOccurrences(of: "GPU ", with: "").replacingOccurrences(of: " %", with: "")
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
}

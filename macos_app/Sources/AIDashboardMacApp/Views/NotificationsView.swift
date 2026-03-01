import SwiftUI

private enum NotificationsFilter: Hashable, CaseIterable {
    case all
    case unread
    case critical
    case warning
    case info

    var title: String {
        switch self {
        case .all: return "All"
        case .unread: return "Unread"
        case .critical: return "Critical"
        case .warning: return "Warning"
        case .info: return "Info"
        }
    }
}

struct NotificationsPageView: View {
    @EnvironmentObject private var store: AppStore

    @State private var activeFilter: NotificationsFilter = .all
    @State private var expandedID: Int?

    private var filteredItems: [NotificationItem] {
        let sorted = store.notifications.sorted { $0.created_at > $1.created_at }
        switch activeFilter {
        case .all:
            return sorted
        case .unread:
            return sorted.filter { !$0.is_read }
        case .critical:
            return sorted.filter { $0.level == .critical }
        case .warning:
            return sorted.filter { $0.level == .warning }
        case .info:
            return sorted.filter { $0.level == .info }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                header
                filters
                table
            }
            .padding(.bottom, 8)
        }
        .task {
            await store.refreshNotifications()
        }
    }

    private var header: some View {
        GlassCard(mode: store.mode, padding: 14) {
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "bell")
                    Text("Notifications")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                    if store.unreadCount > 0 {
                        GlassPill(text: "\(store.unreadCount) unread", tint: DashboardPalette.cpu)
                    }
                }

                Spacer(minLength: 0)

                if store.unreadCount > 0 {
                    Button {
                        Task { await store.markAllNotificationsRead() }
                    } label: {
                        Label("Mark all read", systemImage: "checkmark")
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
    }

    private var filters: some View {
        GlassCard(mode: store.mode, padding: 10) {
            HStack(spacing: 8) {
                filterButton(.all, count: store.notifications.count)
                filterButton(.unread, count: store.notifications.filter { !$0.is_read }.count)
                filterButton(.critical, count: store.notifications.filter { $0.level == .critical }.count)
                filterButton(.warning, count: store.notifications.filter { $0.level == .warning }.count)
                filterButton(.info, count: store.notifications.filter { $0.level == .info }.count)
                Spacer(minLength: 0)
            }
        }
    }

    private var table: some View {
        GlassCard(mode: store.mode, padding: 0) {
            VStack(spacing: 0) {
                HStack {
                    Text("Level").frame(width: 90, alignment: .leading)
                    Text("Title").frame(maxWidth: .infinity, alignment: .leading)
                    Text("Server").frame(width: 180, alignment: .leading)
                    Text("Time").frame(width: 150, alignment: .leading)
                    Text("").frame(width: 80)
                }
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(.secondary)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)

                Divider()

                if filteredItems.isEmpty {
                    VStack(spacing: 8) {
                        Image(systemName: "bell.slash")
                            .font(.system(size: 24, weight: .semibold))
                            .foregroundStyle(.secondary)
                        Text("No notifications in \"\(activeFilter.title)\"")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
                } else {
                    ForEach(filteredItems, id: \.id) { item in
                        NotificationRow(
                            mode: store.mode,
                            item: item,
                            isExpanded: expandedID == item.id,
                            onToggle: {
                                withAnimation(.easeInOut(duration: 0.18)) {
                                    expandedID = expandedID == item.id ? nil : item.id
                                }
                            },
                            onMarkRead: {
                                Task { await store.markNotificationRead(id: item.id) }
                            }
                        )

                        if item.id != filteredItems.last?.id {
                            Divider().padding(.horizontal, 14)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func filterButton(_ filter: NotificationsFilter, count: Int) -> some View {
        Button {
            activeFilter = filter
            expandedID = nil
        } label: {
            HStack(spacing: 6) {
                Text(filter.title)
                Text("\(count)")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(.primary.opacity(activeFilter == filter ? 0.16 : 0.08), in: Capsule())
            }
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(activeFilter == filter ? Color.accentColor.opacity(0.18) : Color.clear, in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct NotificationRow: View {
    let mode: ThemeMode
    let item: NotificationItem
    let isExpanded: Bool
    let onToggle: () -> Void
    let onMarkRead: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Button(action: onToggle) {
                HStack(alignment: .center, spacing: 10) {
                    levelBadge
                        .frame(width: 90, alignment: .leading)

                    Text(item.title)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Text(item.server?.name ?? "-")
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                        .frame(width: 180, alignment: .leading)

                    Text(Formatters.dateTime(item.created_at))
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                        .frame(width: 150, alignment: .leading)

                    HStack(spacing: 8) {
                        if !item.is_read {
                            Circle()
                                .fill(DashboardPalette.cpu)
                                .frame(width: 8, height: 8)
                        }
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.secondary)
                    }
                    .frame(width: 80)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    detailRow("Message", item.message)
                    if let code = item.code, !code.isEmpty {
                        detailRow("Code", code, mono: true)
                    }
                    detailRow("Received", Formatters.dateTime(item.created_at))
                    detailRow("Event ID", "#\(item.id)", mono: true)

                    if !item.is_read {
                        Button {
                            onMarkRead()
                        } label: {
                            Label("Mark as read", systemImage: "checkmark")
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(mode == .dark ? .black.opacity(0.10) : .black.opacity(0.03))
            }
        }
    }

    private var levelBadge: some View {
        let (title, color, icon): (String, Color, String) = {
            switch item.level {
            case .critical: return ("Critical", DashboardPalette.critical, "exclamationmark.octagon.fill")
            case .warning: return ("Warning", DashboardPalette.warning, "exclamationmark.triangle.fill")
            case .info: return ("Info", DashboardPalette.cpu, "info.circle.fill")
            }
        }()

        return HStack(spacing: 4) {
            Image(systemName: icon)
            Text(title)
        }
        .font(.system(size: 10, weight: .bold, design: .rounded))
        .foregroundStyle(color)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(color.opacity(0.16), in: Capsule())
    }

    private func detailRow(_ label: String, _ value: String, mono: Bool = false) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
                .frame(width: 80, alignment: .leading)
            if mono {
                Text(value)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .textSelection(.enabled)
            } else {
                Text(value)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
            }
        }
    }
}

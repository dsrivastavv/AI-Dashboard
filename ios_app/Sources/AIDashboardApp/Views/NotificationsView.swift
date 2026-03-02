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
        case .all: return sorted
        case .unread: return sorted.filter { !$0.is_read }
        case .critical: return sorted.filter { $0.level == .critical }
        case .warning: return sorted.filter { $0.level == .warning }
        case .info: return sorted.filter { $0.level == .info }
        }
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                // Header strip
                GlassCard(mode: store.mode, padding: 14) {
                    HStack {
                        if store.unreadCount > 0 {
                            GlassPill(text: "\(store.unreadCount) unread", tint: DashboardPalette.cpu)
                        } else {
                            Text("All caught up")
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(.secondary)
                        }

                        Spacer(minLength: 0)

                        if store.unreadCount > 0 {
                            Button {
                                Task { await store.markAllNotificationsRead() }
                            } label: {
                                Label("Mark all read", systemImage: "checkmark")
                                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                }

                // Filter chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(NotificationsFilter.allCases, id: \.self) { filter in
                            let count = countForFilter(filter)
                            Button {
                                activeFilter = filter
                            } label: {
                                HStack(spacing: 4) {
                                    Text(filter.title)
                                    if count > 0 {
                                        Text("\(count)")
                                            .font(.system(size: 10, weight: .bold, design: .rounded))
                                            .padding(.horizontal, 5)
                                            .padding(.vertical, 2)
                                            .background(Color.primary.opacity(0.1), in: Capsule())
                                    }
                                }
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(activeFilter == filter ? Color.accentColor.opacity(0.2) : Color.clear, in: Capsule())
                                .overlay {
                                    Capsule().stroke(activeFilter == filter ? Color.accentColor.opacity(0.7) : Color.primary.opacity(0.12), lineWidth: 0.8)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 16)
                }
                .padding(.horizontal, -16)

                // Notification list
                if filteredItems.isEmpty {
                    EmptyStateCard(
                        mode: store.mode,
                        title: "No notifications",
                        message: activeFilter == .all
                            ? "No notifications have been generated yet."
                            : "No \(activeFilter.title.lowercased()) notifications."
                    )
                } else {
                    VStack(spacing: 8) {
                        ForEach(filteredItems) { item in
                            notificationRow(item)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .refreshable {
            await store.refreshNotifications()
        }
        .task {
            await store.refreshNotifications()
        }
    }

    // MARK: – Notification row

    private func notificationRow(_ item: NotificationItem) -> some View {
        let isExpanded = expandedID == item.id
        let levelColor = levelTint(item.level)

        return GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: levelIcon(item.level))
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(levelColor)
                        .frame(width: 22, height: 22)
                        .background(levelColor.opacity(0.12), in: Circle())

                    VStack(alignment: .leading, spacing: 3) {
                        HStack {
                            Text(item.title)
                                .font(.system(size: 14, weight: .semibold, design: .rounded))
                                .foregroundStyle(item.is_read ? .secondary : .primary)
                            Spacer(minLength: 0)
                            if !item.is_read {
                                Circle()
                                    .fill(DashboardPalette.cpu)
                                    .frame(width: 7, height: 7)
                            }
                        }
                        Text(Formatters.dateTime(item.created_at))
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                }

                Text(item.message)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                    .lineLimit(isExpanded ? nil : 2)

                if let code = item.code, !code.isEmpty {
                    if isExpanded {
                        ScrollView(.horizontal, showsIndicators: false) {
                            Text(code)
                                .font(.system(size: 12, design: .monospaced))
                                .padding(10)
                                .background(.primary.opacity(0.05), in: RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }

                HStack {
                    GlassPill(text: item.level.rawValue.capitalized, tint: levelColor)

                    if let server = item.server {
                        GlassPill(text: server.name, tint: DashboardPalette.neutral)
                    }

                    Spacer(minLength: 0)

                    if !item.is_read {
                        Button("Mark read") {
                            Task { await store.markNotificationRead(id: item.id) }
                        }
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .buttonStyle(.bordered)
                    }

                    Button(isExpanded ? "Less" : "More") {
                        withAnimation(.spring(response: 0.3)) {
                            expandedID = isExpanded ? nil : item.id
                        }
                    }
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .buttonStyle(.plain)
                    .foregroundStyle(.secondary)
                }
            }
        }
        .onTapGesture {
            withAnimation(.spring(response: 0.3)) {
                expandedID = isExpanded ? nil : item.id
            }
            if !item.is_read {
                Task { await store.markNotificationRead(id: item.id) }
            }
        }
    }

    // MARK: – Helpers

    private func countForFilter(_ filter: NotificationsFilter) -> Int {
        switch filter {
        case .all: return store.notifications.count
        case .unread: return store.notifications.filter { !$0.is_read }.count
        case .critical: return store.notifications.filter { $0.level == .critical }.count
        case .warning: return store.notifications.filter { $0.level == .warning }.count
        case .info: return store.notifications.filter { $0.level == .info }.count
        }
    }

    private func levelTint(_ level: NotificationLevel) -> Color {
        switch level {
        case .critical: return DashboardPalette.critical
        case .warning: return DashboardPalette.warning
        case .info: return DashboardPalette.cpu
        }
    }

    private func levelIcon(_ level: NotificationLevel) -> String {
        switch level {
        case .critical: return "exclamationmark.octagon.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .info: return "info.circle.fill"
        }
    }
}

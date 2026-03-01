import AppKit
import SwiftUI

struct DashboardShellView: View {
    @EnvironmentObject private var store: AppStore

    @State private var showingCreateServer = false

    var body: some View {
        HStack(spacing: 14) {
            sidebar
                .frame(width: 284)

            VStack(spacing: 12) {
                topbar

                Group {
                    switch store.tab {
                    case .stats:
                        StatsDashboardView()
                    case .terminal:
                        TerminalPageView()
                    case .system:
                        SystemInfoPageView()
                    case .notifications:
                        NotificationsPageView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .padding(20)
        .sheet(isPresented: $showingCreateServer) {
            ServerCreateSheet()
                .environmentObject(store)
                .frame(width: 560, height: 520)
        }
    }

    private var topbar: some View {
        GlassCard(mode: store.mode, padding: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(store.serverNameOrFallback)
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                    Text(store.tab.title)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 0)

                if store.isRefreshing {
                    ProgressView()
                        .controlSize(.small)
                }

                NotificationBellMenu()
            }
        }
    }

    private var sidebar: some View {
        GlassCard(mode: store.mode, padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("AI Dashboard")
                        .font(.system(size: 29, weight: .black, design: .rounded))
                    Text("Operate AI infrastructure with clarity, speed, and confidence.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                    Text("by Divyansh Srivastava")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Label("Server", systemImage: "server.rack")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                        Spacer(minLength: 0)
                        Button {
                            showingCreateServer = true
                        } label: {
                            Image(systemName: "plus")
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                    }

                    Picker("Server", selection: Binding<Int>(
                        get: { store.selectedServer?.id ?? -1 },
                        set: { newID in
                            let next = store.servers.first(where: { $0.id == newID })
                            store.selectServer(next)
                        }
                    )) {
                        if store.servers.isEmpty {
                            Text("No servers").tag(-1)
                        } else {
                            ForEach(store.servers) { server in
                                Text(server.name).tag(server.id)
                            }
                        }
                    }
                    .pickerStyle(.menu)

                    Button {
                        Task { await store.refreshAll() }
                    } label: {
                        Label(store.isRefreshing ? "Refreshing…" : "Refresh", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .disabled(store.isRefreshing)
                }

                VStack(alignment: .leading, spacing: 6) {
                    ForEach(AppStore.DashboardTab.allCases) { tab in
                        Button {
                            store.tab = tab
                        } label: {
                            HStack {
                                Image(systemName: iconName(for: tab))
                                    .frame(width: 16)
                                Text(tab.title)
                                Spacer(minLength: 0)
                                if tab == .notifications && store.unreadCount > 0 {
                                    Text(store.unreadCount > 99 ? "99+" : "\(store.unreadCount)")
                                        .font(.system(size: 10, weight: .bold, design: .rounded))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 3)
                                        .background(DashboardPalette.cpu.opacity(0.2), in: Capsule())
                                }
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .background(store.tab == tab ? Color.accentColor.opacity(0.2) : Color.clear, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Theme")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(.secondary)

                    Picker("Theme", selection: $store.mode) {
                        ForEach(ThemeMode.allCases, id: \.self) { mode in
                            Text(mode.title).tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Spacer(minLength: 0)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Session")
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(.secondary)

                    Button {
                        store.openLogout()
                        store.signOutLocally()
                    } label: {
                        Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)

                    Button {
                        store.openSwitchAccount()
                    } label: {
                        Label("Switch account", systemImage: "arrow.left.arrow.right")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
    }

    private func iconName(for tab: AppStore.DashboardTab) -> String {
        switch tab {
        case .stats: return "square.grid.2x2"
        case .terminal: return "terminal"
        case .system: return "info.circle"
        case .notifications: return "bell"
        }
    }
}

private struct NotificationBellMenu: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        Menu {
            if store.notifications.isEmpty {
                Text("No notifications yet")
            } else {
                Section("Notifications") {
                    ForEach(Array(store.notifications.sorted(by: { $0.created_at > $1.created_at }).prefix(12)), id: \.id) { item in
                        Button {
                            store.tab = .notifications
                        } label: {
                            HStack {
                                Label(item.title, systemImage: iconForLevel(item.level))
                                Spacer(minLength: 6)
                                if !item.is_read {
                                    Circle()
                                        .fill(DashboardPalette.cpu)
                                        .frame(width: 6, height: 6)
                                }
                            }
                        }
                    }
                }
            }

            Divider()

            Button("Mark all read") {
                Task { await store.markAllNotificationsRead() }
            }
            .disabled(store.unreadCount == 0)

            Button("Open notifications page") {
                store.tab = .notifications
            }
        } label: {
            ZStack(alignment: .topTrailing) {
                Image(systemName: "bell")
                    .font(.system(size: 15, weight: .semibold))
                    .frame(width: 36, height: 32)
                    .background(.primary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                if store.unreadCount > 0 {
                    Text(store.unreadCount > 99 ? "99+" : "\(store.unreadCount)")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(DashboardPalette.critical, in: Capsule())
                        .foregroundStyle(.white)
                        .offset(x: 8, y: -8)
                }
            }
        }
        .menuStyle(.borderlessButton)
    }

    private func iconForLevel(_ level: NotificationLevel) -> String {
        switch level {
        case .critical: return "exclamationmark.octagon.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .info: return "info.circle.fill"
        }
    }
}

private struct ServerCreateSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var store: AppStore

    @State private var name = ""
    @State private var slug = ""
    @State private var hostname = ""
    @State private var description = ""

    @State private var isSubmitting = false
    @State private var formError: String?
    @State private var result: RegisterServerResponse?

    var body: some View {
        ZStack {
            AuroraBackdrop(mode: store.mode)

            GlassCard(mode: store.mode, padding: 18) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("Add Monitored Server")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                        Spacer(minLength: 0)
                        Button("Close") { dismiss() }
                    }

                    TextField("Name*", text: $name)
                        .textFieldStyle(.roundedBorder)
                    TextField("Slug (optional)", text: $slug)
                        .textFieldStyle(.roundedBorder)
                    TextField("Hostname (optional)", text: $hostname)
                        .textFieldStyle(.roundedBorder)
                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(2...4)

                    if let formError {
                        Text(formError)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(DashboardPalette.critical)
                    }

                    Button {
                        Task {
                            isSubmitting = true
                            defer { isSubmitting = false }
                            do {
                                result = try await store.createServer(
                                    name: name,
                                    slug: slug.isEmpty ? nil : slug,
                                    hostname: hostname.isEmpty ? nil : hostname,
                                    description: description.isEmpty ? nil : description
                                )
                                formError = nil
                            } catch {
                                formError = error.localizedDescription
                            }
                        }
                    } label: {
                        Label(isSubmitting ? "Creating…" : "Create server & generate token", systemImage: "bolt.badge.checkmark")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSubmitting)

                    if let result {
                        Divider().padding(.vertical, 4)

                        Text("Ingest Token")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                        copyRow(result.ingest_token)

                        Text("Agent Command")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                        copyRow(result.agent_command)
                    }

                    Spacer(minLength: 0)
                }
            }
            .padding(18)
        }
    }

    @ViewBuilder
    private func copyRow(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .lineLimit(2)
                .textSelection(.enabled)
                .padding(8)
                .background(.primary.opacity(0.07), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            Button("Copy") {
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(text, forType: .string)
            }
            .buttonStyle(.bordered)
        }
    }
}

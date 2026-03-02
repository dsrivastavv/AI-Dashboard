import SwiftUI

struct DashboardShellView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        TabView(selection: $store.tab) {
            statsTab
            systemTab
            notificationsTab
            settingsTab
        }
        .tint(DashboardPalette.cpu)
    }

    // MARK: – Tabs

    private var statsTab: some View {
        NavigationStack {
            ZStack {
                AuroraBackdrop(mode: store.mode)
                StatsDashboardView()
            }
            .navigationTitle(store.serverNameOrFallback)
            .inlineNavigationTitleIfSupported()
            .toolbar { statsToolbarItems }
        }
        .tabItem {
            Label("Stats", systemImage: "square.grid.2x2")
        }
        .tag(AppStore.DashboardTab.stats)
    }

    private var systemTab: some View {
        NavigationStack {
            ZStack {
                AuroraBackdrop(mode: store.mode)
                SystemInfoPageView()
            }
            .navigationTitle("System Info")
            .inlineNavigationTitleIfSupported()
            .toolbar { commonToolbarItems }
        }
        .tabItem {
            Label("System", systemImage: "info.circle")
        }
        .tag(AppStore.DashboardTab.system)
    }

    private var notificationsTab: some View {
        NavigationStack {
            ZStack {
                AuroraBackdrop(mode: store.mode)
                NotificationsPageView()
            }
            .navigationTitle("Notifications")
            .inlineNavigationTitleIfSupported()
            .toolbar { commonToolbarItems }
        }
        .tabItem {
            Label("Alerts", systemImage: "bell")
        }
#if os(iOS)
        .badge(store.unreadCount > 0 ? store.unreadCount : 0)
#endif
        .tag(AppStore.DashboardTab.notifications)
    }

    private var settingsTab: some View {
        NavigationStack {
            ZStack {
                AuroraBackdrop(mode: store.mode)
                SettingsView()
            }
            .navigationTitle("Settings")
            .inlineNavigationTitleIfSupported()
        }
        .tabItem {
            Label("Settings", systemImage: "gearshape")
        }
        .tag(AppStore.DashboardTab.settings)
    }

    // MARK: – Toolbar

    @ToolbarContentBuilder
    private var statsToolbarItems: some ToolbarContent {
        ToolbarItem(placement: leadingToolbarPlacement) {
            serverPicker
        }
        ToolbarItem(placement: trailingToolbarPlacement) {
            refreshButton
        }
    }

    @ToolbarContentBuilder
    private var commonToolbarItems: some ToolbarContent {
        ToolbarItem(placement: leadingToolbarPlacement) {
            serverPicker
        }
    }

    private var leadingToolbarPlacement: ToolbarItemPlacement {
#if os(macOS)
        .navigation
#else
        .topBarLeading
#endif
    }

    private var trailingToolbarPlacement: ToolbarItemPlacement {
#if os(macOS)
        .primaryAction
#else
        .topBarTrailing
#endif
    }

    private var serverPicker: some View {
        Menu {
            ForEach(store.servers) { server in
                Button {
                    store.selectServer(server)
                } label: {
                    if server.id == store.selectedServer?.id {
                        Label(server.name, systemImage: "checkmark")
                    } else {
                        Text(server.name)
                    }
                }
            }

            if !store.servers.isEmpty {
                Divider()
            }

            Text(store.servers.isEmpty ? "No servers" : "Choose a server")
                .font(.caption)
                .foregroundStyle(.secondary)
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "server.rack")
                    .font(.system(size: 12, weight: .semibold))
                Text(store.selectedServer?.name ?? "Server")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .lineLimit(1)
                Image(systemName: "chevron.down")
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(DashboardPalette.cpu)
        }
    }

    private var refreshButton: some View {
        Button {
            Task { await store.refreshAll() }
        } label: {
            if store.isRefreshing {
                ProgressView()
                    .scaleEffect(0.8)
            } else {
                Image(systemName: "arrow.clockwise")
            }
        }
        .disabled(store.isRefreshing)
    }
}

private extension View {
    @ViewBuilder
    func inlineNavigationTitleIfSupported() -> some View {
#if os(iOS)
        self.navigationBarTitleDisplayMode(.inline)
#else
        self
#endif
    }
}

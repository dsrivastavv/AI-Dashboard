import SwiftUI

struct RootView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        ZStack {
            AuroraBackdrop(mode: store.mode)

            if store.isCheckingSession {
                sessionCheckView
            } else if store.isAuthenticated {
                DashboardShellView()
            } else {
                LoginView()
            }
        }
        .preferredColorScheme(store.mode == .dark ? .dark : .light)
        .task {
            await store.probeSession()
        }
    }

    private var sessionCheckView: some View {
        VStack(spacing: 20) {
            Image(systemName: "server.rack")
                .font(.system(size: 56, weight: .light))
                .foregroundStyle(DashboardPalette.cpu.opacity(0.8))

            Text("AI Dashboard")
                .font(.system(size: 32, weight: .black, design: .rounded))

            Text("Checking session…")
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)

            ProgressView()
                .tint(DashboardPalette.cpu)
        }
        .padding(40)
    }
}

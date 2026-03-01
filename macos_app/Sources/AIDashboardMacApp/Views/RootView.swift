import SwiftUI

struct RootView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        ZStack {
            AuroraBackdrop(mode: store.mode)

            if store.isAuthenticated {
                DashboardShellView()
            } else {
                LoginView()
            }
        }
        .task {
            if store.isCheckingSession {
                await store.probeSession()
            }
        }
    }
}

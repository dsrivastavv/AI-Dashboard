import SwiftUI

@main
struct AIDashboardMacApp: App {
    @StateObject private var store = AppStore()

    var body: some Scene {
        WindowGroup("AI Dashboard") {
            RootView()
                .environmentObject(store)
                .frame(minWidth: 1220, minHeight: 760)
        }
        .windowStyle(.titleBar)
        .windowResizability(.contentSize)
    }
}

import SwiftUI

struct TerminalPageView: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        VStack {
            Spacer()
            GlassCard(mode: store.mode, padding: 22) {
                VStack(spacing: 10) {
                    Image(systemName: "terminal")
                        .font(.system(size: 34, weight: .light))
                    Text("Work in progress")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    Text("The interactive terminal is under construction. Check back soon.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: 400)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}

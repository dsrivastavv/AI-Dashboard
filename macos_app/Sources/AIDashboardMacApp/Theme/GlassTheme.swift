import SwiftUI

enum ThemeMode: String, CaseIterable {
    case dark
    case light

    var title: String {
        switch self {
        case .dark: return "Dark"
        case .light: return "Light"
        }
    }
}

enum MetricEntity: String {
    case cpu
    case memory
    case gpu
    case disk
    case network
    case neutral
}

enum DashboardPalette {
    static let cpu = Color(red: 0.29, green: 0.47, blue: 0.78)
    static let memory = Color(red: 0.75, green: 0.35, blue: 0.56)
    static let gpu = Color(red: 0.16, green: 0.53, blue: 0.60)
    static let disk = Color(red: 0.53, green: 0.35, blue: 0.72)
    static let network = Color(red: 0.18, green: 0.58, blue: 0.38)
    static let neutral = Color(red: 0.39, green: 0.45, blue: 0.55)

    static let critical = Color(red: 0.75, green: 0.25, blue: 0.25)
    static let warning = Color(red: 0.72, green: 0.58, blue: 0.16)

    static func entity(_ entity: MetricEntity) -> Color {
        switch entity {
        case .cpu: return cpu
        case .memory: return memory
        case .gpu: return gpu
        case .disk: return disk
        case .network: return network
        case .neutral: return neutral
        }
    }
}

struct AuroraBackdrop: View {
    let mode: ThemeMode
    @State private var animate = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: mode == .dark
                    ? [Color(red: 0.03, green: 0.05, blue: 0.10), Color(red: 0.06, green: 0.05, blue: 0.10), Color(red: 0.04, green: 0.08, blue: 0.08)]
                    : [Color(red: 0.90, green: 0.94, blue: 0.99), Color(red: 0.94, green: 0.92, blue: 0.98), Color(red: 0.88, green: 0.95, blue: 0.94)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Circle()
                .fill(DashboardPalette.cpu.opacity(mode == .dark ? 0.28 : 0.22))
                .frame(width: 620, height: 620)
                .blur(radius: 70)
                .offset(x: animate ? -320 : -220, y: animate ? -260 : -180)

            Circle()
                .fill(DashboardPalette.memory.opacity(mode == .dark ? 0.24 : 0.18))
                .frame(width: 560, height: 560)
                .blur(radius: 80)
                .offset(x: animate ? 320 : 260, y: animate ? -160 : -90)

            Circle()
                .fill(DashboardPalette.gpu.opacity(mode == .dark ? 0.22 : 0.15))
                .frame(width: 720, height: 720)
                .blur(radius: 90)
                .offset(x: animate ? 120 : 60, y: animate ? 280 : 210)

            if mode == .dark {
                Rectangle()
                    .fill(.black.opacity(0.2))
            }
        }
        .ignoresSafeArea()
        .animation(.easeInOut(duration: 12).repeatForever(autoreverses: true), value: animate)
        .onAppear {
            animate = true
        }
    }
}

struct GlassCard<Content: View>: View {
    let mode: ThemeMode
    var padding: CGFloat = 16
    @ViewBuilder let content: Content

    var body: some View {
        content
            .padding(padding)
            .background {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(mode == .dark ? .ultraThinMaterial : .thinMaterial)
            }
            .overlay {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(mode == .dark ? .white.opacity(0.14) : .black.opacity(0.08), lineWidth: 1)
            }
            .shadow(color: .black.opacity(mode == .dark ? 0.24 : 0.1), radius: 20, x: 0, y: 12)
    }
}

struct GlassPill: View {
    let text: String
    let tint: Color

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold, design: .rounded))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(tint.opacity(0.18), in: Capsule())
            .overlay {
                Capsule().stroke(tint.opacity(0.55), lineWidth: 0.8)
            }
    }
}

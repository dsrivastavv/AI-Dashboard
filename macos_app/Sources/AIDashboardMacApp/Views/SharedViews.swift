import SwiftUI

struct SectionHeader: View {
    let title: String
    let subtitle: String?
    let icon: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.secondary)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                }
            }
            Spacer(minLength: 0)
        }
    }
}

struct EmptyStateCard: View {
    let mode: ThemeMode
    let title: String
    let message: String

    var body: some View {
        GlassCard(mode: mode) {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                Text(message)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct ErrorStateCard: View {
    let mode: ThemeMode
    let title: String
    let message: String

    var body: some View {
        GlassCard(mode: mode) {
            VStack(alignment: .leading, spacing: 8) {
                Label(title, systemImage: "exclamationmark.triangle.fill")
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                    .foregroundStyle(DashboardPalette.critical)
                Text(message)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct RangeSelector: View {
    let options: [AppStore.TimeRangeOption]
    let value: Int
    let onChange: (Int) -> Void

    var body: some View {
        HStack(spacing: 6) {
            ForEach(options, id: \.minutes) { option in
                Button(option.label) {
                    onChange(option.minutes)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(option.minutes == value ? Color.accentColor.opacity(0.22) : Color.clear, in: Capsule())
                .overlay {
                    Capsule().stroke(option.minutes == value ? Color.accentColor.opacity(0.7) : Color.primary.opacity(0.1), lineWidth: 0.8)
                }
                .font(.system(size: 11, weight: .semibold, design: .rounded))
            }
        }
    }
}

struct MetricProgressBar: View {
    let value: Double
    let tint: Color

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 5, style: .continuous)
                    .fill(.primary.opacity(0.08))
                RoundedRectangle(cornerRadius: 5, style: .continuous)
                    .fill(tint)
                    .frame(width: proxy.size.width * max(0, min(1, value / 100)))
            }
        }
        .frame(height: 8)
    }
}

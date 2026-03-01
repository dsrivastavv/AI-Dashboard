import Foundation
import SwiftUI

enum Formatters {
    private static let numberFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.maximumFractionDigits = 1
        formatter.minimumFractionDigits = 0
        formatter.numberStyle = .decimal
        return formatter
    }()

    private static let dateFormatter = ISO8601DateFormatter()

    static func parseDate(_ raw: String?) -> Date? {
        guard let raw else { return nil }
        if let date = dateFormatter.date(from: raw) {
            return date
        }

        // Covers timestamps with fractional seconds from Django.
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return withFraction.date(from: raw)
    }

    static func percent(_ value: Double?, digits: Int = 1) -> String {
        guard let value else { return "-" }
        return String(format: "%0.*f%%", digits, value)
    }

    static func bytes(_ value: Double?) -> String {
        guard let value else { return "-" }
        let units = ["B", "KB", "MB", "GB", "TB", "PB"]
        var size = abs(value)
        var index = 0
        while size >= 1024 && index < units.count - 1 {
            size /= 1024
            index += 1
        }
        let signed = value < 0 ? -size : size
        let number = numberFormatter.string(from: NSNumber(value: signed)) ?? "\(signed)"
        return "\(number) \(units[index])"
    }

    static func throughput(_ value: Double?) -> String {
        "\(bytes(value))/s"
    }

    static func number(_ value: Double?, digits: Int = 1) -> String {
        guard let value else { return "-" }
        return String(format: "%0.*f", digits, value)
    }

    static func integer(_ value: Double?) -> String {
        guard let value else { return "-" }
        return numberFormatter.string(from: NSNumber(value: value)) ?? "\(Int(value))"
    }

    static func dateTime(_ iso: String?) -> String {
        guard let date = parseDate(iso) else { return "-" }
        return date.formatted(date: .abbreviated, time: .shortened)
    }

    static func relativeSeconds(_ seconds: Double?) -> String {
        guard let seconds else { return "-" }
        if seconds < 1 { return "just now" }
        if seconds < 60 { return "\(Int(seconds.rounded()))s ago" }
        let mins = seconds / 60
        if mins < 60 { return "\(Int(mins.rounded()))m ago" }
        let hrs = mins / 60
        if hrs < 24 { return "\(Int(hrs.rounded()))h ago" }
        let days = hrs / 24
        return "\(Int(days.rounded()))d ago"
    }

    static func bottleneckTitle(_ label: String) -> String {
        label
            .replacingOccurrences(of: "-", with: " ")
            .replacingOccurrences(of: "_", with: " ")
            .split(separator: " ")
            .map { $0.capitalized }
            .joined(separator: " ")
    }

    static func utilizationColor(_ percent: Double?) -> Color {
        guard let percent else { return .secondary }
        if percent >= 90 { return DashboardPalette.critical }
        if percent >= 70 { return DashboardPalette.warning }
        return .primary
    }

    static func temperatureColor(_ celsius: Double?) -> Color {
        guard let celsius else { return .secondary }
        if celsius >= 85 { return DashboardPalette.critical }
        if celsius >= 70 { return DashboardPalette.warning }
        return .primary
    }
}

extension MetricSnapshot.Bottleneck {
    var entity: MetricEntity {
        let normalized = label.lowercased()
        if normalized.contains("gpu") { return .gpu }
        if normalized.contains("cpu") { return .cpu }
        if normalized.contains("memory") { return .memory }
        if normalized.contains("disk") || normalized.contains("io") { return .disk }
        if normalized.contains("network") || normalized.contains("net") { return .network }
        return .neutral
    }
}

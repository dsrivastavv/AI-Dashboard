import SwiftUI

enum LegalDocumentType: String, Identifiable {
    case privacy
    case terms

    var id: String { rawValue }

    var title: String {
        switch self {
        case .privacy: return "Privacy Policy"
        case .terms: return "Terms of Service"
        }
    }

    var lastUpdated: String { "February 28, 2026" }

    var sections: [(String, [String])] {
        switch self {
        case .privacy:
            return [
                (
                    "Data We Collect",
                    [
                        "Server metrics you choose to send (CPU, GPU, memory, disk, network).",
                        "Authentication identifiers used to verify access.",
                        "Basic request logs for reliability and security troubleshooting."
                    ]
                ),
                (
                    "How We Use Data",
                    [
                        "Render real-time dashboards and alerts.",
                        "Maintain security, audit access, and prevent abuse.",
                        "Improve service reliability and performance."
                    ]
                ),
                (
                    "Sharing & Transfers",
                    ["We do not sell data. We share it only as required by law or to operate infrastructure we control."]
                ),
                (
                    "Security",
                    ["Access is restricted via allowlisted accounts. Metrics are transmitted over TLS."]
                ),
                (
                    "Changes",
                    ["Material policy updates will be reflected on this page with a new date."]
                )
            ]

        case .terms:
            return [
                (
                    "Access & Eligibility",
                    [
                        "Access is limited to allowlisted accounts provided by the administrator.",
                        "You must protect your credentials and report unauthorized access."
                    ]
                ),
                (
                    "Acceptable Use",
                    [
                        "Do not attempt to disrupt the service or other users.",
                        "Only send metrics from servers you are authorized to monitor.",
                        "No reverse engineering or resale of the service."
                    ]
                ),
                (
                    "Disclaimer",
                    ["The service is provided as is without warranties of any kind."]
                ),
                (
                    "Limitation of Liability",
                    ["To the maximum extent permitted by law, indirect and consequential damages are excluded."]
                ),
                (
                    "Changes",
                    ["Continued use after terms changes means you accept the revised terms."]
                )
            ]
        }
    }
}

struct LegalDocumentSheet: View {
    @Environment(\.dismiss) private var dismiss

    let mode: ThemeMode
    let document: LegalDocumentType

    var body: some View {
        ZStack {
            AuroraBackdrop(mode: mode)

            ScrollView {
                GlassCard(mode: mode, padding: 18) {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(document.title)
                                    .font(.system(size: 26, weight: .bold, design: .rounded))
                                Text("Last updated: \(document.lastUpdated)")
                                    .font(.system(size: 12, weight: .medium, design: .rounded))
                                    .foregroundStyle(.secondary)
                            }
                            Spacer(minLength: 0)
                            Button("Close") { dismiss() }
                        }

                        ForEach(document.sections.indices, id: \.self) { index in
                            let section = document.sections[index]
                            VStack(alignment: .leading, spacing: 8) {
                                Text(section.0)
                                    .font(.system(size: 15, weight: .bold, design: .rounded))
                                ForEach(section.1, id: \.self) { line in
                                    Text("• \(line)")
                                        .font(.system(size: 12, weight: .medium, design: .rounded))
                                }
                            }
                            if index != document.sections.count - 1 {
                                Divider()
                            }
                        }
                    }
                }
                .padding(20)
            }
        }
    }
}

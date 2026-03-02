import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var store: AppStore

    @State private var serverName = ""
    @State private var serverSlug = ""
    @State private var serverHostname = ""
    @State private var serverDescription = ""

    @State private var isCreatingServer = false
    @State private var createServerMessage: String?
    @State private var createServerError: String?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                themeCard
                backendCard
                serverCard
                sessionCard
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
    }

    private var themeCard: some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Appearance", subtitle: nil, icon: "paintpalette")
                Picker("Theme", selection: $store.mode) {
                    ForEach(ThemeMode.allCases, id: \.self) { mode in
                        Text(mode.title).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
            }
        }
    }

    private var backendCard: some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Backend", subtitle: nil, icon: "network")
                TextField("http://sdworkstation.ucsd.edu:8000", text: $store.baseURLString)
                    .font(.system(size: 12, design: .monospaced))
                    .textFieldStyle(.roundedBorder)

                HStack(spacing: 8) {
                    Button("Apply URL") {
                        store.updateBaseURL()
                    }
                    .buttonStyle(.bordered)

                    Button("Reconnect") {
                        store.updateBaseURL()
                        Task { await store.probeSession() }
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
        }
    }

    private var serverCard: some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Server Registration", subtitle: nil, icon: "server.rack")

                if let selected = store.selectedServer {
                    InfoRow(label: "Selected", value: selected.name)
                    InfoRow(label: "Slug", value: selected.slug, mono: true)
                } else {
                    Text("No server currently selected.")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                }

                Divider()

                TextField("Name (required)", text: $serverName)
                    .textFieldStyle(.roundedBorder)
                TextField("Slug (optional)", text: $serverSlug)
                    .textFieldStyle(.roundedBorder)
                TextField("Hostname (optional)", text: $serverHostname)
                    .textFieldStyle(.roundedBorder)
                TextField("Description (optional)", text: $serverDescription, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)

                if let createServerMessage {
                    Text(createServerMessage)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(DashboardPalette.network)
                }

                if let createServerError {
                    Text(createServerError)
                        .font(.system(size: 12, weight: .semibold, design: .rounded))
                        .foregroundStyle(DashboardPalette.critical)
                }

                Button(isCreatingServer ? "Registering…" : "Register Server") {
                    Task { await registerServer() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isCreatingServer || serverName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }

    private var sessionCard: some View {
        GlassCard(mode: store.mode, padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "Session", subtitle: nil, icon: "person.crop.circle")

                HStack(spacing: 8) {
                    Button("Switch account") {
                        store.openSwitchAccount()
                    }
                    .buttonStyle(.bordered)

                    Button("Open logout") {
                        store.openLogout()
                    }
                    .buttonStyle(.bordered)
                }

                Button("Sign out locally") {
                    store.signOutLocally()
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }

    @MainActor
    private func registerServer() async {
        isCreatingServer = true
        createServerMessage = nil
        createServerError = nil

        do {
            let response = try await store.createServer(
                name: serverName.trimmingCharacters(in: .whitespacesAndNewlines),
                slug: trimmedOrNil(serverSlug),
                hostname: trimmedOrNil(serverHostname),
                description: trimmedOrNil(serverDescription)
            )
            createServerMessage = "Registered server: \(response.server.name)"
            serverName = ""
            serverSlug = ""
            serverHostname = ""
            serverDescription = ""
        } catch {
            createServerError = error.localizedDescription
        }

        isCreatingServer = false
    }

    private func trimmedOrNil(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

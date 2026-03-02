import Combine
import Foundation
import SwiftUI
#if os(iOS)
import UIKit
#elseif os(macOS)
import AppKit
#endif

@MainActor
final class AppStore: ObservableObject {
    enum DashboardTab: String, CaseIterable, Identifiable {
        case stats
        case system
        case notifications
        case settings

        var id: String { rawValue }

        var title: String {
            switch self {
            case .stats: return "Stats"
            case .system: return "System Info"
            case .notifications: return "Notifications"
            case .settings: return "Settings"
            }
        }

        var icon: String {
            switch self {
            case .stats: return "square.grid.2x2"
            case .system: return "info.circle"
            case .notifications: return "bell"
            case .settings: return "gearshape"
            }
        }
    }

    struct TimeRangeOption: Hashable {
        let label: String
        let minutes: Int
    }

    static let timeRangeOptions: [TimeRangeOption] = [
        .init(label: "15m", minutes: 15),
        .init(label: "60m", minutes: 60),
        .init(label: "6h", minutes: 360),
        .init(label: "24h", minutes: 1440)
    ]

    @Published var mode: ThemeMode = .dark
    @Published var tab: DashboardTab = .stats

    @Published var baseURLString: String = "http://sdworkstation.ucsd.edu:8000"

    @Published var isCheckingSession = true
    @Published var isAuthenticated = false
    @Published var accessDenied = false

    @Published var authError: String?
    @Published var authSuccess: String?
    @Published var authLoading = false

    @Published var servers: [ServerSummary] = []
    @Published var selectedServer: ServerSummary?

    @Published var latestSnapshot: MetricSnapshot?
    @Published var latestNotFoundMessage: String?
    @Published var historyPoints: [HistoryPoint] = []

    @Published var latestError: String?
    @Published var historyError: String?
    @Published var notificationsError: String?

    @Published var isInitialLoading = true
    @Published var isRefreshing = false

    @Published var backendVersion: String = "unknown"
    @Published var minAgentVersion: String?

    @Published var systemMinutes = 15
    @Published var ioMinutes = 15

    @Published var notifications: [NotificationItem] = []

    private var apiClient: APIClient

    private var latestTimer: Timer?
    private var historyTimer: Timer?
    private var notificationsTimer: Timer?

    init() {
        let url = URL(string: "http://sdworkstation.ucsd.edu:8000")!
        self.apiClient = APIClient(baseURL: url)
    }

    var unreadCount: Int {
        notifications.filter { !$0.is_read }.count
    }

    var selectedServerSlug: String? {
        selectedServer?.slug
    }

    var serverNameOrFallback: String {
        selectedServer?.name ?? "Operations Center"
    }

    var loginGoogleURL: URL? {
        guard let base = normalizedBaseURL() else { return nil }
        let next = base.appending(path: "dashboard").absoluteString
        let authURL = base.appending(path: "accounts/google/login/")
        guard var components = URLComponents(url: authURL, resolvingAgainstBaseURL: false) else {
            return nil
        }
        components.queryItems = [URLQueryItem(name: "next", value: next)]
        return components.url
    }

    func updateBaseURL() {
        guard let base = normalizedBaseURL() else {
            authError = "Invalid backend URL"
            return
        }
        apiClient.updateBaseURL(base)
    }

    func openPrivacy() {
        guard let base = normalizedBaseURL() else { return }
        openInBrowser(base.appending(path: "privacy"))
    }

    func openTerms() {
        guard let base = normalizedBaseURL() else { return }
        openInBrowser(base.appending(path: "terms"))
    }

    func openGoogleSignIn() {
        guard let url = loginGoogleURL else { return }
        openInBrowser(url)
    }

    func openSwitchAccount() {
        guard let base = normalizedBaseURL() else { return }
        openInBrowser(base.appending(path: "accounts/google/login/"))
    }

    func openLogout() {
        guard let base = normalizedBaseURL() else { return }
        guard let url = URL(string: "/accounts/logout/?next=/login", relativeTo: base)?.absoluteURL else {
            return
        }
        openInBrowser(url)
    }

    func probeSession() async {
        isCheckingSession = true
        accessDenied = false
        authError = nil
        updateBaseURL()

        do {
            let response = try await apiClient.getServers()
            isAuthenticated = true
            servers = response.servers
            if selectedServer == nil {
                selectedServer = response.servers.first
            }
            isCheckingSession = false
            await refreshAll()
            await refreshNotifications()
            startPolling()
        } catch let error as APIClientError {
            handleAuthError(error)
            isCheckingSession = false
        } catch {
            authError = error.localizedDescription
            isCheckingSession = false
        }
    }

    func signIn(username: String, password: String) async {
        guard !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        guard !password.isEmpty else { return }

        authLoading = true
        authError = nil
        authSuccess = nil
        updateBaseURL()

        do {
            _ = try await apiClient.authLogin(username: username.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
            isAuthenticated = true
            accessDenied = false
            authSuccess = nil
            await refreshAll()
            await refreshNotifications()
            startPolling()
        } catch let error as APIClientError {
            handleAuthError(error)
        } catch {
            authError = error.localizedDescription
        }

        authLoading = false
    }

    func register(username: String, email: String, password: String) async {
        guard !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        guard !password.isEmpty else { return }

        authLoading = true
        authError = nil
        authSuccess = nil

        do {
            _ = try await apiClient.authRegister(
                username: username.trimmingCharacters(in: .whitespacesAndNewlines),
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            )
            authSuccess = "Account created. You can now sign in."
        } catch let error as APIClientError {
            handleAuthError(error)
        } catch {
            authError = error.localizedDescription
        }

        authLoading = false
    }

    func forgotPassword(email: String) async {
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        authLoading = true
        authError = nil
        authSuccess = nil

        do {
            let response = try await apiClient.authForgotPassword(email: email.trimmingCharacters(in: .whitespacesAndNewlines))
            authSuccess = response.message
        } catch let error as APIClientError {
            handleAuthError(error)
        } catch {
            authError = error.localizedDescription
        }

        authLoading = false
    }

    func signOutLocally() {
        stopPolling()
        isAuthenticated = false
        accessDenied = false
        authSuccess = nil
        authError = nil
        servers = []
        selectedServer = nil
        latestSnapshot = nil
        latestNotFoundMessage = nil
        historyPoints = []
        notifications = []
        isInitialLoading = false
    }

    func selectServer(_ server: ServerSummary?) {
        selectedServer = server
        Task { await refreshAll() }
    }

    func setSystemMinutes(_ minutes: Int) {
        systemMinutes = minutes
        Task { await fetchHistory(background: true) }
    }

    func setIOMinutes(_ minutes: Int) {
        ioMinutes = minutes
        Task { await fetchHistory(background: true) }
    }

    func refreshAll(background: Bool = false) async {
        if !background {
            isRefreshing = true
            isInitialLoading = latestSnapshot == nil && historyPoints.isEmpty
        }

        async let latest: Void = fetchLatest(background: background)
        async let history: Void = fetchHistory(background: background)
        _ = await (latest, history)

        if !background {
            isRefreshing = false
            isInitialLoading = false
        }
    }

    func fetchLatest(background: Bool = false) async {
        do {
            let response = try await apiClient.getMetricsLatest(server: selectedServerSlug)
            latestSnapshot = response.snapshot
            latestNotFoundMessage = nil
            latestError = nil
            backendVersion = response.backend_version ?? backendVersion
            minAgentVersion = response.min_agent_version

            mergeServers(response.servers)
            selectedServer = response.selected_server
        } catch let error as APIClientError {
            switch error {
            case .authRequired:
                isAuthenticated = false
                stopPolling()
            case .forbidden(let message):
                accessDenied = true
                latestError = message
            case .notFound(let message, let payload):
                latestSnapshot = nil
                latestNotFoundMessage = message
                latestError = nil
                if let payload,
                   let parsed = try? JSONDecoder().decode(LatestSnapshotNotFoundResponse.self, from: payload) {
                    mergeServers(parsed.servers ?? [])
                    if let selected = parsed.selected_server {
                        selectedServer = selected
                    }
                }
            default:
                if !background {
                    latestError = error.localizedDescription
                }
            }
        } catch {
            if !background {
                latestError = error.localizedDescription
            }
        }
    }

    func fetchHistory(background: Bool = false) async {
        let minutes = max(systemMinutes, ioMinutes)

        do {
            let response = try await apiClient.getMetricsHistory(server: selectedServerSlug, minutes: minutes)
            historyPoints = response.points
            historyError = nil
            backendVersion = response.backend_version ?? backendVersion
            minAgentVersion = response.min_agent_version ?? minAgentVersion

            mergeServers(response.servers)
            if let selected = response.selected_server {
                selectedServer = selected
            }
        } catch let error as APIClientError {
            switch error {
            case .authRequired:
                isAuthenticated = false
                stopPolling()
            case .forbidden(let message):
                accessDenied = true
                historyError = message
            default:
                if !background {
                    historyError = error.localizedDescription
                }
            }
        } catch {
            if !background {
                historyError = error.localizedDescription
            }
        }
    }

    func refreshNotifications() async {
        do {
            let response = try await apiClient.getNotifications()
            notifications = response.notifications
            notificationsError = nil
        } catch {
            notificationsError = "notifications_unavailable"
        }
    }

    func markAllNotificationsRead() async {
        let unreadIds = notifications.filter { !$0.is_read }.map(\.id)
        guard !unreadIds.isEmpty else { return }

        do {
            _ = try await apiClient.markNotificationsRead(ids: unreadIds)
            notifications = notifications.map { item in
                NotificationItem(
                    id: item.id,
                    level: item.level,
                    title: item.title,
                    message: item.message,
                    code: item.code,
                    is_read: true,
                    created_at: item.created_at,
                    server: item.server
                )
            }
        } catch {
            // Keep local state unchanged if mark read fails.
        }
    }

    func markNotificationRead(id: Int) async {
        do {
            _ = try await apiClient.markNotificationsRead(ids: [id])
            notifications = notifications.map { item in
                guard item.id == id else { return item }
                return NotificationItem(
                    id: item.id,
                    level: item.level,
                    title: item.title,
                    message: item.message,
                    code: item.code,
                    is_read: true,
                    created_at: item.created_at,
                    server: item.server
                )
            }
        } catch {
            // Keep local state unchanged if mark read fails.
        }
    }

    func createServer(
        name: String,
        slug: String?,
        hostname: String?,
        description: String?
    ) async throws -> RegisterServerResponse {
        let result = try await apiClient.registerServer(name: name, slug: slug, hostname: hostname, description: description)
        mergeServers([result.server])
        selectedServer = result.server
        await refreshAll(background: true)
        return result
    }

    // MARK: – Private helpers

    private func openInBrowser(_ url: URL) {
#if os(iOS)
        UIApplication.shared.open(url)
#elseif os(macOS)
        NSWorkspace.shared.open(url)
#endif
    }

    private func startPolling() {
        stopPolling()

        latestTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task { await self.fetchLatest(background: true) }
        }

        historyTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task { await self.fetchHistory(background: true) }
        }

        notificationsTimer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task { await self.refreshNotifications() }
        }

        RunLoop.main.add(latestTimer!, forMode: .common)
        RunLoop.main.add(historyTimer!, forMode: .common)
        RunLoop.main.add(notificationsTimer!, forMode: .common)
    }

    private func stopPolling() {
        latestTimer?.invalidate()
        historyTimer?.invalidate()
        notificationsTimer?.invalidate()
        latestTimer = nil
        historyTimer = nil
        notificationsTimer = nil
    }

    private func mergeServers(_ incoming: [ServerSummary]) {
        guard !incoming.isEmpty else { return }

        var dictionary: [Int: ServerSummary] = Dictionary(uniqueKeysWithValues: servers.map { ($0.id, $0) })
        incoming.forEach { dictionary[$0.id] = $0 }
        servers = dictionary.values.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }

        if let selectedServer {
            self.selectedServer = servers.first(where: { $0.id == selectedServer.id }) ?? selectedServer
        } else {
            selectedServer = servers.first
        }
    }

    private func handleAuthError(_ error: APIClientError) {
        switch error {
        case .authRequired:
            isAuthenticated = false
            accessDenied = false
            authError = nil
        case .forbidden(let message):
            isAuthenticated = false
            accessDenied = true
            authError = message
        default:
            authError = error.localizedDescription
        }
    }

    private func normalizedBaseURL() -> URL? {
        var value = baseURLString.trimmingCharacters(in: .whitespacesAndNewlines)
        if value.isEmpty { return nil }
        if !value.contains("://") { value = "http://\(value)" }
        if value.hasSuffix("/") { value.removeLast() }
        return URL(string: value)
    }
}

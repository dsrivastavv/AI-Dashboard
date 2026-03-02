import Foundation

enum APIClientError: LocalizedError {
    case invalidURL
    case transport(String)
    case decoding(String)
    case authRequired(loginURL: String?)
    case forbidden(message: String)
    case notFound(message: String, payload: Data?)
    case server(message: String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL."
        case .transport(let message):
            return message
        case .decoding(let message):
            return "Failed to parse response: \(message)"
        case .authRequired:
            return "Authentication required."
        case .forbidden(let message):
            return message
        case .notFound(let message, _):
            return message
        case .server(let message):
            return message
        }
    }
}

final class APIClient {
    private let session: URLSession
    private let decoder = JSONDecoder()
    private var baseURL: URL

    init(baseURL: URL) {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.httpShouldSetCookies = true
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        self.session = URLSession(configuration: config)
        self.baseURL = baseURL
    }

    func updateBaseURL(_ url: URL) {
        baseURL = url
    }

    func getServers() async throws -> ServersListResponse {
        try await request(path: "/api/servers/", method: "GET")
    }

    func registerServer(name: String, slug: String?, hostname: String?, description: String?) async throws -> RegisterServerResponse {
        let body: [String: Any?] = [
            "name": name,
            "slug": slug,
            "hostname": hostname,
            "description": description
        ]
        return try await request(path: "/api/servers/register/", method: "POST", body: body.compactMapValues { $0 })
    }

    func getMetricsLatest(server: String?) async throws -> LatestSnapshotResponse {
        try await request(path: "/api/metrics/latest/", method: "GET", queryItems: [URLQueryItem(name: "server", value: server)])
    }

    func getMetricsHistory(server: String?, minutes: Int?) async throws -> HistoryMetricsResponse {
        try await request(
            path: "/api/metrics/history/",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "server", value: server),
                URLQueryItem(name: "minutes", value: minutes.map { String($0) })
            ]
        )
    }

    func getNotifications() async throws -> NotificationsResponse {
        try await request(path: "/api/notifications/", method: "GET")
    }

    func markNotificationsRead(ids: [Int]) async throws -> MarkNotificationsReadResponse {
        try await request(path: "/api/notifications/mark-read/", method: "POST", body: ["ids": ids])
    }

    func authLogin(username: String, password: String) async throws -> AuthResponse {
        try await request(path: "/api/auth/login/", method: "POST", body: ["username": username, "password": password])
    }

    func authRegister(username: String, email: String, password: String) async throws -> AuthResponse {
        try await request(path: "/api/auth/register/", method: "POST", body: ["username": username, "email": email, "password": password])
    }

    func authForgotPassword(email: String) async throws -> ForgotPasswordResponse {
        try await request(path: "/api/auth/forgot-password/", method: "POST", body: ["email": email])
    }

    private func makeURL(path: String, queryItems: [URLQueryItem?] = []) -> URL? {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            return nil
        }
        components.path = path
        let filtered = queryItems.compactMap { $0 }
            .filter { !($0.value ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        components.queryItems = filtered.isEmpty ? nil : filtered
        return components.url
    }

    private func request<T: Decodable>(
        path: String,
        method: String,
        queryItems: [URLQueryItem?] = [],
        body: Any? = nil
    ) async throws -> T {
        guard let url = makeURL(path: path, queryItems: queryItems) else {
            throw APIClientError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        do {
            let (data, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIClientError.transport("Invalid server response.")
            }

            guard (200...299).contains(httpResponse.statusCode) else {
                try throwHTTPError(statusCode: httpResponse.statusCode, data: data)
            }

            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                throw APIClientError.decoding(error.localizedDescription)
            }
        } catch let apiError as APIClientError {
            throw apiError
        } catch {
            throw APIClientError.transport(error.localizedDescription)
        }
    }

    private func throwHTTPError(statusCode: Int, data: Data) throws {
        let envelope = try? decoder.decode(ApiErrorResponse.self, from: data)
        let message = envelope?.error ?? HTTPURLResponse.localizedString(forStatusCode: statusCode)

        switch statusCode {
        case 401:
            throw APIClientError.authRequired(loginURL: envelope?.login_url)
        case 403:
            throw APIClientError.forbidden(message: message)
        case 404:
            throw APIClientError.notFound(message: message, payload: data)
        default:
            if envelope?.auth_required == true {
                throw APIClientError.authRequired(loginURL: envelope?.login_url)
            }
            throw APIClientError.server(message: message)
        }
    }
}

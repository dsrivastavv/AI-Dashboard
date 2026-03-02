# AI Dashboard iPhone App (SwiftUI)

Native iPhone client for the AI Dashboard backend, sharing the same API contracts as the React frontend and macOS app.

## Features

- **Login flows**: email/password sign-in, registration, forgot password, Google SSO (browser redirect)
- **Stats tab**: live metric cards (CPU, memory, GPU, disk, network), trend charts, GPU/disk device tables, bottleneck analysis
- **System Info tab**: OS, hardware, uptime, partition and network interface details
- **Notifications tab**: filterable alert list with unread badge, mark-read support
- **Settings tab**: server picker & registration, theme toggle, backend URL config, session management
- **Live polling**: metrics every 1 s, history every 5 s, notifications every 10 s

## Requirements

- macOS 14+ with **Xcode 16+** (iOS Simulator or device)
- iOS 17+ deployment target
- Running backend at `http://sdworkstation.ucsd.edu:8000` (default; configurable in Settings)

## Open in Xcode

1. Launch Xcode → **File ▸ New ▸ Project…**
2. Choose **App** under iOS, click **Next**.
3. Set:
   - **Product Name**: `AIDashboardApp`
   - **Bundle ID**: `com.yourname.AIDashboardApp`
   - **Interface**: SwiftUI
   - **Language**: Swift
   - **Minimum Deployments**: iOS 17
4. Choose a location **other than** `ios_app/` and finish.
5. Delete the generated `ContentView.swift` and `<AppName>App.swift`.
6. In the Xcode project navigator, right-click the source group → **Add Files to "AIDashboardApp"…**
7. Navigate to this `ios_app/Sources/AIDashboardApp/` directory, select all files/folders, confirm **Add**.
8. Add the **Charts** framework: Project settings → Target → **Frameworks, Libraries, and Embedded Content** → `+` → search `Charts` → add.
9. Build and run on the iOS Simulator (⌘R).

> **Tip – Quick SPM open**: As an alternative to the manual project setup, you can open `ios_app/` directly in Xcode via **File ▸ Open…** → select the folder. Xcode will recognise the `Package.swift` manifest and let you run the app on the simulator using the `AIDashboardApp` scheme.

## Default Backend URL

```
http://sdworkstation.ucsd.edu:8000
```

Configurable at runtime via **Settings ▸ Backend URL** without restarting the app.

## Backend Endpoints Used

| Method | Path |
|--------|------|
| `GET`  | `/api/servers/` |
| `POST` | `/api/servers/register/` |
| `GET`  | `/api/metrics/latest/` |
| `GET`  | `/api/metrics/history/` |
| `GET`  | `/api/notifications/` |
| `POST` | `/api/notifications/mark-read/` |
| `POST` | `/api/auth/login/` |
| `POST` | `/api/auth/register/` |
| `POST` | `/api/auth/forgot-password/` |

## Project Structure

```
Sources/AIDashboardApp/
├── AIDashboardApp.swift          – @main SwiftUI App entry point
├── Models/
│   └── APIModels.swift           – Codable DTOs (shared with macOS app)
├── Networking/
│   └── APIClient.swift           – URLSession-based API client (shared)
├── State/
│   └── AppStore.swift            – ObservableObject state + polling
├── Theme/
│   ├── GlassTheme.swift          – Colors, aurora backdrop, glass cards
│   └── Formatters.swift          – Byte/percent/date formatters
└── Views/
    ├── RootView.swift             – Session-check gate
    ├── LoginView.swift            – Auth screens (sign in / register / forgot)
    ├── DashboardShellView.swift   – TabView shell with server picker
    ├── StatsDashboardView.swift   – Metric cards + Charts
    ├── SystemInfoView.swift       – OS/hardware/partition info
    ├── NotificationsView.swift    – Alert list with filters
    ├── SharedViews.swift          – Reusable UI components
    └── SettingsView.swift         – Server management, theme, session
```

## Notes

- Google SSO opens the browser flow (`/accounts/google/login/`) via `UIApplication.shared.open`.
- Session handling uses backend cookie auth — cookies are shared within `HTTPCookieStorage.shared`.
- Charts use the system **Charts** framework (iOS 16+).
- All shared model and networking code is identical to the macOS app; only views and `@main` differ.

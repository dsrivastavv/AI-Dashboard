# AI Dashboard macOS App (SwiftUI)

This folder contains a native macOS client that mirrors the React frontend spec:

- Login flows: Google redirect, email/password sign-in, register, forgot password
- Main app shell: server selector, refresh, theme toggle, notification bell, session actions
- Pages: Stats, Terminal (WIP), System Info, Notifications
- Data behavior: same `/api/*` contracts, latest/history polling, notification polling
- Legal docs: in-app Privacy Policy and Terms sheets

## Visual Direction

The app uses a modern glassmorphism style with an animated aurora background, material cards, and high-contrast metric accents for CPU, memory, GPU, disk, and network entities.

## Requirements

- macOS 14+
- Xcode 15+ (or Swift 5.9 toolchain)
- Running backend at `http://sdworkstation.ucsd.edu:8000` (default)

## Open in Xcode

1. Open Xcode.
2. `File -> Open...`
3. Select `macos_app/Package.swift`.
4. Run the `AIDashboardMacApp` executable target.

## Configuration

You can change the backend URL directly in the login screen before authenticating.

Default API base URL:

- `http://sdworkstation.ucsd.edu:8000`

## Backend Endpoints Used

- `GET /api/servers/`
- `POST /api/servers/register/`
- `GET /api/metrics/latest/`
- `GET /api/metrics/history/`
- `GET /api/notifications/`
- `POST /api/notifications/mark-read/`
- `POST /api/auth/login/`
- `POST /api/auth/register/`
- `POST /api/auth/forgot-password/`

## Notes

- Google SSO opens the browser flow (`/accounts/google/login/`) from the app.
- Session handling relies on backend cookie auth for API requests.
- Terminal screen is intentionally WIP to match the web app behavior.

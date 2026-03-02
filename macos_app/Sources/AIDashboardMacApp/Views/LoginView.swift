import SwiftUI

// Shared copy source-of-truth: ../../../../globals/app_text.yml
// Keep this view text aligned with that root-level file.

private enum AuthMode {
    case signin
    case register
    case forgot
}

private enum SignInStep {
    case email
    case password
}

struct LoginView: View {
    @EnvironmentObject private var store: AppStore

    @State private var mode: AuthMode = .signin
    @State private var signInStep: SignInStep = .email

    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false

    @State private var registerUsername = ""
    @State private var registerEmail = ""
    @State private var registerPassword = ""
    @State private var registerConfirm = ""
    @State private var registerShowPassword = false

    @State private var forgotEmail = ""
    @State private var legalDocument: LegalDocumentType?

    private var passwordMismatch: Bool {
        !registerConfirm.isEmpty && registerConfirm != registerPassword
    }

    private var alertText: String? {
        if store.accessDenied {
            return "Access denied. Your account is not authorized."
        }
        return store.authError ?? store.authSuccess
    }

    private var alertTint: Color {
        if store.authSuccess != nil && !store.accessDenied && store.authError == nil {
            return DashboardPalette.network
        }
        return DashboardPalette.critical
    }

    var body: some View {
        HStack(spacing: 24) {
            leftPanel
                .frame(maxWidth: 440)

            rightPanel
        }
        .padding(34)
        .sheet(item: $legalDocument) { document in
            LegalDocumentSheet(mode: store.mode, document: document)
                .frame(minWidth: 760, minHeight: 620)
        }
        .overlay(alignment: .top) {
            if store.isCheckingSession {
                ProgressView("Checking session…")
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(.top, 12)
            }
        }
    }

    private var leftPanel: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let alertText {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                    Text(alertText)
                        .lineLimit(2)
                }
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(alertTint)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(alertTint.opacity(0.14), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(alertTint.opacity(0.35), lineWidth: 0.9)
                }
            }

            GlassCard(mode: store.mode, padding: 20) {
                VStack(alignment: .leading, spacing: 14) {
                    Text("AI Dashboard")
                        .font(.system(size: 34, weight: .black, design: .rounded))
                    Text("Operate AI infrastructure with clarity, speed, and confidence.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Backend URL")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                        HStack {
                            TextField("http://sdworkstation.ucsd.edu:8000", text: $store.baseURLString)
                                .textFieldStyle(.roundedBorder)
                                .font(.system(size: 12, weight: .medium, design: .monospaced))
                                .disableAutocorrection(true)
                            Button("Apply") {
                                store.updateBaseURL()
                                Task { await store.probeSession() }
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.small)
                        }
                    }

                    if mode == .signin {
                        signInForm
                    }

                    if mode == .register {
                        registerForm
                    }

                    if mode == .forgot {
                        forgotForm
                    }

                    HStack {
                        Button("Privacy") { legalDocument = .privacy }
                        Button("Terms") { legalDocument = .terms }
                    }
                    .buttonStyle(.plain)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var signInForm: some View {
        VStack(alignment: .leading, spacing: 10) {
            Button {
                store.openGoogleSignIn()
            } label: {
                Label("Continue with Google", systemImage: "globe")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .controlSize(.large)
            .disabled(store.authLoading || store.isCheckingSession)

            HStack {
                Capsule().fill(.primary.opacity(0.1)).frame(height: 1)
                Text("OR")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(.secondary)
                Capsule().fill(.primary.opacity(0.1)).frame(height: 1)
            }
            .padding(.vertical, 4)

            if signInStep == .email {
                TextField("you@example.com", text: $email)
                    .textFieldStyle(.roundedBorder)
                    .disableAutocorrection(true)
                HStack {
                    Button("Forgot password?") {
                        mode = .forgot
                    }
                    .buttonStyle(.plain)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)
                    Spacer()
                    Button("Continue with Email") {
                        signInStep = .password
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                    .disabled(email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            } else {
                HStack(spacing: 8) {
                    Group {
                        if showPassword {
                            TextField("Password", text: $password)
                        } else {
                            SecureField("Password", text: $password)
                        }
                    }
                    .textFieldStyle(.roundedBorder)

                    Button(showPassword ? "Hide" : "Show") {
                        showPassword.toggle()
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }

                HStack {
                    Button(store.authLoading ? "Signing in…" : "Sign in") {
                        Task { await store.signIn(username: email, password: password) }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                    .disabled(store.authLoading || password.isEmpty)
                }
                Button("Back") {
                    signInStep = .email
                    password = ""
                }
                .buttonStyle(.plain)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
            }

            Button("Create account") {
                mode = .register
                signInStep = .email
            }
            .buttonStyle(.plain)
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(DashboardPalette.cpu)
            .padding(.top, 2)
        }
    }

    private var registerForm: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Create account")
                .font(.system(size: 18, weight: .bold, design: .rounded))

            TextField("Username", text: $registerUsername)
                .textFieldStyle(.roundedBorder)
                .disableAutocorrection(true)

            TextField("you@example.com", text: $registerEmail)
                .textFieldStyle(.roundedBorder)
                .disableAutocorrection(true)

            Group {
                if registerShowPassword {
                    TextField("Minimum 8 characters", text: $registerPassword)
                        .textFieldStyle(.roundedBorder)
                    TextField("Repeat password", text: $registerConfirm)
                        .textFieldStyle(.roundedBorder)
                } else {
                    SecureField("Minimum 8 characters", text: $registerPassword)
                        .textFieldStyle(.roundedBorder)
                    SecureField("Repeat password", text: $registerConfirm)
                        .textFieldStyle(.roundedBorder)
                }
            }

            Toggle("Show password", isOn: $registerShowPassword)
                .font(.system(size: 11, weight: .semibold, design: .rounded))

            if passwordMismatch {
                Text("Passwords do not match")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(DashboardPalette.critical)
            }

            Button(store.authLoading ? "Creating…" : "Create account") {
                Task {
                    await store.register(
                        username: registerUsername,
                        email: registerEmail,
                        password: registerPassword
                    )
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(
                store.authLoading ||
                registerUsername.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                registerEmail.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                registerPassword.isEmpty ||
                passwordMismatch
            )

            Button("Back to sign in") {
                mode = .signin
                signInStep = .email
            }
            .buttonStyle(.plain)
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(.secondary)
        }
    }

    private var forgotForm: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Reset password")
                .font(.system(size: 18, weight: .bold, design: .rounded))
            Text("Enter your email and we will send a secure reset link.")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)

            TextField("you@example.com", text: $forgotEmail)
                .textFieldStyle(.roundedBorder)

            Button(store.authLoading ? "Sending…" : "Send reset link") {
                Task { await store.forgotPassword(email: forgotEmail) }
            }
            .buttonStyle(.borderedProminent)
            .disabled(store.authLoading || forgotEmail.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

            Button("Back to sign in") {
                mode = .signin
                signInStep = .email
            }
            .buttonStyle(.plain)
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(.secondary)
        }
    }

    private var rightPanel: some View {
        GlassCard(mode: store.mode, padding: 24) {
            VStack(alignment: .leading, spacing: 18) {
                GlassPill(text: "AI Infrastructure Platform", tint: DashboardPalette.cpu)

                Text("Operate your cluster.\nIn real time.")
                    .font(.system(size: 44, weight: .heavy, design: .rounded))
                    .lineSpacing(2)

                Text("Gain instant visibility into GPU, CPU, memory, and disk across every node from a single unified control plane.")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)

                GlassCard(mode: store.mode, padding: 14) {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Circle().fill(DashboardPalette.network).frame(width: 8, height: 8)
                            Text("Live system telemetry")
                                .font(.system(size: 12, weight: .semibold, design: .rounded))
                                .foregroundStyle(.secondary)
                        }

                        metricBar(label: "GPU A100 · utilisation", value: 87, color: DashboardPalette.gpu)
                        metricBar(label: "CPU · usage", value: 52, color: DashboardPalette.cpu)
                        metricBar(label: "Memory", value: 68, color: DashboardPalette.memory)
                        metricBar(label: "Disk I/O", value: 34, color: DashboardPalette.disk)
                    }
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    featureItem(icon: "terminal", title: "Remote terminal", desc: "Run commands on any node directly from the app.")
                    featureItem(icon: "point.3.connected.trianglepath.dotted", title: "Multi-cluster control", desc: "Monitor distributed clusters from one interface.")
                    featureItem(icon: "brain.head.profile", title: "Bottleneck intelligence", desc: "Pinpoint what limits performance.")
                    featureItem(icon: "bell.badge", title: "Intelligent alerts", desc: "Get proactive thermal and saturation warnings.")
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    private func metricBar(label: String, value: Double, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
                Spacer(minLength: 0)
                Text("\(Int(value))%")
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(color)
            }
            MetricProgressBar(value: value, tint: color)
        }
    }

    private func featureItem(icon: String, title: String, desc: String) -> some View {
        GlassCard(mode: store.mode, padding: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.secondary)
                Text(title)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                Text(desc)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

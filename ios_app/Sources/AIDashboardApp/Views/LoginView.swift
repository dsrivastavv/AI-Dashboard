import SwiftUI

// Shared copy source-of-truth: ../../../../globals/app_text.yml

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
    @State private var showURLEditor = false

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
        ScrollView {
            VStack(spacing: 24) {
                header

                if let alertText {
                    alertBanner(alertText)
                }

                GlassCard(mode: store.mode, padding: 20) {
                    VStack(alignment: .leading, spacing: 18) {
                        if mode == .signin {
                            signInForm
                        } else if mode == .register {
                            registerForm
                        } else {
                            forgotForm
                        }
                    }
                }

                urlSection

                legalLinks
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)
            .padding(.bottom, 40)
        }
    }

    // MARK: – Header

    private var header: some View {
        VStack(spacing: 8) {
            Image(systemName: "server.rack")
                .font(.system(size: 48, weight: .light))
                .foregroundStyle(DashboardPalette.cpu.opacity(0.85))

            Text("AI Dashboard")
                .font(.system(size: 34, weight: .black, design: .rounded))

            Text("Operate AI infrastructure with clarity,\nspeed, and confidence.")
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: – Alert

    private func alertBanner(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
            Text(text)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .lineLimit(3)
        }
        .foregroundStyle(alertTint)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(alertTint.opacity(0.12), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(alertTint.opacity(0.35), lineWidth: 0.9)
        }
    }

    // MARK: – Sign-in form

    private var signInForm: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Sign in")
                .font(.system(size: 22, weight: .bold, design: .rounded))

            Button {
                store.openGoogleSignIn()
            } label: {
                Label("Continue with Google", systemImage: "globe")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 4)
            }
            .buttonStyle(.bordered)
            .tint(DashboardPalette.cpu)
            .disabled(store.authLoading || store.isCheckingSession)

            divider("OR")

            if signInStep == .email {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Email / Username")
                        .labelStyle()

                    TextField("you@example.com", text: $email)
                        .emailInputFieldStyle()
                        .textFieldStyle(.roundedBorder)

                    HStack {
                        Button("Forgot password?") { mode = .forgot }
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)

                        Spacer(minLength: 0)

                        Button("Continue") { signInStep = .password }
                            .buttonStyle(.borderedProminent)
                            .disabled(email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                }
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Password")
                        .labelStyle()

                    HStack(spacing: 8) {
                        Group {
                            if showPassword {
                                TextField("Password", text: $password)
                            } else {
                                SecureField("Password", text: $password)
                            }
                        }
                        .textFieldStyle(.roundedBorder)
                        .disableAutocorrectionIfSupported()

                        Button(showPassword ? "Hide" : "Show") { showPassword.toggle() }
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .buttonStyle(.bordered)
                    }

                    Button(store.authLoading ? "Signing in…" : "Sign in") {
                        Task { await store.signIn(username: email, password: password) }
                    }
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: .infinity)
                    .disabled(store.authLoading || password.isEmpty)

                    Button("Back") {
                        signInStep = .email
                        password = ""
                    }
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)
                }
            }

            Divider()

            Button("Create account →") { mode = .register; signInStep = .email }
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(DashboardPalette.cpu)
        }
    }

    // MARK: – Register form

    private var registerForm: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Create account")
                .font(.system(size: 22, weight: .bold, design: .rounded))

            labeledField("Username") {
                TextField("johndoe", text: $registerUsername)
                    .textInputFieldStyle()
                    .textFieldStyle(.roundedBorder)
            }

            labeledField("Email") {
                TextField("you@example.com", text: $registerEmail)
                    .emailInputFieldStyle()
                    .textFieldStyle(.roundedBorder)
            }

            labeledField("Password") {
                VStack(spacing: 6) {
                    Group {
                        if registerShowPassword {
                            TextField("Minimum 8 characters", text: $registerPassword)
                            TextField("Repeat password", text: $registerConfirm)
                        } else {
                            SecureField("Minimum 8 characters", text: $registerPassword)
                            SecureField("Repeat password", text: $registerConfirm)
                        }
                    }
                    .textFieldStyle(.roundedBorder)
                }
            }

            Toggle("Show password", isOn: $registerShowPassword)
                .font(.system(size: 13, weight: .regular, design: .rounded))

            if passwordMismatch {
                Text("Passwords do not match")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
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
            .frame(maxWidth: .infinity)
            .disabled(
                store.authLoading ||
                registerUsername.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                registerEmail.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                registerPassword.isEmpty ||
                passwordMismatch
            )

            Button("← Back to sign in") { mode = .signin; signInStep = .email }
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
        }
    }

    // MARK: – Forgot form

    private var forgotForm: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Reset password")
                .font(.system(size: 22, weight: .bold, design: .rounded))

            Text("Enter your email and we'll send a secure reset link.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(.secondary)

            TextField("you@example.com", text: $forgotEmail)
                .emailInputFieldStyle()
                .textFieldStyle(.roundedBorder)

            Button(store.authLoading ? "Sending…" : "Send reset link") {
                Task { await store.forgotPassword(email: forgotEmail) }
            }
            .buttonStyle(.borderedProminent)
            .frame(maxWidth: .infinity)
            .disabled(store.authLoading || forgotEmail.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

            Button("← Back to sign in") { mode = .signin; signInStep = .email }
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
        }
    }

    // MARK: – URL section

    private var urlSection: some View {
        DisclosureGroup(isExpanded: $showURLEditor) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Backend URL")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(.secondary)

                TextField("http://sdworkstation.ucsd.edu:8000", text: $store.baseURLString)
                    .urlInputFieldStyle()
                    .font(.system(size: 12, design: .monospaced))
                    .textFieldStyle(.roundedBorder)

                Button("Apply") {
                    store.updateBaseURL()
                    Task { await store.probeSession() }
                }
                .buttonStyle(.bordered)
            }
            .padding(.top, 10)
        } label: {
            Label("Advanced settings", systemImage: "gearshape")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 4)
    }

    // MARK: – Legal

    private var legalLinks: some View {
        HStack(spacing: 20) {
            Button("Privacy") { store.openPrivacy() }
            Button("Terms") { store.openTerms() }
        }
        .font(.system(size: 12, weight: .semibold, design: .rounded))
        .foregroundStyle(.secondary)
        .buttonStyle(.plain)
    }

    // MARK: – Helpers

    private func divider(_ label: String) -> some View {
        HStack {
            Capsule().fill(.primary.opacity(0.1)).frame(height: 1)
            Text(label)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(.secondary)
                .fixedSize()
            Capsule().fill(.primary.opacity(0.1)).frame(height: 1)
        }
        .padding(.vertical, 4)
    }

    private func labeledField<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .labelStyle()
            content()
        }
    }
}

private extension Text {
    func labelStyle() -> some View {
        self
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundStyle(.secondary)
    }
}

private extension View {
    func labelStyle() -> some View {
        self
    }

    @ViewBuilder
    func textInputFieldStyle() -> some View {
#if os(iOS)
        self
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
#else
        self
#endif
    }

    @ViewBuilder
    func emailInputFieldStyle() -> some View {
#if os(iOS)
        self
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .keyboardType(.emailAddress)
#else
        self
#endif
    }

    @ViewBuilder
    func urlInputFieldStyle() -> some View {
#if os(iOS)
        self
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .keyboardType(.URL)
#else
        self
#endif
    }

    @ViewBuilder
    func disableAutocorrectionIfSupported() -> some View {
#if os(iOS)
        self.autocorrectionDisabled()
#else
        self
#endif
    }
}

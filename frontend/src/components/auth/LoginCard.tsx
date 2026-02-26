interface LoginCardProps {
  title?: string;
  subtitle?: string;
  showAccessDenied?: boolean;
  isCheckingSession?: boolean;
  onGoogleSignIn: () => void;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.1 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4 5.7l6.2 5.2C41.2 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export default function LoginCard({
  title = 'AI Dashboard',
  subtitle = 'Beautiful, real-time infrastructure visibility for AI systems.',
  showAccessDenied = false,
  isCheckingSession = false,
  onGoogleSignIn,
}: LoginCardProps) {
  return (
    <div className="card shadow-lg border-0 login-card login-board">
      <div className="row g-0">
        <div className="col-12 col-lg-6 login-board-visual">
          <div className="login-board-visual-inner">
            <div className="login-brand-row">
              <span className="login-kicker">AI Dashboard</span>
              <span className="designer-chip">Designed by Divyansh Srivastava</span>
            </div>

            <div className="login-hero-copy">
              <h2 className="login-hero-title">Monitor training systems with clarity.</h2>
              <p className="login-hero-text mb-0">
                CPU, GPU, memory, disk, and network telemetry in a single live surface for teams running AI workloads.
              </p>
            </div>

            <div className="login-art-grid" aria-hidden="true">
              <div className="login-art-card login-art-card--wide">
                <img src="/art/login-neural-grid.svg" alt="" />
              </div>
              <div className="login-art-card">
                <img src="/art/login-chip-core.svg" alt="" />
              </div>
              <div className="login-art-card">
                <img src="/art/login-signal-wave.svg" alt="" />
              </div>
            </div>

            <div className="login-feature-list">
              <div className="login-feature-pill">Live refresh support</div>
              <div className="login-feature-pill">Google allowlist auth</div>
              <div className="login-feature-pill">Multi-server metrics</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card-body p-4 p-md-5 p-lg-4 p-xl-5 login-auth-panel">
            <div className="mb-4">
              <p className="text-uppercase login-auth-eyebrow mb-2">Secure Access</p>
              <h1 className="login-auth-title mb-2">{title}</h1>
              <p className="login-auth-subtitle mb-0">{subtitle}</p>
            </div>

            {showAccessDenied ? (
              <div className="alert alert-danger login-alert" role="alert">
                Access denied. Your Google account is not in the configured allowlist.
              </div>
            ) : null}

            <button
              type="button"
              className="btn login-google-btn w-100 d-flex align-items-center justify-content-center gap-2 py-2"
              onClick={onGoogleSignIn}
              disabled={isCheckingSession}
            >
              <GoogleMark />
              <span>{isCheckingSession ? 'Checking session...' : 'Continue with Google'}</span>
            </button>

            <div className="login-support-card mt-3">
              <div className="login-support-title">Need support?</div>
              <p className="mb-0">
                Contact your dashboard administrator for Google allowlist access, account onboarding, and server registration help.
              </p>
            </div>

            <div className="login-auth-meta mt-3">
              <span className="login-meta-pill">Django allauth</span>
              <span className="login-meta-pill">Bootstrap UI</span>
              <span className="login-meta-pill">React + Vite</span>
            </div>

            <p className="small login-credit mt-4 mb-0">
              AI Dashboard by Divyansh Srivastava. Authentication is handled by Django via Google OAuth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

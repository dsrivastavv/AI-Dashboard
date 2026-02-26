interface LoginCardProps {
  title?: string;
  subtitle?: string;
  showAccessDenied?: boolean;
  isCheckingSession?: boolean;
  onGoogleSignIn: () => void;
}

export default function LoginCard({
  title = 'AI Workload Dashboard',
  subtitle = 'Sign in with your allowlisted Google account to view cluster metrics.',
  showAccessDenied = false,
  isCheckingSession = false,
  onGoogleSignIn,
}: LoginCardProps) {
  return (
    <div className="card shadow-lg border-0 login-card">
      <div className="card-body p-4 p-md-5">
        <div className="mb-4">
          <p className="text-uppercase text-body-secondary small fw-semibold mb-2">Monitoring</p>
          <h1 className="h3 mb-2">{title}</h1>
          <p className="text-body-secondary mb-0">{subtitle}</p>
        </div>

        {showAccessDenied ? (
          <div className="alert alert-danger" role="alert">
            Access denied. Your Google account is not in the configured allowlist.
          </div>
        ) : null}

        <button
          type="button"
          className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2 py-2"
          onClick={onGoogleSignIn}
          disabled={isCheckingSession}
        >
          <span aria-hidden="true">G</span>
          <span>{isCheckingSession ? 'Checking session...' : 'Continue with Google'}</span>
        </button>

        <p className="small text-body-secondary mt-3 mb-0">
          Authentication is handled by Django via Google OAuth and allowlist checks.
        </p>
      </div>
    </div>
  );
}

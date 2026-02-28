import { useState } from 'react';

type AuthMode = 'signin' | 'register' | 'forgot';

interface LoginCardProps {
  showAccessDenied?: boolean;
  isCheckingSession?: boolean;
  isLoading?: boolean;
  error?: string | null;
  successMessage?: string | null;
  onGoogleSignIn: () => void;
  onCredentialSignIn: (username: string, password: string) => void;
  onRegister: (username: string, email: string, password: string) => void;
  onForgotPassword: (email: string) => void;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.6 5.1C9.4 39.6 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4 5.7l6.2 5.2C41.2 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="lp-metric-bar">
      <div className="lp-metric-header">
        <span className="lp-metric-label">{label}</span>
        <span className="lp-metric-value" style={{ color }}>{value}%</span>
      </div>
      <div className="lp-metric-track">
        <div className="lp-metric-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: '⚡',
    title: 'Live telemetry',
    desc: 'GPU, CPU, memory & disk — updated every second.',
  },
  {
    icon: '🖥️',
    title: 'Multi-server',
    desc: 'Monitor unlimited training nodes from one dashboard.',
  },
  {
    icon: '🧠',
    title: 'AI bottleneck detection',
    desc: 'Automatically surfaces the resource limiting your runs.',
  },
  {
    icon: '🔔',
    title: 'Smart alerts',
    desc: 'Instant notifications on thermal limits & resource saturation.',
  },
];

const METRICS: { label: string; value: number; color: string }[] = [
  { label: 'GPU A100  ·  utilisation', value: 87, color: '#f97316' },
  { label: 'CPU  ·  usage', value: 52, color: '#3b82f6' },
  { label: 'Memory', value: 68, color: '#14b8a6' },
  { label: 'Disk I/O', value: 34, color: '#8b5cf6' },
];

// ── Eye icon ─────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LoginCard({
  showAccessDenied = false,
  isCheckingSession = false,
  isLoading = false,
  error = null,
  successMessage = null,
  onGoogleSignIn,
  onCredentialSignIn,
  onRegister,
  onForgotPassword,
}: LoginCardProps) {
  const [mode, setMode] = useState<AuthMode>('signin');

  // Sign-in fields
  const [siUsername, setSiUsername] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPass, setSiShowPass] = useState(false);

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regShowPass, setRegShowPass] = useState(false);

  // Forgot password
  const [fpEmail, setFpEmail] = useState('');

  const busy = isCheckingSession || isLoading;
  const passwordMismatch = regConfirm.length > 0 && regPassword !== regConfirm;

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!siUsername.trim() || !siPassword) return;
    onCredentialSignIn(siUsername.trim(), siPassword);
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword || passwordMismatch) return;
    onRegister(regUsername.trim(), regEmail.trim(), regPassword);
  }

  function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!fpEmail.trim()) return;
    onForgotPassword(fpEmail.trim());
  }

  function switchMode(m: AuthMode) {
    setMode(m);
  }

  return (
    <div className="lp-shell">
      {/* Animated background orbs */}
      <div className="lp-orb lp-orb-1" aria-hidden="true" />
      <div className="lp-orb lp-orb-2" aria-hidden="true" />
      <div className="lp-orb lp-orb-3" aria-hidden="true" />
      <div className="lp-grid-bg" aria-hidden="true" />

      <div className="lp-board">

        {/* ── Left: Features panel ─────────────────────────────────────────── */}
        <div className="lp-panel-left">
          <div className="lp-left-inner">

            <div className="lp-brand-row">
              <span className="lp-brand-dot" />
              <span className="lp-brand-name">AI Dashboard</span>
            </div>

            <h1 className="lp-headline">
              Monitor Everything<br />
              with <span className="lp-headline-accent">total clarity.</span>
            </h1>

            <p className="lp-tagline">
              A modern, open-source AI monitoring dashboard for GPU-intensive tasks.
            </p>

            {/* Live metrics preview */}
            <div className="lp-metrics-showcase">
              <div className="lp-showcase-header">
                <span className="lp-live-dot" />
                Live metrics preview
              </div>
              {METRICS.map((m) => (
                <MetricBar key={m.label} label={m.label} value={m.value} color={m.color} />
              ))}
            </div>

            {/* Feature list */}
            <ul className="lp-feature-list">
              {FEATURES.map((f, i) => (
                <li key={f.title} className="lp-feature-item" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                  <span className="lp-feature-icon">{f.icon}</span>
                  <div>
                    <div className="lp-feature-title">{f.title}</div>
                    <div className="lp-feature-desc">{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>

          </div>
        </div>

        {/* ── Right: Auth panel ─────────────────────────────────────────────── */}
        <div className="lp-panel-right">
          <div className="lp-auth-card">

            {/* Logo */}
            <div className="lp-auth-logo">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="rgba(59,130,246,0.18)" />
                <path d="M8 24L16 8l8 16M11 20h10" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="lp-auth-logo-text">AI Dashboard</span>
            </div>

            {/* Mode tabs */}
            <div className="lp-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={mode === 'signin'}
                className={`lp-tab ${mode === 'signin' ? 'lp-tab--active' : ''}`}
                onClick={() => switchMode('signin')}
                type="button"
              >
                Sign in
              </button>
              <button
                role="tab"
                aria-selected={mode === 'register'}
                className={`lp-tab ${mode === 'register' ? 'lp-tab--active' : ''}`}
                onClick={() => switchMode('register')}
                type="button"
              >
                Create account
              </button>
              <button
                role="tab"
                aria-selected={mode === 'forgot'}
                className={`lp-tab ${mode === 'forgot' ? 'lp-tab--active' : ''}`}
                onClick={() => switchMode('forgot')}
                type="button"
              >
                Forgot password
              </button>
            </div>

            {/* Feedback banners */}
            {showAccessDenied && (
              <div className="lp-alert lp-alert--error" role="alert">
                Access denied. Your Google account is not in the configured allowlist.
              </div>
            )}
            {error && (
              <div className="lp-alert lp-alert--error" role="alert">{error}</div>
            )}
            {successMessage && (
              <div className="lp-alert lp-alert--success" role="status">{successMessage}</div>
            )}

            <div className={`lp-form-container lp-form-container--${mode}`}>

              {/* ── Sign In ─────────────────────────────────────────────────── */}
              <div className="lp-form-section lp-form-section--signin">
                <button
                  type="button"
                  className="lp-google-btn"
                  onClick={onGoogleSignIn}
                  disabled={busy}
                >
                  <GoogleMark />
                  <span>{isCheckingSession ? 'Checking session…' : 'Continue with Google'}</span>
                </button>

                <div className="lp-divider"><span>or sign in with credentials</span></div>

                <form onSubmit={handleSignIn} className="lp-form" noValidate>
                  <div className="lp-field">
                    <label className="lp-label" htmlFor="si-username">Username</label>
                    <input
                      id="si-username"
                      className="lp-input"
                      type="text"
                      autoComplete="username"
                      placeholder="your-username"
                      value={siUsername}
                      onChange={(e) => setSiUsername(e.target.value)}
                      disabled={busy}
                    />
                  </div>

                  <div className="lp-field">
                    <label className="lp-label" htmlFor="si-password">Password</label>
                    <div className="lp-input-wrap">
                      <input
                        id="si-password"
                        className="lp-input"
                        type={siShowPass ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={siPassword}
                        onChange={(e) => setSiPassword(e.target.value)}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        className="lp-eye-btn"
                        onClick={() => setSiShowPass((v) => !v)}
                        tabIndex={-1}
                        aria-label={siShowPass ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={siShowPass} />
                      </button>
                    </div>
                  </div>

                  <div className="lp-form-row-end">
                    <button type="button" className="lp-link-btn" onClick={() => switchMode('forgot')}>
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="lp-submit-btn"
                    disabled={busy || !siUsername.trim() || !siPassword}
                  >
                    {isLoading ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>

                <p className="lp-switch-hint">
                  No account yet?{' '}
                  <button className="lp-link-btn" onClick={() => switchMode('register')} type="button">
                    Create one
                  </button>
                </p>
              </div>

              {/* ── Create Account ──────────────────────────────────────────── */}
              <div className="lp-form-section lp-form-section--register">
                <button
                  type="button"
                  className="lp-google-btn"
                  onClick={onGoogleSignIn}
                  disabled={busy}
                >
                  <GoogleMark />
                  <span>Sign up with Google</span>
                </button>

                <div className="lp-divider"><span>or create with credentials</span></div>

                <form onSubmit={handleRegister} className="lp-form" noValidate>
                  <div className="lp-field">
                    <label className="lp-label" htmlFor="reg-username">Username</label>
                    <input
                      id="reg-username"
                      className="lp-input"
                      type="text"
                      autoComplete="username"
                      placeholder="choose a username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      disabled={busy}
                    />
                  </div>

                  <div className="lp-field">
                    <label className="lp-label" htmlFor="reg-email">Email</label>
                    <input
                      id="reg-email"
                      className="lp-input"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      disabled={busy}
                    />
                  </div>

                  <div className="lp-field">
                    <label className="lp-label" htmlFor="reg-password">Password</label>
                    <div className="lp-input-wrap">
                      <input
                        id="reg-password"
                        className="lp-input"
                        type={regShowPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="min 8 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        className="lp-eye-btn"
                        onClick={() => setRegShowPass((v) => !v)}
                        tabIndex={-1}
                        aria-label={regShowPass ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={regShowPass} />
                      </button>
                    </div>
                  </div>

                  <div className="lp-field">
                    <label className="lp-label" htmlFor="reg-confirm">Confirm password</label>
                    <input
                      id="reg-confirm"
                      className={`lp-input${passwordMismatch ? ' lp-input--error' : ''}`}
                      type={regShowPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="repeat password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      disabled={busy}
                    />
                    {passwordMismatch && (
                      <p className="lp-field-error">Passwords don't match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="lp-submit-btn"
                    disabled={busy || !regUsername.trim() || !regEmail.trim() || !regPassword || passwordMismatch}
                  >
                    {isLoading ? 'Creating account…' : 'Create account'}
                  </button>
                </form>

                <p className="lp-switch-hint">
                  Already have an account?{' '}
                  <button className="lp-link-btn" onClick={() => switchMode('signin')} type="button">
                    Sign in
                  </button>
                </p>
              </div>

              {/* ── Forgot Password ─────────────────────────────────────────── */}
              <div className="lp-form-section lp-form-section--forgot">
                <p className="lp-forgot-hint">
                  Enter your email and we'll send you a password reset link.
                </p>

                <form onSubmit={handleForgotPassword} className="lp-form" noValidate>
                  <div className="lp-field">
                    <label className="lp-label" htmlFor="fp-email">Email address</label>
                    <input
                      id="fp-email"
                      className="lp-input"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={fpEmail}
                      onChange={(e) => setFpEmail(e.target.value)}
                      disabled={busy}
                    />
                  </div>

                  <button
                    type="submit"
                    className="lp-submit-btn"
                    disabled={busy || !fpEmail.trim()}
                  >
                    {isLoading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>

                <p className="lp-switch-hint">
                  Remember your password?{' '}
                  <button className="lp-link-btn" onClick={() => switchMode('signin')} type="button">
                    Sign in
                  </button>
                </p>
              </div>
            </div>

            <p className="lp-credit">AI Dashboard · by Divyansh Srivastava</p>

          </div>
        </div>

      </div>
    </div>
  );
}

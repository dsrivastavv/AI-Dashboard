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
    <div className="claude-shell">
      <div className="claude-bg-grid" aria-hidden="true" />

      <header className="claude-nav">
        <div className="claude-brand">
          <div className="claude-burst" aria-hidden="true" />
          <span>AI Dashboard</span>
        </div>
        <div className="claude-nav-links" aria-hidden="true">
          <span>Platform</span>
          <span>Agents</span>
          <span>Pricing</span>
          <span>Docs</span>
        </div>
        <div className="claude-nav-actions" aria-hidden="true">
          <button className="claude-ghost">Contact sales</button>
          <button className="claude-pill">Launch dashboard</button>
        </div>
      </header>

      <div className="claude-hero">
        <div className="claude-left">
          <p className="claude-kicker">Real-time AI infrastructure monitoring</p>
          <h1 className="claude-title">Your cluster, always in view</h1>
          <p className="claude-sub">Track GPU, CPU, memory and disk across every training node — from one unified dashboard.</p>

          <div className="claude-card">
            {showAccessDenied && (
              <div className="claude-alert" role="alert">
                Access denied. Your Google account is not in the allowlist.
              </div>
            )}
            {error && <div className="claude-alert" role="alert">{error}</div>}
            {successMessage && <div className="claude-alert claude-alert--success" role="status">{successMessage}</div>}

            <button
              type="button"
              className="claude-google"
              onClick={onGoogleSignIn}
              disabled={busy}
            >
              <GoogleMark />
              <span>{isCheckingSession ? 'Checking session…' : 'Continue with Google'}</span>
            </button>

            <div className="claude-divider">OR</div>

            {mode === 'signin' && (
              <form className="claude-form" onSubmit={handleSignIn} noValidate>
                <label className="claude-label" htmlFor="si-username">Email or username</label>
                <input
                  id="si-username"
                  className="claude-input"
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={siUsername}
                  onChange={(e) => setSiUsername(e.target.value)}
                  disabled={busy}
                />

                <label className="claude-label" htmlFor="si-password">Password</label>
                <div className="claude-input-wrap">
                  <input
                    id="si-password"
                    className="claude-input"
                    type={siShowPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={siPassword}
                    onChange={(e) => setSiPassword(e.target.value)}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="claude-eye"
                    onClick={() => setSiShowPass((v) => !v)}
                    aria-label={siShowPass ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={siShowPass} />
                  </button>
                </div>

                <button
                  type="submit"
                  className="claude-submit"
                  disabled={busy || !siUsername.trim() || !siPassword}
                >
                  {isLoading ? 'Signing in…' : 'Continue with email'}
                </button>

                <div className="claude-links">
                  <button type="button" className="claude-link" onClick={() => switchMode('forgot')}>
                    Forgot password?
                  </button>
                  <button type="button" className="claude-link" onClick={() => switchMode('register')}>
                    Create account
                  </button>
                </div>
              </form>
            )}

            {mode === 'register' && (
              <form className="claude-form" onSubmit={handleRegister} noValidate>
                <label className="claude-label" htmlFor="reg-username">Username</label>
                <input
                  id="reg-username"
                  className="claude-input"
                  type="text"
                  autoComplete="username"
                  placeholder="choose a username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={busy}
                />

                <label className="claude-label" htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  className="claude-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={busy}
                />

                <label className="claude-label" htmlFor="reg-password">Password</label>
                <div className="claude-input-wrap">
                  <input
                    id="reg-password"
                    className="claude-input"
                    type={regShowPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="min 8 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="claude-eye"
                    onClick={() => setRegShowPass((v) => !v)}
                    aria-label={regShowPass ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={regShowPass} />
                  </button>
                </div>

                <label className="claude-label" htmlFor="reg-confirm">Confirm password</label>
                <input
                  id="reg-confirm"
                  className={`claude-input${passwordMismatch ? ' claude-input--error' : ''}`}
                  type={regShowPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="repeat password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  disabled={busy}
                />
                {passwordMismatch && <p className="claude-error-text">Passwords don't match</p>}

                <button
                  type="submit"
                  className="claude-submit"
                  disabled={busy || !regUsername.trim() || !regEmail.trim() || !regPassword || passwordMismatch}
                >
                  {isLoading ? 'Creating…' : 'Create account'}
                </button>

                <div className="claude-links">
                  <button type="button" className="claude-link" onClick={() => switchMode('signin')}>
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            {mode === 'forgot' && (
              <form className="claude-form" onSubmit={handleForgotPassword} noValidate>
                <p className="claude-help">Enter your email and we'll send you a reset link.</p>
                <label className="claude-label" htmlFor="fp-email">Email</label>
                <input
                  id="fp-email"
                  className="claude-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  disabled={busy}
                />

                <button
                  type="submit"
                  className="claude-submit"
                  disabled={busy || !fpEmail.trim()}
                >
                  {isLoading ? 'Sending…' : 'Send reset link'}
                </button>

                <div className="claude-links">
                  <button type="button" className="claude-link" onClick={() => switchMode('signin')}>
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            <p className="claude-note">
              By continuing, you agree to AI Dashboard&apos;s Privacy Policy and Terms. We may send important product updates.
            </p>

          </div>

          <button className="claude-app-btn" type="button" aria-hidden="true">
            Install the agent
          </button>
        </div>

        <div className="claude-right" aria-hidden="true">
          {/* Server status bar */}
          <div className="claude-preview-header">
            <div className="claude-preview-status">
              <span className="claude-live-dot" />
              <span className="claude-preview-server">gpu-cluster-01</span>
            </div>
            <span className="claude-preview-badge">4 servers online</span>
          </div>

          {/* Live metrics */}
          <div className="claude-metrics-panel">
            <div className="claude-metrics-heading">
              <span className="claude-metrics-live-dot" />
              Live telemetry
            </div>
            {METRICS.map((m) => (
              <MetricBar key={m.label} {...m} />
            ))}
          </div>

          {/* Feature highlights */}
          <ul className="claude-feature-grid" role="list">
            {FEATURES.map((f, i) => (
              <li
                key={f.title}
                className="claude-feature-item"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="claude-feature-icon">{f.icon}</span>
                <div>
                  <p className="claude-feature-title">{f.title}</p>
                  <p className="claude-feature-desc">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

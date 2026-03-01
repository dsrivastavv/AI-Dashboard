import { useState } from 'react';
import BrandName from '../common/BrandName';

type AuthMode = 'signin' | 'register' | 'forgot';
type SignInStep = 'email' | 'password';

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
    gif: '/gif/lightning.gif',
    title: 'Live telemetry',
    desc: 'GPU, CPU, memory & disk — updated every second.',
  },
  {
    gif: '/gif/desktop.gif',
    title: 'Multi-server',
    desc: 'Monitor unlimited training nodes from one dashboard.',
  },
  {
    gif: '/gif/brain.gif',
    title: 'AI bottleneck detection',
    desc: 'Automatically surfaces the resource limiting your runs.',
  },
  {
    gif: '/gif/bell.gif',
    title: 'Smart alerts',
    desc: 'Instant notifications on thermal limits & resource saturation.',
  },
];

const METRICS: { label: string; value: number; color: string }[] = [
  { label: 'GPU A100  ·  utilisation', value: 87, color: '#f97316' },
  { label: 'CPU  ·  usage', value: 52, color: '#3b82f6' },
  { label: 'Memory', value: 68, color: '#14b8a6' },
  { label: 'Disk I/O', value: 34, color: '#8580b5' },
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
  const [siStep, setSiStep] = useState<SignInStep>('email');

  // Sign-in fields
  const [siEmail, setSiEmail] = useState('');
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

  function handleEmailStep(e: React.FormEvent) {
    e.preventDefault();
    if (!siEmail.trim()) return;
    setSiStep('password');
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!siEmail.trim() || !siPassword) return;
    onCredentialSignIn(siEmail.trim(), siPassword);
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
    setSiStep('email');
  }

  const alertMsg = showAccessDenied
    ? 'Access denied. Your Google account is not in the allowlist.'
    : error || successMessage || '';
  const alertVariant = successMessage && !showAccessDenied && !error ? 'success' : 'error';
  const toast = alertMsg ? (
    <div className={`aid-toast aid-toast--${alertVariant}`} role="alert">
      {alertVariant === 'error' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {alertMsg}
    </div>
  ) : null;

  return (
    <div className="aid-shell">
      {toast}
      <div className="aid-bg-grid" aria-hidden="true" />

      <div className="aid-hero">
        {/* ── Left: login ── */}
        <div className="aid-left">
          <div className="aid-brand">
            <BrandName />
          </div>

          <div className="aid-card">
            <h2 className="aid-card-heading">
              {mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Reset password' : 'Sign in'}
            </h2>

            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  className="aid-google"
                  onClick={onGoogleSignIn}
                  disabled={busy}
                >
                  <GoogleMark />
                  <span>{isCheckingSession ? 'Checking session…' : 'Continue with Google'}</span>
                </button>

                <div className="aid-divider">OR</div>

                {siStep === 'email' ? (
                  <form className="aid-form" onSubmit={handleEmailStep} noValidate>
                    <label className="aid-label" htmlFor="si-email">Email</label>
                    <input
                      id="si-email"
                      className="aid-input"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={siEmail}
                      onChange={(e) => setSiEmail(e.target.value)}
                      disabled={busy}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                    />
                    <div className="aid-links">
                      <button type="button" className="aid-link" onClick={() => switchMode('forgot')}>
                        Forgot password?
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="aid-submit"
                      disabled={busy || !siEmail.trim()}
                    >
                      Continue with Email
                    </button>
                  </form>
                ) : (
                  <form className="aid-form" onSubmit={handleSignIn} noValidate>
                    <label className="aid-label" htmlFor="si-password">Password</label>
                    <div className="aid-input-wrap">
                      <input
                        id="si-password"
                        className="aid-input"
                        type={siShowPass ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={siPassword}
                        onChange={(e) => setSiPassword(e.target.value)}
                        disabled={busy}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                      />
                      <button
                        type="button"
                        className="aid-eye"
                        onClick={() => setSiShowPass((v) => !v)}
                        aria-label={siShowPass ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={siShowPass} />
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="aid-submit"
                      disabled={busy || !siPassword}
                    >
                      {isLoading ? 'Signing in…' : 'Sign in'}
                    </button>
                  </form>
                )}
              </>
            )}

            {mode === 'register' && (
              <form className="aid-form" onSubmit={handleRegister} noValidate>
                <label className="aid-label" htmlFor="reg-username">Username</label>
                <input
                  id="reg-username"
                  className="aid-input"
                  type="text"
                  autoComplete="username"
                  placeholder="choose a username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={busy}
                />

                <label className="aid-label" htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  className="aid-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={busy}
                />

                <label className="aid-label" htmlFor="reg-password">Password</label>
                <div className="aid-input-wrap">
                  <input
                    id="reg-password"
                    className="aid-input"
                    type={regShowPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="min 8 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="aid-eye"
                    onClick={() => setRegShowPass((v) => !v)}
                    aria-label={regShowPass ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={regShowPass} />
                  </button>
                </div>

                <label className="aid-label" htmlFor="reg-confirm">Confirm password</label>
                <input
                  id="reg-confirm"
                  className={`aid-input${passwordMismatch ? ' aid-input--error' : ''}`}
                  type={regShowPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="repeat password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  disabled={busy}
                />
                {passwordMismatch && <p className="aid-error-text">Passwords don't match</p>}

                <button
                  type="submit"
                  className="aid-submit"
                  disabled={busy || !regUsername.trim() || !regEmail.trim() || !regPassword || passwordMismatch}
                >
                  {isLoading ? 'Creating…' : 'Create account'}
                </button>

                <div className="aid-links">
                  <button type="button" className="aid-link" onClick={() => switchMode('signin')}>
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            {mode === 'forgot' && (
              <form className="aid-form" onSubmit={handleForgotPassword} noValidate>
                <p className="aid-help">Enter your email and we'll send you a reset link.</p>
                <label className="aid-label" htmlFor="fp-email">Email</label>
                <input
                  id="fp-email"
                  className="aid-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  disabled={busy}
                />

                <button
                  type="submit"
                  className="aid-submit"
                  disabled={busy || !fpEmail.trim()}
                >
                  {isLoading ? 'Sending…' : 'Send reset link'}
                </button>

                <div className="aid-links">
                  <button type="button" className="aid-link" onClick={() => switchMode('signin')}>
                    Back to sign in
                  </button>
                </div>
              </form>
            )}

            <p className="aid-note">
              By continuing, you agree to AI Dashboard&apos;s Privacy Policy and Terms.
            </p>

          </div>
        </div>

        {/* ── Right: features ── */}
        <div className="aid-right" aria-hidden="true">
          <p className="aid-kicker">Real-time AI infrastructure monitoring</p>
          <h2 className="aid-title">Your cluster,<br />always in view</h2>
          <p className="aid-sub">Track GPU, CPU, memory and disk across every training node — from one unified dashboard.</p>

          {/* Server status bar */}
          <div className="aid-preview-header">
            <div className="aid-preview-status">
              <span className="aid-live-dot" />
              <span className="aid-preview-server">gpu-cluster-01</span>
            </div>
            <span className="aid-preview-badge">4 servers online</span>
          </div>

          {/* Live metrics */}
          <div className="aid-metrics-panel">
            <div className="aid-metrics-heading">
              <span className="aid-metrics-live-dot" />
              Live telemetry
            </div>
            {METRICS.map((m) => (
              <MetricBar key={m.label} {...m} />
            ))}
          </div>

          {/* Feature highlights */}
          <ul className="aid-feature-grid" role="list">
            {FEATURES.map((f, i) => (
              <li
                key={f.title}
                className="aid-feature-item"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <img className="aid-feature-icon" src={f.gif} alt="" aria-hidden="true" />
                <div>
                  <p className="aid-feature-title">{f.title}</p>
                  <p className="aid-feature-desc">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

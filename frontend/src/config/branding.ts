// Centralized product branding strings used across the UI.
// Edit here to update copy without touching individual components.
export const PRODUCT_NAME = 'AI Dashboard';
export const PRODUCT_TAGLINE = 'Real-time AI infrastructure monitoring';
export const DEFAULT_SERVER_NAME = 'Operations Center';

// Optional: if legal text ever diverges from the display name.
export const LEGAL_PRODUCT_NAME = PRODUCT_NAME;

// ── Auth / login form copy ───────────────────────────────────────────────────
export const AUTH_COPY = {
  // Card headings
  signInHeading:   'Sign in',
  registerHeading: 'Create account',
  resetHeading:    'Reset password',

  // Google SSO button
  googleBtn:         'Continue with Google',
  googleBtnChecking: 'Checking session…',

  // Divider
  orDivider: 'OR',

  // Email step
  emailLabel:       'Email',
  emailPlaceholder: 'you@example.com',
  emailContinueBtn: 'Continue with Email',
  forgotPasswordLink: 'Forgot password?',

  // Password step
  passwordLabel:       'Password',
  passwordPlaceholder: '••••••••',
  signInBtn:           'Sign in',
  signInBtnLoading:    'Signing in…',
  showPasswordLabel:   'Show password',
  hidePasswordLabel:   'Hide password',

  // Register form
  usernameLabel:           'Username',
  usernamePlaceholder:     'choose a username',
  passwordNewPlaceholder:  'min 8 characters',
  confirmPasswordLabel:    'Confirm password',
  confirmPasswordPlaceholder: 'repeat password',
  passwordMismatchError:   "Passwords don't match",
  createAccountBtn:        'Create account',
  createAccountBtnLoading: 'Creating…',
  backToSignIn:            'Back to sign in',

  // Forgot password form
  forgotPasswordHelp:      "Enter your email and we'll send you a reset link.",
  sendResetBtn:            'Send reset link',
  sendResetBtnLoading:     'Sending…',

  // Footer legal line
  legalNote: `By continuing, you agree to ${LEGAL_PRODUCT_NAME}'s Privacy Policy and Terms.`,

  // Error messages
  accessDeniedError: 'Access denied. Your Google account is not in the allowlist.',
} as const;

// ── Login page — right-panel marketing copy ──────────────────────────────────
export const MARKETING_COPY = {
  heroHeading: 'Your cluster,\nalways in view',
  heroSub:     'Track GPU, CPU, memory and disk across every training node — from one unified dashboard.',
  previewServerName: 'gpu-cluster-01',
  previewBadge:      '4 servers online',
  liveMetricsHeading: 'Live telemetry',
} as const;

// ── Login page — right-panel feature highlights ──────────────────────────────
export const LOGIN_FEATURES: ReadonlyArray<{
  gif: string;
  title: string;
  desc: string;
}> = [
  {
    gif:   '/gif/lightning.gif',
    title: 'Live telemetry',
    desc:  'GPU, CPU, memory & disk — updated every second.',
  },
  {
    gif:   '/gif/desktop.gif',
    title: 'Multi-server',
    desc:  'Monitor unlimited training nodes from one dashboard.',
  },
  {
    gif:   '/gif/brain.gif',
    title: 'AI bottleneck detection',
    desc:  'Automatically surfaces the resource limiting your runs.',
  },
  {
    gif:   '/gif/bell.gif',
    title: 'Smart alerts',
    desc:  'Instant notifications on thermal limits & resource saturation.',
  },
];

// ── Login page — right-panel demo metric bars ────────────────────────────────
import { ENTITY_COLORS } from './colors';

export const LOGIN_METRICS: ReadonlyArray<{
  label: string;
  value: number;
  color: string;
}> = [
  { label: 'GPU A100  ·  utilisation', value: 87, color: ENTITY_COLORS.gpu     },
  { label: 'CPU  ·  usage',            value: 52, color: ENTITY_COLORS.cpu     },
  { label: 'Memory',                   value: 68, color: ENTITY_COLORS.memory  },
  { label: 'Disk I/O',                 value: 34, color: ENTITY_COLORS.disk    },
];

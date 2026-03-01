import { GENERATED_COLOR_VARS } from './generated-colors';

// ============================================================
// Global color tokens — single source of truth for all UI colors.
// Imported by both login and dashboard components.
// ============================================================

// ── Entity palette ───────────────────────────────────────────
// Theme-invariant semantic colors for each metric dimension.
// Tuned for premium dark UI with restrained saturation.
export type MetricEntity =
  | 'cpu'
  | 'memory'
  | 'gpu'
  | 'disk'
  | 'network'
  | 'neutral';

export const ENTITY_COLORS: Record<MetricEntity, string> = {
  cpu:     '#4d74ff', // cleaner infra blue
  memory:  '#18b7a7', // refined teal
  gpu:     '#ff8a3d', // premium burnt amber (primary)
  disk:    '#7a68ff', // refined violet (less saturated)
  network: '#2acb7a', // premium green (less neon)
  neutral: '#72839a', // calmer slate
};

// ── Accent palette ───────────────────────────────────────────
// Support accents (kept restrained to avoid rainbow effect)
export const ACCENT_COLORS = {
  pink:   '#e56bb0',
  yellow: '#f2b84b',
  red:    '#ee6a73', // less “hot” than tailwind red
} as const;

// ── Chart grid / axis / tooltip colors (light vs dark mode) ─
// Slightly tuned for softer contrast on dark background
export const CHART_COLORS = {
  dark: {
    gridStroke:    'rgba(255, 255, 255, 0.045)',
    axisStroke:    'rgba(255, 255, 255, 0.16)',
    axisColor:     'rgba(155, 175, 205, 0.62)',
    // Recharts <Tooltip> contentStyle
    tooltipBg:     '#1c2a42',
    tooltipBorder: 'rgba(255, 255, 255, 0.12)',
    tooltipColor:  '#e0e8f4',
  },
  light: {
    gridStroke:    'rgba(0, 0, 0, 0.05)',
    axisStroke:    'rgba(0, 0, 0, 0.13)',
    axisColor:     'rgba(80, 100, 130, 0.72)',
    // Recharts <Tooltip> contentStyle
    tooltipBg:     '#ffffff',
    tooltipBorder: 'rgba(0, 0, 0, 0.10)',
    tooltipColor:  '#1a2438',
  },
} as const;

// ── Radar chart colors (light vs dark mode) ─────────────────
export const RADAR_COLORS = {
  dark: {
    gridStroke:   'rgba(214, 226, 255, 0.12)',
    axisTickFill: '#b9c8e6',
    radarStroke:  '#7a68ff',
    radarFill:    'rgba(122, 104, 255, 0.18)',
  },
  light: {
    gridStroke:   'rgba(15, 26, 54, 0.10)',
    axisTickFill: '#5c7293',
    radarStroke:  '#4d59ff',
    radarFill:    'rgba(77, 89, 255, 0.14)',
  },
} as const;

// ── App-wide CSS variable presets (kept in TS for single-source control) ────
export const THEME_VARIABLES = {
  dark: {
    '--bg-base': '#09090e',
    '--bg-surface': 'rgba(18, 18, 26, 0.66)',
    '--bg-raised': 'rgba(28, 28, 38, 0.64)',
    '--bg-elevated': 'rgba(42, 42, 56, 0.80)',
    '--sidebar-bg': 'rgba(7, 7, 11, 0.80)',

    '--border-color': 'rgba(255, 255, 255, 0.085)',
    '--border-strong': 'rgba(255, 255, 255, 0.14)',
    '--border-accent': 'rgba(255, 138, 61, 0.34)',

    '--text-primary': '#edf2fb',
    '--text-secondary': '#b5c6de',
    '--text-muted': '#748aa6',
    '--text-on-accent': '#ffffff',

    '--card-bg': 'linear-gradient(160deg, rgba(17, 18, 25, 0.94) 0%, rgba(9, 10, 15, 0.99) 100%)',
    '--glass-surface': 'rgba(14, 15, 22, 0.90)',
    '--glass-border': 'rgba(255, 255, 255, 0.20)',

    '--color-white': '#ffffff',
    '--color-panel-text': '#e6eefb',

    '--color-blue-strong': '#2b4fe8',
    '--color-info-bright': '#79a6ff',

    '--color-success': '#2acb7a',
    '--color-success-soft': 'rgba(42, 203, 122, 0.22)',
    '--color-green-deep': '#0f7a44',

    '--color-error-soft': 'rgba(238, 106, 115, 0.22)',
    '--color-error': '#ee6a73',

    '--color-muted-strong': '#43556f',
    '--color-muted-mid': '#6f8198',
    '--color-slate-soft': '#d2dbe7',
    '--color-surface-quiet': '#edf1f8',
    '--color-navy-muted': '#18233e',

    // Unified amber family (centered around #ff8a3d)
    '--color-orange-soft':  '#ffe1c7',
    '--color-orange-pale':  '#ffd1a6',
    '--color-orange-mid':   '#ff9f5a',
    '--color-orange-glow':  '#ffb77a',
    '--color-orange-deep':  '#ff6d2d',
    '--color-orange-strong':'#d84b1a',

    // Violet + teal families refined
    '--color-purple-soft': '#d2ccff',
    '--color-teal-soft':   '#a6f3ea',
    '--color-teal-deep':   '#0a7f74',

    // ── Background / panel tokens ──────────────────────────────────────
    '--topbar-bg':              'rgba(8, 8, 13, 0.92)',
    '--modal-overlay-bg':       'rgba(8, 10, 16, 0.55)',
    '--modal-bg':               'rgba(12, 13, 20, 0.97)',
    '--modal-bg-deep':          'rgba(12, 13, 18, 0.98)',
    '--dropdown-bg':            'rgba(12, 13, 20, 0.92)',
    '--panel-bg':               'rgba(8, 9, 14, 0.88)',
    '--panel-bg-light':         'rgba(15, 16, 21, 0.85)',
    '--panel-bg-deep':          'rgba(20, 21, 28, 0.92)',
    '--panel-bg-raised':        'rgba(28, 30, 40, 0.95)',
    '--overlay-bg':             'rgba(4, 4, 8, 0.72)',
    '--overlay-bg-blue':        'rgba(5, 8, 18, 0.52)',
    '--card-grad-dark-start':   'rgba(17, 18, 25, 0.94)',
    '--card-grad-dark-end':     'rgba(9, 10, 15, 0.99)',
    '--card-grad-darker-start': 'rgba(16, 17, 24, 0.97)',
    '--card-grad-darker-end':   'rgba(10, 11, 16, 0.99)',
    '--terminal-panel-bg':      'rgba(24, 25, 34, 1)',
    '--terminal-error-bg':      'rgba(30, 8, 8, 0.88)',
    '--terminal-error-mid':     'rgba(200, 30, 30, 0.25)',
    '--terminal-success-bg':    'rgba(5, 24, 12, 0.88)',
    '--terminal-success-mid':   'rgba(20, 160, 60, 0.2)',
    '--terminal-warning-bg':    'rgba(18, 14, 10, 0.96)',
    '--terminal-warm-bg':       'rgba(58, 55, 51, 0.84)',
    '--terminal-warm-border':   'rgba(185, 180, 174, 0.22)',

    // ── Sidebar / navigation text ──────────────────────────────────────
    '--text-sidebar-faint':     'rgba(180, 195, 220, 0.50)',
    '--text-sidebar-dim':       'rgba(180, 195, 220, 0.65)',
    '--text-sidebar-mid':       'rgba(180, 195, 220, 0.72)',
    '--text-sidebar-label':     'rgba(175, 192, 216, 0.52)',
    '--text-sidebar-bright':    'rgba(210, 225, 248, 0.90)',
    '--text-nav-mid':           'rgba(210, 225, 248, 0.92)',
    '--text-nav-mid2':          'rgba(210, 225, 252, 0.92)',
    '--text-nav-strong':        'rgba(210, 225, 252, 0.95)',
    '--text-nav-bright':        'rgba(210, 225, 252, 0.98)',
    '--text-panel-heading':     'rgba(215, 228, 255, 0.90)',
    '--text-topbar':            'rgba(190, 210, 248, 0.88)',
    '--text-dim':               'rgba(175, 192, 230, 0.68)',
    '--text-dim-muted':         'rgba(175, 192, 230, 0.55)',
    '--text-input-mid':         'rgba(195, 210, 242, 0.72)',
    '--text-input-strong':      'rgba(190, 210, 242, 0.82)',
    '--text-secondary-dim':     'rgba(180, 200, 240, 0.68)',
    '--text-secondary-dim70':   'rgba(180, 200, 240, 0.70)',
    '--text-secondary-mid':     'rgba(180, 200, 240, 0.72)',
    '--text-secondary-svg':     'rgba(180, 200, 240, 0.65)',
    '--text-insights-heading':  'rgba(222, 236, 255, 0.95)',
    '--text-muted-60':          'rgba(200, 215, 240, 0.60)',
    '--text-muted-70':          'rgba(200, 215, 240, 0.70)',
    '--text-muted-b':           'rgba(200, 215, 245, 0.70)',
    '--text-menu-dim':          'rgba(158, 174, 206, 0.55)',
    '--text-menu':              'rgba(158, 174, 206, 0.85)',
    '--text-server-dim':        'rgba(180, 200, 230, 0.65)',
    '--text-server-mid':        'rgba(140, 175, 215, 0.60)',
    '--text-server-strong':     'rgba(160, 185, 220, 0.75)',
    '--text-server-bright':     'rgba(160, 185, 225, 0.65)',
    '--text-server-note':       'rgba(150, 178, 218, 0.60)',
    '--text-feature-desc':      'rgba(148, 177, 234, 0.85)',
    '--text-feature-title':     'rgba(200, 220, 252, 0.85)',

    // ── Login page text ────────────────────────────────────────────────
    '--text-login-placeholder': 'rgba(115, 145, 188, 0.38)',
    '--text-login-faint':       'rgba(115, 145, 188, 0.45)',
    '--text-login-mid':         'rgba(115, 145, 188, 0.55)',
    '--text-login-dim':         'rgba(115, 145, 188, 0.60)',
    '--text-login-bright':      'rgba(155, 182, 218, 0.60)',
    '--text-login-md':          'rgba(155, 182, 218, 0.65)',
    '--text-login-strong':      'rgba(155, 182, 218, 0.75)',
    '--text-login-eye':         'rgba(155, 185, 230, 0.80)',
    '--text-login-link':        'rgba(90, 120, 165, 0.45)',
    '--text-help-dim':          'rgba(107, 126, 150, 0.85)',
    '--text-help':              'rgba(107, 126, 150, 0.95)',

    // ── Orange warm text / badge family ───────────────────────────────
    '--text-orange-dim':        'rgba(253, 186, 116, 0.78)',
    '--text-orange':            'rgba(253, 186, 116, 0.90)',
    '--text-orange-md':         'rgba(253, 186, 116, 0.90)',
    '--text-orange-strong':     'rgba(253, 186, 116, 0.95)',
    '--text-orange-pale':       'rgba(253, 210, 170, 0.95)',
    '--orange-rim-faint':       'rgba(255, 200, 120, 0.06)',
    '--orange-rim':             'rgba(255, 200, 140, 0.10)',
    '--orange-rim-mid':         'rgba(255, 200, 140, 0.16)',
    '--orange-rim-strong':      'rgba(255, 200, 140, 0.18)',
    '--orange-glow-faint':      'rgba(255, 220, 160, 0.30)',
    '--orange-glow':            'rgba(255, 220, 160, 0.35)',
    '--orange-bg-faint':        'rgba(255, 180, 80, 0.08)',

    // ── Light mode text (for light-on-light contexts) ──────────────────
    '--text-light-faint':       'rgba(30, 41, 59, 0.42)',
    '--text-light-dim':         'rgba(30, 41, 59, 0.52)',
    '--text-light-mid':         'rgba(30, 41, 59, 0.60)',
    '--text-light-mid2':        'rgba(30, 41, 59, 0.62)',
    '--text-light-strong':      'rgba(30, 41, 59, 0.65)',
    '--text-light-bright':      'rgba(30, 41, 59, 0.70)',
    '--text-light-deep':        'rgba(15, 23, 42, 0.78)',
    '--text-light-deeper':      'rgba(15, 23, 42, 0.85)',
    '--text-light-deepest':     'rgba(15, 23, 42, 0.88)',
    '--text-light-blue':        'rgba(29, 78, 216, 0.88)',

    // ── Warm beige button family ───────────────────────────────────────
    '--warm-btn-bg':            'rgba(158, 153, 146, 0.22)',
    '--warm-btn-bg-end':        'rgba(98, 94, 88, 0.18)',
    '--warm-btn-border':        'rgba(88, 84, 76, 0.55)',
    '--warm-btn-text':          'rgba(218, 212, 200, 0.88)',
    '--warm-btn-hover-bg':      'rgba(185, 180, 172, 0.28)',
    '--warm-btn-hover-bg-end':  'rgba(118, 113, 106, 0.22)',
    '--warm-btn-hover-text':    'rgba(238, 232, 220, 0.96)',
    '--warm-btn-hover-border':  'rgba(108, 103, 94, 0.68)',
    '--warm-btn-shadow':        'rgba(185, 180, 172, 0.16)',

    // ── Light surface tokens ───────────────────────────────────────────
    '--surface-light-sm':       'rgba(248, 249, 251, 0.88)',
    '--surface-light-md':       'rgba(240, 242, 246, 0.80)',
    '--surface-light-lg':       'rgba(240, 242, 246, 0.95)',
    '--surface-light-xl':       'rgba(240, 242, 246, 0.96)',
    '--surface-light-blue-sm':  'rgba(240, 243, 250, 0.70)',
    '--surface-light-blue-md':  'rgba(240, 243, 250, 0.82)',
  },
  light: {
    '--bg-base': '#f0f2f5',
    '--bg-surface': 'rgba(255, 255, 255, 0.84)',
    '--bg-raised': 'rgba(248, 249, 251, 0.90)',
    '--bg-elevated': 'rgba(240, 242, 246, 0.96)',
    '--sidebar-bg': 'rgba(240, 242, 246, 0.97)',

    '--border-color': 'rgba(0, 0, 0, 0.095)',
    '--border-strong': 'rgba(0, 0, 0, 0.16)',
    '--border-accent': 'rgba(255, 138, 61, 0.30)',

    '--text-primary': '#111827',
    '--text-secondary': '#334155',
    '--text-muted': '#64748b',
    '--text-on-accent': '#ffffff',

    '--card-bg': 'var(--glass-surface)',
    '--glass-surface': 'rgba(255, 255, 255, 0.68)',
    '--glass-border': 'rgba(0, 0, 0, 0.07)',

    '--color-white': '#ffffff',
    '--color-panel-text': '#1a2438',

    '--color-blue-strong': '#2b4fe8',
    '--color-info-bright': '#4d74ff',

    '--color-success': '#18b46b',
    '--color-success-soft': 'rgba(24, 180, 107, 0.18)',
    '--color-green-deep': '#116b3f',

    '--color-error-soft': 'rgba(238, 106, 115, 0.18)',
    '--color-error': '#e25563',

    '--color-muted-strong': '#46566e',
    '--color-muted-mid': '#6b7a92',
    '--color-slate-soft': '#cbd5e1',
    '--color-surface-quiet': '#edf1f8',
    '--color-navy-muted': '#1a2540',

    '--color-orange-soft':  '#ffe1c7',
    '--color-orange-pale':  '#ffd1a6',
    '--color-orange-mid':   '#ff9f5a',
    '--color-orange-glow':  '#ffb77a',
    '--color-orange-deep':  '#ff6d2d',
    '--color-orange-strong':'#d84b1a',

    '--color-purple-soft': '#d2ccff',
    '--color-teal-soft':   '#a6f3ea',
    '--color-teal-deep':   '#0a7f74',

    // ── Background / panel tokens (light) ──────────────────────────────
    '--topbar-bg':              'rgba(240, 242, 246, 0.95)',
    '--modal-overlay-bg':       'rgba(71, 85, 105, 0.25)',
    '--modal-bg':               'rgba(255, 255, 255, 0.97)',
    '--modal-bg-deep':          'rgba(248, 249, 251, 0.98)',
    '--dropdown-bg':            'rgba(255, 255, 255, 0.96)',
    '--panel-bg':               'rgba(248, 249, 251, 0.88)',
    '--panel-bg-light':         'rgba(252, 253, 255, 0.90)',
    '--panel-bg-deep':          'rgba(240, 242, 246, 0.95)',
    '--panel-bg-raised':        'rgba(250, 251, 253, 0.98)',
    '--overlay-bg':             'rgba(71, 85, 105, 0.12)',
    '--overlay-bg-blue':        'rgba(59, 130, 246, 0.08)',
    '--card-grad-dark-start':   'rgba(248, 249, 252, 0.98)',
    '--card-grad-dark-end':     'rgba(240, 242, 248, 0.99)',
    '--card-grad-darker-start': 'rgba(244, 246, 250, 0.99)',
    '--card-grad-darker-end':   'rgba(238, 241, 247, 1)',

    // Terminal stays dark in both themes
    '--terminal-panel-bg':      'rgba(24, 25, 34, 1)',
    '--terminal-error-bg':      'rgba(30, 8, 8, 0.88)',
    '--terminal-error-mid':     'rgba(200, 30, 30, 0.25)',
    '--terminal-success-bg':    'rgba(5, 24, 12, 0.88)',
    '--terminal-success-mid':   'rgba(20, 160, 60, 0.2)',
    '--terminal-warning-bg':    'rgba(18, 14, 10, 0.96)',
    '--terminal-warm-bg':       'rgba(58, 55, 51, 0.84)',
    '--terminal-warm-border':   'rgba(185, 180, 174, 0.22)',

    // ── Sidebar / navigation text (light — dark sidebar persists) ──────
    '--text-sidebar-faint':     'rgba(71, 85, 105, 0.50)',
    '--text-sidebar-dim':       'rgba(51, 65, 85, 0.65)',
    '--text-sidebar-mid':       'rgba(51, 65, 85, 0.72)',
    '--text-sidebar-label':     'rgba(71, 85, 105, 0.55)',
    '--text-sidebar-bright':    'rgba(30, 41, 59, 0.90)',
    '--text-nav-mid':           'rgba(30, 41, 59, 0.80)',
    '--text-nav-mid2':          'rgba(30, 41, 59, 0.82)',
    '--text-nav-strong':        'rgba(30, 41, 59, 0.88)',
    '--text-nav-bright':        'rgba(15, 23, 42, 0.92)',
    '--text-panel-heading':     'rgba(15, 23, 42, 0.88)',
    '--text-topbar':            'rgba(30, 41, 59, 0.85)',
    '--text-dim':               'rgba(71, 85, 105, 0.75)',
    '--text-dim-muted':         'rgba(71, 85, 105, 0.60)',
    '--text-input-mid':         'rgba(51, 65, 85, 0.68)',
    '--text-input-strong':      'rgba(30, 41, 59, 0.80)',
    '--text-secondary-dim':     'rgba(71, 85, 105, 0.72)',
    '--text-secondary-dim70':   'rgba(71, 85, 105, 0.70)',
    '--text-secondary-mid':     'rgba(71, 85, 105, 0.75)',
    '--text-secondary-svg':     'rgba(71, 85, 105, 0.68)',
    '--text-insights-heading':  'rgba(15, 23, 42, 0.92)',
    '--text-muted-60':          'rgba(100, 116, 139, 0.65)',
    '--text-muted-70':          'rgba(100, 116, 139, 0.75)',
    '--text-muted-b':           'rgba(100, 116, 139, 0.75)',
    '--text-menu-dim':          'rgba(100, 116, 139, 0.60)',
    '--text-menu':              'rgba(71, 85, 105, 0.88)',
    '--text-server-dim':        'rgba(71, 85, 105, 0.68)',
    '--text-server-mid':        'rgba(51, 65, 85, 0.65)',
    '--text-server-strong':     'rgba(30, 41, 59, 0.78)',
    '--text-server-bright':     'rgba(30, 41, 59, 0.72)',
    '--text-server-note':       'rgba(71, 85, 105, 0.65)',
    '--text-feature-desc':      'rgba(71, 85, 105, 0.88)',
    '--text-feature-title':     'rgba(30, 41, 59, 0.88)',

    // ── Login page text (light) ────────────────────────────────────────
    '--text-login-placeholder': 'rgba(71, 85, 105, 0.42)',
    '--text-login-faint':       'rgba(71, 85, 105, 0.50)',
    '--text-login-mid':         'rgba(71, 85, 105, 0.60)',
    '--text-login-dim':         'rgba(71, 85, 105, 0.65)',
    '--text-login-bright':      'rgba(51, 65, 85, 0.68)',
    '--text-login-md':          'rgba(51, 65, 85, 0.72)',
    '--text-login-strong':      'rgba(30, 41, 59, 0.80)',
    '--text-login-eye':         'rgba(30, 41, 59, 0.82)',
    '--text-login-link':        'rgba(37, 99, 235, 0.65)',
    '--text-help-dim':          'rgba(71, 85, 105, 0.88)',
    '--text-help':              'rgba(51, 65, 85, 0.95)',

    // ── Orange family (same in both themes) ───────────────────────────
    '--text-orange-dim':        'rgba(253, 186, 116, 0.78)',
    '--text-orange':            'rgba(253, 186, 116, 0.90)',
    '--text-orange-md':         'rgba(253, 186, 116, 0.90)',
    '--text-orange-strong':     'rgba(253, 186, 116, 0.95)',
    '--text-orange-pale':       'rgba(253, 210, 170, 0.95)',
    '--orange-rim-faint':       'rgba(255, 200, 120, 0.06)',
    '--orange-rim':             'rgba(255, 200, 140, 0.10)',
    '--orange-rim-mid':         'rgba(255, 200, 140, 0.16)',
    '--orange-rim-strong':      'rgba(255, 200, 140, 0.18)',
    '--orange-glow-faint':      'rgba(255, 220, 160, 0.30)',
    '--orange-glow':            'rgba(255, 220, 160, 0.35)',
    '--orange-bg-faint':        'rgba(255, 180, 80, 0.08)',

    // ── Light mode text tokens (same for both themes) ──────────────────
    '--text-light-faint':       'rgba(30, 41, 59, 0.42)',
    '--text-light-dim':         'rgba(30, 41, 59, 0.52)',
    '--text-light-mid':         'rgba(30, 41, 59, 0.60)',
    '--text-light-mid2':        'rgba(30, 41, 59, 0.62)',
    '--text-light-strong':      'rgba(30, 41, 59, 0.65)',
    '--text-light-bright':      'rgba(30, 41, 59, 0.70)',
    '--text-light-deep':        'rgba(15, 23, 42, 0.78)',
    '--text-light-deeper':      'rgba(15, 23, 42, 0.85)',
    '--text-light-deepest':     'rgba(15, 23, 42, 0.88)',
    '--text-light-blue':        'rgba(29, 78, 216, 0.88)',

    // ── Warm button family (same for both themes) ──────────────────────
    '--warm-btn-bg':            'rgba(158, 153, 146, 0.22)',
    '--warm-btn-bg-end':        'rgba(98, 94, 88, 0.18)',
    '--warm-btn-border':        'rgba(88, 84, 76, 0.55)',
    '--warm-btn-text':          'rgba(218, 212, 200, 0.88)',
    '--warm-btn-hover-bg':      'rgba(185, 180, 172, 0.28)',
    '--warm-btn-hover-bg-end':  'rgba(118, 113, 106, 0.22)',
    '--warm-btn-hover-text':    'rgba(238, 232, 220, 0.96)',
    '--warm-btn-hover-border':  'rgba(108, 103, 94, 0.68)',
    '--warm-btn-shadow':        'rgba(185, 180, 172, 0.16)',

    // ── Light surface tokens (same for both themes) ────────────────────
    '--surface-light-sm':       'rgba(248, 249, 251, 0.88)',
    '--surface-light-md':       'rgba(240, 242, 246, 0.80)',
    '--surface-light-lg':       'rgba(240, 242, 246, 0.95)',
    '--surface-light-xl':       'rgba(240, 242, 246, 0.96)',
    '--surface-light-blue-sm':  'rgba(240, 243, 250, 0.70)',
    '--surface-light-blue-md':  'rgba(240, 243, 250, 0.82)',
  },
} as const;

// Shadows & elevations (mirrors the CSS --shadow-* and --card-shadow tokens)
export const THEME_SHADOWS = {
  dark: {
    '--shadow-sm': '0 4px 16px rgba(0, 0, 0, 0.52), inset 0 1px 0 rgba(255, 255, 255, 0.10)',
    '--shadow-md': '0 8px 32px rgba(0, 0, 0, 0.62), inset 0 1px 0 rgba(255, 255, 255, 0.10)',
    '--shadow-lg': '0 16px 60px rgba(0, 0, 0, 0.78), inset 0 1px 0 rgba(255, 255, 255, 0.10)',
    '--card-shadow':
      '0 24px 64px rgba(0, 0, 0, 0.52), inset 0 1px 0 rgba(255, 255, 255, 0.20), inset 0 2px 8px rgba(255, 255, 255, 0.03), inset 0 -1px 0 rgba(0, 0, 0, 0.30)',
    '--card-blur': 'blur(32px) saturate(1.8)',
  },
  light: {
    '--shadow-sm': '0 1px 4px rgba(0, 0, 0, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    '--shadow-md': '0 4px 20px rgba(0, 0, 0, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.85)',
    '--shadow-lg': '0 8px 48px rgba(0, 0, 0, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.85)',
    '--card-shadow': 'var(--shadow-lg)',
    '--card-blur': 'blur(24px) saturate(1.6)',
  },
} as const;

// Card / surface backgrounds that were defined inline in CSS
export const THEME_BACKGROUNDS = {
  dark: {
    '--card-bg': 'linear-gradient(160deg, rgba(17, 18, 25, 0.94) 0%, rgba(9, 10, 15, 0.99) 100%)',
    '--glass-highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.20)',
  },
  light: {
    '--card-bg': 'var(--glass-surface)',
    '--glass-highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.95)',
  },
} as const;

/** Apply CSS custom properties for the current theme at runtime. */
export function applyThemeVariables(mode: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const vars = {
    ...GENERATED_COLOR_VARS,
    ...THEME_VARIABLES[mode],
    ...THEME_SHADOWS[mode],
    ...THEME_BACKGROUNDS[mode],
  };
  const root = document.documentElement;
  Object.entries(vars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  // Entity and accent palette (kept in sync with app.css custom properties)
  root.style.setProperty('--entity-cpu', ENTITY_COLORS.cpu);
  root.style.setProperty('--entity-memory', ENTITY_COLORS.memory);
  root.style.setProperty('--entity-gpu', ENTITY_COLORS.gpu);
  root.style.setProperty('--entity-disk', ENTITY_COLORS.disk);
  root.style.setProperty('--entity-network', ENTITY_COLORS.network);
  root.style.setProperty('--entity-neutral', ENTITY_COLORS.neutral);

  root.style.setProperty('--accent-blue', ENTITY_COLORS.cpu);
  root.style.setProperty('--accent-cyan', ENTITY_COLORS.memory);
  root.style.setProperty('--accent-orange', ENTITY_COLORS.gpu);
  root.style.setProperty('--accent-purple', ENTITY_COLORS.disk);
  root.style.setProperty('--accent-green', ENTITY_COLORS.network);
}
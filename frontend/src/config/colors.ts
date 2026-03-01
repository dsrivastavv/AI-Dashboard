import { GENERATED_COLOR_VARS } from './generated-colors';

// ============================================================
// Global color tokens — single source of truth for all UI colors.
// Imported by both login and dashboard components.
// ============================================================

// ── Entity palette ───────────────────────────────────────────
// Theme-invariant semantic colors for each metric dimension.
// Tuned for modern, premium UI with consistent luminance.
export type MetricEntity =
  | 'cpu'
  | 'memory'
  | 'gpu'
  | 'disk'
  | 'network'
  | 'neutral';

export const ENTITY_COLORS: Record<MetricEntity, string> = {
  cpu:     '#4F7DFF', // modern cobalt
  memory:  '#22C3B6', // clean cyan-teal
  gpu:     '#FF8B4A', // refined orange (primary accent)
  disk:    '#7C6CFF', // indigo-violet (less neon)
  network: '#2CCB7F', // calm emerald
  neutral: '#7C8DA6', // true slate
};

// ── Accent palette ───────────────────────────────────────────
// Support accents (kept restrained to avoid rainbow effect)
export const ACCENT_COLORS = {
  pink:   '#E56FB3',
  yellow: '#F2BE4E',
  red:    '#F06B78',
} as const;

// ── Chart grid / axis / tooltip colors (light vs dark mode) ─
export const CHART_COLORS = {
  dark: {
    gridStroke:    'rgba(255, 255, 255, 0.05)',
    axisStroke:    'rgba(255, 255, 255, 0.18)',
    axisColor:     'rgba(200, 215, 245, 0.62)',
    tooltipBg:     'rgba(18, 20, 28, 0.92)',
    tooltipBorder: 'rgba(255, 255, 255, 0.12)',
    tooltipColor:  '#EAF0FF',
  },
  light: {
    gridStroke:    'rgba(15, 23, 42, 0.06)',
    axisStroke:    'rgba(15, 23, 42, 0.14)',
    axisColor:     'rgba(51, 65, 85, 0.72)',
    tooltipBg:     '#FFFFFF',
    tooltipBorder: 'rgba(15, 23, 42, 0.10)',
    tooltipColor:  '#0F172A',
  },
} as const;

// ── Radar chart colors (light vs dark mode) ─────────────────
export const RADAR_COLORS = {
  dark: {
    gridStroke:   'rgba(210, 225, 255, 0.14)',
    axisTickFill: 'rgba(200, 215, 245, 0.72)',
    radarStroke:  ENTITY_COLORS.disk,
    radarFill:    'rgba(124, 108, 255, 0.16)',
  },
  light: {
    gridStroke:   'rgba(15, 23, 42, 0.10)',
    axisTickFill: '#526784',
    radarStroke:  ENTITY_COLORS.cpu,
    radarFill:    'rgba(79, 125, 255, 0.12)',
  },
} as const;

// ── App-wide CSS variable presets (kept in TS for single-source control) ────
export const THEME_VARIABLES = {
  dark: {
    // lifted, cooler-neutral foundations (less harsh than near-black)
    '--bg-base': '#0B0D12',
    '--bg-surface': 'rgba(20, 22, 30, 0.72)',
    '--bg-raised': 'rgba(28, 31, 42, 0.70)',
    '--bg-elevated': 'rgba(40, 44, 60, 0.82)',
    '--sidebar-bg': 'rgba(10, 12, 18, 0.86)',

    '--border-color': 'rgba(255, 255, 255, 0.075)',
    '--border-strong': 'rgba(255, 255, 255, 0.13)',
    '--border-accent': 'rgba(255, 139, 74, 0.30)',

    '--text-primary': '#EEF2FF',
    '--text-secondary': '#C7D2E6',
    '--text-muted': '#8FA3BE',
    '--text-on-accent': '#ffffff',

    '--card-bg': 'linear-gradient(160deg, rgba(20, 22, 30, 0.96) 0%, rgba(11, 13, 18, 0.99) 100%)',
    '--glass-surface': 'rgba(18, 20, 28, 0.92)',
    '--glass-border': 'rgba(255, 255, 255, 0.18)',

    '--color-white': '#ffffff',
    '--color-panel-text': '#EAF0FF',

    '--color-blue-strong': '#2F57F0',
    '--color-info-bright': ENTITY_COLORS.cpu,

    '--color-success': ENTITY_COLORS.network,
    '--color-success-soft': 'rgba(44, 203, 127, 0.20)',
    '--color-green-deep': '#0E7A48',

    '--color-error-soft': 'rgba(240, 107, 120, 0.20)',
    '--color-error': ACCENT_COLORS.red,

    '--color-muted-strong': '#4A5C78',
    '--color-muted-mid': '#7486A2',
    '--color-slate-soft': '#D0D9E6',
    '--color-surface-quiet': '#EEF2FF',
    '--color-navy-muted': '#1A2340',

    // Unified orange family (centered around #FF8B4A)
    '--color-orange-soft':  '#FFE4D2',
    '--color-orange-pale':  '#FFD3B5',
    '--color-orange-mid':   '#FF9D66',
    '--color-orange-glow':  '#FFB887',
    '--color-orange-deep':  '#FF7A33',
    '--color-orange-strong':'#D84E1E',

    // Violet + teal families refined
    '--color-purple-soft': '#D6D2FF',
    '--color-teal-soft':   '#A8F3ED',
    '--color-teal-deep':   '#0A7F76',

    // ── Background / panel tokens ──────────────────────────────────────
    '--topbar-bg':              'rgba(10, 12, 18, 0.92)',
    '--modal-overlay-bg':       'rgba(8, 10, 16, 0.55)',
    '--modal-bg':               'rgba(14, 16, 22, 0.97)',
    '--modal-bg-deep':          'rgba(12, 14, 20, 0.98)',
    '--dropdown-bg':            'rgba(14, 16, 22, 0.92)',
    '--panel-bg':               'rgba(12, 14, 20, 0.88)',
    '--panel-bg-light':         'rgba(18, 20, 28, 0.86)',
    '--panel-bg-deep':          'rgba(22, 25, 34, 0.92)',
    '--panel-bg-raised':        'rgba(30, 34, 46, 0.95)',
    '--overlay-bg':             'rgba(6, 7, 12, 0.72)',
    '--overlay-bg-blue':        'rgba(8, 12, 24, 0.52)',
    '--card-grad-dark-start':   'rgba(20, 22, 30, 0.96)',
    '--card-grad-dark-end':     'rgba(11, 13, 18, 0.99)',
    '--card-grad-darker-start': 'rgba(18, 20, 28, 0.97)',
    '--card-grad-darker-end':   'rgba(11, 13, 18, 0.99)',
    '--terminal-panel-bg':      'rgba(24, 25, 34, 1)',
    '--terminal-error-bg':      'rgba(30, 8, 8, 0.88)',
    '--terminal-error-mid':     'rgba(200, 30, 30, 0.25)',
    '--terminal-success-bg':    'rgba(5, 24, 12, 0.88)',
    '--terminal-success-mid':   'rgba(20, 160, 60, 0.2)',
    '--terminal-warning-bg':    'rgba(18, 14, 10, 0.96)',
    '--terminal-warm-bg':       'rgba(58, 55, 51, 0.84)',
    '--terminal-warm-border':   'rgba(185, 180, 174, 0.22)',

    // ── Sidebar / navigation text ──────────────────────────────────────
    '--text-sidebar-faint':     'rgba(200, 215, 245, 0.46)',
    '--text-sidebar-dim':       'rgba(200, 215, 245, 0.62)',
    '--text-sidebar-mid':       'rgba(200, 215, 245, 0.70)',
    '--text-sidebar-label':     'rgba(200, 215, 245, 0.50)',
    '--text-sidebar-bright':    'rgba(234, 240, 255, 0.92)',
    '--text-nav-mid':           'rgba(234, 240, 255, 0.92)',
    '--text-nav-mid2':          'rgba(234, 240, 255, 0.92)',
    '--text-nav-strong':        'rgba(234, 240, 255, 0.95)',
    '--text-nav-bright':        'rgba(234, 240, 255, 0.98)',
    '--text-panel-heading':     'rgba(234, 240, 255, 0.90)',
    '--text-topbar':            'rgba(205, 220, 248, 0.88)',
    '--text-dim':               'rgba(199, 210, 230, 0.68)',
    '--text-dim-muted':         'rgba(199, 210, 230, 0.55)',
    '--text-input-mid':         'rgba(215, 225, 246, 0.72)',
    '--text-input-strong':      'rgba(234, 240, 255, 0.82)',
    '--text-secondary-dim':     'rgba(199, 210, 230, 0.68)',
    '--text-secondary-dim70':   'rgba(199, 210, 230, 0.70)',
    '--text-secondary-mid':     'rgba(199, 210, 230, 0.72)',
    '--text-secondary-svg':     'rgba(199, 210, 230, 0.65)',
    '--text-insights-heading':  'rgba(234, 240, 255, 0.95)',
    '--text-muted-60':          'rgba(199, 210, 230, 0.60)',
    '--text-muted-70':          'rgba(199, 210, 230, 0.70)',
    '--text-muted-b':           'rgba(199, 210, 235, 0.70)',
    '--text-menu-dim':          'rgba(170, 186, 214, 0.55)',
    '--text-menu':              'rgba(170, 186, 214, 0.85)',
    '--text-server-dim':        'rgba(199, 210, 230, 0.62)',
    '--text-server-mid':        'rgba(170, 195, 225, 0.60)',
    '--text-server-strong':     'rgba(190, 210, 238, 0.75)',
    '--text-server-bright':     'rgba(190, 210, 238, 0.65)',
    '--text-server-note':       'rgba(175, 198, 232, 0.60)',
    '--text-feature-desc':      'rgba(175, 198, 232, 0.85)',
    '--text-feature-title':     'rgba(220, 232, 255, 0.86)',

    // ── Login page text ────────────────────────────────────────────────
    '--text-login-placeholder': 'rgba(170, 190, 220, 0.38)',
    '--text-login-faint':       'rgba(170, 190, 220, 0.45)',
    '--text-login-mid':         'rgba(170, 190, 220, 0.55)',
    '--text-login-dim':         'rgba(170, 190, 220, 0.60)',
    '--text-login-bright':      'rgba(195, 212, 238, 0.62)',
    '--text-login-md':          'rgba(195, 212, 238, 0.68)',
    '--text-login-strong':      'rgba(210, 225, 248, 0.78)',
    '--text-login-eye':         'rgba(210, 225, 248, 0.80)',
    '--text-login-link':        'rgba(130, 160, 210, 0.55)',
    '--text-help-dim':          'rgba(160, 175, 198, 0.85)',
    '--text-help':              'rgba(160, 175, 198, 0.95)',

    // ── Orange warm text / badge family ───────────────────────────────
    '--text-orange-dim':        'rgba(255, 187, 135, 0.78)',
    '--text-orange':            'rgba(255, 187, 135, 0.90)',
    '--text-orange-md':         'rgba(255, 187, 135, 0.90)',
    '--text-orange-strong':     'rgba(255, 187, 135, 0.95)',
    '--text-orange-pale':       'rgba(255, 212, 181, 0.95)',
    '--orange-rim-faint':       'rgba(255, 200, 160, 0.06)',
    '--orange-rim':             'rgba(255, 200, 160, 0.10)',
    '--orange-rim-mid':         'rgba(255, 200, 160, 0.16)',
    '--orange-rim-strong':      'rgba(255, 200, 160, 0.18)',
    '--orange-glow-faint':      'rgba(255, 220, 190, 0.28)',
    '--orange-glow':            'rgba(255, 220, 190, 0.34)',
    '--orange-bg-faint':        'rgba(255, 170, 110, 0.08)',

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
    // slightly warmer, cleaner light foundations
    '--bg-base': '#F4F6FA',
    '--bg-surface': 'rgba(255, 255, 255, 0.88)',
    '--bg-raised': 'rgba(250, 251, 253, 0.92)',
    '--bg-elevated': 'rgba(244, 246, 250, 0.98)',
    '--sidebar-bg': 'rgba(244, 246, 250, 0.97)',

    '--border-color': 'rgba(15, 23, 42, 0.09)',
    '--border-strong': 'rgba(15, 23, 42, 0.14)',
    '--border-accent': 'rgba(255, 139, 74, 0.26)',

    '--text-primary': '#0F172A',
    '--text-secondary': '#24324A',
    '--text-muted': '#5B6B85',
    '--text-on-accent': '#ffffff',

    '--card-bg': 'var(--glass-surface)',
    '--glass-surface': 'rgba(255, 255, 255, 0.72)',
    '--glass-border': 'rgba(15, 23, 42, 0.07)',

    '--color-white': '#ffffff',
    '--color-panel-text': '#0F172A',

    '--color-blue-strong': '#2F57F0',
    '--color-info-bright': ENTITY_COLORS.cpu,

    '--color-success': ENTITY_COLORS.network,
    '--color-success-soft': 'rgba(44, 203, 127, 0.16)',
    '--color-green-deep': '#116B43',

    '--color-error-soft': 'rgba(240, 107, 120, 0.16)',
    '--color-error': ACCENT_COLORS.red,

    '--color-muted-strong': '#46566E',
    '--color-muted-mid': '#6B7A92',
    '--color-slate-soft': '#CBD5E1',
    '--color-surface-quiet': '#EEF2FF',
    '--color-navy-muted': '#1A2540',

    '--color-orange-soft':  '#FFE4D2',
    '--color-orange-pale':  '#FFD3B5',
    '--color-orange-mid':   '#FF9D66',
    '--color-orange-glow':  '#FFB887',
    '--color-orange-deep':  '#FF7A33',
    '--color-orange-strong':'#D84E1E',

    '--color-purple-soft': '#D6D2FF',
    '--color-teal-soft':   '#A8F3ED',
    '--color-teal-deep':   '#0A7F76',

    // ── Background / panel tokens (light) ──────────────────────────────
    '--topbar-bg':              'rgba(244, 246, 250, 0.95)',
    '--modal-overlay-bg':       'rgba(71, 85, 105, 0.25)',
    '--modal-bg':               'rgba(255, 255, 255, 0.97)',
    '--modal-bg-deep':          'rgba(250, 251, 253, 0.98)',
    '--dropdown-bg':            'rgba(255, 255, 255, 0.96)',
    '--panel-bg':               'rgba(250, 251, 253, 0.88)',
    '--panel-bg-light':         'rgba(252, 253, 255, 0.90)',
    '--panel-bg-deep':          'rgba(244, 246, 250, 0.95)',
    '--panel-bg-raised':        'rgba(250, 251, 253, 0.98)',
    '--overlay-bg':             'rgba(71, 85, 105, 0.12)',
    '--overlay-bg-blue':        'rgba(79, 125, 255, 0.08)',
    '--card-grad-dark-start':   'rgba(250, 251, 253, 0.98)',
    '--card-grad-dark-end':     'rgba(244, 246, 250, 0.99)',
    '--card-grad-darker-start': 'rgba(248, 249, 252, 0.99)',
    '--card-grad-darker-end':   'rgba(242, 244, 248, 1)',

    // Terminal stays dark in both themes
    '--terminal-panel-bg':      'rgba(24, 25, 34, 1)',
    '--terminal-error-bg':      'rgba(30, 8, 8, 0.88)',
    '--terminal-error-mid':     'rgba(200, 30, 30, 0.25)',
    '--terminal-success-bg':    'rgba(5, 24, 12, 0.88)',
    '--terminal-success-mid':   'rgba(20, 160, 60, 0.2)',
    '--terminal-warning-bg':    'rgba(18, 14, 10, 0.96)',
    '--terminal-warm-bg':       'rgba(58, 55, 51, 0.84)',
    '--terminal-warm-border':   'rgba(185, 180, 174, 0.22)',

    // ── Sidebar / navigation text (light) ──────────────────────────────
    '--text-sidebar-faint':     'rgba(71, 85, 105, 0.50)',
    '--text-sidebar-dim':       'rgba(51, 65, 85, 0.65)',
    '--text-sidebar-mid':       'rgba(51, 65, 85, 0.72)',
    '--text-sidebar-label':     'rgba(71, 85, 105, 0.55)',
    '--text-sidebar-bright':    'rgba(15, 23, 42, 0.90)',
    '--text-nav-mid':           'rgba(15, 23, 42, 0.80)',
    '--text-nav-mid2':          'rgba(15, 23, 42, 0.82)',
    '--text-nav-strong':        'rgba(15, 23, 42, 0.88)',
    '--text-nav-bright':        'rgba(15, 23, 42, 0.92)',
    '--text-panel-heading':     'rgba(15, 23, 42, 0.88)',
    '--text-topbar':            'rgba(15, 23, 42, 0.85)',
    '--text-dim':               'rgba(71, 85, 105, 0.75)',
    '--text-dim-muted':         'rgba(71, 85, 105, 0.60)',
    '--text-input-mid':         'rgba(51, 65, 85, 0.68)',
    '--text-input-strong':      'rgba(15, 23, 42, 0.80)',
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
    '--text-server-strong':     'rgba(15, 23, 42, 0.78)',
    '--text-server-bright':     'rgba(15, 23, 42, 0.72)',
    '--text-server-note':       'rgba(71, 85, 105, 0.65)',
    '--text-feature-desc':      'rgba(71, 85, 105, 0.88)',
    '--text-feature-title':     'rgba(15, 23, 42, 0.88)',

    // ── Login page text (light) ────────────────────────────────────────
    '--text-login-placeholder': 'rgba(71, 85, 105, 0.42)',
    '--text-login-faint':       'rgba(71, 85, 105, 0.50)',
    '--text-login-mid':         'rgba(71, 85, 105, 0.60)',
    '--text-login-dim':         'rgba(71, 85, 105, 0.65)',
    '--text-login-bright':      'rgba(51, 65, 85, 0.68)',
    '--text-login-md':          'rgba(51, 65, 85, 0.72)',
    '--text-login-strong':      'rgba(15, 23, 42, 0.80)',
    '--text-login-eye':         'rgba(15, 23, 42, 0.82)',
    '--text-login-link':        'rgba(47, 87, 240, 0.75)',
    '--text-help-dim':          'rgba(71, 85, 105, 0.88)',
    '--text-help':              'rgba(51, 65, 85, 0.95)',

    // ── Orange family ────────────────────────────────────────────────
    '--text-orange-dim':        'rgba(255, 187, 135, 0.78)',
    '--text-orange':            'rgba(255, 187, 135, 0.90)',
    '--text-orange-md':         'rgba(255, 187, 135, 0.90)',
    '--text-orange-strong':     'rgba(255, 187, 135, 0.95)',
    '--text-orange-pale':       'rgba(255, 212, 181, 0.95)',
    '--orange-rim-faint':       'rgba(255, 200, 160, 0.06)',
    '--orange-rim':             'rgba(255, 200, 160, 0.10)',
    '--orange-rim-mid':         'rgba(255, 200, 160, 0.16)',
    '--orange-rim-strong':      'rgba(255, 200, 160, 0.18)',
    '--orange-glow-faint':      'rgba(255, 220, 190, 0.28)',
    '--orange-glow':            'rgba(255, 220, 190, 0.34)',
    '--orange-bg-faint':        'rgba(255, 170, 110, 0.08)',

    // ── Light mode text tokens ────────────────────────────────────────
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

    // ── Warm button family ────────────────────────────────────────────
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
    '--card-bg': 'linear-gradient(160deg, rgba(20, 22, 30, 0.96) 0%, rgba(11, 13, 18, 0.99) 100%)',
    '--glass-highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.18)',
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
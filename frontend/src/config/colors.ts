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

// ── Chart grid / axis colors (light vs dark mode) ───────────
// Slightly tuned for softer contrast on dark background
export const CHART_COLORS = {
  dark: {
    gridStroke: 'rgba(255, 255, 255, 0.045)',
    axisStroke: 'rgba(255, 255, 255, 0.16)',
    axisColor:  'rgba(155, 175, 205, 0.62)',
  },
  light: {
    gridStroke: 'rgba(0, 0, 0, 0.05)',
    axisStroke: 'rgba(0, 0, 0, 0.13)',
    axisColor:  'rgba(80, 100, 130, 0.72)',
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
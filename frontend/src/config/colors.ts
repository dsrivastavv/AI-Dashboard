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
  cpu:     '#4f7df0',   // softened blue (less neon than #3b82f6)
  memory:  '#1fb6aa',   // deeper teal
  gpu:     '#ff8a3d',   // 🔥 premium burnt amber (primary accent)
  disk:    '#7c6cff',   // softened violet (reduced saturation)
  network: '#2ecf89',   // deeper green
  neutral: '#6b7c93',   // refined slate
};

// ── Accent palette ───────────────────────────────────────────
// Support accents (kept restrained to avoid rainbow effect)

export const ACCENT_COLORS = {
  pink:   '#ec6bb6',   // softened pink
  yellow: '#f4b740',   // warm gold (less bright than #fbbf24)
  red:    '#ef6a6a',   // refined red
} as const;

// ── Chart grid / axis colors (light vs dark mode) ───────────
// Slightly tuned for softer contrast on dark background

export const CHART_COLORS = {
  dark: {
    gridStroke: 'rgba(255, 255, 255, 0.05)',
    axisStroke: 'rgba(255, 255, 255, 0.18)',
    axisColor:  'rgba(150, 170, 200, 0.6)',
  },
  light: {
    gridStroke: 'rgba(0, 0, 0, 0.05)',
    axisStroke: 'rgba(0, 0, 0, 0.14)',
    axisColor:  'rgba(80, 100, 130, 0.7)',
  },
} as const;

// ── Radar chart colors (light vs dark mode) ─────────────────

export const RADAR_COLORS = {
  dark: {
    gridStroke:   'rgba(214, 226, 255, 0.12)',
    axisTickFill: '#b9c8e6',
    radarStroke:  '#7a84ff',
    radarFill:    'rgba(122, 132, 255, 0.20)',
  },
  light: {
    gridStroke:   'rgba(15, 26, 54, 0.10)',
    axisTickFill: '#5c7293',
    radarStroke:  '#4252ff',
    radarFill:    'rgba(66, 82, 255, 0.16)',
  },
} as const;
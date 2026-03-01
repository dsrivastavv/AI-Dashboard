// ============================================================
// Global color tokens — single source of truth for all UI colors.
// Imported by both login and dashboard components.
// ============================================================

// ── Entity palette ────────────────────────────────────────────────────────────
// Theme-invariant semantic colors for each metric dimension.
// These align with the CSS custom properties in app.css (--entity-*).
export type MetricEntity = 'cpu' | 'memory' | 'gpu' | 'disk' | 'network' | 'neutral';

export const ENTITY_COLORS: Record<MetricEntity, string> = {
  cpu:     '#3b82f6',  // blue
  memory:  '#14b8a6',  // teal
  gpu:     '#f97316',  // orange  — primary accent, strongest
  disk:    '#8b5cf6',  // purple
  network: '#22c55e',  // green
  neutral: '#64748b',  // slate
};

// ── Accent palette ────────────────────────────────────────────────────────────
export const ACCENT_COLORS = {
  pink:   '#f472b6',
  yellow: '#fbbf24',
  red:    '#f87171',
} as const;

// ── Chart grid / axis colors (light vs dark mode) ─────────────────────────────
export const CHART_COLORS = {
  dark: {
    gridStroke: 'rgba(255, 255, 255, 0.06)',
    axisStroke: 'rgba(255, 255, 255, 0.2)',
    axisColor:  'rgba(150, 170, 200, 0.6)',
  },
  light: {
    gridStroke: 'rgba(0, 0, 0, 0.06)',
    axisStroke: 'rgba(0, 0, 0, 0.15)',
    axisColor:  'rgba(80, 100, 130, 0.7)',
  },
} as const;

// ── Radar chart colors (light vs dark mode) ───────────────────────────────────
export const RADAR_COLORS = {
  dark: {
    gridStroke:   'rgba(214, 226, 255, 0.14)',
    axisTickFill: '#b9c8e6',
    radarStroke:  '#7a84ff',
    radarFill:    'rgba(122, 132, 255, 0.22)',
  },
  light: {
    gridStroke:   'rgba(15, 26, 54, 0.12)',
    axisTickFill: '#5c7293',
    radarStroke:  '#4252ff',
    radarFill:    'rgba(66, 82, 255, 0.18)',
  },
} as const;

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
  cpu:     '#4a78c8', // muted cobalt blue
  memory:  '#c05890', // muted rose-pink
  gpu:     '#2a8898', // muted teal (distinct from orange AI brand)
  disk:    '#8858b8', // muted purple
  network: '#2e9460', // muted emerald green
  neutral: '#64748b', // neutral slate
};

// ── Accent palette ───────────────────────────────────────────
// Support accents (kept restrained to avoid rainbow effect)
export const ACCENT_COLORS = {
  pink:   '#a0508a',
  yellow: '#b8932a',
  red:    '#b84040',
} as const;

// Brand marks / external logos (kept separate from theme-able accents)
export const BRAND_COLORS = {
  googleYellow: '#FFC107',
  googleRed: '#FF3D00',
  googleGreen: '#4CAF50',
  googleBlue: '#1976D2',
} as const;

const BASE_COLOR_HEXES = [
  '#047857',
  '#050b14',
  '#090805',
  '#09090e',
  '#0a0f1e',
  '#0d0d10',
  '#0f0f13',
  '#0f1115',
  '#0f1728',
  '#0f766e',
  '#111115',
  '#111217',
  '#111827',
  '#141418',
  '#15803d',
  '#161720',
  '#162035',
  '#1a1a1f',
  '#1a1a2e',
  '#1a2540',
  '#1c2a42',
  '#1d4ed8',
  '#1fb6aa',
  '#212128',
  '#22c55e',
  '#2563eb',
  '#2a8a58',
  '#2a9088',
  '#2ecf89',
  '#334155',
  '#34d399',
  '#3b82f6',
  '#3e4f68',
  '#46566e',
  '#475569',
  '#4a78c8',
  '#4f7df0',
  '#555963',
  '#5a6b85',
  '#5e708a',
  '#5fdfd2',
  '#60a5fa',
  '#6366f1',
  '#64748b',
  '#6655b0',
  '#67645e',
  '#6a7e96',
  '#6b7280',
  '#6b7a92',
  '#6b7c93',
  '#6d28d9',
  '#6e7180',
  '#7a7f90',
  '#7aaad0',
  '#7aefc0',
  '#7c3aed',
  '#7c6cff',
  '#7c7f88',
  '#86efac',
  '#8a8783',
  '#8d8a85',
  '#93baff',
  '#93c5fd',
  '#97f0e4',
  '#9aa0ae',
  '#9eaece',
  '#a0508a',
  '#a78bfa',
  '#a9c9fc',
  '#afaca8',
  '#afc0d8',
  '#b45309',
  '#b84040',
  '#b8702e',
  '#b8932a',
  '#b91c1c',
  '#bbf7d0',
  '#bfdbfe',
  '#c2410c',
  '#c2c6d2',
  '#c8a84a',
  '#c8c0f4',
  '#c8cdd9',
  '#c8d8f0',
  '#cbd5e1',
  '#d47070',
  '#d4dcea',
  '#d6e3f5',
  '#d7d9df',
  '#d8e2f0',
  '#dce8f8',
  '#dde8f8',
  '#e0e8f4',
  '#e0e8f8',
  '#e2eaf8',
  '#e6e8ec',
  '#e9eaee',
  '#ec6bb6',
  '#eceff4',
  '#ecf4ff',
  '#edeef2',
  '#edf1f8',
  '#edf2fc',
  '#ef6a6a',
  '#f1f2f5',
  '#f25f29',
  '#f3f4f6',
  '#f43f5e',
  '#f4b740',
  '#f4f4f6',
  '#f4f6fb',
  '#f5f7fa',
  '#f7f7fb',
  '#f7f8fa',
  '#f7f9ff',
  '#f87171',
  '#f89c4f',
  '#f8fafb',
  '#f8fafc',
  '#f97316',
  '#fb923c',
  '#fbbf24',
  '#fc9a9a',
  '#fca5a5',
  '#fdba74',
  '#fecb80',
  '#fed7aa',
  '#ff8a3d',
  '#ffb86c',
  '#ffd399',
  '#ffffff',
] as const;

export const GENERATED_COLOR_VARS: Record<string, string> = BASE_COLOR_HEXES.reduce((acc, hex) => {
  acc[`--color-${hex.slice(1).toLowerCase()}`] = hex;
  return acc;
}, {} as Record<string, string>);

// Generated from app.css hardcoded color literals.
export const APP_CSS_LITERAL_COLOR_VARS: Record<string, string> = {
  '--color-lit-rgba-0-0-0-0p015': 'rgba(0, 0, 0, 0.015)',
  '--color-lit-rgba-0-0-0-0p025': 'rgba(0, 0, 0, 0.025)',
  '--color-lit-rgba-0-0-0-0p03': 'rgba(0, 0, 0, 0.03)',
  '--color-lit-rgba-0-0-0-0p04': 'rgba(0, 0, 0, 0.04)',
  '--color-lit-rgba-0-0-0-0p06': 'rgba(0, 0, 0, 0.06)',
  '--color-lit-rgba-0-0-0-0p08': 'rgba(0, 0, 0, 0.08)',
  '--color-lit-rgba-0-0-0-0p1': 'rgba(0, 0, 0, 0.1)',
  '--color-lit-rgba-0-0-0-0p12': 'rgba(0, 0, 0, 0.12)',
  '--color-lit-rgba-0-0-0-0p15': 'rgba(0, 0, 0, 0.15)',
  '--color-lit-rgba-0-0-0-0p25': 'rgba(0, 0, 0, 0.25)',
  '--color-lit-rgba-0-0-0-0p4': 'rgba(0,0,0,0.4)',
  '--color-lit-rgba-0-0-0-0p55': 'rgba(0, 0, 0, 0.55)',
  '--color-lit-rgba-0-0-0-0p65': 'rgba(0, 0, 0, 0.65)',
  '--color-lit-rgba-0-0-0-1': 'rgba(0,0,0,1)',
  '--color-lit-rgba-0-0-0-p07': 'rgba(0,0,0,.07)',
  '--color-lit-rgba-0-0-0-p08': 'rgba(0,0,0,.08)',
  '--color-lit-rgba-0-0-0-p10': 'rgba(0,0,0,.10)',
  '--color-lit-rgba-0-0-0-p13': 'rgba(0,0,0,.13)',
  '--color-lit-rgba-0-0-0-p18': 'rgba(0,0,0,.18)',
  '--color-lit-rgba-0-0-0-p22': 'rgba(0,0,0,.22)',
  '--color-lit-rgba-0-0-0-p28': 'rgba(0,0,0,.28)',
  '--color-lit-rgba-0-0-0-p30': 'rgba(0,0,0,.30)',
  '--color-lit-rgba-0-0-0-p35': 'rgba(0,0,0,.35)',
  '--color-lit-rgba-0-0-0-p40': 'rgba(0,0,0,.40)',
  '--color-lit-rgba-0-0-0-p48': 'rgba(0,0,0,.48)',
  '--color-lit-rgba-0-0-0-p52': 'rgba(0,0,0,.52)',
  '--color-lit-rgba-0-0-0-p55': 'rgba(0,0,0,.55)',
  '--color-lit-rgba-0-0-0-p60': 'rgba(0,0,0,.60)',
  '--color-lit-rgba-0-0-0-p62': 'rgba(0,0,0,.62)',
  '--color-lit-rgba-0-0-0-p65': 'rgba(0,0,0,.65)',
  '--color-lit-rgba-0-0-0-p70': 'rgba(0,0,0,.70)',
  '--color-lit-rgba-0-0-0-p78': 'rgba(0,0,0,.78)',
  '--color-lit-rgba-100-120-255-0p18': 'rgba(100, 120, 255, 0.18)',
  '--color-lit-rgba-107-126-150-p85': 'rgba(107,126,150,.85)',
  '--color-lit-rgba-107-126-150-p95': 'rgba(107,126,150,.95)',
  '--color-lit-rgba-115-145-188-0p38': 'rgba(115, 145, 188, 0.38)',
  '--color-lit-rgba-115-145-188-0p45': 'rgba(115, 145, 188, 0.45)',
  '--color-lit-rgba-115-145-188-0p55': 'rgba(115, 145, 188, 0.55)',
  '--color-lit-rgba-115-145-188-0p6': 'rgba(115, 145, 188, 0.6)',
  '--color-lit-rgba-122-239-192-1': 'rgba(122,239,192,1)',
  '--color-lit-rgba-139-92-246-0p2': 'rgba(139, 92, 246, 0.2)',
  '--color-lit-rgba-14-14-20-0p96': 'rgba(14, 14, 20, 0.96)',
  '--color-lit-rgba-14-15-22-p90': 'rgba(14,15,22,.90)',
  '--color-lit-rgba-140-175-215-0p6': 'rgba(140, 175, 215, 0.6)',
  '--color-lit-rgba-148-177-234-0p85': 'rgba(148, 177, 234, 0.85)',
  '--color-lit-rgba-15-16-21-0p85': 'rgba(15, 16, 21, 0.85)',
  '--color-lit-rgba-15-23-42-p85': 'rgba(15,23,42,.85)',
  '--color-lit-rgba-150-178-218-0p6': 'rgba(150, 178, 218, 0.6)',
  '--color-lit-rgba-155-182-218-0p6': 'rgba(155, 182, 218, 0.6)',
  '--color-lit-rgba-155-182-218-0p65': 'rgba(155, 182, 218, 0.65)',
  '--color-lit-rgba-155-182-218-0p75': 'rgba(155, 182, 218, 0.75)',
  '--color-lit-rgba-155-185-230-0p8': 'rgba(155, 185, 230, 0.8)',
  '--color-lit-rgba-158-174-206-0p55': 'rgba(158, 174, 206, 0.55)',
  '--color-lit-rgba-158-174-206-0p85': 'rgba(158, 174, 206, 0.85)',
  '--color-lit-rgba-158-174-206-p55': 'rgba(158,174,206,.55)',
  '--color-lit-rgba-158-174-206-p85': 'rgba(158,174,206,.85)',
  '--color-lit-rgba-160-185-220-0p75': 'rgba(160, 185, 220, 0.75)',
  '--color-lit-rgba-160-185-225-0p65': 'rgba(160, 185, 225, 0.65)',
  '--color-lit-rgba-175-192-216-p52': 'rgba(175,192,216,.52)',
  '--color-lit-rgba-175-192-230-p55': 'rgba(175,192,230,.55)',
  '--color-lit-rgba-175-192-230-p68': 'rgba(175,192,230,.68)',
  '--color-lit-rgba-180-195-220-p50': 'rgba(180,195,220,.50)',
  '--color-lit-rgba-180-195-220-p65': 'rgba(180,195,220,.65)',
  '--color-lit-rgba-180-195-220-p72': 'rgba(180,195,220,.72)',
  '--color-lit-rgba-180-200-230-0p65': 'rgba(180, 200, 230, 0.65)',
  '--color-lit-rgba-180-200-240-p65': 'rgba(180,200,240,.65)',
  '--color-lit-rgba-180-200-240-p68': 'rgba(180,200,240,.68)',
  '--color-lit-rgba-180-64-64-0p12': 'rgba(180, 64, 64, 0.12)',
  '--color-lit-rgba-180-64-64-0p22': 'rgba(180, 64, 64, 0.22)',
  '--color-lit-rgba-185-147-42-0p10': 'rgba(185, 147, 42, 0.10)',
  '--color-lit-rgba-185-147-42-0p22': 'rgba(185, 147, 42, 0.22)',
  '--color-lit-rgba-190-210-242-p82': 'rgba(190,210,242,.82)',
  '--color-lit-rgba-190-210-248-p88': 'rgba(190,210,248,.88)',
  '--color-lit-rgba-195-210-242-p72': 'rgba(195,210,242,.72)',
  '--color-lit-rgba-20-160-60-0p2': 'rgba(20, 160, 60, 0.2)',
  '--color-lit-rgba-20-160-60-p2': 'rgba(20,160,60,.2)',
  '--color-lit-rgba-20-184-166-0p12': 'rgba(20, 184, 166, 0.12)',
  '--color-lit-rgba-200-215-240-p60': 'rgba(200,215,240,.60)',
  '--color-lit-rgba-200-215-240-p70': 'rgba(200,215,240,.70)',
  '--color-lit-rgba-200-220-252-0p85': 'rgba(200, 220, 252, 0.85)',
  '--color-lit-rgba-200-30-30-0p25': 'rgba(200, 30, 30, 0.25)',
  '--color-lit-rgba-200-30-30-p25': 'rgba(200,30,30,.25)',
  '--color-lit-rgba-210-225-248-p92': 'rgba(210,225,248,.92)',
  '--color-lit-rgba-210-225-252-p92': 'rgba(210,225,252,.92)',
  '--color-lit-rgba-210-225-252-p95': 'rgba(210,225,252,.95)',
  '--color-lit-rgba-210-225-252-p98': 'rgba(210,225,252,.98)',
  '--color-lit-rgba-22-23-32-1': 'rgba(22,23,32,1)',
  '--color-lit-rgba-222-236-255-p95': 'rgba(222,236,255,.95)',
  '--color-lit-rgba-239-68-68-0p05': 'rgba(239, 68, 68, 0.05)',
  '--color-lit-rgba-239-68-68-0p12': 'rgba(239, 68, 68, 0.12)',
  '--color-lit-rgba-239-68-68-0p28': 'rgba(239, 68, 68, 0.28)',
  '--color-lit-rgba-239-68-68-0p5': 'rgba(239, 68, 68, 0.5)',
  '--color-lit-rgba-24-25-34-1': 'rgba(24, 25, 34, 1)',
  '--color-lit-rgba-248-113-113-0p12': 'rgba(248, 113, 113, 0.12)',
  '--color-lit-rgba-248-113-113-0p15': 'rgba(248, 113, 113, 0.15)',
  '--color-lit-rgba-248-113-113-0p2': 'rgba(248, 113, 113, 0.2)',
  '--color-lit-rgba-248-113-113-0p25': 'rgba(248, 113, 113, 0.25)',
  '--color-lit-rgba-248-113-113-0p45': 'rgba(248, 113, 113, 0.45)',
  '--color-lit-rgba-248-113-113-0p7': 'rgba(248, 113, 113, 0.7)',
  '--color-lit-rgba-249-115-22-0p025': 'rgba(249, 115, 22, 0.025)',
  '--color-lit-rgba-249-115-22-0p03': 'rgba(249, 115, 22, 0.03)',
  '--color-lit-rgba-249-115-22-0p07': 'rgba(249, 115, 22, 0.07)',
  '--color-lit-rgba-249-115-22-0p1': 'rgba(249, 115, 22, 0.1)',
  '--color-lit-rgba-249-115-22-0p12': 'rgba(249, 115, 22, 0.12)',
  '--color-lit-rgba-249-115-22-0p13': 'rgba(249, 115, 22, 0.13)',
  '--color-lit-rgba-249-115-22-0p17': 'rgba(249, 115, 22, 0.17)',
  '--color-lit-rgba-249-115-22-0p2': 'rgba(249, 115, 22, 0.2)',
  '--color-lit-rgba-249-115-22-0p25': 'rgba(249, 115, 22, 0.25)',
  '--color-lit-rgba-249-115-22-0p4': 'rgba(249, 115, 22, 0.4)',
  '--color-lit-rgba-249-115-22-0p5': 'rgba(249, 115, 22, 0.5)',
  '--color-lit-rgba-252-154-154-1': 'rgba(252,154,154,1)',
  '--color-lit-rgba-253-186-116-0p9': 'rgba(253, 186, 116, 0.9)',
  '--color-lit-rgba-253-186-116-p90': 'rgba(253,186,116,.90)',
  '--color-lit-rgba-255-255-255-0p016': 'rgba(255, 255, 255, 0.016)',
  '--color-lit-rgba-255-255-255-0p02': 'rgba(255, 255, 255, 0.02)',
  '--color-lit-rgba-255-255-255-0p025': 'rgba(255, 255, 255, 0.025)',
  '--color-lit-rgba-255-255-255-0p03': 'rgba(255, 255, 255, 0.03)',
  '--color-lit-rgba-255-255-255-0p038': 'rgba(255, 255, 255, 0.038)',
  '--color-lit-rgba-255-255-255-0p04': 'rgba(255, 255, 255, 0.04)',
  '--color-lit-rgba-255-255-255-0p045': 'rgba(255, 255, 255, 0.045)',
  '--color-lit-rgba-255-255-255-0p046': 'rgba(255, 255, 255, 0.046)',
  '--color-lit-rgba-255-255-255-0p05': 'rgba(255, 255, 255, 0.05)',
  '--color-lit-rgba-255-255-255-0p055': 'rgba(255, 255, 255, 0.055)',
  '--color-lit-rgba-255-255-255-0p06': 'rgba(255, 255, 255, 0.06)',
  '--color-lit-rgba-255-255-255-0p065': 'rgba(255, 255, 255, 0.065)',
  '--color-lit-rgba-255-255-255-0p07': 'rgba(255, 255, 255, 0.07)',
  '--color-lit-rgba-255-255-255-0p075': 'rgba(255, 255, 255, 0.075)',
  '--color-lit-rgba-255-255-255-0p08': 'rgba(255, 255, 255, 0.08)',
  '--color-lit-rgba-255-255-255-0p09': 'rgba(255, 255, 255, 0.09)',
  '--color-lit-rgba-255-255-255-0p1': 'rgba(255, 255, 255, 0.1)',
  '--color-lit-rgba-255-255-255-0p11': 'rgba(255, 255, 255, 0.11)',
  '--color-lit-rgba-255-255-255-0p12': 'rgba(255, 255, 255, 0.12)',
  '--color-lit-rgba-255-255-255-0p13': 'rgba(255, 255, 255, 0.13)',
  '--color-lit-rgba-255-255-255-0p14': 'rgba(255, 255, 255, 0.14)',
  '--color-lit-rgba-255-255-255-0p15': 'rgba(255, 255, 255, 0.15)',
  '--color-lit-rgba-255-255-255-0p16': 'rgba(255, 255, 255, 0.16)',
  '--color-lit-rgba-255-255-255-0p18': 'rgba(255, 255, 255, 0.18)',
  '--color-lit-rgba-255-255-255-0p2': 'rgba(255, 255, 255, 0.2)',
  '--color-lit-rgba-255-255-255-0p22': 'rgba(255, 255, 255, 0.22)',
  '--color-lit-rgba-255-255-255-0p3': 'rgba(255, 255, 255, 0.3)',
  '--color-lit-rgba-255-255-255-0p9': 'rgba(255, 255, 255, 0.9)',
  '--color-lit-rgba-255-255-255-p01': 'rgba(255,255,255,.01)',
  '--color-lit-rgba-255-255-255-p010': 'rgba(255,255,255,.010)',
  '--color-lit-rgba-255-255-255-p012': 'rgba(255,255,255,.012)',
  '--color-lit-rgba-255-255-255-p02': 'rgba(255,255,255,.02)',
  '--color-lit-rgba-255-255-255-p03': 'rgba(255,255,255,.03)',
  '--color-lit-rgba-255-255-255-p04': 'rgba(255,255,255,.04)',
  '--color-lit-rgba-255-255-255-p05': 'rgba(255,255,255,.05)',
  '--color-lit-rgba-255-255-255-p06': 'rgba(255,255,255,.06)',
  '--color-lit-rgba-255-255-255-p07': 'rgba(255,255,255,.07)',
  '--color-lit-rgba-255-255-255-p08': 'rgba(255,255,255,.08)',
  '--color-lit-rgba-255-255-255-p09': 'rgba(255,255,255,.09)',
  '--color-lit-rgba-255-255-255-p11': 'rgba(255,255,255,.11)',
  '--color-lit-rgba-255-255-255-p12': 'rgba(255,255,255,.12)',
  '--color-lit-rgba-255-255-255-p15': 'rgba(255,255,255,.15)',
  '--color-lit-rgba-255-255-255-p18': 'rgba(255,255,255,.18)',
  '--color-lit-rgba-255-255-255-p22': 'rgba(255,255,255,.22)',
  '--color-lit-rgba-255-255-255-p32': 'rgba(255,255,255,.32)',
  '--color-lit-rgba-255-255-255-p40': 'rgba(255,255,255,.40)',
  '--color-lit-rgba-255-255-255-p42': 'rgba(255,255,255,.42)',
  '--color-lit-rgba-255-255-255-p95': 'rgba(255,255,255,.95)',
  '--color-lit-rgba-28-30-40-0p95': 'rgba(28, 30, 40, 0.95)',
  '--color-lit-rgba-30-41-59-p65': 'rgba(30,41,59,.65)',
  '--color-lit-rgba-30-8-8-0p88': 'rgba(30, 8, 8, 0.88)',
  '--color-lit-rgba-30-8-8-p88': 'rgba(30,8,8,.88)',
  '--color-lit-rgba-34-197-94-0p1': 'rgba(34, 197, 94, 0.1)',
  '--color-lit-rgba-34-197-94-0p12': 'rgba(34, 197, 94, 0.12)',
  '--color-lit-rgba-34-197-94-0p24': 'rgba(34, 197, 94, 0.24)',
  '--color-lit-rgba-34-197-94-0p28': 'rgba(34, 197, 94, 0.28)',
  '--color-lit-rgba-34-197-94-0p4': 'rgba(34, 197, 94, 0.4)',
  '--color-lit-rgba-34-197-94-0p7': 'rgba(34, 197, 94, 0.7)',
  '--color-lit-rgba-37-99-235-0p06': 'rgba(37, 99, 235, 0.06)',
  '--color-lit-rgba-37-99-235-0p15': 'rgba(37, 99, 235, 0.15)',
  '--color-lit-rgba-5-24-12-0p88': 'rgba(5, 24, 12, 0.88)',
  '--color-lit-rgba-5-24-12-p88': 'rgba(5,24,12,.88)',
  '--color-lit-rgba-59-130-246-0p06': 'rgba(59, 130, 246, 0.06)',
  '--color-lit-rgba-59-130-246-0p12': 'rgba(59, 130, 246, 0.12)',
  '--color-lit-rgba-59-130-246-0p22': 'rgba(59, 130, 246, 0.22)',
  '--color-lit-rgba-59-130-246-0p35': 'rgba(59, 130, 246, 0.35)',
  '--color-lit-rgba-59-130-246-0p55': 'rgba(59, 130, 246, 0.55)',
  '--color-lit-rgba-59-130-246-0p6': 'rgba(59, 130, 246, 0.6)',
  '--color-lit-rgba-59-130-246-1': 'rgba(59, 130, 246, 1)',
  '--color-lit-rgba-74-120-200-0p10': 'rgba(74, 120, 200, 0.10)',
  '--color-lit-rgba-74-120-200-0p20': 'rgba(74, 120, 200, 0.20)',
  '--color-lit-rgba-8-10-16-0p55': 'rgba(8, 10, 16, 0.55)',
  '--color-lit-rgba-8-9-14-0p88': 'rgba(8, 9, 14, 0.88)',
  '--color-lit-rgba-90-120-165-0p45': 'rgba(90, 120, 165, 0.45)',
  '--color-lit-rgba-96-165-250-0p08': 'rgba(96, 165, 250, 0.08)',
  '--color-lit-rgba-96-165-250-0p15': 'rgba(96, 165, 250, 0.15)',
};
// End generated app.css literal colors.

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
    radarFill:    'rgba(102, 85, 176, 0.16)', // #6655b0 at 16%
  },
  light: {
    gridStroke:   'rgba(15, 23, 42, 0.10)',
    axisTickFill: '#526784',
    radarStroke:  ENTITY_COLORS.cpu,
    radarFill:    'rgba(74, 120, 200, 0.12)', // #4a78c8 at 12%
  },
} as const;

// ── App-wide CSS variable presets (kept in TS for single-source control) ────
export const THEME_VARIABLES = {
  dark: {
    // flat deep-neutral dark palette (minimal redesign)
    '--bg-base':     '#0d0d10',
    '--bg-surface':  '#141418',
    '--bg-raised':   '#1a1a1f',
    '--bg-elevated': '#212128',
    '--sidebar-bg':  '#0f0f13',

    '--border-color':  'rgba(255,255,255,.07)',
    '--border-strong': 'rgba(255,255,255,.11)',
    '--border-accent': 'rgba(255,255,255,.11)',

    '--text-primary':   '#eceff4',
    '--text-secondary': '#afc0d8',
    '--text-muted':     '#6a7e96',
    '--text-on-accent': '#ffffff',

    '--card-bg':       '#141418',
    '--glass-surface': 'rgba(13,13,16,0.84)',
    '--glass-border':  'rgba(255,255,255,.09)',

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
    '--topbar-bg':        '#0f0f13',
    '--modal-overlay-bg': 'rgba(0,0,0,.60)',
    '--modal-bg':         '#141418',
    '--modal-bg-deep':    '#141418',
    '--dropdown-bg':      '#1a1a1f',
    '--panel-bg':         '#141418',
    '--panel-bg-light':   '#1a1a1f',
    '--panel-bg-deep':    '#1a1a1f',
    '--panel-bg-raised':  '#212128',
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
    // flat light surfaces (minimal redesign)
    '--bg-base':     '#f1f2f5',
    '--bg-surface':  '#f7f8fa',
    '--bg-raised':   '#f7f8fa',
    '--bg-elevated': '#edeef2',
    '--sidebar-bg':  '#e9eaee',

    '--border-color':  'rgba(0,0,0,.08)',
    '--border-strong': 'rgba(0,0,0,.13)',
    '--border-accent': 'rgba(0,0,0,.13)',

    '--text-primary':   '#111827',
    '--text-secondary': '#334155',
    '--text-muted':     '#6a7e96',
    '--text-on-accent': '#ffffff',

    '--card-bg':       '#ffffff',
    '--glass-surface': 'rgba(241,242,245,0.88)',
    '--glass-border':  'rgba(0,0,0,.08)',

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
    '--topbar-bg':        '#e9eaee',
    '--modal-overlay-bg': 'rgba(0,0,0,.30)',
    '--modal-bg':         '#f7f8fa',
    '--modal-bg-deep':    '#f7f8fa',
    '--dropdown-bg':      '#ffffff',
    '--panel-bg':         '#f7f8fa',
    '--panel-bg-light':   '#ffffff',
    '--panel-bg-deep':    '#edeef2',
    '--panel-bg-raised':  '#edeef2',
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

// Shadows & elevations — minimal flat design
export const THEME_SHADOWS = {
  dark: {
    '--shadow-sm':   '0 1px 3px rgba(0,0,0,.22)',
    '--shadow-md':   '0 2px 6px rgba(0,0,0,.28)',
    '--shadow-lg':   '0 4px 14px rgba(0,0,0,.35)',
    '--card-shadow': '0 4px 14px rgba(0,0,0,.35)',
    '--card-blur':   'blur(12px)',
  },
  light: {
    '--shadow-sm':   '0 1px 3px rgba(0,0,0,.10)',
    '--shadow-md':   '0 2px 8px rgba(0,0,0,.14)',
    '--shadow-lg':   '0 4px 16px rgba(0,0,0,.18)',
    '--card-shadow': '0 4px 16px rgba(0,0,0,.18)',
    '--card-blur':   'blur(8px)',
  },
} as const;

// Card / surface backgrounds — flat, no gradients
export const THEME_BACKGROUNDS = {
  dark: {
    '--card-bg':         '#141418',
    '--glass-highlight': 'inset 0 1px 0 rgba(255,255,255,.08)',
  },
  light: {
    '--card-bg':         '#ffffff',
    '--glass-highlight': 'inset 0 1px 0 rgba(255,255,255,.65)',
  },
} as const;

/** Apply CSS custom properties for the current theme at runtime. */
export function applyThemeVariables(mode: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const vars = {
    ...GENERATED_COLOR_VARS,
    ...APP_CSS_LITERAL_COLOR_VARS,
    ...THEME_VARIABLES[mode],
    ...THEME_SHADOWS[mode],
    ...THEME_BACKGROUNDS[mode],
  };
  const root = document.documentElement;
  Object.entries(vars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  // Entity and accent palette (kept in sync with app.css custom properties)
  root.style.setProperty('--entity-cpu',     ENTITY_COLORS.cpu);
  root.style.setProperty('--entity-memory',  ENTITY_COLORS.memory);
  root.style.setProperty('--entity-gpu',     ENTITY_COLORS.gpu);
  root.style.setProperty('--entity-disk',    ENTITY_COLORS.disk);
  root.style.setProperty('--entity-network', ENTITY_COLORS.network);
  root.style.setProperty('--entity-neutral', ENTITY_COLORS.neutral);

  // Accent alias vars
  root.style.setProperty('--accent-primary', ENTITY_COLORS.cpu);
  root.style.setProperty('--accent-blue',    ENTITY_COLORS.cpu);
  root.style.setProperty('--accent-cyan',    ENTITY_COLORS.memory);
  root.style.setProperty('--accent-orange',  '#cc7030'); // brand orange — fixed, not tied to GPU
  root.style.setProperty('--accent-purple',  ENTITY_COLORS.disk);
  root.style.setProperty('--accent-green',   ENTITY_COLORS.network);
  root.style.setProperty('--accent-yellow',  ACCENT_COLORS.yellow);
  root.style.setProperty('--accent-red',     ACCENT_COLORS.red);
  root.style.setProperty('--accent-pink',    ACCENT_COLORS.pink);
}

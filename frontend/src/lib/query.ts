export interface TimeRangeOption {
  label: string;
  minutes: number;
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: '15m', minutes: 15 },
  { label: '60m', minutes: 60 },
  { label: '6h', minutes: 360 },
  { label: '24h', minutes: 1440 },
];

const DEFAULT_MINUTES = 60;
const ALLOWED_MINUTES = new Set(TIME_RANGE_OPTIONS.map((option) => option.minutes));

export function parseDashboardMinutes(raw: string | null): number {
  if (!raw) {
    return DEFAULT_MINUTES;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || !ALLOWED_MINUTES.has(parsed)) {
    return DEFAULT_MINUTES;
  }
  return parsed;
}

export function parseServerParam(raw: string | null): string | null {
  const normalized = (raw || '').trim();
  return normalized ? normalized : null;
}

export function withDashboardQuery(
  current: URLSearchParams,
  patch: { server?: string | null; minutes?: number | null; accessDenied?: boolean | null },
): URLSearchParams {
  const next = new URLSearchParams(current);

  if ('server' in patch) {
    if (patch.server) {
      next.set('server', patch.server);
    } else {
      next.delete('server');
    }
  }

  if ('minutes' in patch) {
    if (patch.minutes && ALLOWED_MINUTES.has(patch.minutes)) {
      next.set('minutes', String(patch.minutes));
    } else {
      next.delete('minutes');
    }
  }

  if ('accessDenied' in patch) {
    if (patch.accessDenied) {
      next.set('access_denied', '1');
    } else {
      next.delete('access_denied');
    }
  }

  return next;
}

export function buildNextPath(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

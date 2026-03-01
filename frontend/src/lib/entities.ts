// MetricEntity and ENTITY_COLORS are defined in config/colors.ts (shared with login UI).
export type { MetricEntity } from '../config/colors';
export { ENTITY_COLORS } from '../config/colors';
import type { MetricEntity } from '../config/colors';

export function getBottleneckEntity(label: string | null | undefined): MetricEntity {
  const normalized = (label || '').toLowerCase();

  if (normalized.includes('gpu')) {
    return 'gpu';
  }
  if (normalized.includes('cpu')) {
    return 'cpu';
  }
  if (normalized.includes('memory')) {
    return 'memory';
  }
  if (normalized.includes('disk') || normalized.includes('io')) {
    return 'disk';
  }
  if (normalized.includes('network') || normalized.includes('net')) {
    return 'network';
  }

  return 'neutral';
}

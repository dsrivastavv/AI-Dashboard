export type MetricEntity = 'cpu' | 'memory' | 'gpu' | 'disk' | 'network' | 'neutral';

export const ENTITY_COLORS: Record<MetricEntity, string> = {
  cpu: '#3b82f6',
  memory: '#14b8a6',
  gpu: '#f97316',
  disk: '#8b5cf6',
  network: '#22c55e',
  neutral: '#64748b',
};

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

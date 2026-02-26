import { formatLabel } from '../../lib/format';
import type { MetricSnapshot } from '../../types/api';

interface BottleneckPanelProps {
  bottleneck: MetricSnapshot['bottleneck'];
}

function bottleneckBadgeClass(label: string) {
  if (label.includes('gpu')) {
    return 'text-bg-primary';
  }
  if (label.includes('cpu')) {
    return 'text-bg-warning';
  }
  if (label.includes('io')) {
    return 'text-bg-info';
  }
  if (label.includes('memory')) {
    return 'text-bg-danger';
  }
  if (label.includes('idle') || label.includes('underutilized')) {
    return 'text-bg-secondary';
  }
  return 'text-bg-dark';
}

export default function BottleneckPanel({ bottleneck }: BottleneckPanelProps) {
  const confidencePercent = Math.max(0, Math.min(100, Math.round(bottleneck.confidence * 100)));

  return (
    <div className="card shadow-sm border-0 h-100 panel-card bottleneck-panel">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span className={`badge ${bottleneckBadgeClass(bottleneck.label)} px-3 py-2 rounded-pill`}>
            {bottleneck.title || formatLabel(bottleneck.label)}
          </span>
          <span className="text-body-secondary small fw-semibold">
            Confidence {confidencePercent}%
          </span>
        </div>

        <div className="confidence-track mb-3" aria-hidden="true">
          <div className="confidence-fill" style={{ width: `${confidencePercent}%` }} />
        </div>

        <p className="mb-3 text-body-secondary bottleneck-reason">
          {bottleneck.reason || 'No bottleneck reason provided for this sample.'}
        </p>

        <div className="d-flex flex-wrap gap-2">
          <span className="metric-hint-badge">Heuristic classification</span>
          <span className="metric-hint-badge metric-hint-badge--soft">Triage signal only</span>
        </div>
      </div>
    </div>
  );
}

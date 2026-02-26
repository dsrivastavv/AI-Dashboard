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
  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className={`badge ${bottleneckBadgeClass(bottleneck.label)}`}>
            {bottleneck.title || formatLabel(bottleneck.label)}
          </span>
          <span className="text-body-secondary small">
            Confidence {(bottleneck.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <p className="mb-0 text-body-secondary">
          {bottleneck.reason || 'No bottleneck reason provided for this sample.'}
        </p>
      </div>
    </div>
  );
}

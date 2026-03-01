import type { ReactElement } from 'react';
import {
  AlertTriangle,
  Bot,
  Cpu,
  Gamepad2,
  Globe,
  HardDrive,
  Info,
  Moon,
  Database,
  ScanSearch,
} from 'lucide-react';
import { formatLabel } from '../../lib/format';
import { getBottleneckEntity } from '../../lib/entities';
import type { MetricSnapshot } from '../../types/api';

interface BottleneckPanelProps {
  bottleneck: MetricSnapshot['bottleneck'];
}

function bottleneckIcon(label: string): ReactElement {
  const s = 14;
  if (label.includes('gpu'))     return <Gamepad2 size={s} />;
  if (label.includes('cpu'))     return <Cpu size={s} />;
  if (label.includes('io'))      return <HardDrive size={s} />;
  if (label.includes('memory'))  return <Database size={s} />;
  if (label.includes('network')) return <Globe size={s} />;
  if (label.includes('idle') || label.includes('underutilized')) return <Moon size={s} />;
  return <AlertTriangle size={s} />;
}

export default function BottleneckPanel({ bottleneck }: BottleneckPanelProps) {
  const confidencePercent = Math.max(0, Math.min(100, Math.round(bottleneck.confidence * 100)));
  const icon = bottleneckIcon(bottleneck.label);
  const entity = getBottleneckEntity(bottleneck.label);

  return (
    <div className={`card shadow-sm border-0 h-100 panel-card bottleneck-panel bottleneck-panel--${entity}`}>
      <div className="card-body p-4">
        <h2 className="h6 mb-3 panel-title">
          <span className="panel-title-icon"><ScanSearch size={15} aria-hidden="true" /></span>
          Bottleneck Analysis
        </h2>

        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span className={`chip entity--${entity} entity-chip bottleneck-badge`}>
            <span aria-hidden="true">{icon}</span>
            {bottleneck.title || formatLabel(bottleneck.label)}
          </span>
          <span className="text-body-secondary small fw-semibold">
            {confidencePercent}% confidence
          </span>
        </div>

        <div className="confidence-track mb-3" aria-hidden="true">
          <div className="confidence-fill" style={{ width: `${confidencePercent}%` }} />
        </div>

        <p className="mb-3 bottleneck-reason">
          {bottleneck.reason || 'No bottleneck reason provided for this sample.'}
        </p>

        <div className="d-flex flex-wrap gap-2">
          <span className="metric-hint-badge">
            <Bot size={11} aria-hidden="true" style={{ marginRight: 4 }} />
            Heuristic classification
          </span>
          <span className="metric-hint-badge metric-hint-badge--soft">
            <Info size={11} aria-hidden="true" style={{ marginRight: 4 }} />
            Triage signal only
          </span>
        </div>
      </div>
    </div>
  );
}

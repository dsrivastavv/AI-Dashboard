import type { ReactNode } from 'react';
import {
  ArrowUpFromLine,
  BarChart3,
  Calendar,
  Clock,
  Database,
  HardDrive,
  Layers,
  ScanSearch,
  Target,
  Timer,
} from 'lucide-react';
import {
  formatDateTime,
  formatLabel,
  formatNumber,
  formatPercent,
  formatRelativeSeconds,
  formatThroughput,
} from '../../lib/format';
import { getBottleneckEntity } from '../../lib/entities';
import type { MetricSnapshot } from '../../types/api';

interface SnapshotInsightsPanelProps {
  snapshot: MetricSnapshot;
}

interface InsightRowProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function InsightRow({ icon, label, value }: InsightRowProps) {
  return (
    <div className="snapshot-insight-row">
      <span className="snapshot-insight-label">
        <span className="snapshot-insight-icon" aria-hidden="true">{icon}</span>
        {label}
      </span>
      <span className="snapshot-insight-value">{value}</span>
    </div>
  );
}

export default function SnapshotInsightsPanel({ snapshot }: SnapshotInsightsPanelProps) {
  const confidence = Math.max(0, Math.min(100, Math.round(snapshot.bottleneck.confidence * 100)));
  const bottleneckTitle = snapshot.bottleneck.title || formatLabel(snapshot.bottleneck.label);
  const loadSummary = `${formatNumber(snapshot.cpu.load_1, 2)} / ${formatNumber(snapshot.cpu.load_5, 2)}`;
  const bottleneckEntity = getBottleneckEntity(snapshot.bottleneck.label);

  return (
    <div className="panel-card snapshot-insights-card">
      <div className="panel-head">
        <div>
          <h2 className="panel-title d-flex align-items-center gap-2">
            <ScanSearch size={15} aria-hidden="true" />
            Snapshot Insights
          </h2>
          <span className="panel-caption">Latest sample — operational context</span>
        </div>
        <span className={`chip entity--${bottleneckEntity} entity-chip snapshot-bottleneck-pill`}>
          {bottleneckTitle}
        </span>
      </div>

      <div className="card-body">
        <div className="snapshot-insights-grid">
          <InsightRow icon={<Clock size={13} />}            label="Snapshot age"       value={formatRelativeSeconds(snapshot.age_seconds)} />
          <InsightRow icon={<Calendar size={13} />}         label="Collected at"       value={formatDateTime(snapshot.collected_at)} />
          <InsightRow icon={<Timer size={13} />}            label="Sample interval"
            value={snapshot.interval_seconds == null ? '—' : `${formatNumber(snapshot.interval_seconds)}s`}
          />
          <InsightRow icon={<Layers size={13} />}           label="Processes"          value={String(snapshot.process_count)} />
          <InsightRow icon={<BarChart3 size={13} />}        label="CPU load (1m / 5m)" value={loadSummary} />
          <InsightRow icon={<Database size={13} />}         label="Swap usage"         value={formatPercent(snapshot.memory.swap_percent)} />
          <InsightRow icon={<HardDrive size={13} />}        label="Disk throughput"    value={`${formatThroughput(snapshot.disk.read_bps)} read`} />
          <InsightRow icon={<ArrowUpFromLine size={13} />}  label="Network egress"     value={formatThroughput(snapshot.network.tx_bps)} />
        </div>

        <div className="snapshot-confidence-row">
          <span className="snapshot-confidence-label">
            <Target size={13} aria-hidden="true" style={{ marginRight: 5, verticalAlign: 'middle' }} />
            Bottleneck confidence
          </span>
          <span className="snapshot-confidence-value">{confidence}%</span>
        </div>
      </div>
    </div>
  );
}

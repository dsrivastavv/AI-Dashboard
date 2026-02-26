import {
  formatBytes,
  formatDateTime,
  formatPercent,
  formatRelativeSeconds,
  formatThroughput,
} from '../../lib/format';
import type { MetricSnapshot } from '../../types/api';

interface SummaryCardsProps {
  snapshot: MetricSnapshot;
}

type MetricTone = 'cpu' | 'memory' | 'gpu' | 'disk' | 'network' | 'time';

interface MetricCardProps {
  label: string;
  value: string;
  tone: MetricTone;
  meta?: string;
  hint?: string;
  emphasis?: 'hero' | 'compact';
  gridClass?: string;
}

function MetricCard({
  label,
  value,
  tone,
  meta,
  hint,
  emphasis = 'compact',
  gridClass,
}: MetricCardProps) {
  return (
    <div className={gridClass ?? (emphasis === 'hero' ? 'col-12 col-xl-4' : 'col-12 col-sm-6 col-xl-4 col-xxl-2')}>
      <div className={`metric-card metric-card--${tone} metric-card--${emphasis}`}>
        <div className="metric-card-top">
          <div className="metric-orb" aria-hidden="true" />
          <span className="metric-label">{label}</span>
        </div>
        <div className="metric-value">{value}</div>
        <div className="metric-meta-row">
          <span className="metric-meta">{meta || ' '}</span>
          {hint ? <span className="metric-hint">{hint}</span> : null}
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ snapshot }: SummaryCardsProps) {
  const cpuCountText = snapshot.cpu.count_logical > 0 ? `${snapshot.cpu.count_logical} threads` : undefined;
  const memMeta =
    snapshot.memory.total_bytes > 0
      ? `${formatBytes(snapshot.memory.used_bytes)} used`
      : undefined;
  const gpuMeta = snapshot.gpu.present ? `${snapshot.gpu.count} GPU(s)` : 'No accelerators detected';
  const diskMeta = `${snapshot.disk.avg_util_percent.toFixed(1)}% avg`;
  const networkMeta = `TX ${formatThroughput(snapshot.network.tx_bps)}`;
  const timeMeta = formatDateTime(snapshot.collected_at);

  return (
    <div className="row g-3">
      <MetricCard
        label="CPU Usage"
        value={formatPercent(snapshot.cpu.usage_percent)}
        meta={cpuCountText}
        hint={snapshot.cpu.iowait_percent == null ? undefined : `IOWait ${formatPercent(snapshot.cpu.iowait_percent)}`}
        tone="cpu"
        emphasis="hero"
        gridClass="col-12 col-xxl-4"
      />
      <MetricCard
        label="Memory"
        value={formatPercent(snapshot.memory.percent)}
        meta={memMeta}
        hint={snapshot.memory.swap_percent > 0 ? `Swap ${formatPercent(snapshot.memory.swap_percent)}` : 'Swap idle'}
        tone="memory"
        gridClass="col-12 col-sm-6 col-lg-4 col-xxl-2"
      />
      <MetricCard
        label="Top GPU Util"
        value={snapshot.gpu.present ? formatPercent(snapshot.gpu.top_util_percent) : 'No GPU'}
        meta={gpuMeta}
        hint={
          snapshot.gpu.present && snapshot.gpu.top_memory_percent != null
            ? `Mem ${formatPercent(snapshot.gpu.top_memory_percent)}`
            : undefined
        }
        tone="gpu"
        gridClass="col-12 col-sm-6 col-lg-4 col-xxl-2"
      />
      <MetricCard
        label="Disk Util"
        value={formatPercent(snapshot.disk.util_percent)}
        meta={diskMeta}
        hint={`Read ${formatThroughput(snapshot.disk.read_bps)}`}
        tone="disk"
        gridClass="col-12 col-sm-6 col-lg-4 col-xxl-2"
      />
      <MetricCard
        label="Network RX"
        value={formatThroughput(snapshot.network.rx_bps)}
        meta={networkMeta}
        hint={`Processes ${snapshot.process_count}`}
        tone="network"
        gridClass="col-12 col-md-6 col-xxl-3"
      />
      <MetricCard
        label="Snapshot Age"
        value={formatRelativeSeconds(snapshot.age_seconds)}
        meta={timeMeta}
        hint={snapshot.interval_seconds == null ? undefined : `Interval ${snapshot.interval_seconds.toFixed(1)}s`}
        tone="time"
        gridClass="col-12 col-md-6 col-xxl-3"
      />
    </div>
  );
}

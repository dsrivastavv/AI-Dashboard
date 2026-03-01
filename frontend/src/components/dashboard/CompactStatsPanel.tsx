import type { CSSProperties } from 'react';

import { formatNumber, formatPercent, formatThroughput } from '../../lib/format';
import type { MetricSnapshot } from '../../types/api';

interface CompactStatsPanelProps {
  snapshot: MetricSnapshot;
}

interface RingCardProps {
  label: string;
  valueLabel: string;
  subLabel: string;
  percent: number;
  tone: 'blue' | 'violet' | 'mint';
}

function ringStyle(percent: number): CSSProperties {
  return {
    ['--ring-percent' as string]: `${Math.max(0, Math.min(100, percent))}%`,
  } as CSSProperties;
}

function RingCard({ label, valueLabel, subLabel, percent, tone }: RingCardProps) {
  return (
    <div className={`compact-stat-card compact-stat-card--${tone}`}>
      <div className="compact-stat-copy">
        <div className="compact-stat-label">{label}</div>
        <div className="compact-stat-sub">{subLabel}</div>
      </div>
      <div className="compact-stat-right">
        <div className="compact-ring" style={ringStyle(percent)} aria-hidden="true">
          <div className="compact-ring-inner" />
        </div>
        <div className="compact-stat-value">{valueLabel}</div>
      </div>
    </div>
  );
}

export default function CompactStatsPanel({ snapshot }: CompactStatsPanelProps) {
  const cpu = Math.max(0, Math.min(100, snapshot.cpu.usage_percent));
  const memory = Math.max(0, Math.min(100, snapshot.memory.percent));
  const disk = Math.max(0, Math.min(100, snapshot.disk.util_percent));
  const avgGpu = Math.max(0, Math.min(100, snapshot.gpu.avg_util_percent ?? snapshot.gpu.top_util_percent ?? 0));

  return (
    <div className="compact-stats-stack">
      <div className="panel-card compact-stats-panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">Statistics</h2>
            <span className="panel-caption">Current resource readings</span>
          </div>
        </div>
        <div className="card-body d-flex flex-column gap-3">

          <RingCard
            label="CPU Load"
            subLabel={`IOWait ${formatPercent(snapshot.cpu.iowait_percent)}`}
            valueLabel={formatPercent(cpu)}
            percent={cpu}
            tone="blue"
          />
          <RingCard
            label="Memory Pressure"
            subLabel={`Swap ${formatPercent(snapshot.memory.swap_percent)}`}
            valueLabel={formatPercent(memory)}
            percent={memory}
            tone="violet"
          />
          <RingCard
            label="Disk Activity"
            subLabel={`Avg ${formatPercent(snapshot.disk.avg_util_percent)}`}
            valueLabel={formatPercent(disk)}
            percent={disk}
            tone="mint"
          />

          <div className="compact-bottom-metric">
            <div>
              <div className="compact-bottom-label">Network Throughput</div>
              <div className="compact-bottom-sub">RX/TX combined live rate</div>
            </div>
            <div className="compact-bottom-value">{formatThroughput(snapshot.network.rx_bps + snapshot.network.tx_bps)}</div>
            <div className="compact-bottom-chip">GPU avg {formatNumber(avgGpu)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

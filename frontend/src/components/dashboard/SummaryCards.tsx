import type { ReactNode } from 'react';
import { Cpu, Database, Globe, HardDrive } from 'lucide-react';
import {
  formatBytes,
  formatNumber,
  formatPercent,
  formatThroughput,
} from '../../lib/format';
import type { MetricSnapshot } from '../../types/api';

interface SummaryCardsProps {
  snapshot: MetricSnapshot;
}

type MetricTone = 'cpu' | 'memory' | 'gpu' | 'disk' | 'network';

interface MetricCardProps {
  label: ReactNode;
  value: string;
  tone: MetricTone;
  meta?: string;
  hint?: ReactNode;
  barPercent?: number;
}

function MetricCard({ label, value, tone, meta, hint, barPercent }: MetricCardProps) {
  return (
    <div className={`metric-card metric-card--${tone}`}>
      <span className="metric-label">{label}</span>
      <div className="metric-value">{value}</div>
      {barPercent !== undefined ? (
        <div className="metric-bar" aria-hidden="true">
          <div
            className="metric-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, barPercent))}%` }}
          />
        </div>
      ) : null}
      <div className="metric-meta-row">
        <span className="metric-meta">{meta ?? ' '}</span>
        {hint ? <span className="metric-hint">{hint}</span> : null}
      </div>
    </div>
  );
}

export default function SummaryCards({ snapshot }: SummaryCardsProps) {
  const gpuTemps = snapshot.gpu.devices
    .map((device) => device.temperature_c)
    .filter((value): value is number => value != null && Number.isFinite(value));
  const topGpuTemp = gpuTemps.length ? Math.max(...gpuTemps) : null;
  const gpuMemoryPercent = snapshot.gpu.top_memory_percent;

  const cpuCountText = snapshot.cpu.count_logical > 0
    ? `${snapshot.cpu.count_logical} threads`
    : undefined;
  const cpuLoadMeta = `Load ${formatNumber(snapshot.cpu.load_1, 2)}`;
  const cpuTempHint = 'Temp -';
  const memoryMeta = `${formatBytes(snapshot.memory.used_bytes)} / ${formatBytes(snapshot.memory.total_bytes)}`;
  const networkValue = formatThroughput(snapshot.network.rx_bps + snapshot.network.tx_bps);
  const networkMeta = `↓ ${formatThroughput(snapshot.network.rx_bps)}`;
  const diskMeta = `Read ${formatThroughput(snapshot.disk.read_bps)}`;
  const gpuValue = snapshot.gpu.present ? formatPercent(gpuMemoryPercent) : 'No GPU';
  const gpuMeta = topGpuTemp == null ? 'Temp -' : `Temp ${formatNumber(topGpuTemp)} C`;
  const gpuHint = snapshot.gpu.present ? `${snapshot.gpu.count} GPU(s)` : 'No accelerators';

  return (
    <div className="metrics-grid">
      <MetricCard
        label={<><Cpu size={12} aria-hidden="true" /> CPU Usage</>}
        value={formatPercent(snapshot.cpu.usage_percent)}
        meta={cpuLoadMeta}
        hint={`${cpuTempHint}${cpuCountText ? ` | ${cpuCountText}` : ''}`}
        tone="cpu"
        barPercent={snapshot.cpu.usage_percent}
      />
      <MetricCard
        label={<><Database size={12} aria-hidden="true" /> Memory</>}
        value={formatPercent(snapshot.memory.percent)}
        meta={memoryMeta}
        hint={snapshot.memory.swap_percent > 0
          ? `Swap ${formatPercent(snapshot.memory.swap_percent)}`
          : 'Swap idle'}
        tone="memory"
        barPercent={snapshot.memory.percent}
      />
      <MetricCard
        label={<><HardDrive size={12} aria-hidden="true" /> Disk Util</>}
        value={formatPercent(snapshot.disk.util_percent)}
        meta={diskMeta}
        hint={`↓ ${formatThroughput(snapshot.disk.write_bps)} write`}
        tone="disk"
        barPercent={snapshot.disk.util_percent}
      />
      <MetricCard
        label={<><Globe size={12} aria-hidden="true" /> Network</>}
        value={networkValue}
        meta={networkMeta}
        hint={`↑ ${formatThroughput(snapshot.network.tx_bps)}`}
        tone="network"
      />
      <MetricCard
        label={<><Database size={12} aria-hidden="true" /> GPU Memory</>}
        value={gpuValue}
        meta={gpuMeta}
        hint={gpuHint}
        tone="gpu"
        barPercent={snapshot.gpu.present && gpuMemoryPercent != null ? gpuMemoryPercent : undefined}
      />
    </div>
  );
}

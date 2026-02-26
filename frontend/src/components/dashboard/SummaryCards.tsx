import { formatDateTime, formatPercent, formatRelativeSeconds, formatThroughput } from '../../lib/format';
import type { MetricSnapshot } from '../../types/api';

interface SummaryCardsProps {
  snapshot: MetricSnapshot;
}

function SummaryCard({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <div className="col-12 col-sm-6 col-xl-4">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body">
          <p className="text-body-secondary small mb-2">{label}</p>
          <div className="d-flex align-items-baseline justify-content-between gap-2">
            <p className="h4 mb-0">{value}</p>
            {meta ? <span className="small text-body-secondary">{meta}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ snapshot }: SummaryCardsProps) {
  const networkValue = `RX ${formatThroughput(snapshot.network.rx_bps)} / TX ${formatThroughput(snapshot.network.tx_bps)}`;

  return (
    <div className="row g-3">
      <SummaryCard label="CPU Usage" value={formatPercent(snapshot.cpu.usage_percent)} />
      <SummaryCard label="Memory" value={formatPercent(snapshot.memory.percent)} />
      <SummaryCard
        label="Top GPU Util"
        value={snapshot.gpu.present ? formatPercent(snapshot.gpu.top_util_percent) : 'No GPU'}
        meta={snapshot.gpu.present ? `${snapshot.gpu.count} GPU(s)` : undefined}
      />
      <SummaryCard label="Disk Util" value={formatPercent(snapshot.disk.util_percent)} />
      <SummaryCard label="Network" value={networkValue} />
      <SummaryCard
        label="Snapshot Age"
        value={formatRelativeSeconds(snapshot.age_seconds)}
        meta={formatDateTime(snapshot.collected_at)}
      />
    </div>
  );
}

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatPercent, formatThroughput } from '../../lib/format';
import type { HistoryPoint } from '../../types/api';
import EmptyState from '../common/EmptyState';

interface HistoryChartsProps {
  points: HistoryPoint[];
}

function timeTick(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function tooltipLabel(label: string) {
  const date = new Date(label);
  if (Number.isNaN(date.getTime())) {
    return label;
  }
  return date.toLocaleString();
}

export default function HistoryCharts({ points }: HistoryChartsProps) {
  if (points.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        message="No time-series points are available for the selected window."
      />
    );
  }

  const hasGpuSeries = points.some((point) => point.gpu_top_util_percent !== null && point.gpu_top_util_percent !== undefined);

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h6 mb-0">Utilization Trends</h2>
            <span className="small text-body-secondary">CPU / Memory / GPU</span>
          </div>
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="collected_at" tickFormatter={timeTick} minTickGap={20} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  labelFormatter={(label) => tooltipLabel(String(label))}
                  formatter={(value: unknown, name: unknown) => [formatPercent(Number(value)), String(name)]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cpu_usage_percent"
                  name="CPU %"
                  stroke="#0d6efd"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="memory_percent"
                  name="Memory %"
                  stroke="#198754"
                  dot={false}
                  strokeWidth={2}
                />
                {hasGpuSeries ? (
                  <Line
                    type="monotone"
                    dataKey="gpu_top_util_percent"
                    name="Top GPU %"
                    stroke="#fd7e14"
                    dot={false}
                    strokeWidth={2}
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h6 mb-0">IO and Network</h2>
            <span className="small text-body-secondary">Disk util + network throughput</span>
          </div>
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="collected_at" tickFormatter={timeTick} minTickGap={20} />
                <YAxis
                  yAxisId="throughput"
                  tickFormatter={(value) => formatThroughput(Number(value))}
                  width={90}
                />
                <YAxis
                  yAxisId="percent"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  labelFormatter={(label) => tooltipLabel(String(label))}
                  formatter={(value: unknown, name: unknown) => {
                    const numericValue = Number(value);
                    const seriesName = String(name);
                    if (seriesName.includes('%')) {
                      return [formatPercent(numericValue), seriesName];
                    }
                    return [formatThroughput(numericValue), seriesName];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="throughput"
                  type="monotone"
                  dataKey="network_rx_bps"
                  name="Net RX"
                  stroke="#6f42c1"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="throughput"
                  type="monotone"
                  dataKey="network_tx_bps"
                  name="Net TX"
                  stroke="#20c997"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="percent"
                  type="monotone"
                  dataKey="disk_util_percent"
                  name="Disk Util %"
                  stroke="#dc3545"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

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
import type { DashboardThemeMode } from './DashboardSidebar';

interface HistoryChartsProps {
  points: HistoryPoint[];
  themeMode?: DashboardThemeMode;
  variant?: 'full' | 'overview';
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

export default function HistoryCharts({
  points,
  themeMode = 'light',
  variant = 'full',
}: HistoryChartsProps) {
  if (points.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        message="No time-series points are available for the selected window."
      />
    );
  }

  const hasGpuSeries = points.some(
    (point) => point.gpu_top_util_percent !== null && point.gpu_top_util_percent !== undefined,
  );
  const gridStroke = themeMode === 'dark' ? 'rgba(230, 237, 255, 0.11)' : 'rgba(0, 0, 0, 0.08)';
  const axisStroke = themeMode === 'dark' ? 'rgba(230, 237, 255, 0.18)' : 'rgba(0, 0, 0, 0.14)';

  const utilizationChart = (
    <div className="card shadow-sm border-0 panel-card chart-panel chart-panel-overview">
      <div className="card-body">
        <div className="panel-head d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="h6 mb-1 panel-title">System Overview</h2>
            <span className="small panel-caption">CPU / Memory / GPU trends</span>
          </div>
          <div className="chart-panel-pills">
            <span className="chart-pill">Today</span>
            <span className="chart-pill chart-pill-active">Live</span>
          </div>
        </div>
        <div className="chart-frame chart-frame-large">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="collected_at" tickFormatter={timeTick} minTickGap={20} stroke={axisStroke} />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} stroke={axisStroke} />
              <Tooltip
                labelFormatter={(label) => tooltipLabel(String(label))}
                formatter={(value: unknown, name: unknown) => [formatPercent(Number(value)), String(name)]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cpu_usage_percent"
                name="CPU %"
                stroke="#6f7cff"
                dot={false}
                strokeWidth={2.5}
              />
              <Line
                type="monotone"
                dataKey="memory_percent"
                name="Memory %"
                stroke="#56d4ff"
                dot={false}
                strokeWidth={2.2}
              />
              {hasGpuSeries ? (
                <Line
                  type="monotone"
                  dataKey="gpu_top_util_percent"
                  name="Top GPU %"
                  stroke="#8cffbe"
                  dot={false}
                  strokeWidth={2.2}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  if (variant === 'overview') {
    return utilizationChart;
  }

  return (
    <div className="d-flex flex-column gap-3">
      {utilizationChart}

      <div className="card shadow-sm border-0 panel-card chart-panel">
        <div className="card-body">
          <div className="panel-head d-flex justify-content-between align-items-center mb-3">
            <h2 className="h6 mb-0 panel-title">IO and Network</h2>
            <span className="small panel-caption">Disk util + network throughput</span>
          </div>
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="collected_at" tickFormatter={timeTick} minTickGap={20} stroke={axisStroke} />
                <YAxis
                  yAxisId="throughput"
                  tickFormatter={(value) => formatThroughput(Number(value))}
                  width={90}
                  stroke={axisStroke}
                />
                <YAxis
                  yAxisId="percent"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  stroke={axisStroke}
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
                  stroke="#56d4ff"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="throughput"
                  type="monotone"
                  dataKey="network_tx_bps"
                  name="Net TX"
                  stroke="#8cffbe"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="percent"
                  type="monotone"
                  dataKey="disk_util_percent"
                  name="Disk Util %"
                  stroke="#ff7db7"
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

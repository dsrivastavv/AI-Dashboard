import { useMemo } from 'react';
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
import { Activity, TrendingUp } from 'lucide-react';

import { ENTITY_COLORS } from '../../lib/entities';
import { formatPercent, formatThroughput } from '../../lib/format';
import type { HistoryPoint } from '../../types/api';
import EmptyState from '../common/EmptyState';
import type { DashboardThemeMode } from './DashboardSidebar';
import TimeRangeSelector from './TimeRangeSelector';

interface HistoryChartsProps {
  points: HistoryPoint[];
  systemMinutes: number;
  ioMinutes: number;
  onSystemMinutesChange: (minutes: number) => void;
  onIoMinutesChange: (minutes: number) => void;
  themeMode?: DashboardThemeMode;
  variant?: 'full' | 'overview';
  disabled?: boolean;
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

function filterPointsByMinutes(points: HistoryPoint[], minutes: number): HistoryPoint[] {
  const cutoff = Date.now() - minutes * 60 * 1000;
  return points.filter((point) => {
    const timestamp = new Date(point.collected_at).getTime();
    if (Number.isNaN(timestamp)) {
      return true;
    }
    return timestamp >= cutoff;
  });
}

export default function HistoryCharts({
  points,
  systemMinutes,
  ioMinutes,
  onSystemMinutesChange,
  onIoMinutesChange,
  themeMode = 'dark',
  variant = 'full',
  disabled = false,
}: HistoryChartsProps) {
  if (points.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        message="No time-series points are available for the selected window."
      />
    );
  }

  const isDark = themeMode === 'dark';
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const axisStroke = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
  const axisColor = isDark ? 'rgba(150, 170, 200, 0.6)' : 'rgba(80, 100, 130, 0.7)';
  const systemPoints = useMemo(
    () => filterPointsByMinutes(points, systemMinutes),
    [points, systemMinutes],
  );
  const ioPoints = useMemo(
    () => filterPointsByMinutes(points, ioMinutes),
    [points, ioMinutes],
  );
  const hasGpuSeries = systemPoints.some(
    (point) => point.gpu_top_util_percent !== null && point.gpu_top_util_percent !== undefined,
  );

  const utilizationChart = (
    <div className="chart-panel chart-panel--system">
      <div className="panel-head">
        <div>
          <h2 className="panel-title d-flex align-items-center gap-2">
            <TrendingUp size={15} aria-hidden="true" style={{ color: ENTITY_COLORS.cpu, flexShrink: 0 }} />
            System Trends
          </h2>
          <span className="panel-caption">CPU, memory &amp; GPU utilization over time</span>
        </div>
        <TimeRangeSelector
          value={systemMinutes}
          onChange={onSystemMinutesChange}
          disabled={disabled}
          label={null}
          compact
          className="chart-range-control"
        />
      </div>
      <div className="card-body">
        <div className="chart-frame-large">
          {systemPoints.length === 0 ? (
            <div className="chart-empty-state">No samples for this time window.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={systemPoints} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  dataKey="collected_at"
                  tickFormatter={timeTick}
                  minTickGap={28}
                  stroke={axisStroke}
                  tick={{ fill: axisColor, fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  stroke={axisStroke}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  width={38}
                />
                <Tooltip
                  labelFormatter={(label) => tooltipLabel(String(label))}
                  formatter={(value: unknown, name: unknown) => [formatPercent(Number(value)), String(name)]}
                  contentStyle={{
                    background: isDark ? '#1c2a42' : '#fff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: isDark ? '#e0e8f4' : '#1a2438',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="cpu_usage_percent"
                  name="CPU %"
                  stroke={ENTITY_COLORS.cpu}
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="memory_percent"
                  name="Memory %"
                  stroke={ENTITY_COLORS.memory}
                  dot={false}
                  strokeWidth={2}
                />
                {hasGpuSeries ? (
                  <Line
                    type="monotone"
                    dataKey="gpu_top_util_percent"
                    name="Top GPU %"
                    stroke={ENTITY_COLORS.gpu}
                    dot={false}
                    strokeWidth={2}
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === 'overview') {
    return utilizationChart;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {utilizationChart}

      <div className="chart-panel chart-panel--io">
        <div className="panel-head">
          <div>
            <h2 className="panel-title d-flex align-items-center gap-2">
              <Activity size={15} aria-hidden="true" style={{ color: ENTITY_COLORS.network, flexShrink: 0 }} />
              IO &amp; Network
            </h2>
            <span className="panel-caption">Disk utilization and network throughput</span>
          </div>
          <TimeRangeSelector
            value={ioMinutes}
            onChange={onIoMinutesChange}
            disabled={disabled}
            label={null}
            compact
            className="chart-range-control"
          />
        </div>
        <div className="card-body">
          <div className="chart-frame">
            {ioPoints.length === 0 ? (
              <div className="chart-empty-state">No samples for this time window.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ioPoints} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    dataKey="collected_at"
                    tickFormatter={timeTick}
                    minTickGap={28}
                    stroke={axisStroke}
                    tick={{ fill: axisColor, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="throughput"
                    tickFormatter={(value) => formatThroughput(Number(value))}
                    width={72}
                    stroke={axisStroke}
                    tick={{ fill: axisColor, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="percent"
                    orientation="right"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    stroke={axisStroke}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    width={38}
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
                    contentStyle={{
                      background: isDark ? '#1c2a42' : '#fff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: isDark ? '#e0e8f4' : '#1a2438',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line
                    yAxisId="throughput"
                    type="monotone"
                    dataKey="network_rx_bps"
                    name="Net RX"
                    stroke={ENTITY_COLORS.network}
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="throughput"
                    type="monotone"
                    dataKey="network_tx_bps"
                    name="Net TX"
                    stroke={ENTITY_COLORS.network}
                    dot={false}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                  />
                  <Line
                    yAxisId="percent"
                    type="monotone"
                    dataKey="disk_util_percent"
                    name="Disk Util %"
                    stroke={ENTITY_COLORS.disk}
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

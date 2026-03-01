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
import { CHART_COLORS } from '../../config/colors';
import { formatPercent, formatThroughput } from '../../lib/format';
import type { HistoryPoint } from '../../types/api';
import EmptyState from '../common/EmptyState';
import type { DashboardThemeMode } from './DashboardSidebar';
import TimeRangeSelector from './TimeRangeSelector';

const LINE_UPDATE_ANIMATION_DURATION_MS = 600;

type ChartPoint = HistoryPoint & { collected_at_ms: number };

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

function timeTick(value: number | string) {
  const timestamp = typeof value === 'number' ? value : new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return String(value);
  }

  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function tooltipLabel(value: number | string) {
  const timestamp = typeof value === 'number' ? value : new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return String(value);
  }

  return new Date(timestamp).toLocaleString();
}

function normalizePoints(points: HistoryPoint[]): ChartPoint[] {
  const normalized = points
    .map((point) => {
      const timestamp = new Date(point.collected_at).getTime();
      if (Number.isNaN(timestamp)) {
        return null;
      }

      return {
        ...point,
        collected_at_ms: timestamp,
      };
    })
    .filter((point): point is ChartPoint => point !== null);

  normalized.sort((left, right) => left.collected_at_ms - right.collected_at_ms);
  return normalized;
}

function filterPointsByMinutes(points: ChartPoint[], minutes: number, windowEnd: number): ChartPoint[] {
  const windowStart = windowEnd - minutes * 60 * 1000;
  return points.filter(
    (point) => point.collected_at_ms >= windowStart && point.collected_at_ms <= windowEnd,
  );
}

const animatedLineProps = {
  type: 'monotone' as const,
  dot: false,
  strokeWidth: 2,
  // Disable per-update line drawing; domain shift gives the leftward motion without replaying animations
  isAnimationActive: false,
  animateNewValues: false,
  animationBegin: 0,
  animationDuration: LINE_UPDATE_ANIMATION_DURATION_MS,
  animationEasing: 'linear' as const,
};

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
  const normalizedPoints = useMemo(() => normalizePoints(points), [points]);
  const historyWindowEndMs = useMemo(
    () =>
      Math.max(
        Date.now(),
        normalizedPoints.length > 0 ? normalizedPoints[normalizedPoints.length - 1].collected_at_ms : 0,
      ),
    [normalizedPoints],
  );

  if (normalizedPoints.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        message="No time-series points are available for the selected window."
      />
    );
  }

  const isDark = themeMode === 'dark';
  const { gridStroke, axisStroke, axisColor } = CHART_COLORS[isDark ? 'dark' : 'light'];
  const systemWindowStartMs = historyWindowEndMs - systemMinutes * 60 * 1000;
  const ioWindowStartMs = historyWindowEndMs - ioMinutes * 60 * 1000;
  const systemPoints = useMemo(
    () => filterPointsByMinutes(normalizedPoints, systemMinutes, historyWindowEndMs),
    [normalizedPoints, systemMinutes, historyWindowEndMs],
  );
  const ioPoints = useMemo(
    () => filterPointsByMinutes(normalizedPoints, ioMinutes, historyWindowEndMs),
    [normalizedPoints, ioMinutes, historyWindowEndMs],
  );
  const systemPercentMax = useMemo(() => {
    const values: number[] = [];
    systemPoints.forEach((point) => {
      if (point.cpu_usage_percent != null) values.push(point.cpu_usage_percent);
      if (point.memory_percent != null) values.push(point.memory_percent);
      if (point.gpu_top_util_percent != null) values.push(point.gpu_top_util_percent);
    });
    const maxValue = values.length ? Math.max(...values) : 0;
    const padded = maxValue * 1.08 + 3; // small buffer above observed max
    return Math.min(100, Math.max(10, Math.ceil(padded / 5) * 5));
  }, [systemPoints]);
  const ioPercentMax = useMemo(() => {
    const values: number[] = [];
    ioPoints.forEach((point) => {
      if (point.disk_util_percent != null) values.push(point.disk_util_percent);
    });
    const maxValue = values.length ? Math.max(...values) : 0;
    const padded = maxValue * 1.08 + 3;
    return Math.min(100, Math.max(10, Math.ceil(padded / 5) * 5));
  }, [ioPoints]);
  const ioThroughputMax = useMemo(() => {
    const values: number[] = [];
    ioPoints.forEach((point) => {
      if (point.network_rx_bps != null) values.push(point.network_rx_bps);
      if (point.network_tx_bps != null) values.push(point.network_tx_bps);
    });
    const maxValue = values.length ? Math.max(...values) : 0;
    const padded = maxValue * 1.12 + 10;
    return Math.max(1, Math.ceil(padded));
  }, [ioPoints]);
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
                  type="number"
                  scale="time"
                  domain={[systemWindowStartMs, historyWindowEndMs]}
                  dataKey="collected_at_ms"
                  tickFormatter={timeTick}
                  minTickGap={28}
                  stroke={axisStroke}
                  tick={{ fill: axisColor, fontSize: 11 }}
                />
                <YAxis
                  domain={[0, systemPercentMax]}
                  tickFormatter={(value) => `${value}%`}
                  stroke={axisStroke}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  width={38}
                />
                <Tooltip
                  labelFormatter={(label) => tooltipLabel(label as number | string)}
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
                  {...animatedLineProps}
                  dataKey="cpu_usage_percent"
                  name="CPU %"
                  stroke={ENTITY_COLORS.cpu}
                />
                <Line
                  {...animatedLineProps}
                  dataKey="memory_percent"
                  name="Memory %"
                  stroke={ENTITY_COLORS.memory}
                />
                {hasGpuSeries ? (
                  <Line
                    {...animatedLineProps}
                    dataKey="gpu_top_util_percent"
                    name="Top GPU %"
                    stroke={ENTITY_COLORS.gpu}
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
                    type="number"
                    scale="time"
                    domain={[ioWindowStartMs, historyWindowEndMs]}
                    dataKey="collected_at_ms"
                    tickFormatter={timeTick}
                    minTickGap={28}
                    stroke={axisStroke}
                    tick={{ fill: axisColor, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="throughput"
                    domain={[0, ioThroughputMax]}
                    tickFormatter={(value) => formatThroughput(Number(value))}
                    width={72}
                    stroke={axisStroke}
                    tick={{ fill: axisColor, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="percent"
                    orientation="right"
                    domain={[0, ioPercentMax]}
                    tickFormatter={(value) => `${value}%`}
                    stroke={axisStroke}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    width={38}
                  />
                  <Tooltip
                    labelFormatter={(label) => tooltipLabel(label as number | string)}
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
                    {...animatedLineProps}
                    yAxisId="throughput"
                    dataKey="network_rx_bps"
                    name="Net RX"
                    stroke={ENTITY_COLORS.network}
                  />
                  <Line
                    {...animatedLineProps}
                    yAxisId="throughput"
                    dataKey="network_tx_bps"
                    name="Net TX"
                    stroke={ENTITY_COLORS.network}
                    strokeDasharray="5 4"
                  />
                  <Line
                    {...animatedLineProps}
                    yAxisId="percent"
                    dataKey="disk_util_percent"
                    name="Disk Util %"
                    stroke={ENTITY_COLORS.disk}
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

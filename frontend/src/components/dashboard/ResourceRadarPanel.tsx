import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

import type { HistoryPoint, MetricSnapshot } from '../../types/api';
import type { DashboardThemeMode } from './DashboardSidebar';

interface ResourceRadarPanelProps {
  snapshot: MetricSnapshot;
  historyPoints: HistoryPoint[];
  themeMode?: DashboardThemeMode;
}

function clampPercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

export default function ResourceRadarPanel({
  snapshot,
  historyPoints,
  themeMode = 'dark',
}: ResourceRadarPanelProps) {
  const maxObservedNetwork = Math.max(
    1,
    ...historyPoints.map((point) => point.network_rx_bps + point.network_tx_bps),
  );
  const currentNetwork = Math.max(0, snapshot.network.rx_bps + snapshot.network.tx_bps);
  const networkPercent = Math.max(0, Math.min(100, (currentNetwork / maxObservedNetwork) * 100));

  const radarData = [
    { label: 'CPU', value: clampPercent(snapshot.cpu.usage_percent) },
    { label: 'RAM', value: clampPercent(snapshot.memory.percent) },
    { label: 'GPU', value: clampPercent(snapshot.gpu.top_util_percent) },
    { label: 'DISK', value: clampPercent(snapshot.disk.util_percent) },
    { label: 'NET', value: networkPercent },
  ];

  const gridStroke = themeMode === 'dark' ? 'rgba(214, 226, 255, 0.14)' : 'rgba(15, 26, 54, 0.12)';
  const axisTickFill = themeMode === 'dark' ? '#b9c8e6' : '#5c7293';
  const radarStroke = themeMode === 'dark' ? '#7a84ff' : '#4252ff';
  const radarFill = themeMode === 'dark' ? 'rgba(122, 132, 255, 0.22)' : 'rgba(66, 82, 255, 0.18)';

  return (
    <div className="card shadow-sm border-0 panel-card radar-panel h-100">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h2 className="h6 mb-1 panel-title">Resource Profile</h2>
            <div className="small panel-caption">Current utilization signature</div>
          </div>
          <button type="button" className="btn btn-sm radar-panel-menu" aria-label="Panel menu">
            ...
          </button>
        </div>

        <div className="radar-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke={gridStroke} />
              <PolarAngleAxis dataKey="label" tick={{ fill: axisTickFill, fontSize: 12 }} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={false}
                axisLine={false}
                stroke={gridStroke}
              />
              <Radar
                name="Profile"
                dataKey="value"
                stroke={radarStroke}
                fill={radarFill}
                fillOpacity={1}
                strokeWidth={2.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="radar-legend-grid">
          {radarData.map((item) => (
            <div key={item.label} className="radar-legend-item">
              <span className="radar-legend-key">{item.label}</span>
              <span className="radar-legend-value">{Math.round(item.value)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

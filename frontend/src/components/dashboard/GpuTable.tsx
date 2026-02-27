import { Database, Plug, Thermometer, Zap } from 'lucide-react';
import { formatBytes, formatNumber, formatPercent } from '../../lib/format';
import type { GpuDeviceMetric } from '../../types/api';
import EmptyState from '../common/EmptyState';

interface GpuTableProps {
  gpus: GpuDeviceMetric[];
}

function utilColor(percent: number | null | undefined): string {
  if (percent == null) return '';
  if (percent >= 90) return 'util-critical';
  if (percent >= 70) return 'util-warn';
  return 'util-ok';
}

function tempColor(c: number | null | undefined): string {
  if (c == null) return '';
  if (c >= 85) return 'util-critical';
  if (c >= 70) return 'util-warn';
  return '';
}

export default function GpuTable({ gpus }: GpuTableProps) {
  if (gpus.length === 0) {
    return (
      <EmptyState title="No GPU metrics" message="The selected server did not report GPU device metrics." />
    );
  }

  return (
    <div className="card shadow-sm border-0 h-100 panel-card table-panel entity-panel entity-panel--gpu">
      <div className="card-body p-0">
        <div className="p-3 border-bottom table-panel-head">
          <h2 className="h6 mb-0 panel-title d-flex align-items-center gap-2">
            <span className="entity-dot entity-dot--gpu" aria-hidden="true" />
            GPU Devices
          </h2>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0 dashboard-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">
                  <span className="th-icon-label">
                    <Zap size={12} aria-hidden="true" /> Util
                  </span>
                </th>
                <th scope="col">
                  <span className="th-icon-label">
                    <Database size={12} aria-hidden="true" /> Mem
                  </span>
                </th>
                <th scope="col">
                  <span className="th-icon-label">
                    <Thermometer size={12} aria-hidden="true" /> Temp
                  </span>
                </th>
                <th scope="col">
                  <span className="th-icon-label">
                    <Plug size={12} aria-hidden="true" /> Power
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {gpus.map((gpu) => (
                <tr key={`${gpu.gpu_index}-${gpu.uuid || gpu.name}`}>
                  <td className="text-body-secondary">{gpu.gpu_index}</td>
                  <td>
                    <div className="fw-semibold">{gpu.name || `GPU ${gpu.gpu_index}`}</div>
                    <div className="small text-body-secondary">{gpu.uuid || 'No UUID'}</div>
                  </td>
                  <td className={utilColor(gpu.utilization_gpu_percent)}>
                    {formatPercent(gpu.utilization_gpu_percent)}
                  </td>
                  <td>
                    <div className={utilColor(gpu.memory_percent)}>
                      {formatPercent(gpu.memory_percent)}
                    </div>
                    <div className="small text-body-secondary">
                      {formatBytes(gpu.memory_used_bytes)} / {formatBytes(gpu.memory_total_bytes)}
                    </div>
                  </td>
                  <td className={tempColor(gpu.temperature_c)}>
                    {gpu.temperature_c == null ? '—' : `${formatNumber(gpu.temperature_c)}°C`}
                  </td>
                  <td>
                    {gpu.power_w == null
                      ? '—'
                      : `${formatNumber(gpu.power_w)} W${gpu.power_limit_w == null ? '' : ` / ${formatNumber(gpu.power_limit_w)} W`}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { formatBytes, formatNumber, formatPercent } from '../../lib/format';
import type { GpuDeviceMetric } from '../../types/api';
import EmptyState from '../common/EmptyState';

interface GpuTableProps {
  gpus: GpuDeviceMetric[];
}

export default function GpuTable({ gpus }: GpuTableProps) {
  if (gpus.length === 0) {
    return (
      <EmptyState title="No GPU metrics" message="The selected server did not report GPU device metrics." />
    );
  }

  return (
    <div className="card shadow-sm border-0 h-100 panel-card table-panel">
      <div className="card-body p-0">
        <div className="p-3 border-bottom table-panel-head">
          <h2 className="h6 mb-0 panel-title">GPU Devices</h2>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0 dashboard-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Util</th>
                <th scope="col">Mem</th>
                <th scope="col">Temp</th>
                <th scope="col">Power</th>
              </tr>
            </thead>
            <tbody>
              {gpus.map((gpu) => (
                <tr key={`${gpu.gpu_index}-${gpu.uuid || gpu.name}`}>
                  <td>{gpu.gpu_index}</td>
                  <td>
                    <div className="fw-semibold">{gpu.name || `GPU ${gpu.gpu_index}`}</div>
                    <div className="small text-body-secondary">{gpu.uuid || 'No UUID'}</div>
                  </td>
                  <td>{formatPercent(gpu.utilization_gpu_percent)}</td>
                  <td>
                    <div>{formatPercent(gpu.memory_percent)}</div>
                    <div className="small text-body-secondary">
                      {formatBytes(gpu.memory_used_bytes)} / {formatBytes(gpu.memory_total_bytes)}
                    </div>
                  </td>
                  <td>{gpu.temperature_c == null ? '-' : `${formatNumber(gpu.temperature_c)} C`}</td>
                  <td>
                    {gpu.power_w == null
                      ? '-'
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

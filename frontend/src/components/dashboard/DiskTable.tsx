import { ArrowDown, ArrowUp, Zap } from 'lucide-react';
import { formatNumber, formatPercent, formatThroughput, utilSeverityClass } from '../../lib/format';
import type { DiskDeviceMetric } from '../../types/api';
import EmptyState from '../common/EmptyState';

interface DiskTableProps {
  disks: DiskDeviceMetric[];
}

export default function DiskTable({ disks }: DiskTableProps) {
  if (disks.length === 0) {
    return (
      <EmptyState title="No disk metrics" message="The selected server did not report per-disk metrics." />
    );
  }

  return (
    <div className="panel-card table-panel entity-panel entity-panel--disk h-100">
      <div className="table-panel-head">
        <h2 className="panel-title d-flex align-items-center gap-2">
          <span className="entity-dot entity-dot--disk" aria-hidden="true" />
          Disk Devices
        </h2>
      </div>
      <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Device</th>
                <th scope="col">
                  <span className="th-icon-label">
                    <ArrowDown size={12} aria-hidden="true" /> Read
                  </span>
                </th>
                <th scope="col">
                  <span className="th-icon-label">
                    <ArrowUp size={12} aria-hidden="true" /> Write
                  </span>
                </th>
                <th scope="col">
                  <span className="th-icon-label">
                    <Zap size={12} aria-hidden="true" /> Util
                  </span>
                </th>
                <th scope="col">Read IOPS</th>
                <th scope="col">Write IOPS</th>
              </tr>
            </thead>
            <tbody>
              {disks.map((disk) => (
                <tr key={disk.device}>
                  <td className="fw-semibold">{disk.device}</td>
                  <td>{formatThroughput(disk.read_bps)}</td>
                  <td>{formatThroughput(disk.write_bps)}</td>
                  <td className={utilSeverityClass(disk.util_percent)}>
                    {formatPercent(disk.util_percent)}
                  </td>
                  <td className="text-body-secondary">{formatNumber(disk.read_iops)}</td>
                  <td className="text-body-secondary">{formatNumber(disk.write_iops)}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
}

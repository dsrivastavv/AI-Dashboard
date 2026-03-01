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
          <table className="dashboard-table dashboard-table--disk-stable">
            <colgroup>
              <col className="col-disk-device" />
              <col className="col-disk-read" />
              <col className="col-disk-write" />
              <col className="col-disk-util" />
              <col className="col-disk-riops" />
              <col className="col-disk-wiops" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="col-disk-device">Device</th>
                <th scope="col" className="col-disk-read">
                  <span className="th-icon-label">
                    <ArrowDown size={12} aria-hidden="true" /> Read
                  </span>
                </th>
                <th scope="col" className="col-disk-write">
                  <span className="th-icon-label">
                    <ArrowUp size={12} aria-hidden="true" /> Write
                  </span>
                </th>
                <th scope="col" className="col-disk-util">
                  <span className="th-icon-label">
                    <Zap size={12} aria-hidden="true" /> Util
                  </span>
                </th>
                <th scope="col" className="col-disk-riops">Read IOPS</th>
                <th scope="col" className="col-disk-wiops">Write IOPS</th>
              </tr>
            </thead>
            <tbody>
              {disks.map((disk) => (
                <tr key={disk.device}>
                  <td className="fw-semibold col-disk-device">
                    <span className="disk-device-name">{disk.device}</span>
                  </td>
                  <td className="col-disk-read">{formatThroughput(disk.read_bps)}</td>
                  <td className="col-disk-write">{formatThroughput(disk.write_bps)}</td>
                  <td className={`col-disk-util ${utilSeverityClass(disk.util_percent)}`}>
                    {formatPercent(disk.util_percent)}
                  </td>
                  <td className="text-body-secondary col-disk-riops">{formatNumber(disk.read_iops)}</td>
                  <td className="text-body-secondary col-disk-wiops">{formatNumber(disk.write_iops)}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
}

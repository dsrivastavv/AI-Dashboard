import { formatPercent, formatThroughput } from '../../lib/format';
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
    <div className="card shadow-sm border-0 h-100">
      <div className="card-body p-0">
        <div className="p-3 border-bottom">
          <h2 className="h6 mb-0">Disk Devices</h2>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col">Device</th>
                <th scope="col">Read</th>
                <th scope="col">Write</th>
                <th scope="col">Util</th>
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
                  <td>{formatPercent(disk.util_percent)}</td>
                  <td>{disk.read_iops.toFixed(1)}</td>
                  <td>{disk.write_iops.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

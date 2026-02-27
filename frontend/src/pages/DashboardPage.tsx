import { useOutletContext } from 'react-router-dom';

import BottleneckPanel from '../components/dashboard/BottleneckPanel';
import DiskTable from '../components/dashboard/DiskTable';
import GpuTable from '../components/dashboard/GpuTable';
import HistoryCharts from '../components/dashboard/HistoryCharts';
import SnapshotInsightsPanel from '../components/dashboard/SnapshotInsightsPanel';
import SummaryCards from '../components/dashboard/SummaryCards';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import type { AppLayoutContext } from '../components/layout/AppLayout';
import { withDashboardQuery } from '../lib/query';

export default function DashboardPage() {
  const { data, themeMode, searchParams, setSearchParams, systemMinutes, ioMinutes } =
    useOutletContext<AppLayoutContext>();

  const latestNotFound = data.latest.notFound;
  const latestSnapshot = data.latest.data?.snapshot ?? null;
  const historyPoints = data.history.data?.points ?? [];

  const noServers = !latestSnapshot && Boolean(latestNotFound) && data.servers.length === 0;
  const noSnapshotsYet = !latestSnapshot && Boolean(latestNotFound) && !noServers;
  const latestHardError =
    data.latest.error && data.latest.error.kind !== 'auth' && data.latest.error.kind !== 'forbidden'
      ? data.latest.error
      : null;
  const historyVisibleError =
    data.history.error && data.history.error.kind !== 'auth' && data.history.error.kind !== 'forbidden'
      ? data.history.error
      : null;

  if (data.isInitialLoading) {
    return <LoadingState />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {data.accessDenied ? (
        <ErrorState
          title="Access denied"
          message="Your Google account is signed in but not allowlisted for this dashboard."
          actions={
            <div className="d-flex gap-2">
              <a className="btn btn-outline-dark btn-sm" href="/accounts/logout/?next=/login">
                Sign out
              </a>
              <a className="btn btn-primary btn-sm" href="/accounts/google/login/">
                Sign in with another account
              </a>
            </div>
          }
        />
      ) : null}

      {historyVisibleError ? (
        <div className="alert alert-warning mb-0" role="alert">
          History data could not be refreshed: {historyVisibleError.message}
        </div>
      ) : null}

      {noServers ? (
        <EmptyState
          title="No monitored servers registered"
          message="Register a monitored server in Django (`manage.py register_server`) and start the agent to send metrics."
        />
      ) : null}

      {noSnapshotsYet ? (
        <EmptyState
          title="No samples collected yet"
          message={latestNotFound?.error || 'The selected server has no metrics yet. Start the agent and refresh.'}
        />
      ) : null}

      {latestHardError && !latestSnapshot ? (
        <ErrorState
          title="Failed to load dashboard"
          message={latestHardError.message}
          actions={
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void data.refreshAll()}>
              Retry
            </button>
          }
        />
      ) : null}

      {latestSnapshot ? (
        <>
          <SummaryCards snapshot={latestSnapshot} />

          <div className="row g-3">
            <div className="col-12 col-xxl-8 d-flex flex-column gap-3">
              {data.history.data ? (
                <HistoryCharts
                  points={historyPoints}
                  systemMinutes={systemMinutes}
                  ioMinutes={ioMinutes}
                  onSystemMinutesChange={(value) => {
                    const next = withDashboardQuery(searchParams, {
                      systemMinutes: value,
                      ioMinutes,
                      accessDenied: false,
                    });
                    setSearchParams(next);
                  }}
                  onIoMinutesChange={(value) => {
                    const next = withDashboardQuery(searchParams, {
                      systemMinutes,
                      ioMinutes: value,
                      accessDenied: false,
                    });
                    setSearchParams(next);
                  }}
                  themeMode={themeMode}
                  variant="full"
                  disabled={data.isInitialLoading}
                />
              ) : (
                <ErrorState
                  title="History unavailable"
                  message="Could not load historical data for the selected time window."
                  actions={
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => void data.refreshHistory()}
                    >
                      Retry history
                    </button>
                  }
                />
              )}
            </div>
            <div className="col-12 col-xxl-4 d-flex flex-column gap-3">
              <SnapshotInsightsPanel snapshot={latestSnapshot} />
              <BottleneckPanel bottleneck={latestSnapshot.bottleneck} />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-xxl-7">
              <GpuTable gpus={latestSnapshot.gpu.devices} />
            </div>
            <div className="col-12 col-xxl-5">
              <DiskTable disks={latestSnapshot.disk.devices} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

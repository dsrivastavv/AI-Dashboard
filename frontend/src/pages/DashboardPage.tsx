import { useEffect, useMemo } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

import AuthGate from '../components/auth/AuthGate';
import BottleneckPanel from '../components/dashboard/BottleneckPanel';
import DiskTable from '../components/dashboard/DiskTable';
import GpuTable from '../components/dashboard/GpuTable';
import HistoryCharts from '../components/dashboard/HistoryCharts';
import ServerSelector from '../components/dashboard/ServerSelector';
import SummaryCards from '../components/dashboard/SummaryCards';
import TimeRangeSelector from '../components/dashboard/TimeRangeSelector';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import AppShell from '../components/layout/AppShell';
import { useDashboardData } from '../hooks/useDashboardData';
import { buildNextPath, parseDashboardMinutes, parseServerParam, withDashboardQuery } from '../lib/query';

export default function DashboardPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const accessDeniedFromQuery = searchParams.get('access_denied') === '1';
  const requestedServer = parseServerParam(searchParams.get('server'));
  const minutes = parseDashboardMinutes(searchParams.get('minutes'));
  const nextPath = buildNextPath(location.pathname, location.search);

  const data = useDashboardData({ server: requestedServer, minutes });

  const selectedServerSlug = data.selectedServer?.slug ?? requestedServer;

  useEffect(() => {
    if (requestedServer || !data.selectedServer?.slug) {
      return;
    }
    const next = withDashboardQuery(searchParams, { server: data.selectedServer.slug });
    setSearchParams(next, { replace: true });
  }, [data.selectedServer?.slug, requestedServer, searchParams, setSearchParams]);

  const latestNotFound = data.latest.notFound;
  const latestSnapshot = data.latest.data?.snapshot ?? null;

  const noServers = !latestSnapshot && Boolean(latestNotFound) && (data.servers.length === 0);
  const noSnapshotsYet = !latestSnapshot && Boolean(latestNotFound) && !noServers;
  const latestHardError =
    data.latest.error && data.latest.error.kind !== 'auth' && data.latest.error.kind !== 'forbidden'
      ? data.latest.error
      : null;
  const historyVisibleError =
    data.history.error && data.history.error.kind !== 'auth' && data.history.error.kind !== 'forbidden'
      ? data.history.error
      : null;

  const headerActions = useMemo(
    () => (
      <div className="card shadow-sm border-0">
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-lg-5">
              <ServerSelector
                servers={data.servers}
                value={selectedServerSlug ?? null}
                onChange={(value) => {
                  const next = withDashboardQuery(searchParams, { server: value, accessDenied: false });
                  setSearchParams(next);
                }}
                disabled={data.isInitialLoading}
              />
            </div>
            <div className="col-12 col-lg-4">
              <TimeRangeSelector
                value={minutes}
                onChange={(value) => {
                  const next = withDashboardQuery(searchParams, { minutes: value, accessDenied: false });
                  setSearchParams(next);
                }}
                disabled={data.isInitialLoading}
              />
            </div>
            <div className="col-12 col-lg-3 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary flex-grow-1"
                onClick={() => {
                  void data.refreshAll();
                }}
                disabled={data.isRefreshing}
              >
                {data.isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <a className="btn btn-outline-dark" href="/accounts/logout/">
                Sign out
              </a>
            </div>
          </div>
        </div>
      </div>
    ),
    [data, minutes, searchParams, selectedServerSlug, setSearchParams],
  );

  if (accessDeniedFromQuery) {
    const search = new URLSearchParams();
    search.set('access_denied', '1');
    search.set('next', '/dashboard');
    return <Navigate to={`/login?${search.toString()}`} replace />;
  }

  if (data.authRequired) {
    return (
      <AuthGate isBlocked nextPath={nextPath}>
        <div />
      </AuthGate>
    );
  }

  if (data.isInitialLoading) {
    return (
      <AppShell title="Dashboard" subtitle="Loading server metrics..." headerActions={headerActions}>
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle={
        data.selectedServer
          ? `${data.selectedServer.name} (${data.selectedServer.slug})`
          : 'Google-authenticated monitoring dashboard powered by Django APIs.'
      }
      headerActions={headerActions}
    >
      <div className="d-flex flex-column gap-3">
        {data.accessDenied ? (
          <ErrorState
            title="Access denied"
            message="Your Google account is signed in but not allowlisted for this dashboard."
            actions={
              <div className="d-flex gap-2">
                <a className="btn btn-outline-dark btn-sm" href="/accounts/logout/">
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
              <div className="col-12 col-xl-5">
                <BottleneckPanel bottleneck={latestSnapshot.bottleneck} />
              </div>
              <div className="col-12 col-xl-7">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
                    <h2 className="h6 mb-3">Latest Sample Details</h2>
                    <div className="row g-3 small">
                      <div className="col-6 col-md-4">
                        <div className="text-body-secondary">Processes</div>
                        <div className="fw-semibold">{latestSnapshot.process_count}</div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-body-secondary">CPU IOWait</div>
                        <div className="fw-semibold">
                          {latestSnapshot.cpu.iowait_percent == null
                            ? '-'
                            : `${latestSnapshot.cpu.iowait_percent.toFixed(1)}%`}
                        </div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-body-secondary">Disk Avg Util</div>
                        <div className="fw-semibold">{latestSnapshot.disk.avg_util_percent.toFixed(1)}%</div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-body-secondary">CPU Load (1m)</div>
                        <div className="fw-semibold">
                          {latestSnapshot.cpu.load_1 == null ? '-' : latestSnapshot.cpu.load_1.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-body-secondary">GPU Count</div>
                        <div className="fw-semibold">{latestSnapshot.gpu.count}</div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-body-secondary">Sample Interval</div>
                        <div className="fw-semibold">
                          {latestSnapshot.interval_seconds == null
                            ? '-'
                            : `${latestSnapshot.interval_seconds.toFixed(1)}s`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {data.history.data ? <HistoryCharts points={data.history.data.points} /> : null}

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
    </AppShell>
  );
}

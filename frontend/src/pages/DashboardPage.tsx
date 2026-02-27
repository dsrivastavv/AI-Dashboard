import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

import AuthGate from '../components/auth/AuthGate';
import BottleneckPanel from '../components/dashboard/BottleneckPanel';
import DashboardSidebar, { type DashboardThemeMode } from '../components/dashboard/DashboardSidebar';
import DiskTable from '../components/dashboard/DiskTable';
import GpuTable from '../components/dashboard/GpuTable';
import HistoryCharts from '../components/dashboard/HistoryCharts';
import ServerSelector from '../components/dashboard/ServerSelector';
import SnapshotInsightsPanel from '../components/dashboard/SnapshotInsightsPanel';
import SummaryCards from '../components/dashboard/SummaryCards';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import LoadingState from '../components/common/LoadingState';
import AppShell from '../components/layout/AppShell';
import { useDashboardData } from '../hooks/useDashboardData';
import { buildNextPath, parseDashboardMinutes, parseServerParam, withDashboardQuery } from '../lib/query';

function formatSyncTime(timestamp: number | null) {
  if (!timestamp) {
    return 'Pending';
  }
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitialThemeMode(): DashboardThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  const stored = window.localStorage.getItem('ai-dashboard-theme');
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'dark';
}

export default function DashboardPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const accessDeniedFromQuery = searchParams.get('access_denied') === '1';
  const requestedServer = parseServerParam(searchParams.get('server'));
  const legacyMinutes = searchParams.get('minutes');
  const systemMinutes = parseDashboardMinutes(searchParams.get('system_minutes') ?? legacyMinutes);
  const ioMinutes = parseDashboardMinutes(searchParams.get('io_minutes') ?? legacyMinutes);
  const fetchMinutes = Math.max(systemMinutes, ioMinutes);
  const nextPath = buildNextPath(location.pathname, location.search);
  const [themeMode, setThemeMode] = useState<DashboardThemeMode>(getInitialThemeMode);

  const data = useDashboardData({ server: requestedServer, minutes: fetchMinutes, liveRefreshEnabled: true });

  const selectedServerSlug = data.selectedServer?.slug ?? requestedServer;

  useEffect(() => {
    if (requestedServer || !data.selectedServer?.slug) {
      return;
    }
    const next = withDashboardQuery(searchParams, { server: data.selectedServer.slug });
    setSearchParams(next, { replace: true });
  }, [data.selectedServer?.slug, requestedServer, searchParams, setSearchParams]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = themeMode;
    window.localStorage.setItem('ai-dashboard-theme', themeMode);
    return () => {
      delete root.dataset.theme;
    };
  }, [themeMode]);

  const latestNotFound = data.latest.notFound;
  const latestSnapshot = data.latest.data?.snapshot ?? null;
  const historyPoints = data.history.data?.points ?? [];

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
      <div className="topbar-controls">
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
    ),
    [data, searchParams, selectedServerSlug, setSearchParams],
  );

  const sidebar = useMemo(
    () => (
      <DashboardSidebar
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
        isRefreshing={data.isRefreshing}
        onRefresh={() => { void data.refreshAll(); }}
        latestSyncLabel={formatSyncTime(data.lastLatestSuccessAt)}
        historySyncLabel={formatSyncTime(data.lastHistorySuccessAt)}
        selectedServerName={data.selectedServer?.name ?? null}
        selectedServerSlug={data.selectedServer?.slug ?? null}
      />
    ),
    [data, themeMode],
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

  const title = data.selectedServer ? data.selectedServer.name : 'Operations Center';
  const subtitle = data.selectedServer
    ? `${data.selectedServer.slug} · ${data.selectedServer.hostname ?? ''}`
    : 'Select a server to begin monitoring';

  if (data.isInitialLoading) {
    return (
      <AppShell
        title="Operations Center"
        subtitle="Loading metrics..."
        headerActions={headerActions}
        sidebar={sidebar}
        themeMode={themeMode}
      >
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      headerActions={headerActions}
      sidebar={sidebar}
      themeMode={themeMode}
    >
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
    </AppShell>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

import AuthGate from '../components/auth/AuthGate';
import BottleneckPanel from '../components/dashboard/BottleneckPanel';
import CompactStatsPanel from '../components/dashboard/CompactStatsPanel';
import DashboardSidebar, { type DashboardThemeMode } from '../components/dashboard/DashboardSidebar';
import DiskTable from '../components/dashboard/DiskTable';
import GpuTable from '../components/dashboard/GpuTable';
import HistoryCharts from '../components/dashboard/HistoryCharts';
import ResourceRadarPanel from '../components/dashboard/ResourceRadarPanel';
import ServerSelector from '../components/dashboard/ServerSelector';
import SummaryCards from '../components/dashboard/SummaryCards';
import TimeRangeSelector from '../components/dashboard/TimeRangeSelector';
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
  return new Date(timestamp).toLocaleTimeString();
}

function getInitialThemeMode(): DashboardThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
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
  const minutes = parseDashboardMinutes(searchParams.get('minutes'));
  const nextPath = buildNextPath(location.pathname, location.search);
  const [liveRefreshEnabled, setLiveRefreshEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState<DashboardThemeMode>(getInitialThemeMode);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const data = useDashboardData({ server: requestedServer, minutes, liveRefreshEnabled });

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
      <div className="control-surface">
        <div className="control-surface-top">
          <div className="live-status-block">
            <div className="live-status-pill">
              <span className={`live-dot ${liveRefreshEnabled ? 'is-live' : 'is-paused'}`} aria-hidden="true" />
              <span>{liveRefreshEnabled ? 'Live auto refresh enabled' : 'Live auto refresh paused'}</span>
            </div>
            <div className="live-status-meta">
              Latest sync {formatSyncTime(data.lastLatestSuccessAt)} | History sync {formatSyncTime(data.lastHistorySuccessAt)}
            </div>
          </div>
          <div className="header-side-note">Use the sidebar for theme, settings, and session controls.</div>
        </div>

        <div className="control-support-note">
          Support: contact your dashboard administrator for allowlist access, OAuth setup, or server registration help.
        </div>

        <div className="control-surface-body">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-xl-5">
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
            <div className="col-12 col-xl-4">
              <TimeRangeSelector
                value={minutes}
                onChange={(value) => {
                  const next = withDashboardQuery(searchParams, { minutes: value, accessDenied: false });
                  setSearchParams(next);
                }}
                disabled={data.isInitialLoading}
              />
            </div>
            <div className="col-12 col-xl-3 d-flex gap-2">
              <button
                type="button"
                className="btn btn-dark flex-grow-1 refresh-btn"
                onClick={() => {
                  void data.refreshAll();
                }}
                disabled={data.isRefreshing}
              >
                {data.isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    [
      data,
      liveRefreshEnabled,
      minutes,
      searchParams,
      selectedServerSlug,
      setSearchParams,
    ],
  );

  const sidebar = useMemo(
    () => (
      <DashboardSidebar
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
        liveRefreshEnabled={liveRefreshEnabled}
        onLiveRefreshChange={setLiveRefreshEnabled}
        isRefreshing={data.isRefreshing}
        onRefresh={() => {
          void data.refreshAll();
        }}
        latestSyncLabel={formatSyncTime(data.lastLatestSuccessAt)}
        historySyncLabel={formatSyncTime(data.lastHistorySuccessAt)}
        selectedServerName={data.selectedServer?.name ?? null}
        selectedServerSlug={data.selectedServer?.slug ?? null}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((current) => !current)}
      />
    ),
    [
      data,
      liveRefreshEnabled,
      settingsOpen,
      themeMode,
    ],
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
      <AppShell
        title="Operations Center"
        subtitle="Loading live AI system metrics..."
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
      title="AI Dashboard"
      subtitle={
        data.selectedServer
          ? `${data.selectedServer.name} (${data.selectedServer.slug})`
          : 'Designed by Divyansh Srivastava for secure, live infrastructure monitoring.'
      }
      headerActions={headerActions}
      sidebar={sidebar}
      themeMode={themeMode}
    >
      <div className="d-flex flex-column gap-3">
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

            <div className="row g-3 dashboard-scene-grid">
              <div className="col-12 col-xxl-8">
                {data.history.data ? (
                  <HistoryCharts points={historyPoints} themeMode={themeMode} variant="overview" />
                ) : (
                  <ErrorState
                    title="History unavailable"
                    message="Could not load historical data for the selected time window."
                    actions={
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => void data.refreshHistory()}>
                        Retry history
                      </button>
                    }
                  />
                )}
              </div>
              <div className="col-12 col-xxl-4 d-flex flex-column gap-3">
                <ResourceRadarPanel snapshot={latestSnapshot} historyPoints={historyPoints} themeMode={themeMode} />
                <CompactStatsPanel snapshot={latestSnapshot} />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-xl-5">
                <BottleneckPanel bottleneck={latestSnapshot.bottleneck} />
              </div>
              <div className="col-12 col-xl-7">
                <div className="card shadow-sm border-0 h-100 panel-card detail-panel">
                  <div className="card-body">
                    <div className="panel-head d-flex justify-content-between align-items-center mb-3">
                      <h2 className="h6 mb-0 panel-title">Latest Sample Details</h2>
                      <span className="small panel-caption">
                        {liveRefreshEnabled ? 'Auto refresh active' : 'Manual refresh mode'}
                      </span>
                    </div>
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

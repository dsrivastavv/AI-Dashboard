import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';

import AuthGate from '../auth/AuthGate';
import DashboardSidebar, { type DashboardThemeMode } from '../dashboard/DashboardSidebar';
import ServerCreateModal from '../dashboard/ServerCreateModal';
import LoadingState from '../common/LoadingState';
import AppShell from './AppShell';
import NotificationBell from './NotificationBell';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useNotifications } from '../../hooks/useNotifications';
import { buildNextPath, parseDashboardMinutes, parseServerParam, withDashboardQuery } from '../../lib/query';

function getInitialThemeMode(): DashboardThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem('ai-dashboard-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return 'dark';
}

type SetSearchParams = ReturnType<typeof useSearchParams>[1];

export type AppLayoutContext = {
  data: ReturnType<typeof useDashboardData>;
  notifications: ReturnType<typeof useNotifications>;
  themeMode: DashboardThemeMode;
  searchParams: URLSearchParams;
  setSearchParams: SetSearchParams;
  systemMinutes: number;
  ioMinutes: number;
};

export default function AppLayout() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [themeMode, setThemeMode] = useState<DashboardThemeMode>(getInitialThemeMode);

  const accessDeniedFromQuery = searchParams.get('access_denied') === '1';
  const requestedServer = parseServerParam(searchParams.get('server'));
  const legacyMinutes = searchParams.get('minutes');
  const systemMinutes = parseDashboardMinutes(searchParams.get('system_minutes') ?? legacyMinutes);
  const ioMinutes = parseDashboardMinutes(searchParams.get('io_minutes') ?? legacyMinutes);
  const fetchMinutes = Math.max(systemMinutes, ioMinutes);
  const nextPath = buildNextPath(location.pathname, location.search);

  const data = useDashboardData({
    server: requestedServer,
    minutes: fetchMinutes,
    liveRefreshEnabled: location.pathname === '/dashboard' || location.pathname === '/system',
  });
  const notifications = useNotifications();
  const [showCreateServer, setShowCreateServer] = useState(false);

  const selectedServerSlug = data.selectedServer?.slug ?? requestedServer;

  useEffect(() => {
    if (requestedServer || !data.selectedServer?.slug) return;
    const next = withDashboardQuery(searchParams, { server: data.selectedServer.slug });
    setSearchParams(next, { replace: true });
  }, [data.selectedServer?.slug, requestedServer, searchParams, setSearchParams]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = themeMode;
    window.localStorage.setItem('ai-dashboard-theme', themeMode);
    return () => { delete root.dataset.theme; };
  }, [themeMode]);

  const sidebar = useMemo(
    () => (
      <DashboardSidebar
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
        isRefreshing={data.isRefreshing}
        onRefresh={() => { void data.refreshAll(); }}
        selectedServerSlug={selectedServerSlug ?? null}
        servers={data.servers}
        onServerChange={(value) => {
          const next = withDashboardQuery(searchParams, { server: value, accessDenied: false });
          setSearchParams(next);
        }}
        isServerLoading={data.isInitialLoading}
        onCreateServer={() => setShowCreateServer(true)}
        notifUnreadCount={notifications.unreadCount}
      />
    ),
    [data, themeMode, searchParams, selectedServerSlug, setSearchParams, notifications.unreadCount],
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

  const isOnTerminal = location.pathname === '/terminal';
  const isOnSystemInfo = location.pathname === '/system';
  const isOnNotifications = location.pathname === '/notifications';

  // Large title = workstation/server name; small subtitle = tab name
  const serverName = data.selectedServer?.name ?? 'Operations Center';
  const tabLabel = isOnTerminal
    ? 'Terminal'
    : isOnSystemInfo
      ? 'System Info'
      : isOnNotifications
        ? 'Notifications'
        : 'Stats';
  const title = serverName;
  const subtitle = tabLabel;

  if (data.isInitialLoading && !isOnTerminal && !isOnNotifications) {
    return (
      <AppShell title={serverName} subtitle="Stats" sidebar={sidebar} themeMode={themeMode}>
        <LoadingState />
      </AppShell>
    );
  }

  const context: AppLayoutContext = { data, notifications, themeMode, searchParams, setSearchParams, systemMinutes, ioMinutes };

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      sidebar={sidebar}
      themeMode={themeMode}
      headerActions={(
        <NotificationBell
          items={notifications.items}
          unreadCount={notifications.unreadCount}
          onMarkAllRead={notifications.markAllRead}
        />
      )}
    >
      <Outlet context={context} />
      <ServerCreateModal
        isOpen={showCreateServer}
        onClose={() => setShowCreateServer(false)}
        onCreated={(res) => {
          void data.refreshAll({ background: true });
          const next = withDashboardQuery(searchParams, { server: res.server.slug, accessDenied: false });
          setSearchParams(next, { replace: true });
        }}
      />
    </AppShell>
  );
}

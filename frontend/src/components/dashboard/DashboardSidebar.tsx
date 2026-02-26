export type DashboardThemeMode = 'light' | 'dark';

interface DashboardSidebarProps {
  themeMode: DashboardThemeMode;
  onThemeModeChange: (mode: DashboardThemeMode) => void;
  liveRefreshEnabled: boolean;
  onLiveRefreshChange: (enabled: boolean) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  latestSyncLabel: string;
  historySyncLabel: string;
  selectedServerName?: string | null;
  selectedServerSlug?: string | null;
  settingsOpen: boolean;
  onToggleSettings: () => void;
}

export default function DashboardSidebar({
  themeMode,
  onThemeModeChange,
  liveRefreshEnabled,
  onLiveRefreshChange,
  isRefreshing,
  onRefresh,
  latestSyncLabel,
  historySyncLabel,
  selectedServerName,
  selectedServerSlug,
  settingsOpen,
  onToggleSettings,
}: DashboardSidebarProps) {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-glow" aria-hidden="true" />

      <div className="sidebar-panel sidebar-brand-panel">
        <div className="sidebar-brand-kicker">AI Dashboard</div>
        <h2 className="sidebar-brand-title">Operations Console</h2>
        <p className="sidebar-brand-copy mb-0">
          Real-time visibility for AI infrastructure.
        </p>
        <div className="sidebar-meta-line">Designed by Divyansh Srivastava</div>
      </div>

      <div className="sidebar-panel sidebar-nav-panel">
        <div className="sidebar-section-label">Navigation</div>
        <div className="sidebar-nav-list" role="list" aria-label="Dashboard sections">
          <div className="sidebar-nav-item is-active" role="listitem">
            <span className="sidebar-nav-dot" aria-hidden="true" />
            <span>Overview</span>
          </div>
          <div className="sidebar-nav-item" role="listitem">
            <span className="sidebar-nav-dot" aria-hidden="true" />
            <span>Charts</span>
          </div>
          <div className="sidebar-nav-item" role="listitem">
            <span className="sidebar-nav-dot" aria-hidden="true" />
            <span>Devices</span>
          </div>
        </div>
      </div>

      <div className="sidebar-panel sidebar-status-panel">
        <div className="sidebar-section-label">Live Status</div>
        <div className="sidebar-live-pill">
          <span className={`live-dot ${liveRefreshEnabled ? 'is-live' : 'is-paused'}`} aria-hidden="true" />
          <span>{liveRefreshEnabled ? 'Auto refresh enabled' : 'Auto refresh paused'}</span>
        </div>
        <div className="sidebar-sync-grid">
          <div>
            <div className="sidebar-sync-label">Latest</div>
            <div className="sidebar-sync-value">{latestSyncLabel}</div>
          </div>
          <div>
            <div className="sidebar-sync-label">History</div>
            <div className="sidebar-sync-value">{historySyncLabel}</div>
          </div>
        </div>
        {selectedServerName ? (
          <div className="sidebar-server-card">
            <div className="sidebar-server-label">Active server</div>
            <div className="sidebar-server-name">{selectedServerName}</div>
            {selectedServerSlug ? <div className="sidebar-server-slug">{selectedServerSlug}</div> : null}
          </div>
        ) : null}
      </div>

      <div className="sidebar-panel sidebar-settings-panel">
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div className="sidebar-section-label mb-0">Settings</div>
          <button
            type="button"
            className="btn btn-sm sidebar-settings-toggle"
            onClick={onToggleSettings}
            aria-expanded={settingsOpen}
            aria-controls="sidebar-settings-content"
          >
            {settingsOpen ? 'Hide' : 'Show'}
          </button>
        </div>

        {settingsOpen ? (
          <div id="sidebar-settings-content" className="sidebar-settings-content">
            <div className="sidebar-subsection">
              <div className="sidebar-subtitle">Theme</div>
              <div className="sidebar-segmented" role="group" aria-label="Theme mode selector">
                <button
                  type="button"
                  className={`btn btn-sm ${themeMode === 'light' ? 'is-selected' : ''}`}
                  onClick={() => onThemeModeChange('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${themeMode === 'dark' ? 'is-selected' : ''}`}
                  onClick={() => onThemeModeChange('dark')}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="sidebar-subsection">
              <div className="sidebar-subtitle">Refresh</div>
              <div className="d-flex align-items-center justify-content-between gap-2">
                <label className="form-check form-switch m-0 sidebar-mini-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={liveRefreshEnabled}
                    onChange={(event) => onLiveRefreshChange(event.target.checked)}
                  />
                  <span className="form-check-label">Auto refresh</span>
                </label>
                <button
                  type="button"
                  className="btn btn-sm sidebar-refresh-btn"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh now'}
                </button>
              </div>
            </div>

            <div className="sidebar-support-card">
              <div className="sidebar-subtitle">Support</div>
              <p className="mb-0">
                For allowlist access, login issues, or server registration, contact your dashboard administrator.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="sidebar-panel sidebar-session-panel">
        <div className="sidebar-section-label">Session</div>
        <div className="d-grid gap-2">
          <a className="btn btn-dark sidebar-primary-btn" href="/accounts/logout/?next=/login">
            Sign out
          </a>
          <a className="btn btn-outline-secondary sidebar-secondary-btn" href="/accounts/google/login/">
            Switch account
          </a>
        </div>
      </div>
    </aside>
  );
}

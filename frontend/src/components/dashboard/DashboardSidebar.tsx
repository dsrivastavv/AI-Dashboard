import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  History,
  LogOut,
  Moon,
  RefreshCw,
  RotateCw,
  Server,
  Settings,
  Sun,
  User,
  Zap,
} from 'lucide-react';

export type DashboardThemeMode = 'light' | 'dark';

interface DashboardSidebarProps {
  themeMode: DashboardThemeMode;
  onThemeModeChange: (mode: DashboardThemeMode) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  latestSyncLabel: string;
  historySyncLabel: string;
  selectedServerName?: string | null;
  selectedServerSlug?: string | null;
}

export default function DashboardSidebar({
  themeMode,
  onThemeModeChange,
  isRefreshing,
  onRefresh,
  latestSyncLabel,
  historySyncLabel,
  selectedServerName,
  selectedServerSlug,
}: DashboardSidebarProps) {
  return (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <div className="sidebar-brand-icon" aria-hidden="true">
            <Zap size={16} color="white" />
          </div>
          <span className="sidebar-brand-name">AI Dashboard</span>
        </div>
        <div className="sidebar-brand-tagline">
          Real-time AI infrastructure monitoring
        </div>
        <div className="sidebar-brand-by">by Divyansh Srivastava</div>
      </div>

      {/* Live status */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">
          <span className="sidebar-section-icon"><CheckCircle2 size={11} aria-hidden="true" /></span>
          Live Status
        </div>
        <div className="sidebar-live-pill">
          <span className="live-dot is-live" aria-hidden="true" />
          Auto-refresh active
        </div>
        <div className="sidebar-sync-grid">
          <div className="sidebar-sync-item">
            <div className="sidebar-sync-label">
              <Clock size={10} aria-hidden="true" style={{ marginRight: 3, verticalAlign: 'middle' }} />
              Latest
            </div>
            <div className="sidebar-sync-value">{latestSyncLabel}</div>
          </div>
          <div className="sidebar-sync-item">
            <div className="sidebar-sync-label">
              <History size={10} aria-hidden="true" style={{ marginRight: 3, verticalAlign: 'middle' }} />
              History
            </div>
            <div className="sidebar-sync-value">{historySyncLabel}</div>
          </div>
        </div>

        {selectedServerName ? (
          <div className="sidebar-server-card">
            <div className="sidebar-server-eyebrow">
              <Server size={10} aria-hidden="true" style={{ marginRight: 3, verticalAlign: 'middle' }} />
              Active server
            </div>
            <div className="sidebar-server-name">{selectedServerName}</div>
            {selectedServerSlug ? (
              <div className="sidebar-server-slug">{selectedServerSlug}</div>
            ) : null}
          </div>
        ) : null}

        <div className="sidebar-subtitle" style={{ marginTop: '12px' }}>Manual refresh</div>
        <button
          type="button"
          className="sidebar-refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing
            ? <><RotateCw size={13} className="sidebar-refresh-spin" aria-hidden="true" /> Wait...</>
            : <><RefreshCw size={13} aria-hidden="true" /> Refresh</>}
        </button>
      </div>

      {/* Settings */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">
          <span className="sidebar-section-icon"><Settings size={11} aria-hidden="true" /></span>
          Settings
        </div>

        <div className="sidebar-subtitle">Theme</div>
        <div className="sidebar-segmented" role="group" aria-label="Theme mode">
          <button
            type="button"
            className={`btn${themeMode === 'light' ? ' is-selected' : ''}`}
            onClick={() => onThemeModeChange('light')}
          >
            <Sun size={13} aria-hidden="true" /> Light
          </button>
          <button
            type="button"
            className={`btn${themeMode === 'dark' ? ' is-selected' : ''}`}
            onClick={() => onThemeModeChange('dark')}
          >
            <Moon size={13} aria-hidden="true" /> Dark
          </button>
        </div>

      </div>

      {/* Spacer */}
      <div className="sidebar-spacer" />

      {/* Session */}
      <div className="sidebar-session">
        <div className="sidebar-section-label">
          <span className="sidebar-section-icon"><User size={11} aria-hidden="true" /></span>
          Session
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <a
            className="sidebar-session-btn sidebar-session-btn--primary"
            href="/accounts/logout/?next=/login"
          >
            <LogOut size={13} aria-hidden="true" /> Sign out
          </a>
          <a
            className="sidebar-session-btn sidebar-session-btn--secondary"
            href="/accounts/google/login/"
          >
            <ArrowLeftRight size={13} aria-hidden="true" /> Switch account
          </a>
        </div>
      </div>
    </>
  );
}

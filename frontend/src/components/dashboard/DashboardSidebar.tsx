import { Link, useLocation } from 'react-router-dom';
import BrandName from '../common/BrandName';
import {
  ArrowLeftRight,
  Bell,
  Info,
  LogOut,
  Moon,
  RefreshCw,
  RotateCw,
  Server,
  Settings,
  Sun,
  Terminal,
  User,
} from 'lucide-react';

import type { ServerSummary } from '../../types/api';

export type DashboardThemeMode = 'light' | 'dark';

interface DashboardSidebarProps {
  themeMode: DashboardThemeMode;
  onThemeModeChange: (mode: DashboardThemeMode) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  selectedServerSlug?: string | null;
  servers: ServerSummary[];
  onServerChange: (slug: string | null) => void;
  isServerLoading?: boolean;
  onCreateServer?: () => void;
  notifUnreadCount?: number;
}

export default function DashboardSidebar({
  themeMode,
  onThemeModeChange,
  isRefreshing,
  onRefresh,
  selectedServerSlug,
  servers,
  onServerChange,
  isServerLoading = false,
  onCreateServer,
  notifUnreadCount = 0,
}: DashboardSidebarProps) {
  const { pathname, search } = useLocation();

  return (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <span className="sidebar-brand-name"><BrandName /></span>
        </div>
        <div className="sidebar-brand-tagline">
          Real-time AI infrastructure monitoring
        </div>
        <div className="sidebar-brand-by">by Divyansh Srivastava</div>
      </div>

      {/* Server selector */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">
          <span className="sidebar-section-icon"><Server size={11} aria-hidden="true" /></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Server
            <button
              type="button"
              className="sidebar-icon-btn"
              onClick={onCreateServer}
              title="Add server"
            >
              +
            </button>
          </span>
        </div>
        <div className="sidebar-server-select-wrap">
          <select
            id="sidebar-server-selector"
            className="sidebar-server-select"
            value={selectedServerSlug ?? ''}
            disabled={isServerLoading || servers.length === 0}
            onChange={(e) => onServerChange(e.target.value || null)}
          >
            {servers.length === 0 ? <option value="">No servers</option> : null}
            {servers.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="sidebar-refresh-btn"
          style={{ marginTop: '10px' }}
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing
            ? <><RotateCw size={13} className="sidebar-refresh-spin" aria-hidden="true" /> Refreshing...</>
            : <><RefreshCw size={13} aria-hidden="true" /> Refresh</>}
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="sidebar-section">
        <nav className="sidebar-tabs" aria-label="Main navigation">
          <Link
            to={{ pathname: '/dashboard', search }}
            className={`sidebar-tab${pathname === '/dashboard' || pathname === '/' ? ' is-active' : ''}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            Stats
          </Link>
          <Link
            to={{ pathname: '/terminal', search }}
            className={`sidebar-tab${pathname === '/terminal' ? ' is-active' : ''}`}
          >
            <Terminal size={13} aria-hidden="true" />
            Terminal
          </Link>
          <Link
            to={{ pathname: '/system', search }}
            className={`sidebar-tab${pathname === '/system' ? ' is-active' : ''}`}
          >
            <Info size={13} aria-hidden="true" />
            System Info
          </Link>
          <Link
            to={{ pathname: '/notifications', search }}
            className={`sidebar-tab${pathname === '/notifications' ? ' is-active' : ''}`}
          >
            <Bell size={13} aria-hidden="true" />
            Notifications
            {notifUnreadCount > 0 && (
              <span className="sidebar-tab-badge">{notifUnreadCount > 99 ? '99+' : notifUnreadCount}</span>
            )}
          </Link>
        </nav>
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

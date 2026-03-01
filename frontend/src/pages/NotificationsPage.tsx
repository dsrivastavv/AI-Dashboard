import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Server,
} from 'lucide-react';

import type { AppLayoutContext } from '../components/layout/AppLayout';
import type { NotificationItem, NotificationLevel } from '../types/api';
import { markNotificationsRead } from '../lib/api';
import { formatDateTime } from '../lib/format';

// ─── Helpers ────────────────────────────────────────────────────────────────

const LEVEL_META: Record<
  NotificationLevel,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  critical: {
    label: 'Critical',
    icon: <AlertCircle size={13} aria-hidden="true" />,
    cls: 'npage-badge--critical',
  },
  warning: {
    label: 'Warning',
    icon: <AlertTriangle size={13} aria-hidden="true" />,
    cls: 'npage-badge--warning',
  },
  info: {
    label: 'Info',
    icon: <Info size={13} aria-hidden="true" />,
    cls: 'npage-badge--info',
  },
};

type FilterTab = 'all' | 'unread' | NotificationLevel;

function applyFilter(items: NotificationItem[], tab: FilterTab): NotificationItem[] {
  if (tab === 'all') return items;
  if (tab === 'unread') return items.filter((n) => !n.is_read);
  return items.filter((n) => n.level === tab);
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface NotifRowProps {
  item: NotificationItem;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkRead: () => void;
}

function NotifRow({ item, isExpanded, onToggle, onMarkRead }: NotifRowProps) {
  const meta = LEVEL_META[item.level];

  return (
    <div className={`npage-row${isExpanded ? ' npage-row--expanded' : ''}${!item.is_read ? ' npage-row--unread' : ''}`}>
      {/* Summary bar — always visible */}
      <div className="npage-row-summary" role="button" tabIndex={0} onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        aria-expanded={isExpanded}
      >
        {/* Unread dot */}
        <span className={`npage-unread-dot${item.is_read ? ' npage-unread-dot--read' : ''}`} aria-label={item.is_read ? 'Read' : 'Unread'} />

        {/* Level badge */}
        <span className={`npage-badge ${meta.cls}`} aria-label={`Level: ${meta.label}`}>
          {meta.icon}
          <span className="npage-badge-label">{meta.label}</span>
        </span>

        {/* Title */}
        <span className="npage-row-title">{item.title}</span>

        {/* Server */}
        {item.server && (
          <span className="npage-row-server">
            <Server size={11} aria-hidden="true" />
            {item.server.name}
          </span>
        )}

        {/* Time */}
        <span className="npage-row-time">{formatDateTime(item.created_at)}</span>

        {/* Expand toggle */}
        <button
          type="button"
          className="npage-expand-btn"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="npage-row-detail">
          <div className="npage-detail-grid">
            {/* Message */}
            <div className="npage-detail-block npage-detail-block--message">
              <span className="npage-detail-label">Message</span>
              <p className="npage-detail-value">{item.message}</p>
            </div>

            {/* Code */}
            {item.code && (
              <div className="npage-detail-block">
                <span className="npage-detail-label">Code</span>
                <code className="npage-detail-value npage-detail-value--mono">{item.code}</code>
              </div>
            )}

            {/* Server details */}
            {item.server && (
              <div className="npage-detail-block">
                <span className="npage-detail-label">Server</span>
                <div className="npage-detail-value npage-detail-server">
                  <span>{item.server.name}</span>
                  {item.server.hostname && (
                    <span className="npage-detail-server-host">{item.server.hostname}</span>
                  )}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="npage-detail-block">
              <span className="npage-detail-label">Received</span>
              <span className="npage-detail-value">{formatDateTime(item.created_at)}</span>
            </div>

            {/* ID */}
            <div className="npage-detail-block">
              <span className="npage-detail-label">Event ID</span>
              <code className="npage-detail-value npage-detail-value--mono">#{item.id}</code>
            </div>
          </div>

          {/* Mark read button — only if unread */}
          {!item.is_read && (
            <div className="npage-detail-actions">
              <button
                type="button"
                className="npage-mark-one-btn"
                onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
              >
                <CheckCheck size={13} aria-hidden="true" />
                Mark as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { notifications } = useOutletContext<AppLayoutContext>();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { items, unreadCount, markAllRead } = notifications;

  const filtered = applyFilter(items, activeTab);

  const counts: Record<FilterTab, number> = {
    all: items.length,
    unread: items.filter((n) => !n.is_read).length,
    critical: items.filter((n) => n.level === 'critical').length,
    warning: items.filter((n) => n.level === 'warning').length,
    info: items.filter((n) => n.level === 'info').length,
  };

  const handleToggle = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleMarkOneRead = async (id: number) => {
    await markNotificationsRead([id]);
    await notifications.refresh();
  };

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'critical', label: 'Critical' },
    { key: 'warning', label: 'Warning' },
    { key: 'info', label: 'Info' },
  ];

  return (
    <div className="npage-root">
      {/* Page header bar */}
      <div className="npage-header">
        <div className="npage-header-left">
          <Bell size={16} aria-hidden="true" className="npage-header-icon" />
          <h1 className="npage-heading">Notifications</h1>
          {unreadCount > 0 && (
            <span className="npage-unread-count">{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="npage-mark-all-btn"
            onClick={() => { void markAllRead(); }}
          >
            <CheckCheck size={14} aria-hidden="true" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="npage-filter-tabs" role="tablist" aria-label="Filter notifications">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={activeTab === key}
            className={`npage-filter-tab${activeTab === key ? ' is-active' : ''}${key === 'critical' ? ' npage-filter-tab--critical' : key === 'warning' ? ' npage-filter-tab--warning' : ''}`}
            onClick={() => { setActiveTab(key); setExpandedId(null); }}
          >
            {label}
            <span className="npage-filter-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="panel-card npage-table-card">
        {/* Table column headers */}
        <div className="npage-table-head">
          <span />
          <span>Level</span>
          <span>Title</span>
          <span>Server</span>
          <span>Time</span>
          <span />
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="npage-empty">
            <Bell size={28} aria-hidden="true" className="npage-empty-icon" />
            <span>No notifications{activeTab !== 'all' ? ` in "${FILTER_TABS.find(t => t.key === activeTab)?.label}"` : ''}</span>
          </div>
        ) : (
          <div className="npage-rows" role="list">
            {filtered.map((item) => (
              <NotifRow
                key={item.id}
                item={item}
                isExpanded={expandedId === item.id}
                onToggle={() => handleToggle(item.id)}
                onMarkRead={() => { void handleMarkOneRead(item.id); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check, AlertTriangle, Info } from 'lucide-react';
import { formatRelativeSeconds, formatDateTime } from '../../lib/format';
import type { NotificationItem } from '../../types/api';
import { ACCENT_COLORS, ENTITY_COLORS } from '../../config/colors';

function iconFor(level: NotificationItem['level']) {
  switch (level) {
    case 'critical':
      return <AlertTriangle size={14} color={ACCENT_COLORS.red} />;
    case 'warning':
      return <AlertTriangle size={14} color={ACCENT_COLORS.yellow} />;
    default:
      return <Info size={14} color={ENTITY_COLORS.cpu} />;
  }
}

interface NotificationBellProps {
  items: NotificationItem[];
  unreadCount: number;
  onMarkAllRead: () => Promise<void>;
}

export default function NotificationBell({ items, unreadCount, onMarkAllRead }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 12),
    [items],
  );

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notif-button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {unreadCount > 0 ? <span className="notif-badge">{unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notif-dropdown" role="menu">
          <div className="notif-head">
            <span className="notif-title">Notifications</span>
            <button type="button" className="notif-mark" onClick={() => void onMarkAllRead()}>
              <Check size={14} /> Mark all read
            </button>
          </div>

          {sorted.length === 0 ? (
            <div className="notif-empty">No notifications yet.</div>
          ) : (
            <ul className="notif-list">
              {sorted.map((n) => (
                <li key={n.id} className={`notif-item notif-item--${n.level}`}>
                  <div className="notif-icon">{iconFor(n.level)}</div>
                  <div className="notif-body">
                    <div className="notif-row">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-time" title={formatDateTime(n.created_at)}>
                        {formatRelativeSeconds((Date.now() - new Date(n.created_at).getTime()) / 1000)}
                      </span>
                    </div>
                    <div className="notif-msg">{n.message}</div>
                    {n.server ? <div className="notif-server">{n.server.name}</div> : null}
                  </div>
                  {!n.is_read ? <span className="notif-dot" aria-label="Unread" /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

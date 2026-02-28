import { useEffect, useRef, useState } from 'react';
import { getNotifications, markNotificationsRead } from '../lib/api';
import type { NotificationItem } from '../types/api';

interface UseNotificationsResult {
  items: NotificationItem[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  error: string | null;
}

export function useNotifications(): UseNotificationsResult {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const resp = await getNotifications(controller.signal);
      setItems(resp.notifications ?? []);
      setError(null);
    } catch (err) {
      // Treat 404/forbidden as disablement; don’t spam errors
      setError('notifications_unavailable');
    }
  };

  const markAllRead = async () => {
    const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id);
    if (!unreadIds.length) return;
    try {
      await markNotificationsRead(unreadIds);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, 10000);
    return () => {
      window.clearInterval(id);
      abortRef.current?.abort();
    };
  }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;
  return { items, unreadCount, markAllRead, refresh, error };
}

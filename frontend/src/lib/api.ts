import type {
  HistoryMetricsResponse,
  LatestSnapshotResponse,
  ServersListResponse,
  NotificationsResponse,
  MarkNotificationsReadResponse,
} from '../types/api';
import { requestJson } from './http';

function buildPath(path: string, params?: Record<string, string | number | null | undefined>) {
  const url = new URL(path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return `${url.pathname}${url.search}`;
}

export function getServers(signal?: AbortSignal) {
  return requestJson<ServersListResponse>('/api/servers/', { signal });
}

export function getMetricsLatest(options: { server?: string | null; signal?: AbortSignal } = {}) {
  return requestJson<LatestSnapshotResponse>(
    buildPath('/api/metrics/latest/', { server: options.server }),
    { signal: options.signal },
  );
}

export function getMetricsHistory(options: {
  server?: string | null;
  minutes?: number;
  signal?: AbortSignal;
} = {}) {
  return requestJson<HistoryMetricsResponse>(
    buildPath('/api/metrics/history/', {
      server: options.server,
      minutes: options.minutes,
    }),
    { signal: options.signal },
  );
}

export function getNotifications(signal?: AbortSignal) {
  return requestJson<NotificationsResponse>('/api/notifications/', { signal });
}

export function markNotificationsRead(ids: number[], signal?: AbortSignal) {
  return requestJson<MarkNotificationsReadResponse>('/api/notifications/mark-read/', {
    method: 'POST',
    body: JSON.stringify({ ids }),
    signal,
  });
}

export function authLogin(username: string, password: string, signal?: AbortSignal) {
  return requestJson<{ ok: boolean; user: { username: string; email: string } }>('/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    signal,
  });
}

export function authRegister(username: string, email: string, password: string, signal?: AbortSignal) {
  return requestJson<{ ok: boolean; user: { username: string; email: string } }>('/api/auth/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
    signal,
  });
}

export function authForgotPassword(email: string, signal?: AbortSignal) {
  return requestJson<{ ok: boolean; message: string }>('/api/auth/forgot-password/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    signal,
  });
}

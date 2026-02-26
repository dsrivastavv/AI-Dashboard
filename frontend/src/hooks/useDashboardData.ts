import { useEffect, useRef, useState } from 'react';

import { getMetricsHistory, getMetricsLatest } from '../lib/api';
import { normalizeRequestError, type NormalizedRequestError } from '../lib/http';
import type {
  HistoryMetricsResponse,
  LatestSnapshotNotFoundResponse,
  LatestSnapshotResponse,
  ServerSummary,
} from '../types/api';
import { usePolling } from './usePolling';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface EndpointState<T> {
  status: LoadStatus;
  data: T | null;
  error: NormalizedRequestError | null;
}

interface LatestState extends EndpointState<LatestSnapshotResponse> {
  notFound: LatestSnapshotNotFoundResponse | null;
}

export interface DashboardDataResult {
  latest: LatestState;
  history: EndpointState<HistoryMetricsResponse>;
  servers: ServerSummary[];
  selectedServer: ServerSummary | null;
  authRequired: boolean;
  authLoginUrl: string | null;
  accessDenied: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  refreshAll: () => Promise<void>;
  refreshLatest: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

function initialLatestState(): LatestState {
  return {
    status: 'idle',
    data: null,
    error: null,
    notFound: null,
  };
}

function initialHistoryState(): EndpointState<HistoryMetricsResponse> {
  return {
    status: 'idle',
    data: null,
    error: null,
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function asLatestNotFoundPayload(value: unknown): LatestSnapshotNotFoundResponse | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const payload = value as Record<string, unknown>;
  if (payload.ok !== false || typeof payload.error !== 'string') {
    return null;
  }
  return payload as unknown as LatestSnapshotNotFoundResponse;
}

export function useDashboardData(options: { server: string | null; minutes: number }): DashboardDataResult {
  const { server, minutes } = options;

  const [latest, setLatest] = useState<LatestState>(() => initialLatestState());
  const [history, setHistory] = useState<EndpointState<HistoryMetricsResponse>>(() => initialHistoryState());
  const [authRequired, setAuthRequired] = useState(false);
  const [authLoginUrl, setAuthLoginUrl] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const latestAbortRef = useRef<AbortController | null>(null);
  const historyAbortRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef(0);
  const historyRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      latestAbortRef.current?.abort();
      historyAbortRef.current?.abort();
    };
  }, []);

  function clearAuthFlags() {
    setAuthRequired(false);
    setAuthLoginUrl(null);
    setAccessDenied(false);
  }

  function recordAuthError(error: NormalizedRequestError) {
    if (error.kind === 'auth') {
      setAuthRequired(true);
      setAuthLoginUrl(error.loginUrl || null);
      return;
    }
    if (error.kind === 'forbidden') {
      setAccessDenied(true);
    }
  }

  async function fetchLatest(params: { background?: boolean } = {}): Promise<void> {
    const background = params.background ?? false;
    latestAbortRef.current?.abort();
    const controller = new AbortController();
    latestAbortRef.current = controller;
    const requestId = ++latestRequestIdRef.current;

    setLatest((current) => ({
      ...current,
      status: current.data || current.notFound || background ? current.status : 'loading',
      error: null,
    }));

    try {
      const response = await getMetricsLatest({ server, signal: controller.signal });
      if (requestId !== latestRequestIdRef.current) {
        return;
      }
      clearAuthFlags();
      setLatest({ status: 'success', data: response, error: null, notFound: null });
    } catch (error) {
      if (isAbortError(error) || requestId !== latestRequestIdRef.current) {
        return;
      }
      const normalized = normalizeRequestError(error);
      if (normalized.kind === 'unknown' && normalized.message === 'Request canceled.') {
        return;
      }
      recordAuthError(normalized);

      if (normalized.kind === 'not_found') {
        const payload = asLatestNotFoundPayload(normalized.data);
        if (payload) {
          setLatest({
            status: 'success',
            data: null,
            error: null,
            notFound: payload,
          });
          return;
        }
      }

      setLatest((current) => ({
        ...current,
        status: current.data || current.notFound ? current.status : 'error',
        error: normalized,
      }));
    }
  }

  async function fetchHistory(params: { background?: boolean } = {}): Promise<void> {
    const background = params.background ?? false;
    historyAbortRef.current?.abort();
    const controller = new AbortController();
    historyAbortRef.current = controller;
    const requestId = ++historyRequestIdRef.current;

    setHistory((current) => ({
      ...current,
      status: current.data || background ? current.status : 'loading',
      error: null,
    }));

    try {
      const response = await getMetricsHistory({ server, minutes, signal: controller.signal });
      if (requestId !== historyRequestIdRef.current) {
        return;
      }
      clearAuthFlags();
      setHistory({ status: 'success', data: response, error: null });
    } catch (error) {
      if (isAbortError(error) || requestId !== historyRequestIdRef.current) {
        return;
      }
      const normalized = normalizeRequestError(error);
      if (normalized.kind === 'unknown' && normalized.message === 'Request canceled.') {
        return;
      }
      recordAuthError(normalized);
      setHistory((current) => ({
        ...current,
        status: current.data ? current.status : 'error',
        error: normalized,
      }));
    }
  }

  async function refreshAll(params: { background?: boolean } = {}): Promise<void> {
    setIsRefreshing(true);
    await Promise.allSettled([
      fetchLatest({ background: params.background }),
      fetchHistory({ background: params.background }),
    ]);
    setIsRefreshing(false);
  }

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, minutes]);

  usePolling(
    () => {
      void fetchLatest({ background: true });
    },
    5000,
    !authRequired && !accessDenied,
  );

  usePolling(
    () => {
      void fetchHistory({ background: true });
    },
    30000,
    !authRequired && !accessDenied,
  );

  const servers =
    latest.data?.servers ?? latest.notFound?.servers ?? history.data?.servers ?? [];
  const selectedServer =
    latest.data?.selected_server ?? latest.notFound?.selected_server ?? history.data?.selected_server ?? null;

  const isInitialLoading =
    (latest.status === 'loading' || latest.status === 'idle') &&
    (history.status === 'loading' || history.status === 'idle') &&
    !latest.data &&
    !latest.notFound &&
    !history.data;

  return {
    latest,
    history,
    servers,
    selectedServer,
    authRequired,
    authLoginUrl,
    accessDenied,
    isInitialLoading,
    isRefreshing,
    refreshAll: () => refreshAll(),
    refreshLatest: () => fetchLatest(),
    refreshHistory: () => fetchHistory(),
  };
}

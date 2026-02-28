type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel =
  (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined)?.toLowerCase() ??
  (import.meta.env.MODE === 'production' ? 'info' : 'debug');

const THRESHOLD = LEVEL_ORDER[envLevel as LogLevel] ?? LEVEL_ORDER.info;

function emit(level: LogLevel, ...args: unknown[]) {
  if (LEVEL_ORDER[level] < THRESHOLD) return;
  const method =
    level === 'debug' ? 'debug' : level === 'info' ? 'info' : level === 'warn' ? 'warn' : 'error';
  // eslint-disable-next-line no-console
  console[method](`[ui:${level}]`, ...args);
}

export const logDebug = (...args: unknown[]) => emit('debug', ...args);
export const logInfo = (...args: unknown[]) => emit('info', ...args);
export const logWarn = (...args: unknown[]) => emit('warn', ...args);
export const logError = (...args: unknown[]) => emit('error', ...args);

export function reportError(message: string, error?: unknown, context?: Record<string, unknown>) {
  emit('error', message, { error, ...context });
}

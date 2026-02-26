import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, delayMs: number, enabled = true) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || delayMs <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      callbackRef.current();
    }, delayMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [delayMs, enabled]);
}

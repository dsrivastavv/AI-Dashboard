import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import LoginCard from '../components/auth/LoginCard';
import { getServers, authLogin, authRegister, authForgotPassword } from '../lib/api';
import { normalizeRequestError } from '../lib/http';
import { logError, logInfo } from '../lib/logger';

function sanitizeNextPath(nextParam: string | null): string {
  const next = (nextParam || '').trim();
  if (!next.startsWith('/')) {
    return '/dashboard';
  }
  if (next.startsWith('/login')) {
    return '/dashboard';
  }
  return next;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [probeAccessDenied, setProbeAccessDenied] = useState(false);

  // Auth action state
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const nextPath = useMemo(() => sanitizeNextPath(searchParams.get('next')), [searchParams]);
  const accessDeniedFromQuery = searchParams.get('access_denied') === '1';
  const showAccessDenied = accessDeniedFromQuery || probeAccessDenied;

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function probeSession() {
      setIsCheckingSession(true);
      setProbeAccessDenied(false);

      try {
        await getServers(controller.signal);
        if (!isMounted) return;
        logInfo('Existing session detected; redirecting', { nextPath });
        navigate(nextPath, { replace: true });
      } catch (error) {
        if (!isMounted) return;
        const normalized = normalizeRequestError(error);
        if (normalized.kind === 'forbidden') {
          setProbeAccessDenied(true);
        } else if (normalized.kind === 'auth') {
          // Not logged in — expected, show login page
        } else if (normalized.kind !== 'unknown' || normalized.message !== 'Request canceled.') {
          setAuthError(normalized.message);
          logError('Session probe failed', normalized, { nextPath });
        }
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    }

    void probeSession();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate, nextPath]);

  function handleGoogleSignIn() {
    const nextAbsolute = new URL(nextPath, window.location.origin).toString();
    const url = `/accounts/google/login/?next=${encodeURIComponent(nextAbsolute)}`;
    window.location.assign(url);
  }

  async function handleCredentialSignIn(username: string, password: string) {
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      await authLogin(username, password);
      logInfo('Credential sign-in success', { username });
      navigate(nextPath, { replace: true });
    } catch (err) {
      setAuthError(normalizeRequestError(err).message);
      logError('Credential sign-in failed', err, { username });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(username: string, email: string, password: string) {
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      await authRegister(username, email, password);
      logInfo('User registered via UI', { username, email });
      setAuthSuccess('Account created! You can now sign in.');
    } catch (err) {
      setAuthError(normalizeRequestError(err).message);
      logError('Registration failed', err, { username, email });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleForgotPassword(email: string) {
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await authForgotPassword(email);
      setAuthSuccess((res as { message?: string }).message ?? 'If that email is registered, a reset link has been sent.');
      logInfo('Password reset requested', { email });
    } catch (err) {
      setAuthError(normalizeRequestError(err).message);
      logError('Password reset failed', err, { email });
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <LoginCard
      showAccessDenied={showAccessDenied}
      isCheckingSession={isCheckingSession}
      isLoading={authLoading}
      error={authError}
      successMessage={authSuccess}
      onGoogleSignIn={handleGoogleSignIn}
      onCredentialSignIn={handleCredentialSignIn}
      onRegister={handleRegister}
      onForgotPassword={handleForgotPassword}
    />
  );
}

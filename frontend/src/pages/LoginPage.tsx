import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import LoginCard from '../components/auth/LoginCard';
import ErrorState from '../components/common/ErrorState';
import { getServers } from '../lib/api';
import { normalizeRequestError } from '../lib/http';

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
  const [probeError, setProbeError] = useState<string | null>(null);
  const [probeAccessDenied, setProbeAccessDenied] = useState(false);

  const nextPath = useMemo(() => sanitizeNextPath(searchParams.get('next')), [searchParams]);
  const accessDeniedFromQuery = searchParams.get('access_denied') === '1';
  const showAccessDenied = accessDeniedFromQuery || probeAccessDenied;

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function probeSession() {
      setIsCheckingSession(true);
      setProbeError(null);
      setProbeAccessDenied(false);

      try {
        await getServers(controller.signal);
        if (!isMounted) {
          return;
        }
        navigate(nextPath, { replace: true });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        const normalized = normalizeRequestError(error);
        if (normalized.kind === 'auth') {
          setProbeError(null);
        } else if (normalized.kind === 'forbidden') {
          setProbeAccessDenied(true);
          setProbeError(null);
        } else if (normalized.kind !== 'unknown' || normalized.message !== 'Request canceled.') {
          setProbeError(normalized.message);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
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

  return (
    <div className="min-vh-100 login-bg d-flex align-items-center py-4 py-lg-5 login-page-shell">
      <div className="container-xl">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            {probeError ? (
              <div className="mb-3">
                <ErrorState
                  title="Backend Unreachable"
                  message={probeError}
                  actions={
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </button>
                  }
                />
              </div>
            ) : null}

            <LoginCard
              showAccessDenied={showAccessDenied}
              isCheckingSession={isCheckingSession}
              onGoogleSignIn={handleGoogleSignIn}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

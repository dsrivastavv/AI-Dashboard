import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface AuthGateProps {
  isBlocked: boolean;
  nextPath: string;
  children: ReactNode;
}

export default function AuthGate({ isBlocked, nextPath, children }: AuthGateProps) {
  if (isBlocked) {
    const search = new URLSearchParams();
    search.set('next', nextPath);
    return <Navigate to={`/login?${search.toString()}`} replace />;
  }

  return <>{children}</>;
}

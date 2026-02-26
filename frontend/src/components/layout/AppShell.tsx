import type { ReactNode } from 'react';

interface AppShellProps {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

export default function AppShell({ title, subtitle, headerActions, children }: AppShellProps) {
  return (
    <div className="min-vh-100 dashboard-bg py-4 py-lg-5">
      <div className="container-xl">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-4">
          <div>
            <p className="text-uppercase small text-body-secondary fw-semibold mb-1">AI Monitoring</p>
            <h1 className="h3 mb-1">{title}</h1>
            {subtitle ? <p className="text-body-secondary mb-0">{subtitle}</p> : null}
          </div>
          {headerActions ? <div className="w-100 w-lg-auto">{headerActions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';

interface AppShellProps {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  sidebar?: ReactNode;
  themeMode?: 'light' | 'dark';
  children: ReactNode;
}

export default function AppShell({
  title,
  subtitle,
  headerActions,
  sidebar,
  themeMode = 'light',
  children,
}: AppShellProps) {
  return (
    <div className={`min-vh-100 dashboard-bg py-4 py-lg-5 dashboard-app-shell theme-${themeMode}`}>
      <div className="container-xl">
        <div className="app-hero-card d-flex flex-column flex-lg-row justify-content-between align-items-start gap-3 mb-4">
          <div>
            <p className="hero-kicker mb-2">AI Dashboard</p>
            <h1 className="app-hero-title mb-2">{title}</h1>
            {subtitle ? <p className="hero-subtitle mb-2">{subtitle}</p> : null}
            <div className="hero-chip-row">
              <span className="hero-chip">Designed by Divyansh Srivastava</span>
              <span className="hero-chip hero-chip-soft">Real-time metrics interface</span>
            </div>
          </div>
          {headerActions ? <div className="w-100 w-lg-auto app-hero-actions">{headerActions}</div> : null}
        </div>

        {sidebar ? (
          <div className="dashboard-layout">
            <div className="dashboard-layout-sidebar">{sidebar}</div>
            <div className="dashboard-layout-main">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

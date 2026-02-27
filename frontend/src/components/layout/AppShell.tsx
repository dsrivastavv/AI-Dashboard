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
  themeMode = 'dark',
  children,
}: AppShellProps) {
  return (
    <div className={`app-root theme-${themeMode}`}>
      {sidebar ? (
        <nav className="app-sidebar" aria-label="Dashboard navigation">
          {sidebar}
        </nav>
      ) : null}

      <div className={`app-body${sidebar ? '' : ' app-body--no-sidebar'}`}>
        <header className="app-topbar">
          <div className="app-topbar-left">
            <h1 className="app-topbar-title">{title}</h1>
            {subtitle ? (
              <span className="app-topbar-subtitle d-none d-lg-inline">{subtitle}</span>
            ) : null}
          </div>
          {headerActions ? (
            <div className="app-topbar-right">{headerActions}</div>
          ) : null}
        </header>

        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}

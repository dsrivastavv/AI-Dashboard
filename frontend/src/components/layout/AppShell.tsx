import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { PRODUCT_NAME } from '../../config/branding';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile drawer whenever the user navigates to a different page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when the drawer is open on mobile
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Close on Escape key for accessibility
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen((v) => !v);

  // Keep browser title in sync with the active view
  useEffect(() => {
    const nextTitle = subtitle ? `${title} · ${subtitle} | ${PRODUCT_NAME}` : `${title} | ${PRODUCT_NAME}`;
    document.title = nextTitle;
  }, [title, subtitle]);

  return (
    <div className={`app-root theme-${themeMode}`}>
      <a href="#app-main" className="skip-link">Skip to content</a>

      {sidebar ? (
        <>
          <nav
            id="app-sidebar-nav"
            className={`app-sidebar${mobileMenuOpen ? ' is-mobile-open' : ''}`}
            aria-label="Dashboard navigation"
          >
            {sidebar}
          </nav>
          {mobileMenuOpen && (
            <div
              className="mobile-nav-backdrop"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
          )}
        </>
      ) : null}

      <div className={`app-body${sidebar ? '' : ' app-body--no-sidebar'}`}>
        <header className="app-topbar">
          <div className="app-topbar-left">
            {sidebar ? (
              <button
                type="button"
                className="hamburger-btn"
                onClick={toggleMobileMenu}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="app-sidebar-nav"
              >
                <span className={`hamburger-line${mobileMenuOpen ? ' hamburger-line--top-open' : ''}`} />
                <span className={`hamburger-line${mobileMenuOpen ? ' hamburger-line--mid-open' : ''}`} />
                <span className={`hamburger-line${mobileMenuOpen ? ' hamburger-line--bot-open' : ''}`} />
              </button>
            ) : null}
            <h1 className="app-topbar-title">{title}</h1>
            {subtitle ? (
              <span className="app-topbar-subtitle d-none d-lg-inline">{subtitle}</span>
            ) : null}
          </div>
          {headerActions ? (
            <div className="app-topbar-right">{headerActions}</div>
          ) : null}
        </header>

        <main id="app-main" className="app-main" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}

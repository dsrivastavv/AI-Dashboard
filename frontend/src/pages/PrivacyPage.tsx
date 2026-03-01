import AppShell from '../components/layout/AppShell';
import { LEGAL_PRODUCT_NAME, PRODUCT_NAME } from '../config/branding';

export default function PrivacyPage() {
  return (
    <AppShell title="Privacy Policy" subtitle={PRODUCT_NAME} themeMode="dark">
      <div className="app-main-inner d-flex flex-column gap-3">
        <section className="panel-card p-4" aria-labelledby="privacy-intro">
          <h1 id="privacy-intro" className="panel-title mb-2">Privacy Policy</h1>
          <p className="panel-caption mb-3">Last updated: February 28, 2026</p>
          <p>
            {LEGAL_PRODUCT_NAME} is operated for internal monitoring. We collect only the
            minimum telemetry needed to render this dashboard and do not sell or share data with
            third parties.
          </p>
        </section>

        <section className="panel-card p-4" aria-labelledby="privacy-collect">
          <h2 id="privacy-collect" className="h6 mb-2">Data We Collect</h2>
          <ul className="mb-0">
            <li>Server metrics you choose to send (CPU, GPU, memory, disk, network).</li>
            <li>Authentication identifiers from Google SSO to verify access.</li>
            <li>Basic request logs for reliability and security troubleshooting.</li>
          </ul>
        </section>

        <section className="panel-card p-4" aria-labelledby="privacy-use">
          <h2 id="privacy-use" className="h6 mb-2">How We Use Data</h2>
          <ul className="mb-0">
            <li>Render real-time dashboards and alerts.</li>
            <li>Maintain security, audit access, and prevent abuse.</li>
            <li>Improve service reliability and performance.</li>
          </ul>
        </section>

        <section className="panel-card p-4" aria-labelledby="privacy-sharing">
          <h2 id="privacy-sharing" className="h6 mb-2">Sharing &amp; Transfers</h2>
          <p className="mb-0">We do not sell data. We share it only as required by law or to operate infrastructure we control.</p>
        </section>

        <section className="panel-card p-4" aria-labelledby="privacy-cookies">
          <h2 id="privacy-cookies" className="h6 mb-2">Cookies</h2>
          <p className="mb-0">Session cookies are used solely for authentication and expire when you sign out or the session ends.</p>
        </section>

        <section className="panel-card p-4" aria-labelledby="privacy-security">
          <h2 id="privacy-security" className="h6 mb-2">Security</h2>
          <p className="mb-0">Access is restricted via allowlisted Google accounts. Metrics are transmitted over TLS.</p>
        </section>

        <section className="panel-card p-4" aria-labelledby="privacy-changes">
          <h2 id="privacy-changes" className="h6 mb-2">Changes</h2>
          <p className="mb-0">We may update this policy. Material changes will be reflected on this page with a new date.</p>
        </section>

        <section className="panel-card p-4" aria-labelledby="privacy-contact">
          <h2 id="privacy-contact" className="h6 mb-2">Contact</h2>
          <p className="mb-0">For privacy questions or requests, contact the dashboard administrator.</p>
        </section>
      </div>
    </AppShell>
  );
}

import AppShell from '../components/layout/AppShell';
import { LEGAL_PRODUCT_NAME, PRODUCT_NAME } from '../config/branding';

export default function TermsPage() {
  return (
    <AppShell title="Terms of Service" subtitle={PRODUCT_NAME} themeMode="dark">
      <div className="app-main-inner d-flex flex-column gap-3">
        <section className="panel-card p-4" aria-labelledby="terms-intro">
          <h1 id="terms-intro" className="panel-title mb-2">Terms of Service</h1>
          <p className="panel-caption mb-3">Last updated: February 28, 2026</p>
          <p className="mb-0">
            These Terms govern your use of {LEGAL_PRODUCT_NAME}. By accessing the dashboard you
            agree to these Terms.
          </p>
        </section>

        <section className="panel-card p-4" aria-labelledby="terms-access">
          <h2 id="terms-access" className="h6 mb-2">Access &amp; Eligibility</h2>
          <ul className="mb-0">
            <li>Access is limited to allowlisted Google accounts provided by the administrator.</li>
            <li>You must protect your credentials and promptly report any unauthorized access.</li>
          </ul>
        </section>

        <section className="panel-card p-4" aria-labelledby="terms-acceptable">
          <h2 id="terms-acceptable" className="h6 mb-2">Acceptable Use</h2>
          <ul className="mb-0">
            <li>Do not attempt to disrupt the service or other users.</li>
            <li>Only send metrics from servers you are authorized to monitor.</li>
            <li>No reverse engineering or resale of the service.</li>
          </ul>
        </section>

        <section className="panel-card p-4" aria-labelledby="terms-data">
          <h2 id="terms-data" className="h6 mb-2">Data &amp; Ownership</h2>
          <p className="mb-0">
            You retain ownership of metrics you send. {LEGAL_PRODUCT_NAME} may process and display them to
            operate the dashboard.
          </p>
        </section>

        <section className="panel-card p-4" aria-labelledby="terms-disclaimer">
          <h2 id="terms-disclaimer" className="h6 mb-2">Disclaimer</h2>
          <p className="mb-0">The service is provided “as is” without warranties of any kind.</p>
        </section>

        <section className="panel-card p-4" aria-labelledby="terms-liability">
          <h2 id="terms-liability" className="h6 mb-2">Limitation of Liability</h2>
          <p className="mb-0">
            To the maximum extent permitted by law, {LEGAL_PRODUCT_NAME} is not liable for indirect,
            incidental, or consequential damages arising from your use of the dashboard.
          </p>
        </section>

        <section className="panel-card p-4" aria-labelledby="terms-termination">
          <h2 id="terms-termination" className="h6 mb-2">Termination</h2>
          <p className="mb-0">Access may be revoked at any time for policy violations or security concerns.</p>
        </section>

        <section className="panel-card p-4" aria-labelledby="terms-changes">
          <h2 id="terms-changes" className="h6 mb-2">Changes</h2>
          <p className="mb-0">We may update these Terms. Continued use after changes means you accept them.</p>
        </section>

        <section className="panel-card p-4" aria-labelledby="terms-contact">
          <h2 id="terms-contact" className="h6 mb-2">Contact</h2>
          <p className="mb-0">Questions about these Terms can be directed to the dashboard administrator.</p>
        </section>
      </div>
    </AppShell>
  );
}

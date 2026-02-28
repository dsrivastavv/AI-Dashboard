import { useMemo, useState } from 'react';
import { registerServer } from '../../lib/api';
import { normalizeRequestError } from '../../lib/http';
import type { RegisterServerResponse } from '../../types/api';
import { logError, logInfo } from '../../lib/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (server: RegisterServerResponse) => void;
}

export default function ServerCreateModal({ isOpen, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [hostname, setHostname] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterServerResponse | null>(null);

  const canSubmit = name.trim().length > 0 && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await registerServer({
        name: name.trim(),
        slug: slug.trim() || undefined,
        hostname: hostname.trim() || undefined,
        description: description.trim() || undefined,
      });
      setResult(res);
      onCreated(res);
      logInfo('Server created', { slug: res.server.slug });
    } catch (err) {
      const normalized = normalizeRequestError(err);
      setError(normalized.message);
      logError('Server create failed', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetAndClose() {
    setName('');
    setSlug('');
    setHostname('');
    setDescription('');
    setResult(null);
    setError(null);
    onClose();
  }

  const displayCommand = useMemo(() => result?.agent_command ?? '', [result]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Add Monitored Server</h3>
          <button type="button" className="modal-close" onClick={resetAndClose} aria-label="Close">×</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="modal-label" htmlFor="server-name">Name *</label>
          <input
            id="server-name"
            className="modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="GPU Box 01"
            required
          />

          <label className="modal-label" htmlFor="server-slug">Slug (optional)</label>
          <input
            id="server-slug"
            className="modal-input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="gpu-box-01"
          />

          <label className="modal-label" htmlFor="server-hostname">Hostname (optional)</label>
          <input
            id="server-hostname"
            className="modal-input"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="trainer01.local"
          />

          <label className="modal-label" htmlFor="server-description">Description (optional)</label>
          <textarea
            id="server-description"
            className="modal-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="8xA100 training node"
            rows={2}
          />

          {error ? <div className="modal-error" role="alert">{error}</div> : null}

          <button type="submit" className="modal-submit" disabled={!canSubmit}>
            {isSubmitting ? 'Creating…' : 'Create server & generate token'}
          </button>
        </form>

        {result && (
          <div className="modal-result">
            <div className="modal-result-row">
              <span className="modal-result-label">Ingest Token</span>
              <code className="modal-code">{result.ingest_token}</code>
              <button
                type="button"
                className="modal-copy-btn"
                onClick={() => navigator.clipboard.writeText(result.ingest_token)}
              >Copy</button>
            </div>
            <div className="modal-result-row">
              <span className="modal-result-label">Agent Command</span>
              <code className="modal-code modal-code--wide">{displayCommand}</code>
              <button
                type="button"
                className="modal-copy-btn"
                onClick={() => navigator.clipboard.writeText(displayCommand)}
              >Copy</button>
            </div>
            <div className="modal-hint">Run the command on the target machine to start the agent.</div>
          </div>
        )}
      </div>
    </div>
  );
}

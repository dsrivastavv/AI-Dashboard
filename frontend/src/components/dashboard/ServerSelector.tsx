import type { ServerSummary } from '../../types/api';

interface ServerSelectorProps {
  servers: ServerSummary[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export default function ServerSelector({
  servers,
  value,
  onChange,
  disabled = false,
}: ServerSelectorProps) {
  return (
    <div>
      <label htmlFor="server-selector" className="form-label small text-body-secondary mb-1">
        Server
      </label>
      <select
        id="server-selector"
        className="form-select"
        value={value ?? ''}
        disabled={disabled || servers.length === 0}
        onChange={(event) => onChange(event.target.value || null)}
      >
        {servers.length === 0 ? <option value="">No servers</option> : null}
        {servers.map((server) => (
          <option key={server.id} value={server.slug}>
            {server.name} ({server.slug})
          </option>
        ))}
      </select>
    </div>
  );
}

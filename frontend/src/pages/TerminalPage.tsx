import { Terminal } from 'lucide-react';

export default function TerminalPage() {
  return (
    <div className="terminal-wip">
      <div className="terminal-wip-icon" aria-hidden="true">
        <Terminal size={40} strokeWidth={1.5} />
      </div>
      <h2 className="terminal-wip-heading">Work in progress</h2>
      <p className="terminal-wip-desc">
        The interactive terminal is under construction. Check back soon.
      </p>
    </div>
  );
}

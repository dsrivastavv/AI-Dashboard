import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  actions?: ReactNode;
}

export default function EmptyState({ title, message, actions }: EmptyStateProps) {
  return (
    <div className="card shadow-sm border-0 border-dashed-subtle">
      <div className="card-body p-4 text-center">
        <h2 className="h5 mb-2">{title}</h2>
        <p className="text-body-secondary mb-3">{message}</p>
        {actions}
      </div>
    </div>
  );
}

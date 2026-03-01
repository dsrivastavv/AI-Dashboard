import type { ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  actions?: ReactNode;
}

export default function ErrorState({ title = 'Something went wrong', message, actions }: ErrorStateProps) {
  return (
    <div className="state-card state-card--error">
      <div className="card-body p-4">
        <h2 className="h5 mb-2">{title}</h2>
        <p className="text-body-secondary mb-3">{message}</p>
        {actions}
      </div>
    </div>
  );
}

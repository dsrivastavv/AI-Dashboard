interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({ label = 'Loading dashboard data...' }: LoadingStateProps) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center text-body-secondary gap-3">
      <div className="spinner-border" role="status" aria-hidden="true" />
      <p className="mb-0">{label}</p>
    </div>
  );
}

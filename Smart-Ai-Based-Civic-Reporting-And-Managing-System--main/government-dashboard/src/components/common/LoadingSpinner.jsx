export default function LoadingSpinner({ message = 'Loading...', className = 'mt-3', small = false }) {
  const sizeClass = small ? 'spinner-border-sm' : '';

  return (
    <div className={`d-flex align-items-center gap-2 ${className}`.trim()}>
      <div className={`spinner-border ${sizeClass}`.trim()} role="status" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

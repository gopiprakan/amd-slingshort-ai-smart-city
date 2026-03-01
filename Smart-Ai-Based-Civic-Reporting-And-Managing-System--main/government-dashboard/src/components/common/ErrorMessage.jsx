export default function ErrorMessage({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="alert alert-danger mt-3 mb-0" role="alert">
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <span>{message}</span>
        {onRetry ? (
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const getScoreClass = (score) => {
  if (score >= 80) return { text: 'text-success', bg: 'bg-success' };
  if (score >= 60) return { text: 'text-warning', bg: 'bg-warning' };
  return { text: 'text-danger', bg: 'bg-danger' };
};

export default function DepartmentPerformance({ data, loading, error, onRetry }) {
  const departments = Array.isArray(data) ? data : [];

  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="card-title">🏆 Department Performance</h5>

        {loading ? (
          <LoadingSpinner className="mt-3" message="Loading..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={onRetry} />
        ) : departments.length === 0 ? (
          <p className="mt-3 mb-0 text-muted">No performance data</p>
        ) : (
          <div className="row g-3 mt-1">
            {departments.map((item) => {
              const score = Number(item.performance_score ?? 0);
              const scoreClass = getScoreClass(score);

              return (
                <div key={item.department} className="col-12 col-lg-6">
                  <div className="border rounded p-3 h-100">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{item.department}</h6>
                        <small className="text-muted">Avg Resolution: {item.avg_resolution_hours}h</small>
                      </div>
                      <div className={`fw-bold fs-4 ${scoreClass.text}`}>{score}</div>
                    </div>

                    <div className="progress mt-3" style={{ height: '10px' }}>
                      <div
                        className={`progress-bar ${scoreClass.bg}`}
                        role="progressbar"
                        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                        aria-valuenow={score}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>

                    <div className="d-flex flex-wrap gap-3 mt-3">
                      <small className="text-muted">Resolution Rate: {item.resolution_rate}%</small>
                      <small className="text-muted">Violations: {item.sla_violations}</small>
                      <small className="text-muted">Escalations: {item.escalations}</small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

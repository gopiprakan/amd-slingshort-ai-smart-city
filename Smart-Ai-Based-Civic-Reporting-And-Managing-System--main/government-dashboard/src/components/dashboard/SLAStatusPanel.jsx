import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

export default function SLAStatusPanel({ data, loading, error, onRetry }) {
  const violations = data?.violations ?? [];
  const totalViolations = data?.total_violations ?? 0;
  const totalAtRisk = data?.total_at_risk ?? 0;

  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="card-title">SLA Monitoring</h5>

        {loading ? (
          <LoadingSpinner className="mt-3" message="Loading..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={onRetry} />
        ) : (
          <>
            <div className="row g-3 mt-1">
              <div className="col-12 col-md-6">
                <div className="card border-danger">
                  <div className="card-body">
                    <h6 className="card-title mb-1">SLA Violations</h6>
                    <h3 className="text-danger mb-0">{totalViolations}</h3>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="card border-warning">
                  <div className="card-body">
                    <h6 className="card-title mb-1">SLA At Risk</h6>
                    <h3 className="text-warning mb-0">{totalAtRisk}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <h6 className="mb-2">Top 5 Violations</h6>
              {violations.length === 0 ? (
                <p className="text-muted mb-0">No SLA violations</p>
              ) : (
                <div className="list-group list-group-flush">
                  {violations.slice(0, 5).map((item) => (
                    <div
                      key={item.complaint_id}
                      className="list-group-item px-0 border-start border-4 border-danger"
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="fw-semibold text-danger">Complaint #{item.complaint_id}</div>
                          <small className="text-muted d-block">Priority: {item.priority_level}</small>
                          <small className="text-muted d-block">Department: {item.department_id}</small>
                          <small className="text-muted d-block">Status: {item.status}</small>
                        </div>
                        <div className="text-end">
                          <small className="d-block text-danger">{item.hours_pending}h pending</small>
                          <small className="text-muted">SLA: {item.sla_limit}h</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

export default function EscalationPanel({ data, loading, error, onRetry }) {
  const escalatedCount = data?.escalated_count ?? 0;
  const escalatedComplaints = data?.escalated_complaints ?? [];

  return (
    <div className="card h-100 border-danger">
      <div className="card-body bg-danger bg-opacity-10">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">🔥 Escalated Complaints</h5>
          <span className="badge bg-danger">{escalatedCount}</span>
        </div>

        {loading ? (
          <LoadingSpinner className="mt-3" message="Loading..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={onRetry} />
        ) : escalatedComplaints.length === 0 ? (
          <p className="mt-3 mb-0">No escalated complaints</p>
        ) : (
          <div className="list-group list-group-flush mt-3">
            {escalatedComplaints.slice(0, 5).map((item) => (
              <div
                key={item.complaint_id}
                className="list-group-item px-0 border-start border-4 border-danger bg-transparent"
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <div className="fw-semibold text-danger">⚠ Complaint #{item.complaint_id}</div>
                    <small className="text-muted d-block">Priority: {item.priority_level}</small>
                    <small className="text-muted d-block">Department: {item.department_id}</small>
                    <small className="text-muted d-block">Status: {item.status}</small>
                  </div>
                  <div className="text-end">
                    <small className="d-block text-danger">{item.hours_pending}h</small>
                    <small className="text-muted d-block">SLA: {item.sla_limit}h</small>
                    <small className="text-muted">Esc: {item.escalation_threshold}h</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

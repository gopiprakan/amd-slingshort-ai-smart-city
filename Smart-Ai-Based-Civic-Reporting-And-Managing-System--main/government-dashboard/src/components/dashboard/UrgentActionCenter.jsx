const getPriorityBadgeClass = (priority) => {
  const normalized = String(priority || '').toLowerCase();

  if (normalized === 'critical') return 'bg-danger';
  if (normalized === 'high') return 'bg-warning text-dark';
  if (normalized === 'medium') return 'bg-info text-dark';
  return 'bg-secondary';
};

const getBorderClass = (priority) => {
  const normalized = String(priority || '').toLowerCase();

  if (normalized === 'critical') return 'border-danger';
  if (normalized === 'high') return 'border-warning';
  return 'border-light';
};

export default function UrgentActionCenter({ urgentComplaints }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="card-title">Urgent Action Center</h5>
        {urgentComplaints.length === 0 ? (
          <p className="mb-0">✅ No urgent complaints</p>
        ) : (
          <div className="list-group list-group-flush">
            {urgentComplaints.map((complaint) => (
              <div
                key={complaint.complaint_id}
                className={`list-group-item px-0 border-start border-4 ${getBorderClass(complaint.priority_level)}`}
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <div className="fw-semibold">Complaint #{complaint.complaint_id}</div>
                    <div>{complaint.description}</div>
                    <small className="text-muted d-block">Department: {complaint.department_id}</small>
                    <small className="text-muted d-block">Status: {complaint.status}</small>
                    <small className="text-muted d-block">Hours Pending: {complaint.hours_pending}</small>
                    <small className="text-muted d-block">Submitted: {complaint.submitted_time}</small>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-2">
                    <span className={`badge ${getPriorityBadgeClass(complaint.priority_level)}`}>
                      {complaint.priority_level}
                    </span>
                    <button type="button" className="btn btn-sm btn-outline-primary">Assign Team</button>
                    <button type="button" className="btn btn-sm btn-outline-secondary">Open Complaint</button>
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

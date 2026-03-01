export default function QuickActions({ onAction, busy = false }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="card-title">⚡ Quick Actions</h5>
        <div className="row g-2 mt-1">
          <div className="col-12 col-md-6 col-xl-4">
            <button type="button" className="btn btn-primary w-100" onClick={() => onAction('all')} disabled={busy}>
              <i className="bi bi-list-ul me-2" />
              View All Complaints
            </button>
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <button type="button" className="btn btn-warning w-100" onClick={() => onAction('pending')} disabled={busy}>
              <i className="bi bi-clock me-2" />
              Assign Pending Complaints
            </button>
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <button type="button" className="btn btn-danger w-100" onClick={() => onAction('critical')} disabled={busy}>
              <i className="bi bi-exclamation-triangle me-2" />
              Critical Complaints
            </button>
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <button type="button" className="btn btn-primary w-100" onClick={() => onAction('heatmap')} disabled={busy}>
              <i className="bi bi-geo-alt me-2" />
              Open Heatmap
            </button>
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <button type="button" className="btn btn-success w-100" onClick={() => onAction('export')} disabled={busy}>
              <i className="bi bi-download me-2" />
              Export Complaints CSV
            </button>
          </div>
          <div className="col-12 col-md-6 col-xl-4">
            <button type="button" className="btn btn-secondary w-100" onClick={() => onAction('refresh')} disabled={busy}>
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  return (
    <nav className="navbar navbar-dark bg-primary">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <i className="bi bi-shield-lock-fill text-white me-3" style={{ fontSize: '2rem' }}></i>
          <div>
            <div className="navbar-brand mb-0 h1">Municipal Corporation</div>
            <small className="text-white d-block" style={{ fontSize: '0.85rem', fontWeight: '400', letterSpacing: '0.3px' }}>
              Smart Governance & Complaint Intelligence System
            </small>
          </div>
        </div>
        <div className="text-white text-end">
          <div className="mb-2">
            <small style={{ fontSize: '0.75rem', fontWeight: '500' }}>Logged in as: Municipal Officer</small>
            <br />
            <small style={{ fontSize: '0.7rem', fontWeight: '400', opacity: '0.9' }}>Role: City Operations Manager</small>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Urban Development Department
          </div>
          <div className="d-flex align-items-center justify-content-end mt-1">
            <span className="status-dot"></span>
            <small style={{ fontSize: '0.75rem', fontWeight: '500' }}>System Status: Operational</small>
          </div>
        </div>
      </div>
    </nav>
  );
}

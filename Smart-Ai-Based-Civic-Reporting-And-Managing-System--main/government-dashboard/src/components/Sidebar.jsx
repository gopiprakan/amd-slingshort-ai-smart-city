export default function Sidebar({ setActivePage }) {
  return (
    <div className="sidebar-container bg-light border-end">
      <div className="sidebar-logo-container">
        <img 
          src="/pngwing.com.png" 
          alt="Swachh Bharat Mission" 
          className="sidebar-logo"
        />
      </div>
      <div className="list-group list-group-flush">
        <button 
          className="list-group-item list-group-item-action" 
          onClick={() => setActivePage('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className="list-group-item list-group-item-action" 
          onClick={() => setActivePage('complaints')}
        >
          Complaints
        </button>
        <button 
          className="list-group-item list-group-item-action" 
          onClick={() => setActivePage('analytics')}
        >
          Analytics
        </button>
        <button 
          className="list-group-item list-group-item-action" 
          onClick={() => setActivePage('heatmap')}
        >
          Heatmap
        </button>
      </div>
    </div>
  );
}

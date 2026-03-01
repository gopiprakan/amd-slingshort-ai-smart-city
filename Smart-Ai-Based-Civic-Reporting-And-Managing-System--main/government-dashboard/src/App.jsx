import { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import Analytics from './pages/Analytics';
import Heatmap from './pages/Heatmap';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [complaintsFilter, setComplaintsFilter] = useState(null);

  const renderPage = () => {
    if (activePage === 'dashboard') {
      return (
        <Dashboard
          setActivePage={setActivePage}
          setComplaintsFilter={setComplaintsFilter}
        />
      );
    }
    if (activePage === 'complaints') {
      return (
        <Complaints
          navigationFilter={complaintsFilter}
          clearNavigationFilter={() => setComplaintsFilter(null)}
        />
      );
    }
    if (activePage === 'analytics') return <Analytics />;
    if (activePage === 'heatmap') return <Heatmap />;
  };

  return (
    <div className="app-layout">
      <div className="sidebar">
        <Sidebar setActivePage={setActivePage} />
      </div>
      <div className="main-wrapper">
        <Navbar />
        <div className="content-area">
          {renderPage()}
        </div>
        <Footer />
      </div>
    </div>
  );
}

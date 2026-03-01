import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllComplaints, getComplaintStats } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { logError } from '../utils/logger';

const GENERIC_ERROR = 'Unable to load analytics data. Please try again.';

export default function Analytics() {
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError('');

    try {
      const [statsData, complaintsData] = await Promise.all([
        getComplaintStats(),
        getAllComplaints(),
      ]);

      if (!mountedRef.current) return;

      setStats(statsData);
      setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
    } catch (fetchError) {
      logError('Failed to load analytics data', { message: fetchError?.message });
      if (!mountedRef.current) return;
      setError(fetchError?.message || GENERIC_ERROR);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const kpis = {
    total: stats?.total || 0,
    critical: stats?.by_priority?.Critical || 0,
    high: stats?.by_priority?.High || 0,
    medium: stats?.by_priority?.Medium || 0,
    low: stats?.by_priority?.Low || 0,
  };

  const departmentData = useMemo(() => {
    const grouped = complaints.reduce((acc, complaint) => {
      const key = String(complaint.department_id ?? 'Unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, complaintsCount]) => ({
      name,
      complaints: complaintsCount,
    }));
  }, [complaints]);

  const priorityData = [
    { name: 'Critical', value: kpis.critical },
    { name: 'High', value: kpis.high },
    { name: 'Medium', value: kpis.medium },
    { name: 'Low', value: kpis.low },
  ];

  const COLORS = ['#dc3545', '#fd7e14', '#0dcaf0', '#198754'];

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <h2>Analytics Dashboard</h2>
        <LoadingSpinner className="mt-4" message="Loading..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4">
        <h2>Analytics Dashboard</h2>
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <h2>Analytics Dashboard</h2>

      <div className="row mt-4">
        <div className="col-md-2">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <h5 className="card-title">Total Complaints</h5>
              <h2>{kpis.total}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-white bg-danger">
            <div className="card-body">
              <h5 className="card-title">Critical</h5>
              <h2>{kpis.critical}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-white bg-warning">
            <div className="card-body">
              <h5 className="card-title">High</h5>
              <h2>{kpis.high}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-white bg-info">
            <div className="card-body">
              <h5 className="card-title">Medium</h5>
              <h2>{kpis.medium}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-white bg-success">
            <div className="card-body">
              <h5 className="card-title">Low</h5>
              <h2>{kpis.low}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Complaints by Department</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="complaints" fill="#0d6efd" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Complaints by Priority</h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

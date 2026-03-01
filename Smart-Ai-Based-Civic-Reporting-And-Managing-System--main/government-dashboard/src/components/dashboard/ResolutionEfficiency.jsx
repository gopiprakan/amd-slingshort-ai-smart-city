import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

export default function ResolutionEfficiency({ data, loading, error, onRetry }) {
  const overallAvg = data?.overall_avg_resolution_hours ?? 0;
  const priorityData = (data?.avg_resolution_by_priority ?? []).map((item) => ({
    priority: item.priority_level,
    avg_resolution_hours: item.avg_resolution_hours ?? 0,
  }));
  const fastestDepartment = data?.fastest_department;
  const slowestDepartment = data?.slowest_department;

  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="card-title">⚡ Resolution Efficiency</h5>

        {loading ? (
          <LoadingSpinner className="mt-3" message="Loading..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={onRetry} />
        ) : (
          <>
            <div className="mb-3 mt-2">
              <small className="text-muted d-block">Overall Average Resolution Time</small>
              <h3 className="mb-0">{overallAvg}h</h3>
            </div>

            <div style={{ width: '100%', height: 280 }}>
              {priorityData.length === 0 ? (
                <p className="text-muted mt-2">No resolved complaint data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="avg_resolution_hours" fill="#0d6efd" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="row g-3 mt-1">
              <div className="col-12 col-md-6">
                <div className="border rounded p-2">
                  <small className="text-muted d-block">Fastest Department</small>
                  <span className="fw-semibold">{fastestDepartment?.department ?? 'N/A'}</span>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="border rounded p-2">
                  <small className="text-muted d-block">Slowest Department</small>
                  <span className="fw-semibold">{slowestDepartment?.department ?? 'N/A'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

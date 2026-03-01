import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

export default function DepartmentWorkload({ workload, loading, error, onRetry }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <h5 className="card-title">Department Workload</h5>

        {loading ? (
          <LoadingSpinner className="mt-3" message="Loading..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={onRetry} />
        ) : workload.length === 0 ? (
          <p className="text-muted mt-3 mb-0">No workload data</p>
        ) : (
          <div className="mt-3" style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" angle={-20} textAnchor="end" interval={0} height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="active" fill="#0d6efd" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

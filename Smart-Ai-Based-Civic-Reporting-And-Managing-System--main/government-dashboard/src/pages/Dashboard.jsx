import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getAllComplaints,
  getDashboardSummary,
  getDepartmentPerformance,
  getDepartmentWorkload,
  getEscalations,
  getResolutionEfficiency,
  getSLAStatus,
  getUrgentComplaints,
} from '../services/api';
import LiveKPIBar from '../components/dashboard/LiveKPIBar';
import UrgentActionCenter from '../components/dashboard/UrgentActionCenter';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import DepartmentWorkload from '../components/dashboard/DepartmentWorkload';
import SLAStatusPanel from '../components/dashboard/SLAStatusPanel';
import EscalationPanel from '../components/dashboard/EscalationPanel';
import DepartmentPerformance from '../components/dashboard/DepartmentPerformance';
import ResolutionEfficiency from '../components/dashboard/ResolutionEfficiency';
import QuickActions from '../components/dashboard/QuickActions';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { exportComplaintsToCSV } from '../utils/exportCSV';
import { logError } from '../utils/logger';

const GENERIC_ERROR = 'Unable to load dashboard data. Please try again.';

export default function Dashboard({ setActivePage, setComplaintsFilter }) {
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const [summary, setSummary] = useState(null);
  const [urgentData, setUrgentData] = useState({ urgent_count: 0, complaints: [] });
  const [workloadData, setWorkloadData] = useState([]);
  const [workloadLoading, setWorkloadLoading] = useState(true);
  const [workloadError, setWorkloadError] = useState('');
  const [slaData, setSlaData] = useState({ violations: [], at_risk: [], total_violations: 0, total_at_risk: 0 });
  const [slaLoading, setSlaLoading] = useState(true);
  const [slaError, setSlaError] = useState('');
  const [escalationData, setEscalationData] = useState({ escalated_count: 0, escalated_complaints: [] });
  const [escalationLoading, setEscalationLoading] = useState(true);
  const [escalationError, setEscalationError] = useState('');
  const [departmentPerformanceData, setDepartmentPerformanceData] = useState([]);
  const [departmentPerformanceLoading, setDepartmentPerformanceLoading] = useState(true);
  const [departmentPerformanceError, setDepartmentPerformanceError] = useState('');
  const [resolutionEfficiencyData, setResolutionEfficiencyData] = useState({
    avg_resolution_by_priority: [],
    fastest_department: null,
    slowest_department: null,
    overall_avg_resolution_hours: 0,
  });
  const [resolutionEfficiencyLoading, setResolutionEfficiencyLoading] = useState(true);
  const [resolutionEfficiencyError, setResolutionEfficiencyError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickActionBusy, setQuickActionBusy] = useState(false);

  const setIfMounted = (setter, value) => {
    if (!mountedRef.current) return;
    setter(value);
  };

  const fetchDashboardData = useCallback(async () => {
    setIfMounted(setLoading, true);
    setIfMounted(setError, '');

    try {
      const [summaryResponse, urgentResponse] = await Promise.all([
        getDashboardSummary(),
        getUrgentComplaints(),
      ]);

      setIfMounted(setSummary, summaryResponse);
      setIfMounted(setUrgentData, urgentResponse || { urgent_count: 0, complaints: [] });
    } catch (fetchError) {
      logError('Failed to load dashboard summary/urgent data', { message: fetchError?.message });
      setIfMounted(setError, fetchError?.message || GENERIC_ERROR);
    } finally {
      setIfMounted(setLoading, false);
    }
  }, []);

  const fetchWorkload = useCallback(async () => {
    setIfMounted(setWorkloadLoading, true);
    setIfMounted(setWorkloadError, '');

    try {
      const response = await getDepartmentWorkload();
      setIfMounted(setWorkloadData, Array.isArray(response) ? response : []);
    } catch (fetchError) {
      logError('Failed to load department workload', { message: fetchError?.message });
      setIfMounted(setWorkloadError, fetchError?.message || GENERIC_ERROR);
    } finally {
      setIfMounted(setWorkloadLoading, false);
    }
  }, []);

  const fetchSlaStatus = useCallback(async () => {
    setIfMounted(setSlaLoading, true);
    setIfMounted(setSlaError, '');

    try {
      const response = await getSLAStatus();
      setIfMounted(setSlaData, response || { violations: [], at_risk: [], total_violations: 0, total_at_risk: 0 });
    } catch (fetchError) {
      logError('Failed to load SLA status', { message: fetchError?.message });
      setIfMounted(setSlaError, fetchError?.message || GENERIC_ERROR);
    } finally {
      setIfMounted(setSlaLoading, false);
    }
  }, []);

  const fetchEscalations = useCallback(async () => {
    setIfMounted(setEscalationLoading, true);
    setIfMounted(setEscalationError, '');

    try {
      const response = await getEscalations();
      setIfMounted(setEscalationData, response || { escalated_count: 0, escalated_complaints: [] });
    } catch (fetchError) {
      logError('Failed to load escalations', { message: fetchError?.message });
      setIfMounted(setEscalationError, fetchError?.message || GENERIC_ERROR);
    } finally {
      setIfMounted(setEscalationLoading, false);
    }
  }, []);

  const fetchDepartmentPerformance = useCallback(async () => {
    setIfMounted(setDepartmentPerformanceLoading, true);
    setIfMounted(setDepartmentPerformanceError, '');

    try {
      const response = await getDepartmentPerformance();
      setIfMounted(setDepartmentPerformanceData, Array.isArray(response) ? response : []);
    } catch (fetchError) {
      logError('Failed to load department performance', { message: fetchError?.message });
      setIfMounted(setDepartmentPerformanceError, fetchError?.message || GENERIC_ERROR);
    } finally {
      setIfMounted(setDepartmentPerformanceLoading, false);
    }
  }, []);

  const fetchResolutionEfficiency = useCallback(async () => {
    setIfMounted(setResolutionEfficiencyLoading, true);
    setIfMounted(setResolutionEfficiencyError, '');

    try {
      const response = await getResolutionEfficiency();
      setIfMounted(setResolutionEfficiencyData, response || {
        avg_resolution_by_priority: [],
        fastest_department: null,
        slowest_department: null,
        overall_avg_resolution_hours: 0,
      });
    } catch (fetchError) {
      logError('Failed to load resolution efficiency', { message: fetchError?.message });
      setIfMounted(setResolutionEfficiencyError, fetchError?.message || GENERIC_ERROR);
    } finally {
      setIfMounted(setResolutionEfficiencyLoading, false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchDashboardData();
    fetchWorkload();
    fetchSlaStatus();
    fetchEscalations();
    fetchDepartmentPerformance();
    fetchResolutionEfficiency();
  }, [
    fetchDashboardData,
    fetchWorkload,
    fetchSlaStatus,
    fetchEscalations,
    fetchDepartmentPerformance,
    fetchResolutionEfficiency,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    if (!initializedRef.current) {
      initializedRef.current = true;
      refreshAll();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [refreshAll]);

  const urgentComplaints = useMemo(() => urgentData?.complaints ?? [], [urgentData]);
  const activityEvents = useMemo(() => summary?.activity_feed ?? summary?.activityFeed ?? [], [summary]);

  const handleAction = (action) => {
    if (quickActionBusy) return;

    if (action === 'all') {
      setComplaintsFilter?.(null);
      setActivePage?.('complaints');
      return;
    }

    if (action === 'heatmap') {
      setActivePage?.('heatmap');
      return;
    }

    if (action === 'refresh') {
      refreshAll();
      return;
    }

    if (action === 'pending') {
      setComplaintsFilter?.({ type: 'status', value: 'Pending' });
      setActivePage?.('complaints');
      return;
    }

    if (action === 'critical') {
      setComplaintsFilter?.({ type: 'priority', value: 'Critical' });
      setActivePage?.('complaints');
      return;
    }

    if (action === 'export') {
      setQuickActionBusy(true);
      getAllComplaints()
        .then((complaints) => {
          exportComplaintsToCSV(complaints);
        })
        .catch((exportError) => {
          logError('Failed to export complaints CSV', { message: exportError?.message });
          setIfMounted(setError, exportError?.message || GENERIC_ERROR);
        })
        .finally(() => {
          setIfMounted(setQuickActionBusy, false);
        });
      return;
    }

    if (action === 'assign') {
      setComplaintsFilter?.({ type: 'status_not', value: 'Resolved' });
      setActivePage?.('complaints');
    }
  };

  const lastUpdated = new Date().toLocaleString();

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Dashboard</h2>
        <small className="text-muted" style={{ fontSize: '0.8rem', fontWeight: '500' }}>
          Last Updated: {lastUpdated}
        </small>
      </div>

      {loading ? (
        <LoadingSpinner className="mt-4" message="Loading..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refreshAll} />
      ) : (
        <>
          <LiveKPIBar summary={summary} />

          <div className="row g-3 mt-1">
            <div className="col-12 col-xl-7">
              <UrgentActionCenter urgentComplaints={urgentComplaints} urgentCount={urgentData?.urgent_count ?? 0} />
            </div>
            <div className="col-12 col-xl-5">
              <ActivityFeed events={activityEvents} />
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12">
              <DepartmentWorkload
                workload={workloadData}
                loading={workloadLoading}
                error={workloadError}
                onRetry={fetchWorkload}
              />
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12">
              <SLAStatusPanel
                data={slaData}
                loading={slaLoading}
                error={slaError}
                onRetry={fetchSlaStatus}
              />
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12">
              <EscalationPanel
                data={escalationData}
                loading={escalationLoading}
                error={escalationError}
                onRetry={fetchEscalations}
              />
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12">
              <DepartmentPerformance
                data={departmentPerformanceData}
                loading={departmentPerformanceLoading}
                error={departmentPerformanceError}
                onRetry={fetchDepartmentPerformance}
              />
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12">
              <ResolutionEfficiency
                data={resolutionEfficiencyData}
                loading={resolutionEfficiencyLoading}
                error={resolutionEfficiencyError}
                onRetry={fetchResolutionEfficiency}
              />
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-12">
              <QuickActions onAction={handleAction} busy={quickActionBusy || loading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

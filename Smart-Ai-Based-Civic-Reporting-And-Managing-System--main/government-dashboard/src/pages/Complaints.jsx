import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  assignWorkerToComplaint,
  getAllComplaints,
  getAvailableWorkers,
  updateComplaintStatus,
} from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ComplaintDetailPanel from '../components/complaints/ComplaintDetailPanel';
import { logError } from '../utils/logger';

const GENERIC_ERROR = 'Unable to load complaints. Please try again.';

const isOverdue = (submittedTime) => {
  if (!submittedTime) return false;
  const submittedDate = new Date(submittedTime);
  if (Number.isNaN(submittedDate.getTime())) return false;
  const ageMs = Date.now() - submittedDate.getTime();
  return ageMs > 48 * 60 * 60 * 1000;
};

export default function Complaints({ navigationFilter, clearNavigationFilter }) {
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const [complaints, setComplaints] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState({});
  const [availableWorkersByDepartment, setAvailableWorkersByDepartment] = useState({});
  const [assignedWorkerByComplaint, setAssignedWorkerByComplaint] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [assigningId, setAssigningId] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  const fetchAvailableWorkersForDepartments = useCallback(async (complaintRows) => {
    const departmentIds = Array.from(
      new Set(
        complaintRows
          .map((complaint) => complaint.department_id)
          .filter((departmentId) => departmentId !== null && departmentId !== undefined)
      )
    );

    if (departmentIds.length === 0) {
      if (mountedRef.current) {
        setAvailableWorkersByDepartment({});
      }
      return;
    }

    try {
      const responses = await Promise.all(
        departmentIds.map(async (departmentId) => {
          const result = await getAvailableWorkers(departmentId);
          return {
            departmentId: String(departmentId),
            workers: Array.isArray(result?.workers) ? result.workers : [],
          };
        })
      );

      if (!mountedRef.current) return;

      const nextWorkersMap = {};
      responses.forEach((entry) => {
        nextWorkersMap[entry.departmentId] = entry.workers;
      });

      setAvailableWorkersByDepartment(nextWorkersMap);
    } catch (fetchError) {
      logError('Failed to load available workers', { message: fetchError?.message });
      if (mountedRef.current) {
        setAvailableWorkersByDepartment({});
      }
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError('');

    try {
      const response = await getAllComplaints();
      if (!mountedRef.current) return;

      const complaintRows = Array.isArray(response) ? response : [];
      setComplaints(complaintRows);

      setAssignedWorkerByComplaint((previous) => {
        const next = { ...previous };
        complaintRows.forEach((complaint) => {
          if (complaint.assigned_team) {
            next[complaint.complaint_id] = complaint.assigned_team;
          }
        });
        return next;
      });

      await fetchAvailableWorkersForDepartments(complaintRows);
    } catch (fetchError) {
      logError('Failed to load complaints', { message: fetchError?.message });
      if (!mountedRef.current) return;
      setError(fetchError?.message || GENERIC_ERROR);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchAvailableWorkersForDepartments]);

  useEffect(() => {
    mountedRef.current = true;

    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchComplaints();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchComplaints]);

  useEffect(() => {
    if (!navigationFilter) return;
    setActiveFilter(navigationFilter);
    clearNavigationFilter?.();
  }, [navigationFilter, clearNavigationFilter]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        setToastMessage('');
      }
    }, 2500);
    return () => clearTimeout(timeoutId);
  }, [toastMessage]);

  const filteredComplaints = useMemo(() => {
    if (!activeFilter) return complaints;

    if (activeFilter.type === 'status') {
      const target = String(activeFilter.value || '').toLowerCase();
      return complaints.filter((complaint) => String(complaint.status || '').toLowerCase() === target);
    }

    if (activeFilter.type === 'priority') {
      const target = String(activeFilter.value || '').toLowerCase();
      return complaints.filter((complaint) => String(complaint.priority_level || '').toLowerCase() === target);
    }

    if (activeFilter.type === 'overdue') {
      return complaints.filter((complaint) => (
        String(complaint.status || '').toLowerCase() !== 'resolved' &&
        isOverdue(complaint.submitted_time)
      ));
    }

    if (activeFilter.type === 'status_not') {
      const target = String(activeFilter.value || '').toLowerCase();
      return complaints.filter((complaint) => String(complaint.status || '').toLowerCase() !== target);
    }

    return complaints;
  }, [complaints, activeFilter]);

  const handleWorkerSelect = (complaintId, workerId) => {
    setSelectedWorkers((previous) => ({ ...previous, [complaintId]: workerId }));
  };

  const isComplaintAssigned = (complaint) => {
    const normalizedStatus = String(complaint.status || '').toLowerCase();
    return (
      normalizedStatus === 'assigned' ||
      Boolean(complaint.assigned_team) ||
      Boolean(assignedWorkerByComplaint[complaint.complaint_id])
    );
  };

  const handleAssign = async (complaint) => {
    if (assigningId || resolvingId) return;
    if (isComplaintAssigned(complaint)) return;

    const selectedWorkerId = selectedWorkers[complaint.complaint_id];

    if (!selectedWorkerId) {
      setActionError('Please select a worker before assigning.');
      return;
    }

    const departmentWorkers = availableWorkersByDepartment[String(complaint.department_id)] || [];
    const selectedWorker = departmentWorkers.find(
      (worker) => String(worker.worker_id) === String(selectedWorkerId)
    );

    if (!selectedWorker) {
      setActionError('Selected worker is no longer available. Please refresh and try again.');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to assign this complaint?');
    if (!confirmed) return;

    setActionError('');
    setAssigningId(complaint.complaint_id);

    try {
      await assignWorkerToComplaint(complaint.complaint_id, Number(selectedWorkerId));
      await updateComplaintStatus(complaint.complaint_id, 'Assigned');

      const assignedLabel = `${selectedWorker.worker_name} (${selectedWorker.team_name})`;
      if (mountedRef.current) {
        setAssignedWorkerByComplaint((previous) => ({
          ...previous,
          [complaint.complaint_id]: assignedLabel,
        }));
      }

      await fetchComplaints();

      if (mountedRef.current) {
        setToastMessage('Complaint assigned successfully');
      }
    } catch (assignError) {
      logError('Failed to assign complaint via workforce API', {
        complaintId: complaint.complaint_id,
        message: assignError?.message,
      });
      if (!mountedRef.current) return;
      setActionError(assignError?.message || 'Unable to assign complaint. Please try again.');
    } finally {
      if (mountedRef.current) {
        setAssigningId(null);
      }
    }
  };

  const handleResolve = async (complaintId) => {
    if (assigningId || resolvingId) return;

    const confirmed = window.confirm('Are you sure you want to mark this complaint as resolved?');
    if (!confirmed) return;

    setActionError('');
    setResolvingId(complaintId);

    try {
      await updateComplaintStatus(complaintId, 'Resolved');
      await fetchComplaints();
      if (mountedRef.current) {
        setToastMessage('Complaint resolved successfully');
      }
    } catch (resolveError) {
      logError('Failed to resolve complaint', { complaintId, message: resolveError?.message });
      if (!mountedRef.current) return;
      setActionError(resolveError?.message || 'Unable to resolve complaint. Please try again.');
    } finally {
      if (mountedRef.current) {
        setResolvingId(null);
      }
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'success',
    };

    return colors[(priority || '').toLowerCase()] || 'secondary';
  };

  const handleRowClick = (complaintId) => {
    setSelectedComplaintId(complaintId);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
  };

  const getSlaBadgeClass = (slaStatus) => {
    const normalized = String(slaStatus || '').toUpperCase();
    if (normalized === 'OVERDUE') return 'danger';
    if (normalized === 'ON_TIME') return 'success';
    if (normalized === 'COMPLETED') return 'primary';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <h2>Complaints Management</h2>
        <LoadingSpinner className="mt-4" message="Loading..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4">
        <h2>Complaints Management</h2>
        <ErrorMessage message={error} onRetry={fetchComplaints} />
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <h2>Complaints Management</h2>

      {actionError ? <ErrorMessage message={actionError} onRetry={fetchComplaints} /> : null}

      {toastMessage && (
        <div
          className="alert alert-success position-fixed"
          role="alert"
          style={{ top: '20px', right: '20px', zIndex: 1080 }}
        >
          {toastMessage}
        </div>
      )}

      <table className="table table-striped table-hover mt-4">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Department</th>
            <th>Priority</th>
            <th>Status</th>
            <th>SLA Deadline</th>
            <th>SLA Status</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredComplaints.map((complaint) => {
            const departmentWorkers = availableWorkersByDepartment[String(complaint.department_id)] || [];
            const noWorkersAvailable = departmentWorkers.length === 0;
            const complaintAssigned = isComplaintAssigned(complaint);
            const assignedLabel = assignedWorkerByComplaint[complaint.complaint_id] || complaint.assigned_team;
            const isBusy = assigningId === complaint.complaint_id || resolvingId === complaint.complaint_id;
            const isOverdue = String(complaint.sla_status || '').toUpperCase() === 'OVERDUE';

            return (
              <Fragment key={complaint.complaint_id}>
                <tr
                  className={isOverdue ? 'table-danger' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(complaint.complaint_id)}
                >
                  <td>{complaint.complaint_id}</td>
                  <td>{complaint.description}</td>
                  <td>{complaint.department_id}</td>
                  <td>
                    <span className={`badge bg-${getPriorityBadge(complaint.priority_level)}`}>
                      {complaint.priority_level}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${complaint.status === 'Pending' ? 'secondary' : 'success'}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td>{complaint.sla_deadline || '-'}</td>
                  <td>
                    <span className={`badge bg-${getSlaBadgeClass(complaint.sla_status)}`}>
                      {complaint.sla_status || 'PENDING'}
                    </span>
                  </td>
                  <td>{complaint.latitude}, {complaint.longitude}</td>
                  <td>
                    <select
                      className="form-select form-select-sm d-inline-block"
                      style={{ width: '220px' }}
                      onChange={(event) => handleWorkerSelect(complaint.complaint_id, event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      value={selectedWorkers[complaint.complaint_id] || ''}
                      disabled={isBusy || complaintAssigned || noWorkersAvailable}
                    >
                      <option value="">Select Worker</option>
                      {departmentWorkers.map((worker) => (
                        <option key={worker.worker_id} value={worker.worker_id}>
                          {worker.worker_name} ({worker.team_name})
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn btn-primary btn-sm ms-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAssign(complaint);
                      }}
                      disabled={Boolean(assigningId || resolvingId) || complaintAssigned || noWorkersAvailable}
                    >
                      {assigningId === complaint.complaint_id ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      ) : 'Assign'}
                    </button>

                    <button
                      className="btn btn-success btn-sm ms-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleResolve(complaint.complaint_id);
                      }}
                      disabled={complaint.status === 'Resolved' || Boolean(assigningId || resolvingId)}
                    >
                      {resolvingId === complaint.complaint_id ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      ) : 'Resolve'}
                    </button>

                    {noWorkersAvailable ? (
                      <span className="badge bg-warning text-dark ms-2">No workers available</span>
                    ) : null}
                  </td>
                </tr>
                {assignedLabel ? (
                  <tr>
                    <td colSpan="9" className="bg-light">
                      <span className="badge bg-info text-dark">Assigned to {assignedLabel}</span>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <ComplaintDetailPanel
        complaintId={selectedComplaintId}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
      />
    </div>
  );
}

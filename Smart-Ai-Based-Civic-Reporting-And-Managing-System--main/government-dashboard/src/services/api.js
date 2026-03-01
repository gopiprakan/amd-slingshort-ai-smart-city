import { apiRequest } from './apiClient';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function getAllComplaints() {
  const data = await apiRequest('/complaints');
  return data?.complaints ?? [];
}

export async function getComplaintStats() {
  return apiRequest('/complaints/stats');
}

export async function getDashboardSummary() {
  return apiRequest('/dashboard/summary');
}

export async function getUrgentComplaints() {
  return apiRequest('/dashboard/urgent');
}

export async function getDepartmentWorkload() {
  return apiRequest('/dashboard/department-workload');
}

export async function getComplaintLocations() {
  return apiRequest('/complaints/locations');
}

export async function updateComplaintStatus(id, status) {
  return apiRequest(`/complaints/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export async function assignComplaint(id, team) {
  return apiRequest(`/complaints/${id}/assign`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team }),
  });
}

export async function getAvailableWorkers(departmentId) {
  return apiRequest(`/workforce/workers/available/${departmentId}`);
}

export async function assignWorkerToComplaint(complaintId, workerId) {
  return apiRequest('/workforce/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ complaint_id: complaintId, worker_id: workerId }),
  });
}

export async function getSLAStatus() {
  return apiRequest('/dashboard/sla-status');
}

export async function getEscalations() {
  return apiRequest('/dashboard/escalations');
}

export async function getDepartmentPerformance() {
  return apiRequest('/dashboard/department-performance');
}

export async function getResolutionEfficiency() {
  return apiRequest('/dashboard/resolution-efficiency');
}


export async function getComplaintDetail(complaintId) {
  return apiRequest(`/complaints/${complaintId}`);
}

export async function getComplaintHistory(complaintId) {
  return apiRequest(`/complaints/${complaintId}/history`);
}

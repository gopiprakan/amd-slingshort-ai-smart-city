import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { getComplaintDetail, getComplaintHistory } from '../../services/api';
import { logError } from '../../utils/logger';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  const base = process.env.REACT_APP_API_BASE_URL || '';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${cleanBase}/${cleanPath}`;
};

export default function ComplaintDetailPanel({ complaintId, isOpen, onClose }) {
  const mountedRef = useRef(true);

  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!isOpen || !complaintId) return;

    setLoading(true);
    setError('');
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const [detailResponse, historyResponse] = await Promise.all([
        getComplaintDetail(complaintId),
        getComplaintHistory(complaintId),
      ]);
      if (!mountedRef.current) return;
      setDetail(detailResponse || null);
      setHistory(Array.isArray(historyResponse?.history) ? historyResponse.history : []);
    } catch (fetchError) {
      logError('Failed to load complaint detail', { complaintId, message: fetchError?.message });
      if (!mountedRef.current) return;
      setError(fetchError?.message || 'Unable to load complaint details. Please try again.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setHistoryLoading(false);
      }
    }
  }, [complaintId, isOpen]);

  const fetchHistory = useCallback(async () => {
    if (!isOpen || !complaintId) return;

    setHistoryLoading(true);
    setHistoryError('');

    try {
      const response = await getComplaintHistory(complaintId);
      if (!mountedRef.current) return;
      setHistory(Array.isArray(response?.history) ? response.history : []);
    } catch (fetchError) {
      logError('Failed to load complaint history', { complaintId, message: fetchError?.message });
      if (!mountedRef.current) return;
      setHistoryError(fetchError?.message || 'Unable to load complaint history.');
    } finally {
      if (mountedRef.current) {
        setHistoryLoading(false);
      }
    }
  }, [complaintId, isOpen]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const mapCenter = useMemo(() => {
    const lat = Number(detail?.latitude);
    const lng = Number(detail?.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return [lat, lng];
  }, [detail]);

  const imageUrl = getImageUrl(detail?.image_path);

  return (
    <>
      <div
        className={`position-fixed top-0 start-0 w-100 h-100 bg-dark ${isOpen ? 'd-block' : 'd-none'}`}
        style={{ opacity: 0.25, zIndex: 1040 }}
        onClick={onClose}
      />

      <div
        className="position-fixed top-0 end-0 h-100 bg-white border-start shadow"
        style={{
          width: 'min(460px, 100%)',
          zIndex: 1050,
          overflowY: 'auto',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease-in-out',
        }}
      >
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Complaint Details</h5>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="p-3">
          {loading ? <LoadingSpinner message="Loading details..." /> : null}
          {error ? <ErrorMessage message={error} onRetry={fetchDetail} /> : null}

          {!loading && !error && detail ? (
            <div className="d-flex flex-column gap-3">
              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">Basic Info</h6>
                  <p className="mb-1"><strong>ID:</strong> {detail.complaint_id}</p>
                  <p className="mb-1"><strong>Description:</strong> {detail.description}</p>
                  <p className="mb-1"><strong>Department:</strong> {detail.department_id}</p>
                  <p className="mb-1"><strong>Priority:</strong> {detail.priority_level}</p>
                  <p className="mb-0"><strong>Status:</strong> {detail.status}</p>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">Image Preview</h6>
                  {imageUrl ? (
                    <img src={imageUrl} alt="Complaint" className="img-fluid rounded border" />
                  ) : (
                    <p className="text-muted mb-0">No image available</p>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">Location Map</h6>
                  {mapCenter ? (
                    <div style={{ height: '220px' }}>
                      <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={mapCenter} icon={markerIcon} />
                      </MapContainer>
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Location data unavailable</p>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">Timeline</h6>
                  <p className="mb-1"><strong>Submitted:</strong> {detail.submitted_time || '-'}</p>
                  <p className="mb-1"><strong>Assigned:</strong> {detail.assigned_time || '-'}</p>
                  <p className="mb-1"><strong>Resolved:</strong> {detail.completed_time || '-'}</p>
                  <p className="mb-0"><strong>SLA Deadline:</strong> {detail.sla_deadline || '-'}</p>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">Assignment Info</h6>
                  {detail.assigned_worker ? (
                    <>
                      <p className="mb-1"><strong>Worker:</strong> {detail.assigned_worker.worker_name || '-'}</p>
                      <p className="mb-0"><strong>Team:</strong> {detail.assigned_worker.team_name || '-'}</p>
                    </>
                  ) : (
                    <p className="text-muted mb-0">Not assigned</p>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">Activity Timeline</h6>
                  {historyLoading ? <LoadingSpinner size="sm" message="Loading activity..." /> : null}
                  {historyError ? <ErrorMessage message={historyError} onRetry={fetchHistory} /> : null}
                  {!historyLoading && !historyError ? (
                    history.length > 0 ? (
                      <div className="d-flex flex-column gap-2">
                        {history.map((item) => (
                          <div key={item.log_id} className="border rounded p-2">
                            <p className="mb-1">
                              <strong>{item.action_type || 'UPDATE'}</strong>
                              {item.assigned_to ? ` - ${item.assigned_to}` : ''}
                            </p>
                            <p className="mb-1 text-muted">
                              {item.previous_status || '-'} {'->'} {item.new_status || '-'}
                            </p>
                            <p className="mb-0 small text-muted">
                              {item.timestamp || '-'} | {item.performed_by || 'System'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No activity logs available</p>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

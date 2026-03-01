import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { getComplaintLocations } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { logError } from '../utils/logger';

const DEFAULT_CENTER = [18.5204, 73.8567];
const GENERIC_ERROR = 'Unable to load heatmap data. Please try again.';

function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 13,
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

function HeatmapBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(points) || points.length === 0) return;
    const bounds = L.latLngBounds(points.map((point) => [point[0], point[1]]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, points]);

  return null;
}

export default function Heatmap() {
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [points, setPoints] = useState([]);

  const fetchHeatmapData = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError('');

    try {
      const locations = await getComplaintLocations();
      if (!mountedRef.current) return;

      const mappedPoints = (Array.isArray(locations) ? locations : [])
        .map((item) => {
          const lat = Number(item.latitude);
          const lng = Number(item.longitude);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
          return [lat, lng, 0.8];
        })
        .filter(Boolean);

      setPoints(mappedPoints);
    } catch (fetchError) {
      logError('Failed to load heatmap data', { message: fetchError?.message });
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
      fetchHeatmapData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchHeatmapData]);

  const mapCenter = useMemo(() => {
    if (points.length > 0) {
      return [points[0][0], points[0][1]];
    }
    return DEFAULT_CENTER;
  }, [points]);

  return (
    <div className="container-fluid p-4">
      <h2>Complaint Heatmap</h2>
      <p>Visualizing complaint density across the city</p>

      {loading ? <LoadingSpinner className="mt-3" message="Loading..." /> : null}
      {error ? <ErrorMessage message={error} onRetry={fetchHeatmapData} /> : null}
      {!loading && !error && points.length === 0 ? (
        <p className="mt-3 mb-0">No complaint data available for heatmap</p>
      ) : null}

      <div style={{ height: '600px', marginTop: '20px' }}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <HeatmapLayer points={points} />
          <HeatmapBounds points={points} />
        </MapContainer>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, MapPin } from 'lucide-react';

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom technician marker (teal van icon)
const technicianIcon = new L.DivIcon({
  html: `
    <div style="
      width:40px;height:40px;
      background:linear-gradient(135deg,#0f766e,#14b8a6);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="transform:rotate(45deg);color:white;font-size:16px;">🔧</div>
    </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Customer destination marker
const destinationIcon = new L.DivIcon({
  html: `
    <div style="
      width:36px;height:36px;
      background:linear-gradient(135deg,#f59e0b,#d97706);
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
    ">📍</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [60, 60] });
    }
  }, [positions, map]);
  return null;
}

// Simulates technician moving towards the customer
function useSimulatedLocation(techStart, destination, isActive) {
  const [position, setPosition] = useState(techStart);
  const [eta, setEta] = useState(null);
  const stepRef = useRef(0);
  const totalSteps = 30;

  useEffect(() => {
    if (!isActive || !techStart || !destination) return;
    setPosition(techStart);
    stepRef.current = 0;

    const interval = setInterval(() => {
      stepRef.current += 1;
      const progress = stepRef.current / totalSteps;

      if (progress >= 1) {
        clearInterval(interval);
        setPosition(destination);
        setEta(0);
        return;
      }

      // Interpolate with slight curve for realism
      const lat = techStart[0] + (destination[0] - techStart[0]) * progress;
      const lng = techStart[1] + (destination[1] - techStart[1]) * progress;
      const remaining = Math.round((1 - progress) * 15); // ~15 min total ETA
      setPosition([lat, lng]);
      setEta(remaining);
    }, 3000); // update every 3 seconds

    return () => clearInterval(interval);
  }, [isActive]);

  return { position, eta };
}

export default function TechnicianTrackingMap({ booking, technician }) {
  // Customer location
  const customerLat = booking?.location?.lat || -1.2921;
  const customerLng = booking?.location?.lng || 36.8219;
  const customerPos = [customerLat, customerLng];

  // Technician starting location (slightly offset from customer)
  const techLat = (technician?.location?.lat) || customerLat - 0.03;
  const techLng = (technician?.location?.lng) || customerLng - 0.04;
  const techStart = [techLat, techLng];

  const { position: techPos, eta } = useSimulatedLocation(techStart, customerPos, true);

  const routeLine = [techPos, customerPos];

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-purple-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Navigation className="w-5 h-5 animate-pulse" />
          <span className="font-semibold">Technician En Route</span>
        </div>
        {eta !== null && (
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {eta === 0 ? 'Arriving now' : `~${eta} min`}
            </span>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ height: '300px' }}>
        <MapContainer
          center={customerPos}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Dashed route line */}
          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#7c3aed', weight: 3, dashArray: '8 6', opacity: 0.8 }}
          />

          {/* Technician marker */}
          <Marker position={techPos} icon={technicianIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{technician?.name || 'Technician'}</p>
                <p className="text-xs text-gray-500">On the way to you</p>
              </div>
            </Popup>
          </Marker>

          {/* Customer/destination marker */}
          <Marker position={customerPos} icon={destinationIcon}>
            <Popup>
              <p className="font-semibold text-sm">Your Location</p>
              <p className="text-xs text-gray-500">{booking?.location?.address}</p>
            </Popup>
          </Marker>

          <FitBounds positions={routeLine} />
        </MapContainer>
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 bg-purple-50 flex items-center gap-3">
        <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
        <p className="text-sm text-purple-700">
          {technician?.name || 'Your technician'} is heading to{' '}
          <span className="font-medium">{booking?.location?.address || 'your location'}</span>
        </p>
      </div>
    </div>
  );
}
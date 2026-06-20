import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, MapPin, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Fix default leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

// Smoothly animate marker to new position
function AnimatedMarker({ position, icon, children }) {
  const markerRef = useRef(null);
  const prevPos = useRef(position);

  useEffect(() => {
    if (!markerRef.current) return;
    const [prevLat, prevLng] = prevPos.current;
    const [newLat, newLng] = position;
    if (prevLat === newLat && prevLng === newLng) return;

    const steps = 20;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const t = step / steps;
      const lat = prevLat + (newLat - prevLat) * t;
      const lng = prevLng + (newLng - prevLng) * t;
      markerRef.current?.setLatLng([lat, lng]);
      if (step >= steps) {
        clearInterval(interval);
        prevPos.current = position;
      }
    }, 50);

    return () => clearInterval(interval);
  }, [position]);

  return (
    <Marker position={position} icon={icon} ref={markerRef}>
      {children}
    </Marker>
  );
}

// Fallback: simulate movement toward destination when no real GPS
function useSimulatedLocation(techStart, destination) {
  const [position, setPosition] = useState(techStart);
  const [eta, setEta] = useState(15);
  const stepRef = useRef(0);
  const totalSteps = 30;

  useEffect(() => {
    if (!techStart || !destination) return;
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
      const lat = techStart[0] + (destination[0] - techStart[0]) * progress;
      const lng = techStart[1] + (destination[1] - techStart[1]) * progress;
      setPosition([lat, lng]);
      setEta(Math.round((1 - progress) * 15));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { position, eta };
}

export default function TechnicianTrackingMap({ booking, technician: initialTechnician }) {
  const [technician, setTechnician] = useState(initialTechnician);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Customer location
  const customerLat = booking?.location?.lat || -1.2921;
  const customerLng = booking?.location?.lng || 36.8219;
  const customerPos = [customerLat, customerLng];

  // Technician base location
  const techLat = technician?.location?.lat || customerLat - 0.03;
  const techLng = technician?.location?.lng || customerLng - 0.04;
  const techStart = [techLat, techLng];

  const hasRealGPS = !!(technician?.location?.lat && technician?.location?.lng);

  // Real-time GPS position from technician entity
  const [realPos, setRealPos] = useState(techStart);
  const [eta, setEta] = useState(null);

  // Subscribe to real-time technician location updates
  useEffect(() => {
    if (!initialTechnician?.id) return;

    const unsubscribe = base44.entities.Technician.subscribe((event) => {
      if (event.data?.id === initialTechnician.id && event.type !== 'delete') {
        const updated = event.data;
        setTechnician(updated);

        if (updated.location?.lat && updated.location?.lng) {
          setRealPos([updated.location.lat, updated.location.lng]);
          setIsLive(true);
          setLastUpdated(new Date());

          // Rough ETA estimate based on distance
          const dLat = customerLat - updated.location.lat;
          const dLng = customerLng - updated.location.lng;
          const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
          setEta(Math.max(0, Math.round(distKm / 0.5))); // ~30km/h avg
        }
      }
    });

    return () => unsubscribe();
  }, [initialTechnician?.id]);

  // Fallback simulation if no real GPS
  const simulation = useSimulatedLocation(techStart, customerPos);

  // Use real position if available, otherwise fall back to simulation
  const techPos = isLive ? realPos : simulation.position;
  const displayEta = isLive ? eta : simulation.eta;

  const routeLine = [techPos, customerPos];

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-purple-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Navigation className="w-5 h-5 animate-pulse" />
          <span className="font-semibold">Technician En Route</span>
          {isLive && (
            <span className="flex items-center gap-1 bg-green-500/30 rounded-full px-2 py-0.5 text-xs">
              <Radio className="w-3 h-3 animate-pulse" /> LIVE
            </span>
          )}
        </div>
        {displayEta !== null && (
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {displayEta === 0 ? 'Arriving now' : `~${displayEta} min`}
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

          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#7c3aed', weight: 3, dashArray: '8 6', opacity: 0.8 }}
          />

          <AnimatedMarker position={techPos} icon={technicianIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{technician?.name || 'Technician'}</p>
                <p className="text-xs text-gray-500">On the way to you</p>
                {lastUpdated && (
                  <p className="text-xs text-green-600 mt-1">
                    Updated {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </Popup>
          </AnimatedMarker>

          <Marker position={customerPos} icon={destinationIcon}>
            <Popup>
              <p className="font-semibold text-sm">Your Location</p>
              <p className="text-xs text-gray-500">{booking?.location?.address}</p>
            </Popup>
          </Marker>

          <FitBounds positions={routeLine} />
        </MapContainer>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-purple-50 flex items-center gap-3">
        <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
        <p className="text-sm text-purple-700">
          {technician?.name || 'Your technician'} is heading to{' '}
          <span className="font-medium">{booking?.location?.address || 'your location'}</span>
        </p>
        {isLive && lastUpdated && (
          <span className="ml-auto text-xs text-green-600 shrink-0">
            Live · {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
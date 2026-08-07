import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Star } from 'lucide-react';
import { resolveAreaCoords } from '@/lib/kenyaAreas';

const techIcon = L.divIcon({
  className: '',
  html: `<div style="background:#0B463C;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:#fff;font-size:13px;font-weight:700;">F</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };

function hashOffset(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const dx = ((h % 100) / 100 - 0.5) * 0.012;
  const dy = (((h >> 8) % 100) / 100 - 0.5) * 0.012;
  return { dx, dy };
}

function Recenter({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 13);
  }, [center?.lat, center?.lng]);
  return null;
}

function resolveTechCoords(t) {
  if (t.location?.lat && t.location?.lng) return { lat: t.location.lat, lng: t.location.lng };
  const fromAddress = resolveAreaCoords(t.location?.address);
  if (fromAddress) return fromAddress;
  for (const aName of (t.service_areas || [])) {
    const c = resolveAreaCoords(aName);
    if (c) return c;
  }
  return null;
}

export default function ServicesMap({ location, technicians }) {
  const center = useMemo(() => resolveAreaCoords(location) || NAIROBI_CENTER, [location]);

  const points = useMemo(
    () =>
      technicians.map((t) => ({
        tech: t,
        coords: resolveTechCoords(t),
      })),
    [technicians]
  );

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-gray-900">
          {technicians.length} technician{technicians.length !== 1 ? 's' : ''} near "{location}"
        </h3>
      </div>
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-[320px] sm:h-[400px]">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter center={center} />
          <Marker position={[center.lat, center.lng]} icon={userIcon}>
            <Popup>Your location</Popup>
          </Marker>
          {points.map(({ tech, coords }) => {
            const c = coords || { ...center, ...hashOffset(tech.id || tech.name || '') };
            return (
              <Marker key={tech.id} position={[c.lat, c.lng]} icon={techIcon}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>{tech.name}</strong>
                    <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'capitalize' }}>
                      {tech.profession?.replace('_', ' ')}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      ⭐ {tech.rating?.toFixed(1) || '0.0'} · {tech.total_jobs || 0} jobs
                    </div>
                    <a
                      href={`/#/TechnicianDetail?id=${tech.id}`}
                      style={{ color: '#0B463C', fontWeight: 600, fontSize: 12 }}
                    >
                      View profile →
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}
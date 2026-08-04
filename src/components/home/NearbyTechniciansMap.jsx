import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Star, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Fix Leaflet's default marker icons (they break under bundlers)
const techIcon = L.divIcon({
  className: '',
  html: `<div style="background:#0B463C;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:#fff;font-size:14px;font-weight:700;">F</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="background:#2563eb;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };

// Deterministic small offset so markers without coords spread around the area center
function hashOffset(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const dx = ((h % 100) / 100 - 0.5) * 0.012;
  const dy = (((h >> 8) % 100) / 100 - 0.5) * 0.012;
  return { dx, dy };
}

function RecenterOnArea({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 13);
  }, [center?.lat, center?.lng]);
  return null;
}

export default function NearbyTechniciansMap() {
  const [selectedArea, setSelectedArea] = useState('');

  const { data: areas = [] } = useQuery({
    queryKey: ['serviceAreas'],
    queryFn: () => base44.entities.ServiceArea.list('-created_date', 100),
  });

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['approvedTechnicians'],
    queryFn: () => base44.entities.Technician.filter({ verification_status: 'approved' }, '-rating', 100),
  });

  const area = useMemo(
    () => areas.find(a => a.name.toLowerCase() === selectedArea.toLowerCase()),
    [areas, selectedArea]
  );

  const mapCenter = area?.center_lat && area?.center_lng
    ? { lat: area.center_lat, lng: area.center_lng }
    : NAIROBI_CENTER;

  // Technicians currently working (available) in the selected area
  const nearbyTechs = useMemo(() => {
    let list = technicians.filter(t => t.is_available);
    if (selectedArea) {
      const q = selectedArea.toLowerCase();
      list = list.filter(t =>
        (t.service_areas || []).some(a => a.toLowerCase() === q)
      );
    }
    return list.map(t => {
      const hasCoords = t.location?.lat && t.location?.lng;
      const base = hasCoords
        ? { lat: t.location.lat, lng: t.location.lng }
        : { ...mapCenter, ...hashOffset(t.id || t.name || '') };
      return { ...t, _coords: base };
    });
  }, [technicians, selectedArea, mapCenter]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-5 h-5 text-[#0B463C]" />
            <h2 className="text-lg font-bold text-gray-900">Technicians Near You</h2>
          </div>
          <p className="text-sm text-gray-500">
            See certified pros currently working in your area. Pick an area to focus the map.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring max-w-[200px]"
          >
            <option value="">All areas</option>
            {areas.map(a => (
              <option key={a.id} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-[360px] sm:h-[440px]">
          {isLoading ? (
            <LoadingSpinner text="Loading technicians..." />
          ) : (
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={12}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterOnArea center={mapCenter} />
              <Marker position={[mapCenter.lat, mapCenter.lng]} icon={userIcon}>
                <Popup>Your area center</Popup>
              </Marker>
              {nearbyTechs.map(t => (
                <Marker key={t.id} position={[t._coords.lat, t._coords.lng]} icon={techIcon}>
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <strong>{t.name}</strong>
                      <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'capitalize' }}>
                        {t.profession?.replace('_', ' ')}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        ⭐ {t.rating?.toFixed(1) || '0.0'} · {t.total_jobs || 0} jobs
                      </div>
                      <a href={`/#/TechnicianDetail?id=${t.id}`} style={{ color: '#0B463C', fontWeight: 600, fontSize: 12 }}>
                        View profile →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Side list */}
        <div className="lg:col-span-1 space-y-3 max-h-[440px] overflow-y-auto pr-1">
          {nearbyTechs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {isLoading
                  ? 'Looking for available technicians...'
                  : 'No technicians available in this area right now.'}
              </p>
              <Button asChild variant="outline" className="mt-3">
                <Link to={createPageUrl('Services')}>Browse all services</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                {nearbyTechs.length} available now
                {selectedArea ? ` in ${selectedArea}` : ' nearby'}
              </div>
              {nearbyTechs.map(t => (
                <Link
                  key={t.id}
                  to={createPageUrl(`TechnicianDetail?id=${t.id}`)}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md hover:border-teal-100 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-semibold flex-shrink-0">
                    {t.name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{t.name}</p>
                    <p className="text-xs text-gray-500 capitalize truncate">{t.profession?.replace('_', ' ')}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {t.rating?.toFixed(1) || '0.0'} · {t.total_jobs || 0} jobs
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Available</Badge>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
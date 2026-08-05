import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ShieldAlert, ShieldCheck, MapPin, Navigation, Phone, Car, CheckCircle2, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { NAIROBI_CBD } from '@/lib/rideConfig';

// Public live trip-share page — reached via /RideShare/:token
// Lets a trusted contact follow a Safe Ride in real time.
const STATUS_LABEL = {
  searching: 'Finding driver…',
  assigned: 'Driver en route to pickup',
  in_progress: 'On trip',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled',
};

const makeIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

export default function RideShare() {
  const { token } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadRide = async () => {
    try {
      const matches = await base44.entities.Ride.filter({ share_token: token }, '-updated_date', 1);
      if (matches && matches.length > 0) {
        setRide(matches[0]);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRide();
    // Poll every 10s for live updates
    const id = setInterval(loadRide, 10000);
    return () => clearInterval(id);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
      </div>
    );
  }

  if (notFound || !ride) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-50 px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-pink-400 mb-3" />
        <h1 className="text-lg font-bold text-gray-900">Trip not found</h1>
        <p className="text-sm text-gray-500 mt-1">This trip-share link is invalid or has expired.</p>
      </div>
    );
  }

  const pickup = ride.pickup || NAIROBI_CBD;
  const dest = ride.destination || NAIROBI_CBD;
  const center = { lat: (pickup.lat + dest.lat) / 2, lng: (pickup.lng + dest.lng) / 2 };
  const sos = !!ride.sos_active;

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className={`rounded-2xl p-5 ${sos ? 'bg-red-600 text-white' : 'bg-pink-600 text-white'}`}>
          <div className="flex items-center gap-2 mb-1">
            {sos ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            <h1 className="text-lg font-bold">{sos ? 'SOS ALERT' : 'Live Safe Ride'}</h1>
          </div>
          <p className="text-sm text-white/80">
            {sos
              ? 'The rider has triggered an emergency alert on this trip.'
              : `${ride.user_name || 'Rider'} is sharing this trip with you in real time.`}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-sm">
            <span className={`w-2 h-2 rounded-full ${ride.status === 'completed' ? 'bg-white' : 'bg-white animate-pulse'}`} />
            {STATUS_LABEL[ride.status] || ride.status}
          </div>
        </div>

        {/* Map */}
        <div className="h-64 rounded-2xl overflow-hidden border border-pink-100">
          <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[pickup.lat, pickup.lng]} icon={makeIcon('#0B463C')} />
            <Marker position={[dest.lat, dest.lng]} icon={makeIcon('#111827')} />
            <Polyline positions={[[pickup.lat, pickup.lng], [dest.lat, dest.lng]]} color="#ec4899" dashArray="6 8" weight={3} />
          </MapContainer>
        </div>

        {/* Driver card */}
        {ride.driver_name && (
          <div className="bg-white rounded-2xl border border-pink-100 p-4">
            <p className="text-xs text-gray-500 mb-2">Driver</p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold">
                {ride.driver_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{ride.driver_name}</p>
                <p className="text-sm text-gray-500 truncate">{ride.vehicle_model} · {ride.vehicle_plate}</p>
              </div>
              {ride.driver_phone && (
                <a href={`tel:${ride.driver_phone}`} className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Route */}
        <div className="bg-white rounded-2xl border border-pink-100 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B463C] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="text-sm text-gray-900 truncate">{ride.pickup?.address || '—'}</p>
            </div>
            <MapPin className="w-4 h-4 text-[#0B463C]" />
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-900 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Destination</p>
              <p className="text-sm text-gray-900 truncate">{ride.destination?.address || '—'}</p>
            </div>
            <Navigation className="w-4 h-4 text-gray-900" />
          </div>
        </div>

        {/* Completed banner */}
        {ride.status === 'completed' && (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-800">The rider has arrived safely.</p>
          </div>
        )}

        <p className="text-xs text-center text-gray-400 px-6">
          Powered by Fixie Safe Ride. Updates every few seconds. This page is visible to anyone with the link.
        </p>
      </div>
    </div>
  );
}
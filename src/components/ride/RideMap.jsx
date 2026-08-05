import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pickupIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#0B463C;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#111827;border:2px solid #fff;border-radius:4px;transform:rotate(45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const driverIcon = (emoji) =>
  L.divIcon({
    className: '',
    html: `<div style="background:#fff;width:36px;height:36px;border-radius:50%;border:2px solid #0B463C;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:18px;">${emoji || '🚗'}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 14);
  }, [center?.lat, center?.lng]);
  return null;
}

function FitBounds({ pickup, destination }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && destination) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
      ]);
      map.fitBounds(bounds, { padding: [70, 70] });
    }
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);
  return null;
}

export default function RideMap({ pickup, destination, driverPos, driverType }) {
  const center = pickup || destination || { lat: -1.2864, lng: 36.8233 };
  const emoji = driverType === 'bodaboda' ? '🏍️' : driverType === 'truck' ? '🚚' : '🚗';
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds pickup={pickup} destination={destination} />
      <Recenter center={pickup || center} />
      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>Pickup</Popup>
        </Marker>
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}
      {pickup && destination && (
        <Polyline
          positions={[
            [pickup.lat, pickup.lng],
            [destination.lat, destination.lng],
          ]}
          pathOptions={{ color: '#0B463C', weight: 4, dashArray: '6 8' }}
        />
      )}
      {driverPos && (
        <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon(emoji)}>
          <Popup>Your driver</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
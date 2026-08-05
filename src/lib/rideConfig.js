import { resolveAreaCoords } from './kenyaAreas';

// Ride types with Bolt-style pricing for the Kenyan market (KES)
export const RIDE_TYPES = {
  bodaboda: { key: 'bodaboda', label: 'Boda boda', base: 50, perKm: 25, perMin: 0, capacity: '1 seat', eta: '2 min', emoji: '🏍️' },
  cab:      { key: 'cab',      label: 'Cab',        base: 120, perKm: 45, perMin: 3, capacity: '4 seats', eta: '4 min', emoji: '🚗' },
  truck:    { key: 'truck',    label: 'Truck',      base: 600, perKm: 90, perMin: 0, capacity: 'Cargo',   eta: '8 min', emoji: '🚚' },
};

export const RIDE_TYPE_ORDER = ['cab', 'bodaboda', 'truck'];

// Haversine distance in km between two {lat, lng} points
export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function estimateDurationMin(distanceKm) {
  // ~28 km/h average Nairobi traffic
  return Math.max(3, Math.round(((distanceKm || 0) / 28) * 60));
}

export function computeFare(type, distanceKm, durationMin) {
  const t = RIDE_TYPES[type];
  if (!t) return 0;
  return Math.round(t.base + t.perKm * (distanceKm || 0) + t.perMin * (durationMin || 0));
}

// Resolve a place name to coords; falls back to a deterministic offset from
// Nairobi CBD so any typed destination is bookable even if unknown.
export function resolveCoords(name) {
  return resolveAreaCoords(name);
}

export const NAIROBI_CBD = { lat: -1.2864, lng: 36.8233 };

export function fallbackCoords(name) {
  let h = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return {
    lat: NAIROBI_CBD.lat - 0.02 + ((h % 100) / 100) * 0.04,
    lng: NAIROBI_CBD.lng - 0.02 + (((h >> 8) % 100) / 100) * 0.04,
  };
}

// Simulated driver fleet
export const DRIVER_POOL = {
  cab: [
    { name: 'James Mwangi', phone: '+254712345601', vehicle_model: 'Toyota Vitz', vehicle_plate: 'KDA 100A' },
    { name: 'Grace Wanjiru', phone: '+254712345602', vehicle_model: 'Nissan Note', vehicle_plate: 'KDB 201B' },
    { name: 'Ali Hassan', phone: '+254712345603', vehicle_model: 'Mazda Demio', vehicle_plate: 'KDC 302C' },
  ],
  bodaboda: [
    { name: 'Peter Kamau', phone: '+254712345611', vehicle_model: 'Honda CB125', vehicle_plate: 'KMEA 451B' },
    { name: 'Brian Otieno', phone: '+254712345612', vehicle_model: 'Boxer BF150', vehicle_plate: 'KMEB 552B' },
    { name: 'Samuel Kiptoo', phone: '+254712345613', vehicle_model: 'TVS HLX 150', vehicle_plate: 'KMEC 653C' },
  ],
  truck: [
    { name: 'David Otieno', phone: '+254712345621', vehicle_model: 'Isuzu NQR (3.5 ton)', vehicle_plate: 'KCH 701C' },
    { name: 'Meshack Njoroge', phone: '+254712345622', vehicle_model: 'Mitsubishi Canter (3 ton)', vehicle_plate: 'KCH 802C' },
    { name: 'Felix Mutua', phone: '+254712345623', vehicle_model: 'Isuzu FRR (5 ton)', vehicle_plate: 'KCH 903C' },
  ],
};

// Pick the nearest real driver from a list, using each driver's stored
// location or first resolvable service-area coordinate. Returns null if none
// can be geolocated (caller should then fall back to a default).
export function nearestDriverFromList(drivers, pickup) {
  if (!drivers || drivers.length === 0 || !pickup) return null;
  let best = null;
  let bestDist = Infinity;
  for (const d of drivers) {
    let coords = null;
    if (d.location?.lat && d.location?.lng) {
      coords = { lat: d.location.lat, lng: d.location.lng };
    } else if (d.service_areas?.length) {
      for (const a of d.service_areas) {
        const c = resolveAreaCoords(a);
        if (c) { coords = c; break; }
      }
    }
    if (!coords) continue;
    const dist = haversineKm(pickup, coords);
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return best;
}

export function pickDriver(type) {
  const pool = DRIVER_POOL[type] || DRIVER_POOL.cab;
  return pool[Math.floor(Math.random() * pool.length)];
}
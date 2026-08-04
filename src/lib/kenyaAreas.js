// Approximate coordinates for common Kenyan areas/towns for map placement.
// Lightweight offline geocoder used when no precise coordinates are stored.
export const KENYA_AREAS = {
  // Nairobi neighbourhoods
  westlands: { lat: -1.2676, lng: 36.8108 },
  kilimani: { lat: -1.2921, lng: 36.7833 },
  lavington: { lat: -1.2676, lng: 36.7683 },
  karen: { lat: -1.3197, lng: 36.7044 },
  runda: { lat: -1.2308, lng: 36.8236 },
  kasarani: { lat: -1.2186, lng: 36.8986 },
  embakasi: { lat: -1.3167, lng: 36.9167 },
  ruaka: { lat: -1.2076, lng: 36.7556 },
  'ngong road': { lat: -1.2921, lng: 36.7683 },
  'industrial area': { lat: -1.3167, lng: 36.8667 },
  cbd: { lat: -1.2864, lng: 36.8233 },
  'south b': { lat: -1.3167, lng: 36.85 },
  'south c': { lat: -1.3267, lng: 36.8333 },
  eastleigh: { lat: -1.2767, lng: 36.8667 },
  langata: { lat: -1.3667, lng: 36.7333 },
  dagoretti: { lat: -1.3, lng: 36.7167 },
  ruaraka: { lat: -1.25, lng: 36.8833 },
  parklands: { lat: -1.2676, lng: 36.8083 },
  kileleshwa: { lat: -1.2767, lng: 36.7833 },
  muthaiga: { lat: -1.25, lng: 36.85 },
  roysambu: { lat: -1.2186, lng: 36.8986 },
  // Mombasa / Coast
  mombasa: { lat: -4.0435, lng: 39.6682 },
  likoni: { lat: -4.0747, lng: 39.6682 },
  bamburi: { lat: -4.05, lng: 39.7167 },
  nyali: { lat: -4.0167, lng: 39.7 },
  shanzu: { lat: -3.9833, lng: 39.7333 },
  mtwapa: { lat: -3.95, lng: 39.75 },
  malindi: { lat: -3.139, lng: 40.1171 },
  kilifi: { lat: -3.6333, lng: 39.85 },
  diani: { lat: -4.29, lng: 39.59 },
  ukunda: { lat: -4.2833, lng: 39.5667 },
  voi: { lat: -3.3969, lng: 38.556 },
  mwatate: { lat: -3.4667, lng: 38.3833 },
  taita: { lat: -3.4, lng: 38.35 },
  // Other major towns
  nairobi: { lat: -1.2921, lng: 36.8219 },
  nakuru: { lat: -0.3031, lng: 36.08 },
  eldoret: { lat: 0.5143, lng: 35.2698 },
  kisumu: { lat: -0.0917, lng: 34.768 },
  thika: { lat: -1.0333, lng: 37.0833 },
  nyeri: { lat: -0.4167, lng: 36.95 },
  machakos: { lat: -1.5167, lng: 37.2667 },
  meru: { lat: 0.0463, lng: 37.6459 },
  kakamega: { lat: 0.2827, lng: 34.7519 },
  kitale: { lat: 1.0167, lng: 35.0 },
  garissa: { lat: -0.4569, lng: 39.6467 },
  wajir: { lat: 1.7471, lng: 40.0573 },
  lamu: { lat: -2.2717, lng: 40.901 },
  naivasha: { lat: -0.7167, lng: 36.4333 },
  narok: { lat: -1.0833, lng: 35.8667 },
  bungoma: { lat: 0.5667, lng: 34.5667 },
  kericho: { lat: -0.3667, lng: 35.2833 },
};

// Resolve a place name (area, town, address) to coordinates, case-insensitively.
// Returns { lat, lng } or null.
export function resolveAreaCoords(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  if (!key) return null;
  if (KENYA_AREAS[key]) return KENYA_AREAS[key];
  // Loose contains match for longer names (avoid short-token false positives)
  for (const k of Object.keys(KENYA_AREAS)) {
    if (k.length >= 4 && (key.includes(k) || k.includes(key))) return KENYA_AREAS[k];
  }
  return null;
}
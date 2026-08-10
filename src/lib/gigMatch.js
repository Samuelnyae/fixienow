// Client-side gig matching for the reverse job board.
// Pure deterministic scoring (no LLM) — the future voice/USSD agent layer
// can reuse the same Gig data.

export const GIG_CATEGORIES = [
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'hvac', label: 'HVAC / Cooling' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
  { value: 'locksmith', label: 'Locksmith' },
  { value: 'boda', label: 'Boda / Delivery' },
  { value: 'tailor', label: 'Tailor' },
  { value: 'artisan', label: 'Artisan / Other' },
];

export function categoryLabel(category) {
  const c = GIG_CATEGORIES.find((x) => x.value === category);
  return c ? c.label : (category || '').replace(/_/g, ' ');
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Core trade skills technicians can pick. Each maps to a gig category slug so
// the reverse job board matches them to gigs; a few extra common trades are
// included for profile richness (no gig category yet).
export const TECHNICIAN_SKILLS = [
  { label: 'Plumbing', slug: 'plumber' },
  { label: 'Electrical', slug: 'electrician' },
  { label: 'Car maintenance', slug: 'mechanic' },
  { label: 'Carpentry', slug: 'carpenter' },
  { label: 'Painting', slug: 'painter' },
  { label: 'HVAC / Cooling', slug: 'hvac' },
  { label: 'Appliance repair', slug: 'appliance_repair' },
  { label: 'Locksmith', slug: 'locksmith' },
  { label: 'Boda / Delivery', slug: 'boda' },
  { label: 'Tailoring', slug: 'tailor' },
  { label: 'Artisan / Crafts', slug: 'artisan' },
  { label: 'Welding', slug: 'welding' },
  { label: 'Tiling', slug: 'tiling' },
  { label: 'Roofing', slug: 'roofing' },
  { label: 'Solar installation', slug: 'solar' },
  { label: 'CCTV installation', slug: 'cctv' },
  { label: 'Generator repair', slug: 'generator' },
  { label: 'General handyman', slug: 'handyman' },
];

// Friendly skill label → gig category slug, so "Plumbing" matches a "plumber" gig, etc.
const SKILL_ALIASES = {
  plumbing: 'plumber',
  pipefitting: 'plumber',
  electrical: 'electrician',
  electricity: 'electrician',
  wiring: 'electrician',
  carmaintenance: 'mechanic',
  automechanic: 'mechanic',
  vehicle: 'mechanic',
  carpentry: 'carpenter',
  woodworking: 'carpenter',
  painting: 'painter',
  hvaccooling: 'hvac',
  aircon: 'hvac',
  tailoring: 'tailor',
  sewing: 'tailor',
  artisancrafts: 'artisan',
  handyman: 'handyman',
};

function resolveSkill(raw) {
  const n = norm(raw);
  return SKILL_ALIASES[n] || n;
}

export function isSkillMatch(technician, category) {
  if (!technician || !category) return false;
  const cat = norm(category);
  const skills = [technician.profession, ...(technician.skills || [])]
    .filter(Boolean)
    .map(resolveSkill);
  return skills.some((s) => s && (s === cat || s.includes(cat) || cat.includes(s)));
}

function haversineKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null || a.lng == null || b.lng == null) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function scoreGigForTechnician(gig, technician) {
  if (!isSkillMatch(technician, gig.category)) return 0;
  let score = 40; // base for skill match

  const area = norm(gig.area_name);
  if (area) {
    const areas = (technician.service_areas || []).map(norm);
    if (areas.some((a) => a && (a === area || a.includes(area) || area.includes(a)))) score += 25;
  } else {
    score += 10;
  }

  const rating = Number(technician.rating) || 0;
  score += Math.min(15, (rating / 5) * 15);

  if (technician.is_available) score += 10;

  const dist = haversineKm(gig.location, technician.location);
  if (dist != null) {
    if (dist <= 5) score += 10;
    else if (dist <= 15) score += 6;
    else if (dist <= 30) score += 2;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function neededByLabel(gig) {
  if (!gig || !gig.needed_by) return 'ASAP';
  const d = new Date(gig.needed_by);
  if (Number.isNaN(d.getTime())) return 'ASAP';
  const diffH = (d.getTime() - Date.now()) / 3600000;
  if (diffH <= 0) return 'Now';
  if (diffH <= 6) return `Within ~${Math.max(1, Math.round(diffH))}h`;
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
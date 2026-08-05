// Fixie Credit Score
// Turns a provider's verified activity (technician or driver) into a 300–850
// credit-readiness score that partner banks / SACCOs can use for micro-loans,
// asset finance and insurance. Pure function — no SDK calls.

const BASE = 300;
const MAX = 850;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Each factor contributes points up to its `weight`. Returned `factors` are
// used by the UI to show what's driving the score.
export function computeCreditScore(profile = {}) {
  const {
    verification_status,
    rating = 0,
    total_reviews = 0,
    total_jobs = 0,
    total_trips = 0,
    wallet_balance = 0,
    years_experience = 0,
    has_certificate = false,
  } = profile;

  const factors = [];
  let score = BASE;

  // 1. Verification (0 or 120)
  const verifPts = verification_status === 'approved' ? 120 : 0;
  score += verifPts;
  factors.push({ label: 'KYC / Verification', points: verifPts, max: 120, value: verification_status === 'approved' ? 'Verified' : 'Pending' });

  // 2. Rating (0–150) — maps 0..5 stars to 0..150
  const ratingPts = clamp((rating / 5) * 150, 0, 150);
  score += ratingPts;
  factors.push({ label: 'Customer rating', points: Math.round(ratingPts), max: 150, value: `${(rating || 0).toFixed(1)} / 5` });

  // 3. Completed work volume (0–200) — jobs + trips, capped at 100
  const volume = (total_jobs || 0) + (total_trips || 0);
  const volumePts = clamp((Math.min(volume, 100) / 100) * 200, 0, 200);
  score += volumePts;
  factors.push({ label: 'Completed jobs / trips', points: Math.round(volumePts), max: 200, value: `${volume} done` });

  // 4. Wallet activity (0–150) — balance proxy for transaction history, cap 50k
  const walletPts = clamp((Math.min(wallet_balance || 0, 50000) / 50000) * 150, 0, 150);
  score += walletPts;
  factors.push({ label: 'Wallet activity', points: Math.round(walletPts), max: 150, value: `KES ${(wallet_balance || 0).toLocaleString()}` });

  // 5. Experience (0–80) — capped at 10 years
  const expPts = clamp((Math.min(years_experience || 0, 10) / 10) * 80, 0, 80);
  score += expPts;
  factors.push({ label: 'Years of experience', points: Math.round(expPts), max: 80, value: `${years_experience || 0} yrs` });

  // 6. Review count (0–80) — signals consistent reputation, cap 50
  const reviewPts = clamp((Math.min(total_reviews || 0, 50) / 50) * 80, 0, 80);
  score += reviewPts;
  factors.push({ label: 'Number of reviews', points: Math.round(reviewPts), max: 80, value: `${total_reviews || 0} reviews` });

  // 7. Certificate / insurance (0–50)
  const certPts = has_certificate ? 50 : 0;
  score += certPts;
  factors.push({ label: 'Trade certificate / insurance', points: certPts, max: 50, value: has_certificate ? 'Provided' : 'Missing' });

  score = clamp(Math.round(score), BASE, MAX);

  return { score, band: bandFor(score), tier: tierFor(score), factors };
}

export function bandFor(score) {
  if (score >= 800) return { label: 'Excellent', color: '#15803d', tailwind: 'text-green-700', ring: '#22c55e' };
  if (score >= 740) return { label: 'Very Good', color: '#166534', tailwind: 'text-green-700', ring: '#4ade80' };
  if (score >= 670) return { label: 'Good', color: '#1d4ed8', tailwind: 'text-blue-700', ring: '#3b82f6' };
  if (score >= 580) return { label: 'Fair', color: '#b45309', tailwind: 'text-amber-700', ring: '#f59e0b' };
  return { label: 'Needs Work', color: '#b91c1c', tailwind: 'text-red-700', ring: '#ef4444' };
}

export function tierFor(score) {
  if (score >= 740) return 'Credit-ready';      // pre-qualified for loans / asset finance
  if (score >= 670) return 'Emerging';         // eligible for small starter credit
  if (score >= 580) return 'Building';         // needs more history
  return 'Early stage';                        // focus on onboarding + first jobs
}

// Normalise a Technician record into the profile shape computeCreditScore reads.
export const technicianProfile = (t = {}) => ({
  verification_status: t.verification_status,
  rating: t.rating,
  total_reviews: t.total_reviews,
  total_jobs: t.total_jobs,
  wallet_balance: t.wallet_balance,
  years_experience: t.years_experience,
  has_certificate: !!t.certificate_url,
});

export const driverProfile = (d = {}) => ({
  verification_status: d.verification_status,
  rating: d.rating,
  total_reviews: 0,
  total_trips: d.total_trips,
  wallet_balance: d.wallet_balance,
  years_experience: d.years_experience,
  has_certificate: !!d.insurance_url,
});
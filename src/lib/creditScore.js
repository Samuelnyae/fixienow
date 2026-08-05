// Fixie Credit Score
// A 300–850 credit-readiness score built on three pillars of verified hustle:
//   1. Successful job count      — proven, completed work volume
//   2. Positive review ratings   — consistent customer satisfaction
//   3. Wallet transaction history — documented financial behaviour
// KYC verification acts as a gate: an unverified provider cannot be credit-ready.

import { base44 } from '@/api/base44Client';

export const BASE = 300;
export const MAX = 850;
// Without verified KYC a provider cannot exceed "Fair" — no credit eligibility.
export const KYC_GATE_CAP = 580;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Pillar weights (sum to 550; base 300 + 550 = 850 max)
const WEIGHTS = {
  jobs: 200,     // successful job count
  reviews: 180,  // positive review ratings
  wallet: 170,  // wallet transaction history
};

export function computeCreditScore(profile = {}) {
  const {
    verification_status,
    rating = 0,
    total_reviews = 0,
    total_jobs = 0,
    total_trips = 0,
    walletStats = null,   // { tx_count, tx_throughput } from loadWalletStats
    wallet_balance = 0,   // fallback when walletStats unavailable
  } = profile;

  const completedJobs = (total_jobs || 0) + (total_trips || 0);
  const factors = [];
  let score = BASE;

  // --- Pillar 1: Successful job count (0–200) ---
  // Volume of proven, completed work. Caps at 80 jobs: beyond that the
  // hustle is well established and extra jobs add diminishing signal.
  const jobPts = clamp((Math.min(completedJobs, 80) / 80) * WEIGHTS.jobs, 0, WEIGHTS.jobs);
  score += jobPts;
  factors.push({
    label: 'Successful jobs',
    key: 'jobs',
    points: Math.round(jobPts),
    max: WEIGHTS.jobs,
    value: `${completedJobs} completed`,
  });

  // --- Pillar 2: Positive review ratings (0–180) ---
  // Blends rating quality with review consistency:
  //   rating contributes up to 120  (rating/5 * 120)
  //   review count contributes 60   (min(reviews,40)/40 * 60)
  const ratingPts = clamp((rating / 5) * 120, 0, 120);
  const reviewCountPts = clamp((Math.min(total_reviews || 0, 40) / 40) * 60, 0, 60);
  const reviewPts = ratingPts + reviewCountPts;
  score += reviewPts;
  factors.push({
    label: 'Positive reviews',
    key: 'reviews',
    points: Math.round(reviewPts),
    max: WEIGHTS.reviews,
    value: `${(rating || 0).toFixed(1)} ★ · ${total_reviews || 0} reviews`,
  });

  // --- Pillar 3: Wallet transaction history (0–170) ---
  // Uses real transaction history when available, else falls back to balance:
  //   tx count contributes up to 100     (min(count,50)/50 * 100)
  //   throughput contributes up to 70    (min(throughput, 200k)/200k * 70)
  let txCount = 0;
  let throughput = 0;
  let usingFallback = false;
  if (walletStats) {
    txCount = walletStats.tx_count || 0;
    throughput = walletStats.tx_throughput || 0;
  } else {
    throughput = wallet_balance || 0;
    usingFallback = true;
  }
  const txCountPts = clamp((Math.min(txCount, 50) / 50) * 100, 0, 100);
  const throughputPts = clamp((Math.min(throughput, 200000) / 200000) * 70, 0, 70);
  const walletPts = txCountPts + throughputPts;
  score += walletPts;
  factors.push({
    label: 'Wallet history',
    key: 'wallet',
    points: Math.round(walletPts),
    max: WEIGHTS.wallet,
    value: usingFallback
      ? `KES ${(wallet_balance || 0).toLocaleString()} balance`
      : `${txCount} transactions · KES ${Math.round(throughput).toLocaleString()}`,
  });

  score = clamp(Math.round(score), BASE, MAX);

  // KYC gate — unverified providers cannot reach credit-ready tiers
  const kycVerified = verification_status === 'approved';
  let gated = false;
  if (!kycVerified && score > KYC_GATE_CAP) {
    score = KYC_GATE_CAP;
    gated = true;
  }

  return { score, band: bandFor(score), tier: tierFor(score), factors, kycVerified, gated };
}

export function bandFor(score) {
  if (score >= 800) return { label: 'Excellent', color: '#15803d', tailwind: 'text-green-700', ring: '#22c55e' };
  if (score >= 740) return { label: 'Very Good', color: '#166534', tailwind: 'text-green-700', ring: '#4ade80' };
  if (score >= 670) return { label: 'Good', color: '#1d4ed8', tailwind: 'text-blue-700', ring: '#3b82f6' };
  if (score >= 580) return { label: 'Fair', color: '#b45309', tailwind: 'text-amber-700', ring: '#f59e0b' };
  return { label: 'Needs Work', color: '#b91c1c', tailwind: 'text-red-700', ring: '#ef4444' };
}

export function tierFor(score) {
  if (score >= 740) return 'Credit-ready';
  if (score >= 670) return 'Emerging';
  if (score >= 580) return 'Building';
  return 'Early stage';
}

// Fetch a wallet's completed transaction history and reduce it to the two
// numbers the credit score needs: count of transactions and total throughput
// (sum of all completed transaction amounts, in & out).
export async function loadWalletStats(walletId) {
  if (!walletId) return { tx_count: 0, tx_throughput: 0 };
  try {
    const [outgoing, incoming] = await Promise.all([
      base44.entities.Transaction.filter(
        { from_wallet_id: walletId, status: 'completed' },
        '-created_date', 200
      ),
      base44.entities.Transaction.filter(
        { to_wallet_id: walletId, status: 'completed' },
        '-created_date', 200
      ),
    ]);
    const txs = [...(outgoing || []), ...(incoming || [])];
    const tx_throughput = txs.reduce((sum, t) => sum + (t.amount || 0), 0);
    return { tx_count: txs.length, tx_throughput };
  } catch {
    return { tx_count: 0, tx_throughput: 0 };
  }
}

// Normalise a Technician record into the profile shape computeCreditScore reads.
export const technicianProfile = (t = {}, walletStats = null) => ({
  verification_status: t.verification_status,
  rating: t.rating,
  total_reviews: t.total_reviews,
  total_jobs: t.total_jobs,
  wallet_balance: t.wallet_balance,
  walletStats,
});

export const driverProfile = (d = {}, walletStats = null) => ({
  verification_status: d.verification_status,
  rating: d.rating,
  total_trips: d.total_trips,
  wallet_balance: d.wallet_balance,
  walletStats,
});
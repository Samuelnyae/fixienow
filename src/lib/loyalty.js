import { base44 } from '@/api/base44Client';

// 1 point per KES 10 spent; 1 point redeems for KES 0.50
export const POINTS_PER_KES = 0.1;
export const REDEEM_RATE = 0.5;
export const MIN_REDEEM_POINTS = 100;

export const TIER_CONFIG = {
  bronze:   { key: 'bronze',   label: 'Bronze',   min: 0,     cashback: 0.02, badge: 'bg-amber-100 text-amber-700',   bar: 'bg-amber-500',   tint: 'bg-amber-50' },
  silver:   { key: 'silver',   label: 'Silver',   min: 500,   cashback: 0.03, badge: 'bg-slate-200 text-slate-700',   bar: 'bg-slate-400',   tint: 'bg-slate-50' },
  gold:     { key: 'gold',     label: 'Gold',     min: 2500,  cashback: 0.05, badge: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500',  tint: 'bg-yellow-50' },
  platinum: { key: 'platinum', label: 'Platinum', min: 10000, cashback: 0.08, badge: 'bg-indigo-100 text-indigo-700',  bar: 'bg-indigo-500',  tint: 'bg-indigo-50' },
};
export const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'];

export const computeTier = (lifetimePoints) => {
  let t = 'bronze';
  for (const k of TIER_ORDER) if ((lifetimePoints || 0) >= TIER_CONFIG[k].min) t = k;
  return t;
};

export const nextTier = (tier) => {
  const i = TIER_ORDER.indexOf(tier);
  return i < TIER_ORDER.length - 1 ? TIER_CONFIG[TIER_ORDER[i + 1]] : null;
};

export const getOrCreateAccount = async (userId) => {
  if (!userId) return null;
  try {
    const existing = await base44.entities.LoyaltyAccount.filter({ user_id: userId });
    if (existing && existing[0]) return existing[0];
  } catch (e) { /* fall through to create */ }
  return await base44.entities.LoyaltyAccount.create({
    user_id: userId,
    points_balance: 0,
    lifetime_points: 0,
    tier: 'bronze',
    total_bookings: 0,
    total_spent: 0,
  });
};

const kesBalance = (wallet) => {
  const i = (wallet?.balances || []).findIndex((b) => b.currency === 'KES');
  return i !== -1 ? (wallet.balances[i].amount || 0) : 0;
};
const setKes = (wallet, amt) => {
  const balances = [...(wallet?.balances || [])];
  const i = balances.findIndex((b) => b.currency === 'KES');
  if (i !== -1) balances[i] = { ...balances[i], amount: amt };
  else balances.push({ currency: 'KES', amount: amt, currency_symbol: 'KSh' });
  return balances;
};

// Award points for a paid booking; credit wallet cashback when paid via Fixie Wallet.
export const awardForBooking = async (user, booking, paymentMethod, amount) => {
  if (!user || !booking || !amount || amount <= 0) return { points: 0, cashback: 0, tier: 'bronze' };
  const account = await getOrCreateAccount(user.id);
  const points = Math.floor(amount * POINTS_PER_KES);
  const newLifetime = (account.lifetime_points || 0) + points;
  const newBalance = (account.points_balance || 0) + points;
  const newTier = computeTier(newLifetime);
  const currentTier = account.tier || 'bronze';
  const cashbackRate = TIER_CONFIG[currentTier].cashback;
  const cashback = paymentMethod === 'wallet' ? Math.round(amount * cashbackRate) : 0;

  await base44.entities.LoyaltyAccount.update(account.id, {
    points_balance: newBalance,
    lifetime_points: newLifetime,
    tier: newTier,
    total_bookings: (account.total_bookings || 0) + 1,
    total_spent: (account.total_spent || 0) + amount,
  });
  await base44.entities.LoyaltyTransaction.create({
    user_id: user.id,
    account_id: account.id,
    type: 'earn',
    points,
    amount,
    booking_id: booking.id,
    description: `Points earned for ${booking.category?.replace(/_/g, ' ') || 'service'} service`,
  });

  if (cashback > 0) {
    try {
      const wallets = await base44.entities.Wallet.filter({ user_id: user.id });
      const wallet = wallets && wallets[0];
      if (wallet) {
        const newAmt = kesBalance(wallet) + cashback;
        await base44.entities.Wallet.update(wallet.id, {
          balances: setKes(wallet, newAmt),
          total_received: (wallet.total_received || 0) + cashback,
        });
        await base44.entities.Transaction.create({
          transaction_id: `cb_${Date.now()}_${(booking.id || '').slice(-6)}`,
          to_wallet_id: wallet.id,
          to_address: wallet.wallet_address || '',
          amount: cashback,
          currency: 'KES',
          transaction_type: 'deposit',
          status: 'completed',
          payment_method: 'wallet',
          description: `Loyalty cashback (${TIER_CONFIG[currentTier].label})`,
          metadata: { booking_id: booking.id },
        });
        await base44.entities.LoyaltyTransaction.create({
          user_id: user.id,
          account_id: account.id,
          type: 'cashback',
          points: 0,
          amount: cashback,
          booking_id: booking.id,
          description: 'Wallet cashback for paying with Fixie Wallet',
        });
      }
    } catch (e) { /* cashback is best-effort */ }
  }
  return { points, cashback, tier: newTier };
};

// Redeem points into wallet KES credit.
export const redeemPointsToWallet = async (userId, points) => {
  if (!points || points < MIN_REDEEM_POINTS) throw new Error(`Minimum redeem is ${MIN_REDEEM_POINTS} points`);
  const account = await getOrCreateAccount(userId);
  if ((account.points_balance || 0) < points) throw new Error('Not enough points');
  const kesAmount = Math.round(points * REDEEM_RATE);
  const wallets = await base44.entities.Wallet.filter({ user_id: userId });
  const wallet = wallets && wallets[0];
  if (!wallet) throw new Error('No wallet found. Open your wallet first.');

  await base44.entities.LoyaltyAccount.update(account.id, {
    points_balance: (account.points_balance || 0) - points,
  });
  const newAmt = kesBalance(wallet) + kesAmount;
  await base44.entities.Wallet.update(wallet.id, {
    balances: setKes(wallet, newAmt),
    total_received: (wallet.total_received || 0) + kesAmount,
  });
  await base44.entities.Transaction.create({
    transaction_id: `rdm_${Date.now()}`,
    to_wallet_id: wallet.id,
    to_address: wallet.wallet_address || '',
    amount: kesAmount,
    currency: 'KES',
    transaction_type: 'deposit',
    status: 'completed',
    payment_method: 'wallet',
    description: `Redeemed ${points} Fixie points`,
  });
  await base44.entities.LoyaltyTransaction.create({
    user_id: userId,
    account_id: account.id,
    type: 'redeem',
    points: -points,
    amount: kesAmount,
    description: 'Redeemed points to wallet',
  });
  return { kesAmount, newBalance: (account.points_balance || 0) - points };
};
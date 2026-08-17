import { base44 } from '@/api/base44Client';

// Find a logged-in customer's wallet by the phone number they typed in the USSD menu.
// Returns the wallet object or null (guests / unregistered phones have no wallet).
export const findCustomerWallet = async (phone) => {
  if (!phone) return null;
  try {
    const users = await base44.entities.User.filter({ phone });
    const user = users && users[0];
    if (!user) return null;
    const wallets = await base44.entities.Wallet.filter({ user_id: user.id });
    return wallets && wallets[0] ? wallets[0] : null;
  } catch (e) {
    return null;
  }
};

// Read the KES balance off a wallet object (0 when absent).
export const getKesBalance = (wallet) => {
  const balances = wallet?.balances || [];
  const idx = balances.findIndex((b) => b.currency === 'KES');
  return idx !== -1 ? (balances[idx].amount || 0) : 0;
};

// Debit a customer's wallet by `amount`. Caller must have verified sufficient funds.
// Returns { ok: true } on success or { ok: false, reason: 'insufficient' }.
export const debitWallet = async (wallet, amount) => {
  const balances = [...(wallet?.balances || [])];
  const idx = balances.findIndex((b) => b.currency === 'KES');
  const current = idx !== -1 ? (balances[idx].amount || 0) : 0;
  if (current < amount) return { ok: false, reason: 'insufficient' };
  if (idx !== -1) balances[idx] = { ...balances[idx], amount: current - amount };
  else balances.push({ currency: 'KES', amount: -amount, currency_symbol: 'KSh' });
  await base44.entities.Wallet.update(wallet.id, {
    balances,
    total_sent: (wallet.total_sent || 0) + amount,
  });
  return { ok: true };
};

// Credit a recipient's wallet by `amount` (KES). Mirrors debitWallet in reverse.
export const creditWallet = async (wallet, amount) => {
  const balances = [...(wallet?.balances || [])];
  const idx = balances.findIndex((b) => b.currency === 'KES');
  const current = idx !== -1 ? (balances[idx].amount || 0) : 0;
  if (idx !== -1) balances[idx] = { ...balances[idx], amount: current + amount };
  else balances.push({ currency: 'KES', amount, currency_symbol: 'KSh' });
  await base44.entities.Wallet.update(wallet.id, {
    balances,
    total_received: (wallet.total_received || 0) + amount,
  });
  return { ok: true };
};
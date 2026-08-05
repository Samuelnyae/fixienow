import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { loadWalletStats } from '@/lib/creditScore';

// Loads the wallet + completed-transaction stats for a provider (technician or
// driver), keyed by their owning user_id. Returns null while loading or when no
// wallet exists (the score then falls back to balance).
export function useWalletStats(userId, enabled = true) {
  return useQuery({
    queryKey: ['walletStats', userId],
    queryFn: async () => {
      const wallets = await base44.entities.Wallet.filter({ user_id: userId });
      const wallet = wallets && wallets[0];
      if (!wallet) return null;
      return loadWalletStats(wallet.id);
    },
    enabled: !!userId && enabled,
    staleTime: 60 * 1000,
  });
}
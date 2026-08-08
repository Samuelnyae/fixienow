import { useQuery } from '@tanstack/react-query';
import { Award, ShieldCheck, Star, Gem } from 'lucide-react';
import { getOrCreateAccount, TIER_CONFIG } from '@/lib/loyalty';

const TIER_ICONS = { bronze: Award, silver: ShieldCheck, gold: Star, platinum: Gem };

export default function TierBadge({ userId, className = '' }) {
  const { data: account } = useQuery({
    queryKey: ['loyaltyAccount', userId],
    queryFn: () => getOrCreateAccount(userId),
    enabled: !!userId,
    staleTime: 30000,
  });
  if (!account) return null;
  const cfg = TIER_CONFIG[account.tier || 'bronze'];
  const Icon = TIER_ICONS[account.tier || 'bronze'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label} · {(account.points_balance || 0).toLocaleString()} pts
    </span>
  );
}
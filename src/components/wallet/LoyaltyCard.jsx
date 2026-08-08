import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, Sparkles } from 'lucide-react';
import { getOrCreateAccount, TIER_CONFIG, nextTier, REDEEM_RATE, MIN_REDEEM_POINTS } from '@/lib/loyalty';
import RedeemPointsDialog from './RedeemPointsDialog';

export default function LoyaltyCard({ user }) {
  const [showRedeem, setShowRedeem] = useState(false);
  const queryClient = useQueryClient();
  const { data: account } = useQuery({
    queryKey: ['loyaltyAccount', user?.id],
    queryFn: () => getOrCreateAccount(user.id),
    enabled: !!user,
  });
  if (!account) return null;

  const cfg = TIER_CONFIG[account.tier || 'bronze'];
  const nt = nextTier(account.tier || 'bronze');
  const progress = nt
    ? Math.min(100, Math.max(0, Math.round(((account.lifetime_points - cfg.min) / (nt.min - cfg.min)) * 100)))
    : 100;
  const points = account.points_balance || 0;
  const kesValue = Math.round(points * REDEEM_RATE);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className={`p-5 ${cfg.tint} border-b border-gray-100`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fixie Rewards</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {points.toLocaleString()} <span className="text-base font-medium text-gray-500">pts</span>
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.badge}`}>{cfg.label}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">≈ KES {kesValue.toLocaleString()} available to redeem</p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{nt ? `Progress to ${nt.label}` : 'Top tier reached 🎉'}</span>
              {nt && <span>{account.lifetime_points || 0} / {nt.min} pts</span>}
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full ${cfg.bar} rounded-full transition-all`} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Pay with Fixie Wallet to earn <strong>{Math.round(cfg.cashback * 100)}% cashback</strong> on every booking.</span>
          </div>

          <button
            onClick={() => setShowRedeem(true)}
            disabled={points < MIN_REDEEM_POINTS}
            className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Gift className="w-4 h-4" />
            {points < MIN_REDEEM_POINTS ? `Need ${MIN_REDEEM_POINTS} pts to redeem` : 'Redeem points to wallet'}
          </button>
        </div>
      </div>

      <RedeemPointsDialog
        open={showRedeem}
        onOpenChange={setShowRedeem}
        account={account}
        onRedeemed={() => queryClient.invalidateQueries(['loyaltyAccount', user.id])}
      />
    </>
  );
}
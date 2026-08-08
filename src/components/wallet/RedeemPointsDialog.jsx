import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Gift } from 'lucide-react';
import { redeemPointsToWallet, REDEEM_RATE, MIN_REDEEM_POINTS } from '@/lib/loyalty';

export default function RedeemPointsDialog({ open, onOpenChange, account, onRedeemed }) {
  const [points, setPoints] = useState(MIN_REDEEM_POINTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setPoints(MIN_REDEEM_POINTS);
      setError(null);
    }
  }, [open]);

  const balance = account?.points_balance || 0;
  const n = Math.floor(Number(points) || 0);
  const kesValue = Math.round(n * REDEEM_RATE);

  const handleRedeem = async () => {
    setError(null);
    setLoading(true);
    try {
      await redeemPointsToWallet(account.user_id, n);
      onRedeemed?.();
      onOpenChange(false);
    } catch (e) {
      setError(e.message || 'Could not redeem points');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-teal-600" /> Redeem Fixie Points
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-teal-50 rounded-xl p-4">
            <p className="text-sm text-teal-700">Available balance</p>
            <p className="text-2xl font-bold text-teal-800">{balance.toLocaleString()} pts</p>
          </div>
          <div>
            <Label>Points to redeem (min {MIN_REDEEM_POINTS})</Label>
            <Input
              type="number"
              min={MIN_REDEEM_POINTS}
              max={balance}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">You'll receive</span>
            <span className="font-semibold text-teal-600">KES {kesValue.toLocaleString()}</span>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleRedeem}
            disabled={loading || n < MIN_REDEEM_POINTS || n > balance}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Redeem KES ${kesValue.toLocaleString()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
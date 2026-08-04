import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Tag, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PromoCodeInput({ category, baseAmount, onApply, onClear }) {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    setError('');
    if (!code.trim()) { setError('Enter a code'); return; }
    setLoading(true);
    try {
      const codes = await base44.entities.PromoCode.filter({ is_active: true });
      const promo = codes.find((p) => p.code?.toUpperCase() === code.trim().toUpperCase());

      if (!promo) { setError('Invalid promo code'); setLoading(false); return; }

      const now = new Date();
      if (promo.valid_from && new Date(promo.valid_from) > now) { setError('Promo not active yet'); setLoading(false); return; }
      if (promo.valid_until && new Date(promo.valid_until) < now) { setError('Promo has expired'); setLoading(false); return; }
      if (promo.usage_limit != null && (promo.used_count || 0) >= promo.usage_limit) { setError('Promo usage limit reached'); setLoading(false); return; }
      if (promo.min_booking_amount && baseAmount < promo.min_booking_amount) { setError(`Minimum booking is KES ${promo.min_booking_amount.toLocaleString()}`); setLoading(false); return; }
      if (promo.applicable_categories?.length > 0 && !promo.applicable_categories.includes(category)) { setError('Not valid for this service'); setLoading(false); return; }

      let discount = 0;
      if (promo.discount_type === 'percentage') {
        discount = (baseAmount * promo.discount_value) / 100;
        if (promo.max_discount_amount && discount > promo.max_discount_amount) discount = promo.max_discount_amount;
      } else {
        discount = promo.discount_value;
      }
      discount = Math.round(Math.min(discount, baseAmount));

      setApplied({ code: promo.code, discountAmount: discount, description: promo.description });
      onApply(discount, promo.code);

      // Increment usage count (best-effort)
      try {
        await base44.entities.PromoCode.update(promo.id, { used_count: (promo.used_count || 0) + 1 });
      } catch (e) { /* may be restricted */ }
    } catch (e) {
      setError('Could not validate code');
    }
    setLoading(false);
  };

  const clear = () => {
    setApplied(null); setCode(''); setError(''); onClear();
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">{applied.code}</p>
            <p className="text-xs text-green-600">−KES {applied.discountAmount.toLocaleString()} off</p>
          </div>
        </div>
        <button onClick={clear} className="text-green-600 hover:text-green-800 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && !loading && apply()}
            placeholder="ENTER CODE"
            className="pl-9 h-11 uppercase font-mono tracking-wider"
            disabled={loading}
          />
        </div>
        <Button
          onClick={apply}
          disabled={loading || !code.trim()}
          variant="outline"
          className="h-11 px-4"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
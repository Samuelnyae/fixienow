import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Verified badge shown when a technician's verification_status === 'approved'.
 * variant:
 *  - "solid"  : teal pill for light backgrounds (cards, sidebar)
 *  - "onTeal" : translucent white pill for teal/gradient headers
 */
export default function VerifiedBadge({ variant = 'solid', className }) {
  const styles =
    variant === 'onTeal'
      ? 'bg-white/20 text-white border border-white/30'
      : 'bg-teal-50 text-teal-700 border border-teal-100';

  return (
    <span
      title="Fixie Verified — national ID and professional certificate have been checked"
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 flex-shrink-0',
        styles,
        className
      )}
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      Verified
    </span>
  );
}
import React from 'react';
import { MapPin, Wallet, Clock } from 'lucide-react';
import { categoryLabel, neededByLabel } from '@/lib/gigMatch';

const STATUS_STYLES = {
  open: 'bg-green-100 text-green-700',
  matched: 'bg-blue-100 text-blue-700',
  completed: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function GigCard({ gig, score, footer, selected, onClick }) {
  const status = gig.status || 'open';
  const Card = (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-sm transition-shadow ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${selected ? 'border-[#0B463C] ring-2 ring-[#0B463C]/20' : 'border-gray-100'}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0B463C] bg-[#0B463C]/5 px-2 py-0.5 rounded-full">
              {categoryLabel(gig.category)}
            </span>
            {status !== 'open' && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                {status}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 leading-tight">{gig.title}</h3>
        </div>
        {score != null && (
          <div className="flex flex-col items-center justify-center rounded-xl bg-amber-50 text-amber-600 px-3 py-1.5 flex-shrink-0">
            <span className="text-lg font-bold leading-none">{score}</span>
            <span className="text-[10px] uppercase tracking-wide">match</span>
          </div>
        )}
      </div>

      {gig.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{gig.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-3">
        {gig.area_name && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {gig.area_name}
          </span>
        )}
        {gig.budget != null && (
          <span className="inline-flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" />
            KES {Number(gig.budget).toLocaleString()}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {neededByLabel(gig)}
        </span>
      </div>

      {footer}
    </div>
  );

  return Card;
}
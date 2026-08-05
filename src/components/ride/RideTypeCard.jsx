import React from 'react';
import { Car, Bike, Truck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = { cab: Car, bodaboda: Bike, truck: Truck };

export default function RideTypeCard({ config, selected, fare, onSelect }) {
  const Icon = ICONS[config.key] || Car;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left',
        selected ? 'border-[#0B463C] bg-[#0B463C]/5' : 'border-transparent hover:bg-gray-50'
      )}
    >
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
          selected ? 'bg-[#0B463C] text-white' : 'bg-gray-100 text-gray-600'
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 leading-tight">{config.label}</p>
        <p className="text-xs text-gray-500">{config.capacity} · {config.eta} away</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-gray-900">KES {fare ? fare.toLocaleString() : '—'}</p>
      </div>
      {selected && <Check className="w-4 h-4 text-[#0B463C] flex-shrink-0" />}
    </button>
  );
}
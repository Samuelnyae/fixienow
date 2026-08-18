import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Settings as SettingsIcon, ShieldCheck, Percent, MapPin, Wallet, Bell } from 'lucide-react';
import ServiceAreaManager from './ServiceAreaManager';

function cls(...parts) { return parts.filter(Boolean).join(' '); }

export default function AdminSettings() {
  const { data: areas = [] } = useQuery({
    queryKey: ['serviceAreas'],
    queryFn: () => base44.entities.ServiceArea.list('-created_date', 200),
  });
  const { data: promoCodes = [] } = useQuery({
    queryKey: ['adminSettingsPromos'],
    queryFn: () => base44.entities.PromoCode.list('-created_date', 100),
  });

  const activeAreas = areas.filter((a) => a.is_active).length;

  const config = [
    { icon: Percent, title: 'Commission Rate', value: '15%', desc: 'Charged on every completed booking. Goes to platform revenue.', color: 'bg-emerald-50 text-emerald-600' },
    { icon: Wallet, title: 'Payout Schedule', value: 'Instant', desc: 'Fundi wallet balance settles to M-Pesa on demand after job completion.', color: 'bg-blue-50 text-blue-600' },
    { icon: MapPin, title: 'Active Service Areas', value: (activeAreas + ' / ' + areas.length), desc: 'Counties and neighbourhoods currently enabled for bookings.', color: 'bg-amber-50 text-amber-600' },
    { icon: Bell, title: 'Active Promo Codes', value: promoCodes.filter((p) => p.is_active).length, desc: 'Discount codes currently redeemable at checkout.', color: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-[#064e3b] to-[#0B463C] rounded-2xl shadow-sm p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Platform Configuration</h3>
            <p className="text-xs text-emerald-100/80">Core settings powering Fixie's marketplace and wallet.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {config.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className={cls('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', c.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-gray-900">{c.title}</p>
                    <p className="text-lg font-bold text-gray-900">{c.value}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" /> Service Areas
        </h3>
        <ServiceAreaManager />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Compliance &amp; Trust
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">CBK License</span><span className="font-medium text-emerald-700">Active</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Escrow Model</span><span className="font-medium text-gray-900">Hold-and-release</span></div>
          <div className="flex justify-between"><span className="text-gray-500">KYC Verification</span><span className="font-medium text-gray-900">Mandatory for fundis</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Dispute Window</span><span className="font-medium text-gray-900">7 days post-job</span></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Promo Codes</h3>
        {promoCodes.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No promo codes created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Code</th>
                  <th className="pb-2 font-medium">Discount</th>
                  <th className="pb-2 font-medium">Used</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.slice(0, 20).map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-mono font-semibold">{p.code}</td>
                    <td className="py-3">{p.discount_type === 'percentage' ? (p.discount_value + '%') : ('KES ' + p.discount_value)}</td>
                    <td className="py-3">{p.used_count || 0}{p.usage_limit ? ('/' + p.usage_limit) : ''}</td>
                    <td className="py-3">
                      <span className={cls('inline-flex px-2 py-0.5 rounded-full text-xs', p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{p.valid_until ? format(new Date(p.valid_until), 'MMM d, yyyy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
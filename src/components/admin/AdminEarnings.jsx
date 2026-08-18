import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { DollarSign } from 'lucide-react';

const COMMISSION_RATE = 0.15;

export default function AdminEarnings({ payments = [], technicians = [] }) {
  const { data: transactions = [] } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
  });

  const paid = payments.filter((p) => p.status === 'completed');
  const gross = paid.reduce((s, p) => s + (p.amount || 0), 0);
  const commission = Math.round(gross * COMMISSION_RATE);
  const payouts = gross - commission;

  const byCategory = useMemo(() => {
    const counts = {};
    paid.forEach((p) => {
      const k = p.category || p.metadata?.category || 'other';
      counts[k] = (counts[k] || 0) + (p.amount || 0);
    });
    return Object.entries(counts)
      .map(([k, v]) => ({ name: k.replace('_', ' '), amount: v }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [paid]);

  const topEarners = useMemo(() =>
    [...technicians].sort((a, b) => (b.wallet_balance || 0) - (a.wallet_balance || 0)).slice(0, 8),
    [technicians]);

  const recentPayouts = useMemo(() =>
    transactions.filter((t) => ['withdraw', 'booking_payment'].includes(t.transaction_type)).slice(0, 8),
    [transactions]);

  const cards = [
    { label: 'Gross Revenue', value: `KES ${gross.toLocaleString()}`, accent: 'bg-emerald-50 text-emerald-600' },
    { label: 'Commission (15%)', value: `KES ${commission.toLocaleString()}`, accent: 'bg-blue-50 text-blue-600' },
    { label: 'Payouts to Fundis', value: `KES ${payouts.toLocaleString()}`, accent: 'bg-amber-50 text-amber-600' },
    { label: 'Net Profit', value: `KES ${commission.toLocaleString()}`, accent: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${c.accent} flex items-center justify-center mb-3`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-gray-900 truncate">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue by Category</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">No revenue yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(v) => `KES ${v.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Earning Technicians</h3>
          {topEarners.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">No technicians yet.</p>
          ) : (
            <div className="space-y-2">
              {topEarners.map((t, i) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{t.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">KES {(t.wallet_balance || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Payouts</h3>
        {recentPayouts.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No payouts recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Reference</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayouts.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-mono text-xs text-gray-500">{t.transaction_id?.slice(0, 10) || t.id.slice(-8)}</td>
                    <td className="py-3 capitalize">{t.transaction_type?.replace('_', ' ')}</td>
                    <td className="py-3 capitalize">{t.payment_method}</td>
                    <td className="py-3 text-right font-semibold">KES {(t.amount || 0).toLocaleString()}</td>
                    <td className="py-3">{format(new Date(t.created_date), 'MMM d, yyyy')}</td>
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
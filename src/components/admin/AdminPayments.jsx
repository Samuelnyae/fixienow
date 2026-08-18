import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Search, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

function statusBadge(status) {
  const map = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    processing: 'bg-blue-50 text-blue-700 border-blue-100',
    failed: 'bg-red-50 text-red-700 border-red-100',
    cancelled: 'bg-gray-50 text-gray-700 border-gray-100',
    refunded: 'bg-violet-50 text-violet-700 border-violet-100',
  };
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-100';
}

export default function AdminPayments({ payments = [] }) {
  const [q, setQ] = React.useState('');
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
  });

  const filtered = payments.filter((p) => {
    const t = `${p.id} ${p.payment_method} ${p.status} ${p.amount}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  const totalVolume = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const completed = payments.filter((p) => p.status === 'completed').length;

  const cards = [
    { label: 'Total Payments', value: payments.length, sub: `${completed} completed` },
    { label: 'Volume', value: `KES ${totalVolume.toLocaleString()}`, sub: 'all records' },
    { label: 'Wallet Transactions', value: transactions.length, sub: 'ledger entries' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-gray-900 truncate">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label} · {c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Payments</h3>
            <p className="text-xs text-gray-500">{filtered.length} shown</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search payments..." className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No payments recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 50).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs text-gray-500">#{p.id?.slice(-8).toUpperCase()}</TableCell>
                      <TableCell className="capitalize">{p.payment_method || '—'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusBadge(p.status)}`}>{p.status}</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">KES {(p.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(p.created_date), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {filtered.slice(0, 50).map((p) => (
                <div key={p.id} className="p-4 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-mono text-xs text-gray-500">#{p.id?.slice(-8).toUpperCase()}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(p.status)}`}>{p.status}</span>
                  </div>
                  <p className="text-sm font-semibold">KES {(p.amount || 0).toLocaleString()} · <span className="capitalize text-gray-500 font-normal">{p.payment_method}</span></p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
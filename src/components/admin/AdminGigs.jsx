import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Briefcase, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

function statusBadge(status) {
  const map = {
    open: 'bg-amber-50 text-amber-700 border-amber-100',
    matched: 'bg-blue-50 text-blue-700 border-blue-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelled: 'bg-red-50 text-red-700 border-red-100',
  };
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-100';
}

export default function AdminGigs() {
  const [q, setQ] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const { data: gigs = [], isLoading } = useQuery({
    queryKey: ['adminGigs'],
    queryFn: () => base44.entities.Gig.list('-created_date', 100),
  });

  const filtered = gigs.filter((g) => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    const t = `${g.title} ${g.category} ${g.customer_name} ${g.area_name}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['open', 'matched', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`text-left bg-white rounded-2xl border shadow-sm p-4 transition-colors ${statusFilter === s ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-100'}`}
          >
            <p className="text-2xl font-bold text-gray-900">{gigs.filter((g) => g.status === s).length}</p>
            <p className="text-xs text-gray-500 capitalize">{s}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">All Gigs</h3>
            <p className="text-xs text-gray-500">{filtered.length} shown</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gigs..." className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading gigs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No gigs found.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{g.title}</TableCell>
                      <TableCell className="capitalize">{g.category?.replace('_', ' ')}</TableCell>
                      <TableCell>{g.customer_name || 'N/A'}</TableCell>
                      <TableCell>{g.area_name || '—'}</TableCell>
                      <TableCell>{g.budget ? `KES ${g.budget.toLocaleString()}` : '—'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusBadge(g.status)}`}>
                          {g.status}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(g.created_date), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {filtered.map((g) => (
                <div key={g.id} className="p-4 space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium truncate">{g.title}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(g.status)}`}>{g.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 capitalize">{g.category?.replace('_', ' ')} · {g.area_name || 'No area'}</p>
                  <p className="text-sm text-gray-500">{g.customer_name || 'N/A'} · {g.budget ? `KES ${g.budget.toLocaleString()}` : 'No budget'}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
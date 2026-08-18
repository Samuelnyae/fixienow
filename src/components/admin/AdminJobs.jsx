import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Briefcase, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const ACTIVE = ['accepted', 'en_route', 'in_progress'];

function statusBadge(status) {
  const map = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    accepted: 'bg-blue-50 text-blue-700 border-blue-100',
    en_route: 'bg-blue-50 text-blue-700 border-blue-100',
    cancelled: 'bg-red-50 text-red-700 border-red-100',
  };
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-100';
}

export default function AdminJobs() {
  const [q, setQ] = React.useState('');
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: () => base44.entities.Booking.list('-created_date', 100),
  });

  const active = bookings.filter((b) => ACTIVE.includes(b.status));
  const filtered = active.filter((b) => {
    const t = `${b.user_name} ${b.category} ${b.technician_name} ${b.description}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ACTIVE.map((s) => (
          <div key={s} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-900">{bookings.filter((b) => b.status === s).length}</p>
            <p className="text-xs text-gray-500 capitalize">{s.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Active Jobs</h3>
            <p className="text-xs text-gray-500">{active.length} in progress</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs..." className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading jobs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No active jobs right now.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.user_name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{b.category?.replace('_', ' ')}</TableCell>
                      <TableCell>{b.technician_name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusBadge(b.status)}`}>
                          {b.status?.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>KES {(b.final_price || b.estimated_price || 0).toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(b.created_date), 'MMM d, HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {filtered.map((b) => (
                <div key={b.id} className="p-4 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-medium truncate">{b.user_name || 'N/A'}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge(b.status)}`}>{b.status?.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-500 capitalize">{b.category?.replace('_', ' ')} · {b.technician_name || 'Unassigned'}</p>
                  <p className="text-sm font-semibold">KES {(b.final_price || b.estimated_price || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
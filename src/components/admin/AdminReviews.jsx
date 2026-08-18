import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Star, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </span>
  );
}

export default function AdminReviews() {
  const [q, setQ] = React.useState('');
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['adminReviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 100),
  });

  const filtered = reviews.filter((r) => {
    const t = `${r.customer_name} ${r.technician_name} ${r.comment}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
          <p className="text-xs text-gray-500">Total Reviews</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">{avg}<Star className="w-4 h-4 fill-amber-400 text-amber-400" /></p>
          <p className="text-xs text-gray-500">Avg Rating</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{reviews.filter((r) => r.rating >= 4).length}</p>
          <p className="text-xs text-gray-500">Positive (4-5★)</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{reviews.filter((r) => r.rating <= 2).length}</p>
          <p className="text-xs text-gray-500">Negative (1-2★)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Customer Reviews</h3>
            <p className="text-xs text-gray-500">{filtered.length} shown</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews..." className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading reviews...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No reviews yet.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.customer_name || r.user_name || 'N/A'}</TableCell>
                      <TableCell>{r.technician_name || 'N/A'}</TableCell>
                      <TableCell><Stars rating={r.rating || 0} /></TableCell>
                      <TableCell className="max-w-[280px] truncate text-gray-600">{r.comment || '—'}</TableCell>
                      <TableCell>{format(new Date(r.created_date), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {filtered.map((r) => (
                <div key={r.id} className="p-4 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-medium truncate">{r.technician_name || 'N/A'}</span>
                    <Stars rating={r.rating || 0} />
                  </div>
                  <p className="text-sm text-gray-600">{r.comment || '—'}</p>
                  <p className="text-xs text-gray-400">{r.customer_name || 'N/A'} · {format(new Date(r.created_date), 'MMM d, yyyy')}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
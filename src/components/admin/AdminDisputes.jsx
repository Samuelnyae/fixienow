import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ShieldAlert } from 'lucide-react';

function statusBadge(status) {
  const map = {
    open: 'bg-amber-50 text-amber-700 border-amber-100',
    under_review: 'bg-blue-50 text-blue-700 border-blue-100',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dismissed: 'bg-gray-50 text-gray-700 border-gray-100',
  };
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-100';
}

export default function AdminDisputes() {
  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['adminDisputes'],
    queryFn: () => base44.entities.Dispute.list('-created_date', 100),
  });

  const open = disputes.filter((d) => ['open', 'under_review'].includes(d.status));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['open', 'under_review', 'resolved', 'dismissed'].map((s) => (
          <div key={s} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-900">{disputes.filter((d) => d.status === s).length}</p>
            <p className="text-xs text-gray-500 capitalize">{s.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Disputes</h3>
          <p className="text-xs text-gray-500">{open.length} need attention · {disputes.length} total</p>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No disputes filed. All clear.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {disputes.map((d) => (
              <div key={d.id} className="p-4 sm:p-5 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{d.subject}</p>
                    <p className="text-xs text-gray-500">
                      Booking #{d.booking_id?.slice(-6).toUpperCase()} · by {d.raised_by_name || d.raised_by_role} · {format(new Date(d.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize self-start ${statusBadge(d.status)}`}>
                    {d.status?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{d.description}</p>
                {d.refund_amount ? (
                  <p className="text-xs text-emerald-700 font-medium">Refund: KES {d.refund_amount.toLocaleString()}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
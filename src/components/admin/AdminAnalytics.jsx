import React, { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { format, startOfDay, subDays, isSameDay, parseISO } from 'date-fns';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#9ca3af'];
const STATUS_LABELS = {
  pending: 'Pending', accepted: 'Accepted', en_route: 'En Route',
  in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};



export default function AdminAnalytics({ bookings = [], payments = [], technicians = [] }) {
  const trendData = useMemo(() => {
    const days = [];
    const today = startOfDay(new Date());
    for (let i = 13; i >= 0; i--) {
      const d = subDays(today, i);
      const b = bookings.filter((r) => r.created_date && isSameDay(parseISO(r.created_date), d)).length;
      const rev = payments
        .filter((p) => p.status === 'completed' && p.created_date && isSameDay(parseISO(p.created_date), d))
        .reduce((s, p) => s + (p.amount || 0), 0);
      days.push({ day: format(d, 'MMM d'), bookings: b, revenue: rev });
    }
    return days;
  }, [bookings, payments]);

  const statusData = useMemo(() => {
    const counts = {};
    bookings.forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v }));
  }, [bookings]);

  const categoryData = useMemo(() => {
    const counts = {};
    bookings.forEach((b) => { const k = b.category || 'other'; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts)
      .map(([k, v]) => ({ name: k.replace('_', ' '), value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [bookings]);

  const completionRate = bookings.length
    ? Math.round((bookings.filter((b) => b.status === 'completed').length / bookings.length) * 100)
    : 0;
  const cancelRate = bookings.length
    ? Math.round((bookings.filter((b) => b.status === 'cancelled').length / bookings.length) * 100)
    : 0;
  const avgRating = technicians.length
    ? (technicians.reduce((s, t) => s + (t.rating || 0), 0) / technicians.length).toFixed(2)
    : '0.00';

  const kpis = [
    { label: 'Completion Rate', value: `${completionRate}%` },
    { label: 'Cancellation Rate', value: `${cancelRate}%` },
    { label: 'Avg Technician Rating', value: `${avgRating}★` },
    { label: 'Active Technicians', value: technicians.filter((t) => t.is_available).length },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Bookings & Revenue (14 days)</h3>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500 py-10 text-center">No data yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} fill="url(#gB)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Booking Status</h3>
          {statusData.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">No data yet.</p>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 w-full">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-600 flex-1 truncate">{d.name}</span>
                    <span className="text-gray-900 font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Categories</h3>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">No data yet.</p>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
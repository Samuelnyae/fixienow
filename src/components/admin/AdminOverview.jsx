import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  ShieldCheck,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  Wrench,
  UserPlus,
  FilePlus,
  ListChecks,
  Settings as SettingsIcon,
  ArrowRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AdminStatCard from './AdminStatCard';
import { format, formatDistanceToNow, startOfDay, subDays, isSameDay, parseISO } from 'date-fns';

const DONUT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#9ca3af'];
const CATEGORY_LABELS = {
  mechanic: 'Mechanic',
  plumber: 'Plumbing',
  electrician: 'Electrical',
  carpenter: 'Carpentry',
  painter: 'Painting',
  hvac: 'HVAC',
  appliance_repair: 'Appliance',
  locksmith: 'Locksmith',
};

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

function last7DaysBookings(bookings) {
  const days = [];
  const today = startOfDay(new Date());
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const count = bookings.filter((b) => b.created_date && isSameDay(parseISO(b.created_date), d)).length;
    days.push({ day: format(d, 'EEE'), bookings: count });
  }
  return days;
}

function monthOverMonth(records, dateField = 'created_date') {
  if (!records?.length) return 0;
  const now = new Date();
  const thisMonth = records.filter((r) => r[dateField] && new Date(r[dateField]).getMonth() === now.getMonth() && new Date(r[dateField]).getFullYear() === now.getFullYear());
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = records.filter((r) => r[dateField] && new Date(r[dateField]).getMonth() === lastMonthDate.getMonth() && new Date(r[dateField]).getFullYear() === lastMonthDate.getFullYear());
  const t = thisMonth.length;
  const l = last.length;
  if (l === 0) return t > 0 ? 100 : 0;
  return Math.round(((t - l) / l) * 100);
}

function revenueMoM(payments) {
  const paid = payments.filter((p) => p.status === 'completed');
  const now = new Date();
  const thisMonth = paid.filter((p) => p.created_date && new Date(p.created_date).getMonth() === now.getMonth() && new Date(p.created_date).getFullYear() === now.getFullYear()).reduce((s, p) => s + (p.amount || 0), 0);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = paid.filter((p) => p.created_date && new Date(p.created_date).getMonth() === lastMonthDate.getMonth() && new Date(p.created_date).getFullYear() === lastMonthDate.getFullYear()).reduce((s, p) => s + (p.amount || 0), 0);
  if (last === 0) return thisMonth > 0 ? 100 : 0;
  return Math.round(((thisMonth - last) / last) * 100);
}

export default function AdminOverview({ user, technicians, bookings, payments, pendingTechnicians, totalRevenue }) {
  const chartData = useMemo(() => last7DaysBookings(bookings), [bookings]);
  const recentBookings = useMemo(() => bookings.slice(0, 6), [bookings]);
  const donutData = useMemo(() => {
    const counts = {};
    bookings.forEach((b) => {
      const k = b.category || 'other';
      counts[k] = (counts[k] || 0) + 1;
    });
    const entries = Object.entries(counts).map(([key, value]) => ({ name: CATEGORY_LABELS[key] || 'Other', value })).sort((a, b) => b.value - a.value);
    const top = entries.slice(0, 4);
    const rest = entries.slice(4).reduce((s, e) => s + e.value, 0);
    if (rest > 0) top.push({ name: 'Other', value: rest });
    return top;
  }, [bookings]);

  const activity = useMemo(() => {
    const events = [];
    technicians.slice(0, 8).forEach((t) => {
      events.push({ id: 't' + t.id, icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50', detail: `New technician registered: ${t.name}`, date: t.created_date });
    });
    bookings.slice(0, 8).forEach((b) => {
      events.push({ id: 'b' + b.id, icon: FilePlus, color: 'text-blue-600', bg: 'bg-blue-50', detail: `New booking created by ${b.user_name || 'a customer'}`, date: b.created_date });
    });
    return events
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 7);
  }, [technicians, bookings]);

  const techTrend = monthOverMonth(technicians);
  const bookingTrend = monthOverMonth(bookings);
  const revTrend = revenueMoM(payments);
  const pendingTrend = pendingTechnicians.length === 0 ? 0 : 1;

  const commission = Math.round(totalRevenue * 0.15);
  const payouts = totalRevenue - commission;

  const statCards = [
    { icon: Users, label: 'Technicians', value: technicians.length, change: techTrend, trend: chartData.map((d) => d.bookings), accent: 'emerald', bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { icon: Briefcase, label: 'Total Bookings', value: bookings.length, change: bookingTrend, trend: chartData.map((d) => d.bookings), accent: 'blue', bg: 'bg-blue-50', color: 'text-blue-600' },
    { icon: Clock, label: 'Pending Approval', value: pendingTechnicians.length, change: 0, trend: [1, 1, 1, 1, 1], accent: 'amber', bg: 'bg-amber-50', color: 'text-amber-600' },
    { icon: DollarSign, label: 'Total Revenue', value: `KES ${totalRevenue.toLocaleString()}`, change: revTrend, trend: chartData.map((d) => d.bookings), accent: 'emerald', bg: 'bg-emerald-50', color: 'text-emerald-600' },
  ];

  const quickActions = [
    { label: 'Add Technician', icon: UserPlus, to: createPageUrl('TechnicianRegister') },
    { label: 'Create Job', icon: FilePlus, to: createPageUrl('BookService') },
    { label: 'View All Users', icon: ListChecks, to: createPageUrl('Services') },
    { label: 'Platform Settings', icon: SettingsIcon, to: createPageUrl('Settings') },
  ];

  return (
    <div className="space-y-5">
      {/* Alert cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to={createPageUrl('FraudDetection')}
          className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">AI Fraud Detection</p>
            <p className="text-xs text-gray-500">2 suspicious activities flagged for review</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </Link>
        <Link
          to={createPageUrl('CreditReadiness')}
          className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Credit Readiness</p>
            <p className="text-xs text-gray-500">All systems normal</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <AdminStatCard key={i} {...s} />
        ))}
      </div>

      {/* Middle: chart + recent bookings + earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bookings overview chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Bookings Overview</h3>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-100 bg-emerald-50">
              {bookings.length} total
            </Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Earnings summary */}
        <div className="rounded-2xl shadow-sm p-5 flex flex-col" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #0B463C 100%)' }}>
          <div className="mb-4">
            <p className="text-xs text-emerald-200/80">Total Revenue</p>
            <p className="text-2xl font-bold text-white">KES {totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-emerald-200/80 mt-1">
              {revTrend === 0 ? 'No change' : `${revTrend > 0 ? '↑' : '↓'} ${Math.abs(revTrend)}% vs last month`}
            </p>
          </div>
          <div className="space-y-3 text-sm flex-1">
            <div className="flex items-center justify-between">
              <span className="text-emerald-100/80">Platform Commission</span>
              <span className="font-semibold text-white">KES {commission.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-100/80">Payouts to Technicians</span>
              <span className="font-semibold text-white">KES {payouts.toLocaleString()}</span>
            </div>
            <div className="border-t border-white/15 pt-3 flex items-center justify-between">
              <span className="text-emerald-100/80">Net Profit</span>
              <span className="font-bold text-white">KES {commission.toLocaleString()}</span>
            </div>
          </div>
          <Link
            to={createPageUrl('AdminDashboard')}
            className="mt-4 w-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold rounded-xl py-2.5 text-center transition-colors"
          >
            View Financial Report
          </Link>
        </div>
      </div>

      {/* Recent bookings table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
          <Link to={createPageUrl('AdminDashboard')} className="text-xs font-medium text-emerald-600 hover:underline">
            View all
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-2 pb-3 font-medium">Customer</th>
                  <th className="px-2 pb-3 font-medium">Service</th>
                  <th className="px-2 pb-3 font-medium">Status</th>
                  <th className="px-2 pb-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={b.user_photo} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                            {b.user_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900 truncate max-w-[140px]">{b.user_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 capitalize text-gray-600">{b.category?.replace('_', ' ') || '—'}</td>
                    <td className="px-2 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusBadge(b.status)}`}>
                        {b.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right font-semibold text-gray-900">
                      KES {(b.final_price || b.estimated_price || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom: activity + donut + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Platform activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Platform Activity</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {activity.map((e) => {
                const Icon = e.icon;
                return (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${e.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${e.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-snug">{e.detail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {e.date ? formatDistanceToNow(new Date(e.date), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Service categories donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Service Categories</h3>
          {donutData.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">No data yet.</p>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 w-full">
                {donutData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-gray-600 flex-1 truncate">{d.name}</span>
                    <span className="text-gray-900 font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label}
                  to={a.to}
                  className="border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors text-center"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
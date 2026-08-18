import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Users,
  Briefcase,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Search,
  Construction,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminToolsManager from '../components/admin/AdminToolsManager';
import AdminDriversManager from '../components/admin/AdminDriversManager';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';
import AdminOverview from '../components/admin/AdminOverview';
import AdminJobs from '../components/admin/AdminJobs';
import AdminGigs from '../components/admin/AdminGigs';
import AdminEarnings from '../components/admin/AdminEarnings';
import AdminReviews from '../components/admin/AdminReviews';
import AdminDisputes from '../components/admin/AdminDisputes';
import AdminUsers from '../components/admin/AdminUsers';
import AdminPayments from '../components/admin/AdminPayments';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminSettings from '../components/admin/AdminSettings';

const NAV_TITLES = {
  dashboard: { title: 'Welcome back, Admin 👋', subtitle: "Here's what's happening on Fixie today." },
  jobs: { title: 'Jobs', subtitle: 'Manage service jobs across the platform.' },
  gigs: { title: 'Gigs', subtitle: 'Review same-day gig postings.' },
  technicians: { title: 'Technicians', subtitle: 'All verified and pending technicians.' },
  bookings: { title: 'Bookings', subtitle: 'Track every booking on Fixie.' },
  earnings: { title: 'Earnings', subtitle: 'Revenue, commissions and payouts.' },
  reviews: { title: 'Reviews', subtitle: 'Customer feedback and ratings.' },
  disputes: { title: 'Disputes', subtitle: 'Resolve raised disputes.' },
  users: { title: 'Users', subtitle: 'All registered platform users.' },
  payments: { title: 'Payments', subtitle: 'Transactions and payouts.' },
  analytics: { title: 'Analytics', subtitle: 'Platform performance insights.' },
  settings: { title: 'Settings', subtitle: 'Platform configuration.' },
  pending: { title: 'Pending Approvals', subtitle: 'Review new technician applications.' },
  tools: { title: 'Tools Marketplace', subtitle: 'Approve and manage tool listings.' },
  drivers: { title: 'Drivers', subtitle: 'Manage the driver fleet.' },
};

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        if (userData.role !== 'admin' && userData.user_type !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: technicians = [], isLoading: techLoading } = useQuery({
    queryKey: ['allTechnicians'],
    queryFn: () => base44.entities.Technician.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['allPayments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 100),
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Technician.update(id, { verification_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['allTechnicians']);
    },
    onError: (error) => {
      alert('Failed to update technician status: ' + (error?.message || 'Permission denied.'));
    },
  });

  const pendingTechnicians = technicians.filter((t) => t.verification_status === 'pending');
  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  if (!user) {
    return <LoadingSpinner text="Loading..." />;
  }

  const head = NAV_TITLES[activeNav] || NAV_TITLES.dashboard;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <AdminSidebar
        activeNav={activeNav}
        onNav={setActiveNav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCount={pendingTechnicians.length}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar
          user={user}
          onMenu={() => setSidebarOpen(true)}
          title={head.title}
          subtitle={head.subtitle}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeNav === 'dashboard' && (
            <AdminOverview
              user={user}
              technicians={technicians}
              bookings={bookings}
              payments={payments}
              pendingTechnicians={pendingTechnicians}
              totalRevenue={totalRevenue}
            />
          )}

          {activeNav === 'pending' && (
            <PendingApprovals
              pendingTechnicians={pendingTechnicians}
              approveMutation={approveMutation}
            />
          )}

          {activeNav === 'technicians' && <TechniciansTable technicians={technicians} />}

          {activeNav === 'bookings' && <BookingsTable bookings={bookings} />}

          {activeNav === 'tools' && <AdminToolsManager user={user} />}

          {activeNav === 'drivers' && <AdminDriversManager user={user} />}

          {activeNav === 'jobs' && <AdminJobs />}
          {activeNav === 'gigs' && <AdminGigs />}
          {activeNav === 'earnings' && <AdminEarnings payments={payments} technicians={technicians} />}
          {activeNav === 'reviews' && <AdminReviews />}
          {activeNav === 'disputes' && <AdminDisputes />}
          {activeNav === 'users' && <AdminUsers />}
          {activeNav === 'payments' && <AdminPayments payments={payments} />}
          {activeNav === 'analytics' && <AdminAnalytics bookings={bookings} payments={payments} technicians={technicians} />}
          {activeNav === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
}

function PlaceholderView({ label }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
        <Construction className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="font-semibold text-gray-900">{label}</h3>
      <p className="text-sm text-gray-500 mt-1">This section is part of the admin overview dashboard.</p>
      <p className="text-xs text-gray-400 mt-1">Switch to Dashboard from the sidebar to see live stats, charts and activity.</p>
    </div>
  );
}

function PendingApprovals({ pendingTechnicians, approveMutation }) {
  if (pendingTechnicians.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900">All caught up!</h3>
        <p className="text-gray-500">No pending approvals</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Pending Technician Approvals</h3>
        <p className="text-xs text-gray-500">{pendingTechnicians.length} awaiting review</p>
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technician</TableHead>
              <TableHead>Profession</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingTechnicians.map((tech) => (
              <TableRow key={tech.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={tech.profile_photo} />
                      <AvatarFallback>{tech.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{tech.name}</p>
                      <p className="text-sm text-gray-500">{tech.phone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{tech.profession?.replace('_', ' ')}</TableCell>
                <TableCell>{format(new Date(tech.created_date), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {tech.id_document_url && (
                      <a href={tech.id_document_url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                          <FileText className="w-3 h-3 mr-1" /> ID
                        </Badge>
                      </a>
                    )}
                    {tech.certificate_url && (
                      <a href={tech.certificate_url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                          <FileText className="w-3 h-3 mr-1" /> Cert
                        </Badge>
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate({ id: tech.id, status: 'approved' })}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate({ id: tech.id, status: 'rejected' })}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {pendingTechnicians.map((tech) => (
          <div key={tech.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={tech.profile_photo} />
                <AvatarFallback>{tech.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{tech.name}</p>
                <p className="text-sm text-gray-500 capitalize">{tech.profession?.replace('_', ' ')} · {tech.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: tech.id, status: 'approved' })} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: tech.id, status: 'rejected' })} className="flex-1">
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusBadgeClass(status) {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'cancelled') return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-blue-50 text-blue-700 border-blue-100';
}

function TechniciansTable({ technicians }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">All Technicians</h3>
        <p className="text-xs text-gray-500">{technicians.length} total</p>
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technician</TableHead>
              <TableHead>Profession</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Jobs</TableHead>
              <TableHead>Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.map((tech) => (
              <TableRow key={tech.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={tech.profile_photo} />
                      <AvatarFallback>{tech.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{tech.name}</p>
                      <p className="text-sm text-gray-500">{tech.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{tech.profession?.replace('_', ' ')}</TableCell>
                <TableCell>
                  <Badge className={
                    tech.verification_status === 'approved' ? 'bg-emerald-50 text-emerald-700'
                    : tech.verification_status === 'pending' ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700'
                  }>
                    {tech.verification_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{tech.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-400"> ({tech.total_reviews || 0})</span>
                </TableCell>
                <TableCell>{tech.total_jobs || 0}</TableCell>
                <TableCell>KES {(tech.wallet_balance || 0).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden divide-y divide-gray-50">
        {technicians.map((tech) => (
          <div key={tech.id} className="p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={tech.profile_photo} />
                <AvatarFallback>{tech.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{tech.name}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{tech.profession?.replace('_', ' ')}</p>
              </div>
              <Badge className={
                tech.verification_status === 'approved' ? 'bg-emerald-50 text-emerald-700'
                : tech.verification_status === 'pending' ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
              }>
                {tech.verification_status}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rating / Jobs</span>
              <span>{tech.rating?.toFixed(1) || '0.0'} · {tech.total_jobs || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Earnings</span>
              <span className="font-semibold">KES {(tech.wallet_balance || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsTable({ bookings }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">All Bookings</h3>
        <p className="text-xs text-gray-500">{bookings.length} total</p>
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.slice(0, 25).map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-sm">#{b.id?.slice(-8).toUpperCase()}</TableCell>
                <TableCell>{b.user_name || 'N/A'}</TableCell>
                <TableCell className="capitalize">{b.category?.replace('_', ' ')}</TableCell>
                <TableCell>{b.technician_name || 'Unassigned'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusBadgeClass(b.status)}`}>
                    {b.status}
                  </span>
                </TableCell>
                <TableCell>KES {(b.final_price || b.estimated_price || 0).toLocaleString()}</TableCell>
                <TableCell>{format(new Date(b.created_date), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden divide-y divide-gray-50">
        {bookings.slice(0, 25).map((b) => (
          <div key={b.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-500">#{b.id?.slice(-8).toUpperCase()}</span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusBadgeClass(b.status)}`}>
                {b.status}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium truncate ml-2">{b.user_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service</span>
              <span className="capitalize">{b.category?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold">KES {(b.final_price || b.estimated_price || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span>{format(new Date(b.created_date), 'MMM d, yyyy')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
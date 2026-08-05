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
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Shield,
  FileText,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Skewed neomorphism design tokens
const NEO_BASE = 'bg-[#e6ebf2]';
const NEO_RAISED = 'bg-[#e6ebf2] shadow-[6px_6px_14px_#c3cad8,-6px_-6px_14px_#ffffff] border border-white/40';
const NEO_INSET = 'bg-[#e6ebf2] shadow-[inset_5px_5px_10px_#c3cad8,inset_-5px_-5px_10px_#ffffff] border border-white/30';
const SKEW = 'skew-y-[-2deg]';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
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
      setSelectedTechnician(null);
    },
    onError: (error) => {
      console.error('Approve/reject failed:', error);
      alert('Failed to update technician status: ' + (error?.message || 'Permission denied. Make sure you are logged in as admin.'));
    },
  });

  const pendingTechnicians = technicians.filter(t => t.verification_status === 'pending');
  const approvedTechnicians = technicians.filter(t => t.verification_status === 'approved');
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedBookings = bookings.filter(b => b.status === 'completed');

  if (!user) {
    return <LoadingSpinner text="Loading..." />;
  }

  const stats = [
    { icon: Users, color: 'text-teal-600', bg: 'bg-teal-100', value: technicians.length, label: 'Technicians' },
    { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', value: pendingTechnicians.length, label: 'Pending Approval' },
    { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100', value: bookings.length, label: 'Total Bookings' },
    { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', value: `KES ${totalRevenue.toLocaleString()}`, label: 'Total Revenue' },
  ];

  return (
    <div className={`min-h-screen ${NEO_BASE}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-6">
        {/* Header */}
        <div className={`flex items-center gap-4 ${NEO_RAISED} rounded-2xl px-5 py-4 ${SKEW}`}>
          <div className={`flex items-center gap-4 -skew-y-[2deg] flex-1 min-w-0`}>
            <Link
              to={createPageUrl('Home')}
              className="text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Admin Dashboard</h1>
              <p className="text-gray-500 text-sm hidden sm:block">Manage your platform</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <Link
          to={createPageUrl('FraudDetection')}
          className={`flex items-center gap-3 ${NEO_RAISED} rounded-2xl px-4 py-3 hover:shadow-[inset_4px_4px_8px_#c3cad8,inset_-4px_-4px_8px_#ffffff] transition-all w-fit`}
        >
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="font-medium text-red-700 text-sm">AI Fraud Detection</span>
          <Shield className="w-4 h-4 text-red-400" />
        </Link>

        {/* Stats — strict 2×2 grid, consistent padding, centered icons */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={`${NEO_RAISED} rounded-2xl p-5 ${SKEW}`}>
                <div className="-skew-y-[2deg] flex flex-col items-center text-center gap-2">
                  <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold leading-none truncate max-w-full">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending">
          <TabsList className={`${NEO_INSET} border-0 w-full flex overflow-x-auto scrollbar-hide rounded-2xl p-1.5 gap-1.5`}>
            {[
              { value: 'pending', label: `Pending (${pendingTechnicians.length})` },
              { value: 'technicians', label: 'Technicians' },
              { value: 'bookings', label: 'Bookings' },
              { value: 'tools', label: 'Tools' },
              { value: 'drivers', label: 'Drivers' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 shrink-0 min-w-fit text-xs sm:text-sm rounded-xl px-3 py-2.5 whitespace-nowrap transition-colors data-[state=active]:bg-[#0B463C] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_10px_rgba(11,70,60,.35)] data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-white/40"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Pending Approvals */}
          <TabsContent value="pending" className="mt-6">
            {pendingTechnicians.length > 0 ? (
              <>
                {/* Mobile cards */}
                <div className="md:hidden space-y-4">
                  {pendingTechnicians.map((tech) => (
                    <div key={tech.id} className={`${NEO_RAISED} rounded-2xl p-4 space-y-3`}>
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
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Applied</span>
                        <span>{format(new Date(tech.created_date), 'MMM d, yyyy')}</span>
                      </div>
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
                      <div className="flex gap-2">
                        <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: tech.id, status: 'approved' })} className="bg-green-600 hover:bg-green-700 flex-1">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: tech.id, status: 'rejected' })} className="flex-1">
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table */}
                <div className={`hidden md:block ${NEO_RAISED} rounded-2xl overflow-hidden`}>
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
                              <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: tech.id, status: 'approved' })} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: tech.id, status: 'rejected' })}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className={`${NEO_RAISED} rounded-2xl p-12 text-center`}>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">All caught up!</h3>
                <p className="text-gray-500">No pending approvals</p>
              </div>
            )}
          </TabsContent>

          {/* All Technicians */}
          <TabsContent value="technicians" className="mt-6">
            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {technicians.map((tech) => (
                <div key={tech.id} className={`${NEO_RAISED} rounded-2xl p-4 space-y-2`}>
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
                      tech.verification_status === 'approved' ? 'bg-green-100 text-green-700'
                      : tech.verification_status === 'pending' ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                    }>
                      {tech.verification_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rating</span>
                    <span>{tech.rating?.toFixed(1) || '0.0'} ({tech.total_reviews || 0})</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Jobs</span>
                    <span>{tech.total_jobs || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Earnings</span>
                    <span className="font-semibold">{(tech.wallet_balance || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className={`hidden md:block ${NEO_RAISED} rounded-2xl overflow-hidden`}>
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
                          tech.verification_status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : tech.verification_status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }>
                          {tech.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{tech.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-gray-400">({tech.total_reviews || 0})</span>
                        </div>
                      </TableCell>
                      <TableCell>{tech.total_jobs || 0}</TableCell>
                      <TableCell>{(tech.wallet_balance || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings" className="mt-6">
            {/* Mobile cards */}
            <div className="md:hidden space-y-4">
              {bookings.slice(0, 20).map((booking) => (
                <div key={booking.id} className={`${NEO_RAISED} rounded-2xl p-4 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-500">#{booking.id?.slice(-8).toUpperCase()}</span>
                    <Badge className={
                      booking.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium truncate ml-2">{booking.user_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service</span>
                    <span className="capitalize">{booking.category?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Technician</span>
                    <span className="truncate ml-2">{booking.technician_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-semibold">{(booking.final_price || booking.estimated_price)?.toLocaleString() || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span>{format(new Date(booking.created_date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className={`hidden md:block ${NEO_RAISED} rounded-2xl overflow-hidden`}>
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
                  {bookings.slice(0, 20).map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        #{booking.id?.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>{booking.user_name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{booking.category?.replace('_', ' ')}</TableCell>
                      <TableCell>{booking.technician_name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge className={
                          booking.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(booking.final_price || booking.estimated_price)?.toLocaleString() || '—'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.created_date), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tools Marketplace */}
          <TabsContent value="tools" className="mt-6">
            <AdminToolsManager user={user} />
          </TabsContent>

          {/* Drivers / Fleet */}
          <TabsContent value="drivers" className="mt-6">
            <AdminDriversManager user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
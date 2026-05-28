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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import LoadingSpinner from '../components/common/LoadingSpinner';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            to={createPageUrl('Home')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500">Manage your platform</p>
          </div>
        </div>

        {/* Quick Links */}
        <Link
          to={createPageUrl('FraudDetection')}
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors w-fit"
        >
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="font-medium text-red-700">AI Fraud Detection</span>
          <Shield className="w-4 h-4 text-red-400" />
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{technicians.length}</p>
                  <p className="text-sm text-gray-500">Technicians</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingTechnicians.length}</p>
                  <p className="text-sm text-gray-500">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending">
          <TabsList className="bg-white border">
            <TabsTrigger value="pending">
              Pending Approvals ({pendingTechnicians.length})
            </TabsTrigger>
            <TabsTrigger value="technicians">All Technicians</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          {/* Pending Approvals */}
          <TabsContent value="pending" className="mt-6">
            {pendingTechnicians.length > 0 ? (
              <div className="bg-white rounded-xl border overflow-hidden">
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
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate({ id: tech.id, status: 'rejected' })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">All caught up!</h3>
                <p className="text-gray-500">No pending approvals</p>
              </div>
            )}
          </TabsContent>

          {/* All Technicians */}
          <TabsContent value="technicians" className="mt-6">
            <div className="bg-white rounded-xl border overflow-hidden">
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
                      <TableCell>KES {(tech.wallet_balance || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings" className="mt-6">
            <div className="bg-white rounded-xl border overflow-hidden">
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
                        KES {(booking.final_price || booking.estimated_price)?.toLocaleString()}
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
        </Tabs>
      </div>
    </div>
  );
}
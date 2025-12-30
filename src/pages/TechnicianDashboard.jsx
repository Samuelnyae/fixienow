import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Briefcase,
  DollarSign,
  Star,
  Clock,
  ToggleLeft,
  ToggleRight,
  Bell,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BookingCard from '../components/booking/BookingCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function TechnicianDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: technician, isLoading: techLoading } = useQuery({
    queryKey: ['myTechnician', user?.id],
    queryFn: async () => {
      const techs = await base44.entities.Technician.filter({ user_id: user.id });
      return techs[0];
    },
    enabled: !!user,
  });

  const { data: pendingJobs = [] } = useQuery({
    queryKey: ['pendingJobs', technician?.id],
    queryFn: () => base44.entities.Booking.filter(
      { technician_id: technician.id, status: 'pending' },
      '-created_date',
      10
    ),
    enabled: !!technician,
  });

  const { data: activeJobs = [] } = useQuery({
    queryKey: ['activeJobs', technician?.id],
    queryFn: () => base44.entities.Booking.filter(
      { technician_id: technician.id },
      '-created_date',
      50
    ),
    enabled: !!technician,
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (isAvailable) => 
      base44.entities.Technician.update(technician.id, { is_available: isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myTechnician']);
    },
  });

  const todayJobs = activeJobs.filter(j => 
    ['accepted', 'en_route', 'in_progress'].includes(j.status)
  );
  const completedJobs = activeJobs.filter(j => j.status === 'completed');
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.final_price || j.estimated_price || 0), 0);

  if (techLoading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (!technician) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Not Registered as Technician</h2>
          <p className="text-gray-500 mb-6">You need to register as a technician first</p>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link to={createPageUrl('TechnicianRegister')}>Register Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (technician.verification_status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verification Pending</h2>
          <p className="text-gray-500 mb-6">
            Your application is under review. We'll notify you once it's approved (usually within 24-48 hours).
          </p>
          <Button asChild variant="outline">
            <Link to={createPageUrl('Home')}>Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (technician.verification_status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Application Rejected</h2>
          <p className="text-gray-500 mb-6">
            Unfortunately, your application was not approved. Please contact support for more details.
          </p>
          <Button asChild variant="outline">
            <Link to={createPageUrl('Home')}>Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {technician.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {technician.is_available ? 'Available' : 'Offline'}
            </span>
            <Switch
              checked={technician.is_available}
              onCheckedChange={(checked) => toggleAvailabilityMutation.mutate(checked)}
            />
          </div>
        </div>

        {/* Availability Banner */}
        {!technician.is_available && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-amber-800 text-sm flex-1">
              You're currently offline. Turn on availability to receive job requests.
            </p>
            <Button 
              onClick={() => toggleAvailabilityMutation.mutate(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Go Online
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{technician.total_jobs || 0}</p>
                  <p className="text-sm text-gray-500">Total Jobs</p>
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
                  <p className="text-2xl font-bold">KES {(technician.wallet_balance || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{technician.rating?.toFixed(1) || '0.0'}</p>
                  <p className="text-sm text-gray-500">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{technician.total_reviews || 0}</p>
                  <p className="text-sm text-gray-500">Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Jobs */}
        {pendingJobs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">New Job Requests</h2>
              <Badge className="bg-amber-100 text-amber-700">{pendingJobs.length}</Badge>
            </div>
            <div className="space-y-4">
              {pendingJobs.map((job) => (
                <BookingCard key={job.id} booking={job} showTechnician={false} />
              ))}
            </div>
          </div>
        )}

        {/* Active Jobs */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Today's Jobs</h2>
          {todayJobs.length > 0 ? (
            <div className="space-y-4">
              {todayJobs.map((job) => (
                <BookingCard key={job.id} booking={job} showTechnician={false} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No active jobs"
              description={technician.is_available 
                ? "You'll see new job requests here when customers book your services"
                : "Go online to start receiving job requests"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
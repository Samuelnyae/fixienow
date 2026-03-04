import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay, isToday, isFuture } from 'date-fns';
import {
  Briefcase, Star, Bell, AlertCircle, Clock, CheckCircle2,
  Wrench, ChevronRight, CalendarDays, Zap, User, Settings, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import DashboardJobCard from '../components/technician/DashboardJobCard';
import EarningsSummary from '../components/technician/EarningsSummary';

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

  const { data: allJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['techAllJobs', technician?.id],
    queryFn: () => base44.entities.Booking.filter(
      { technician_id: technician.id },
      '-created_date',
      100
    ),
    enabled: !!technician,
    refetchInterval: 30000, // live refresh every 30s
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (isAvailable) =>
      base44.entities.Technician.update(technician.id, { is_available: isAvailable }),
    onSuccess: () => queryClient.invalidateQueries(['myTechnician']),
  });

  const acceptJobMutation = useMutation({
    mutationFn: (job) => base44.entities.Booking.update(job.id, { status: 'accepted' }),
    onSuccess: () => queryClient.invalidateQueries(['techAllJobs']),
  });

  const declineJobMutation = useMutation({
    mutationFn: (job) => base44.entities.Booking.update(job.id, { status: 'cancelled' }),
    onSuccess: () => queryClient.invalidateQueries(['techAllJobs']),
  });

  // Categorize jobs
  const { pendingJobs, activeJobs, upcomingJobs, completedJobs, todayCompleted, weekCompleted } = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);

    const pending   = allJobs.filter(j => j.status === 'pending');
    const active    = allJobs.filter(j => ['accepted', 'en_route', 'in_progress'].includes(j.status));
    const completed = allJobs.filter(j => j.status === 'completed');
    const upcoming  = allJobs.filter(j =>
      j.booking_type === 'scheduled' &&
      j.scheduled_date &&
      isFuture(new Date(j.scheduled_date)) &&
      !['cancelled', 'completed'].includes(j.status)
    );

    const todayDone = completed.filter(j => isToday(new Date(j.created_date)));
    const weekDone  = completed.filter(j => new Date(j.created_date) >= weekAgo);

    return {
      pendingJobs: pending,
      activeJobs: active,
      upcomingJobs: upcoming,
      completedJobs: completed,
      todayCompleted: todayDone,
      weekCompleted: weekDone,
    };
  }, [allJobs]);

  const dailyEarnings  = todayCompleted.reduce((s, j) => s + (j.final_price || j.estimated_price || 0), 0);
  const weeklyEarnings = weekCompleted.reduce((s, j)  => s + (j.final_price || j.estimated_price || 0), 0);

  if (techLoading) return <LoadingSpinner text="Loading dashboard..." />;

  // Guard: not a technician
  if (!technician) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Not Registered as Technician</h2>
          <p className="text-gray-500 mb-6">Register to access the technician dashboard</p>
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
          <p className="text-gray-500 mb-6">Your application is under review. We'll notify you once approved (usually 24-48 hours).</p>
          <Button asChild variant="outline"><Link to={createPageUrl('Home')}>Back to Home</Link></Button>
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
          <p className="text-gray-500 mb-6">Please contact support for more details.</p>
          <Button asChild variant="outline"><Link to={createPageUrl('Home')}>Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/20 to-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-teal-100">
              <AvatarImage src={technician.profile_photo} />
              <AvatarFallback className="bg-teal-100 text-teal-700 font-semibold">
                {technician.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">{technician.name}</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 capitalize">{technician.profession?.replace('_', ' ')}</span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {technician.rating?.toFixed(1) || '0.0'}
                </span>
              </div>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${technician.is_available ? 'text-green-600' : 'text-gray-400'}`}>
              {technician.is_available ? 'Online' : 'Offline'}
            </span>
            <Switch
              checked={technician.is_available}
              onCheckedChange={(checked) => toggleAvailabilityMutation.mutate(checked)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Offline Banner */}
        {!technician.is_available && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-amber-800 text-sm flex-1">
              You're offline and not receiving new job requests.
            </p>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
              onClick={() => toggleAvailabilityMutation.mutate(true)}
            >
              Go Online
            </Button>
          </div>
        )}

        {/* Earnings Summary Card */}
        <EarningsSummary
          dailyEarnings={dailyEarnings}
          weeklyEarnings={weeklyEarnings}
          todayJobs={todayCompleted.length}
          weekJobs={weekCompleted.length}
        />

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Jobs',  value: technician.total_jobs || 0,                             icon: Briefcase,   color: 'text-teal-600 bg-teal-50' },
            { label: 'Active',      value: activeJobs.length,                                       icon: Zap,         color: 'text-blue-600 bg-blue-50' },
            { label: 'Upcoming',    value: upcomingJobs.length,                                     icon: CalendarDays,color: 'text-purple-600 bg-purple-50' },
            { label: 'Reviews',     value: technician.total_reviews || 0,                           icon: Star,        color: 'text-amber-600 bg-amber-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-200 text-center">
              <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* New Job Requests */}
        {pendingJobs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="font-semibold text-gray-900">New Requests</h2>
              <Badge className="bg-amber-100 text-amber-700 border-0">{pendingJobs.length}</Badge>
            </div>
            <div className="space-y-3">
              {pendingJobs.map(job => (
                <DashboardJobCard
                  key={job.id}
                  job={job}
                  onAccept={(j) => acceptJobMutation.mutate(j)}
                  onDecline={(j) => declineJobMutation.mutate(j)}
                  isLoading={acceptJobMutation.isPending || declineJobMutation.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Jobs Tabs: Active / Upcoming / Completed */}
        <Tabs defaultValue="active">
          <div className="flex items-center justify-between mb-3">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="active" className="text-xs">
                Active
                {activeJobs.length > 0 && (
                  <span className="ml-1.5 bg-teal-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    {activeJobs.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs">
                Upcoming
                {upcomingJobs.length > 0 && (
                  <span className="ml-1.5 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    {upcomingJobs.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            </TabsList>
            <Link
              to={createPageUrl('TechnicianJobs')}
              className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              Manage All
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Active Jobs */}
          <TabsContent value="active" className="mt-0 space-y-3">
            {jobsLoading ? (
              <LoadingSpinner />
            ) : activeJobs.length > 0 ? (
              activeJobs.map(job => (
                <DashboardJobCard
                  key={job.id}
                  job={job}
                  onAccept={() => {}}
                  onDecline={() => {}}
                />
              ))
            ) : (
              <EmptyState
                icon={Zap}
                title="No active jobs"
                description={technician.is_available ? "Waiting for new job requests" : "Go online to receive jobs"}
              />
            )}
          </TabsContent>

          {/* Upcoming Scheduled */}
          <TabsContent value="upcoming" className="mt-0 space-y-3">
            {upcomingJobs.length > 0 ? (
              upcomingJobs.map(job => (
                <DashboardJobCard
                  key={job.id}
                  job={job}
                  onAccept={() => {}}
                  onDecline={() => {}}
                />
              ))
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming jobs"
                description="Scheduled jobs will appear here"
              />
            )}
          </TabsContent>

          {/* Completed History */}
          <TabsContent value="history" className="mt-0">
            {completedJobs.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 divide-y overflow-hidden">
                {completedJobs.slice(0, 15).map(job => (
                  <Link
                    key={job.id}
                    to={`${createPageUrl('TechnicianJobs')}?id=${job.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4.5 h-4.5 w-[18px] h-[18px] text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 capitalize">
                          {job.category?.replace('_', ' ')} Service
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(job.created_date), 'MMM d, yyyy')} · {job.user_name || 'Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-green-600">
                        +KES {(job.final_price || job.estimated_price || 0).toLocaleString()}
                      </p>
                      <ChevronRight className="w-4 h-4 text-gray-300 ml-auto mt-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Briefcase}
                title="No completed jobs yet"
                description="Complete jobs to see them here"
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 gap-3 pb-4">
          {[
            { label: 'All Jobs',   icon: Briefcase, page: 'TechnicianJobs',    color: 'bg-teal-50 text-teal-600 border-teal-200' },
            { label: 'Earnings',   icon: Wallet,    page: 'TechnicianEarnings', color: 'bg-green-50 text-green-600 border-green-200' },
            { label: 'My Profile', icon: User,      page: 'TechnicianProfile',  color: 'bg-purple-50 text-purple-600 border-purple-200' },
          ].map(nav => (
            <Link
              key={nav.page}
              to={createPageUrl(nav.page)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${nav.color} hover:opacity-80 transition-opacity`}
            >
              <nav.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{nav.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
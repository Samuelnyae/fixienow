import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, isToday, isFuture } from 'date-fns';
import {
  Star, AlertCircle, Bell, CheckCircle2, CalendarDays, Zap, Briefcase,
  ChevronRight, LineChart, MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import DashboardJobCard from '../components/technician/DashboardJobCard';
import AISuggestionsPanel from '../components/technician/AISuggestionsPanel';
import CreditScoreCard from '../components/credit/CreditScoreCard';
import { technicianProfile } from '../lib/creditScore';
import { useWalletStats } from '../hooks/useWalletStats';

export default function TechnicianDashboard() {
  const [user, setUser] = useState(null);
  const [statusTab, setStatusTab] = useState('active');
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
    refetchInterval: 30000,
  });

  const { data: walletStats = null } = useWalletStats(technician?.user_id, !!technician);

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

  if (!technician) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Not Registered as Technician</h2>
          <p className="text-gray-500 mb-6">Register to access the technician dashboard</p>
          <Button asChild className="bg-[#2E7D32] hover:bg-[#256628]">
            <Link to={createPageUrl('TechnicianRegister')}>Register Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (technician.verification_status === 'pending') {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verification Pending</h2>
          <p className="text-gray-500 mb-6">Your application is under review. We'll notify you once approved (usually 24-48 hours).</p>
          <Button asChild variant="outline"><Link to={createPageUrl('Home')}>Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  if (technician.verification_status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#F5F7F9] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Application Rejected</h2>
          <p className="text-gray-500 mb-6">Please contact support for more details.</p>
          <Button asChild variant="outline"><Link to={createPageUrl('Home')}>Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  const statusTabs = [
    { key: 'upcoming', label: 'Upcoming', count: upcomingJobs.length, icon: CalendarDays },
    { key: 'active',   label: 'Active',   count: activeJobs.length,   icon: Zap },
    { key: 'history',  label: 'History',  count: completedJobs.length, icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7F9]">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-28 space-y-5">

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

        {/* Unified Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
          <Avatar className="w-14 h-14 ring-2 ring-green-100 flex-shrink-0">
            <AvatarImage src={technician.profile_photo} />
            <AvatarFallback className="bg-[#2E7D32]/10 text-[#2E7D32] font-semibold text-lg">
              {technician.name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate leading-tight">{technician.name}</h1>
            <p className="text-sm text-gray-500 capitalize truncate">{technician.profession?.replace('_', ' ')}</p>
            <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium">{technician.rating?.toFixed(1) || '0.0'} Star Rating</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`text-xs font-bold tracking-wide ${technician.is_available ? 'text-[#2E7D32]' : 'text-gray-400'}`}>
              {technician.is_available ? 'ONLINE' : 'OFFLINE'}
            </span>
            <Switch
              checked={technician.is_available}
              onCheckedChange={(checked) => toggleAvailabilityMutation.mutate(checked)}
            />
          </div>
        </div>

        {/* Dashboard Overview — consolidated hero card */}
        <div className="rounded-2xl p-5 text-white shadow-sm" style={{ background: '#2E7D32' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base">Dashboard Overview</h2>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-white" />
            </div>
          </div>

          <div>
            <p className="text-white/80 text-sm">Today's Earnings</p>
            <p className="text-3xl font-bold tracking-tight">KES {dailyEarnings.toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/70 text-xs">Jobs Done Today</p>
              <p className="text-lg font-bold">{todayCompleted.length}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">This Week</p>
              <p className="text-lg font-bold">
                KES {weeklyEarnings.toLocaleString()}
                <span className="text-white/70 text-sm font-medium"> ({weekCompleted.length} Job{weekCompleted.length !== 1 ? 's' : ''})</span>
              </p>
            </div>
          </div>
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

        {/* Consolidated horizontal status bar */}
        <div className="grid grid-cols-3 gap-2">
          {statusTabs.map(tab => {
            const isActive = statusTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-[#2E7D32] bg-[#2E7D32]/5 text-[#2E7D32]'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-0.5 text-xs font-bold ${isActive ? 'text-[#2E7D32]' : 'text-gray-400'}`}>
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Status content */}
        {statusTab === 'active' && (
          <div className="space-y-3">
            {jobsLoading ? (
              <LoadingSpinner />
            ) : activeJobs.length > 0 ? (
              activeJobs.map(job => (
                <DashboardJobCard key={job.id} job={job} onAccept={() => {}} onDecline={() => {}} />
              ))
            ) : (
              <EmptyState
                icon={Zap}
                title="No active jobs"
                description={technician.is_available ? "Waiting for new job requests" : "Go online to receive jobs"}
              />
            )}
          </div>
        )}

        {statusTab === 'upcoming' && (
          <div className="space-y-3">
            {upcomingJobs.length > 0 ? (
              upcomingJobs.map(job => (
                <DashboardJobCard key={job.id} job={job} onAccept={() => {}} onDecline={() => {}} />
              ))
            ) : (
              <EmptyState icon={CalendarDays} title="No upcoming jobs" description="Scheduled jobs will appear here" />
            )}
          </div>
        )}

        {statusTab === 'history' && (
          <div>
            {completedJobs.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 divide-y overflow-hidden">
                {completedJobs.slice(0, 15).map(job => (
                  <Link
                    key={job.id}
                    to={`${createPageUrl('TechnicianJobs')}?id=${job.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-[18px] h-[18px] text-green-600" />
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
              <EmptyState icon={Briefcase} title="No completed jobs yet" description="Complete jobs to see them here" />
            )}
          </div>
        )}

        {/* Fixie Credit Score — detailed full-width widget */}
        <CreditScoreCard profile={technicianProfile(technician, walletStats)} />

        {/* AI Suggestions */}
        <AISuggestionsPanel technician={technician} completedJobs={completedJobs} />
      </div>
    </div>
  );
}
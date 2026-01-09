import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Navigation,
  Play,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-700' },
  en_route: { label: 'En Route', color: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function TechnicianJobs() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [finalPrice, setFinalPrice] = useState('');
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

  const { data: technician } = useQuery({
    queryKey: ['myTechnician', user?.id],
    queryFn: async () => {
      const techs = await base44.entities.Technician.filter({ user_id: user.id });
      return techs[0];
    },
    enabled: !!user,
  });

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['techJobs', technician?.id],
    queryFn: () => base44.entities.Booking.filter(
      { technician_id: technician.id },
      '-created_date',
      100
    ),
    enabled: !!technician,
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ jobId, data }) => base44.entities.Booking.update(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['techJobs']);
      setShowCompleteDialog(false);
      setSelectedJob(null);
    },
  });

  const handleAccept = async (job) => {
    await updateJobMutation.mutateAsync({ jobId: job.id, data: { status: 'accepted' } });
    
    // Create notification for user
    await base44.entities.Notification.create({
      user_id: job.user_id,
      type: 'booking_accepted',
      title: 'Booking Accepted',
      message: `${technician?.name || 'A technician'} has accepted your ${job.category?.replace('_', ' ')} service request`,
      booking_id: job.id,
      metadata: {
        category: job.category,
        technician_name: technician?.name
      }
    });
  };

  const handleDecline = (job) => {
    updateJobMutation.mutate({ jobId: job.id, data: { status: 'cancelled' } });
  };

  const handleStartRoute = (job) => {
    updateJobMutation.mutate({ jobId: job.id, data: { status: 'en_route' } });
  };

  const handleStartWork = async (job) => {
    await updateJobMutation.mutateAsync({ jobId: job.id, data: { status: 'in_progress' } });
    
    // Create notification for user
    await base44.entities.Notification.create({
      user_id: job.user_id,
      type: 'booking_started',
      title: 'Work Started',
      message: `${technician?.name || 'Your technician'} has started working on your ${job.category?.replace('_', ' ')} service`,
      booking_id: job.id,
      metadata: {
        category: job.category,
        technician_name: technician?.name
      }
    });
  };

  const handleComplete = async () => {
    if (selectedJob) {
      const price = parseFloat(finalPrice) || selectedJob.estimated_price;
      
      await updateJobMutation.mutateAsync({ 
        jobId: selectedJob.id, 
        data: { 
          status: 'completed', 
          final_price: price
        } 
      });

      // Update technician stats
      if (technician) {
        base44.entities.Technician.update(technician.id, {
          total_jobs: (technician.total_jobs || 0) + 1,
          wallet_balance: (technician.wallet_balance || 0) + price
        });
      }

      // Create notification for user
      await base44.entities.Notification.create({
        user_id: selectedJob.user_id,
        type: 'booking_completed',
        title: 'Service Completed',
        message: `Your ${selectedJob.category?.replace('_', ' ')} service has been completed. Total: KES ${price.toLocaleString()}`,
        booking_id: selectedJob.id,
        metadata: {
          category: selectedJob.category,
          technician_name: technician?.name,
          amount: price
        }
      });
    }
  };

  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const activeJobs = jobs.filter(j => ['accepted', 'en_route', 'in_progress'].includes(j.status));
  const completedJobs = jobs.filter(j => ['completed', 'cancelled'].includes(j.status));

  const getJobsByTab = () => {
    switch (activeTab) {
      case 'pending': return pendingJobs;
      case 'active': return activeJobs;
      case 'history': return completedJobs;
      default: return [];
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading jobs..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Jobs</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-white border mb-6">
            <TabsTrigger value="pending" className="flex-1">
              Requests ({pendingJobs.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Active ({activeJobs.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              History
            </TabsTrigger>
          </TabsList>

          {['pending', 'active', 'history'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {getJobsByTab().length > 0 ? (
                <div className="space-y-4">
                  {getJobsByTab().map((job) => (
                    <div key={job.id} className="bg-white rounded-2xl p-4 border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold capitalize">
                            {job.category?.replace('_', ' ')} Service
                          </h3>
                          <p className="text-sm text-gray-500">
                            #{job.id?.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <Badge className={statusConfig[job.status]?.color}>
                          {statusConfig[job.status]?.label}
                        </Badge>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">{job.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-[200px]">{job.location?.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {job.scheduled_date 
                              ? format(new Date(job.scheduled_date), 'MMM d')
                              : format(new Date(job.created_date), 'MMM d')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="font-medium">{job.user_name}</p>
                        </div>
                        <p className="text-lg font-bold text-teal-600">
                          KES {(job.final_price || job.estimated_price)?.toLocaleString()}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      {job.status === 'pending' && (
                        <div className="flex gap-3 mt-4">
                          <Button 
                            variant="outline"
                            onClick={() => handleDecline(job)}
                            className="flex-1"
                            disabled={updateJobMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                          <Button 
                            onClick={() => handleAccept(job)}
                            className="flex-1 bg-teal-600 hover:bg-teal-700"
                            disabled={updateJobMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      )}

                      {job.status === 'accepted' && (
                        <div className="flex gap-3 mt-4">
                          <Button 
                            variant="outline"
                            className="flex-1"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                          <Button 
                            onClick={() => handleStartRoute(job)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                            disabled={updateJobMutation.isPending}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Start Route
                          </Button>
                        </div>
                      )}

                      {job.status === 'en_route' && (
                        <Button 
                          onClick={() => handleStartWork(job)}
                          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
                          disabled={updateJobMutation.isPending}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Arrived - Start Work
                        </Button>
                      )}

                      {job.status === 'in_progress' && (
                        <Button 
                          onClick={() => {
                            setSelectedJob(job);
                            setFinalPrice(job.estimated_price?.toString() || '');
                            setShowCompleteDialog(true);
                          }}
                          className="w-full mt-4 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Complete Job
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title={`No ${tab} jobs`}
                  description={tab === 'pending' 
                    ? "New job requests will appear here"
                    : "Jobs will show here once you start working"}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Complete Job Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Job</DialogTitle>
            <DialogDescription>
              Enter the final price for this job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Final Price (KES)</label>
              <Input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                placeholder={selectedJob?.estimated_price?.toString()}
              />
            </div>
            <Button 
              onClick={handleComplete}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={updateJobMutation.isPending}
            >
              {updateJobMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Mark as Complete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
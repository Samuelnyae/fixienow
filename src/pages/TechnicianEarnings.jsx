import React, { useState, useEffect } from 'react';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Wallet,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function TechnicianEarnings() {
  const [user, setUser] = useState(null);

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

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['techPayments', technician?.id],
    queryFn: () => base44.entities.Payment.filter(
      { technician_id: technician.id, status: 'completed' },
      '-created_date',
      100
    ),
    enabled: !!technician,
  });

  const { data: completedJobs = [] } = useQuery({
    queryKey: ['completedJobs', technician?.id],
    queryFn: () => base44.entities.Booking.filter(
      { technician_id: technician.id, status: 'completed' },
      '-created_date',
      100
    ),
    enabled: !!technician,
  });

  // Calculate earnings
  const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.final_price || job.estimated_price || 0), 0);
  
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const thisMonthJobs = completedJobs.filter(job => {
    const date = new Date(job.created_date);
    return date >= thisMonthStart && date <= thisMonthEnd;
  });
  const thisMonthEarnings = thisMonthJobs.reduce((sum, job) => sum + (job.final_price || job.estimated_price || 0), 0);

  const last7DaysJobs = completedJobs.filter(job => {
    const date = new Date(job.created_date);
    return date >= subDays(new Date(), 7);
  });
  const weeklyEarnings = last7DaysJobs.reduce((sum, job) => sum + (job.final_price || job.estimated_price || 0), 0);

  if (isLoading) {
    return <LoadingSpinner text="Loading earnings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-teal-600 to-teal-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6">
            <p className="text-teal-100 mb-1">Available Balance</p>
            <p className="text-4xl font-bold mb-6">
              KES {(technician?.wallet_balance || 0).toLocaleString()}
            </p>
            <Button 
              asChild
              className="bg-white text-teal-600 hover:bg-teal-50"
            >
              <a href={createPageUrl('Wallet')}>
                <Wallet className="w-4 h-4 mr-2" />
                Open Wallet
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">This Week</p>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">KES {weeklyEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{last7DaysJobs.length} jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">This Month</p>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">KES {thisMonthEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{thisMonthJobs.length} jobs</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          
          {completedJobs.length > 0 ? (
            <div className="bg-white rounded-2xl border divide-y">
              {completedJobs.map((job) => (
                <div key={job.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {job.category?.replace('_', ' ')} Service
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(job.created_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">
                    +KES {(job.final_price || job.estimated_price)?.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={DollarSign}
              title="No earnings yet"
              description="Complete jobs to start earning"
            />
          )}
        </div>
      </div>
    </div>
  );
}
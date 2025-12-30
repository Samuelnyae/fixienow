import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookingCard from '../components/booking/BookingCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function MyBookings() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

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

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings', user?.id],
    queryFn: () => base44.entities.Booking.filter({ user_id: user.id }, '-created_date', 50),
    enabled: !!user,
  });

  const activeBookings = bookings.filter(b => 
    ['pending', 'accepted', 'en_route', 'in_progress'].includes(b.status)
  );
  const completedBookings = bookings.filter(b => 
    ['completed', 'cancelled'].includes(b.status)
  );

  if (!user) {
    return <LoadingSpinner text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link to={createPageUrl('Services')}>
              <Plus className="w-5 h-5 mr-1" />
              New Booking
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-white border mb-6">
            <TabsTrigger value="active" className="flex-1">
              Active ({activeBookings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              History ({completedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <LoadingSpinner />
            ) : activeBookings.length > 0 ? (
              <div className="space-y-4">
                {activeBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No active bookings"
                description="Book a service and track your appointments here"
                actionLabel="Book a Service"
                onAction={() => window.location.href = createPageUrl('Services')}
              />
            )}
          </TabsContent>

          <TabsContent value="history">
            {isLoading ? (
              <LoadingSpinner />
            ) : completedBookings.length > 0 ? (
              <div className="space-y-4">
                {completedBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No booking history"
                description="Your completed bookings will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
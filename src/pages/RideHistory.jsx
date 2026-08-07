import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import {
  Car, Truck, Bike, Receipt, Calendar, Clock, MapPin, Navigation,
  Star, CheckCircle2, XCircle, Loader2, ArrowLeft, Filter, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RideReceiptDialog from '@/components/ride/RideReceiptDialog';
import EmptyState from '@/components/common/EmptyState';

const RIDE_TYPE_META = {
  cab: { icon: Car, label: 'Cab', color: 'text-teal-600', bg: 'bg-teal-50' },
  truck: { icon: Truck, label: 'Truck', color: 'text-amber-600', bg: 'bg-amber-50' },
  bodaboda: { icon: Bike, label: 'Boda', color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

const STATUS_META = {
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-green-600', bg: 'bg-green-50' },
  scheduled: { icon: Calendar, label: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-50' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50' },
  in_progress: { icon: Navigation, label: 'In Progress', color: 'text-purple-600', bg: 'bg-purple-50' },
  assigned: { icon: Clock, label: 'Driver Assigned', color: 'text-teal-600', bg: 'bg-teal-50' },
  searching: { icon: Loader2, label: 'Finding Driver', color: 'text-gray-500', bg: 'bg-gray-50' },
};

export default function RideHistory() {
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [receiptRide, setReceiptRide] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const list = await base44.entities.Ride.filter(
          { user_id: me.id },
          '-created_date',
          100
        );
        setRides(list || []);
      } catch (e) {
        // not logged in
      }
      setLoading(false);
    })();
  }, []);

  const filtered = rides.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['searching', 'assigned', 'in_progress'].includes(r.status);
    return r.status === filter;
  });

  const stats = {
    total: rides.length,
    completed: rides.filter(r => r.status === 'completed').length,
    scheduled: rides.filter(r => r.status === 'scheduled').length,
    spent: rides
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.final_fare || r.estimated_fare || 0), 0),
  };

  if (!user && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={Car}
          title="Sign in to view your rides"
          description="Your ride history and receipts will appear here once you're logged in."
          actionLabel="Go to Sign In"
          onAction={() => base44.auth.redirectToLogin('/RideHistory')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/OrderRide" className="md:hidden">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Rides</h1>
          <p className="text-sm text-gray-500">Trip history, receipts & scheduled rides</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{stats.completed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Completed</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
          <p className="text-xs text-gray-500 mt-0.5">Scheduled</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.spent.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">KES Spent</p>
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList className="w-full grid grid-cols-4 h-10 bg-gray-100 rounded-xl">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
          <TabsTrigger value="scheduled" className="text-xs">Upcoming</TabsTrigger>
          <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No rides yet"
          description="Book your first ride and it'll show up here with a downloadable receipt."
          actionLabel="Order a Ride"
          onAction={() => (window.location.href = '/OrderRide')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ride) => {
            const meta = RIDE_TYPE_META[ride.ride_type] || RIDE_TYPE_META.cab;
            const status = STATUS_META[ride.completed_via_cancelled || ride.status] || STATUS_META[ride.status] || STATUS_META.completed;
            const Icon = meta.icon;
            const StatusIcon = status.icon;
            const amount = ride.final_fare || ride.estimated_fare || 0;
            const rideDate = ride.updated_date || ride.created_date;

            return (
              <div key={ride.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 capitalize">{meta.label} ride</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" /> {status.label}
                      </span>
                    </div>
                    {rideDate && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(rideDate), 'EEE, MMM d · h:mm a')}
                        {ride.booking_type === 'scheduled' && ride.scheduled_date && (
                          <span className="text-blue-500"> · scheduled {ride.scheduled_date} {ride.scheduled_time || ''}</span>
                        )}
                      </p>
                    )}
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 truncate">{ride.pickup?.address || '—'}</span>
                    </div>
                    <div className="mt-1 flex items-start gap-2 text-sm">
                      <Navigation className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 truncate">{ride.destination?.address || '—'}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {ride.driver_name && <span className="truncate">👤 {ride.driver_name}</span>}
                        {ride.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {ride.rating}
                          </span>
                        )}
                        <span className="font-semibold text-gray-900">KES {amount.toLocaleString()}</span>
                      </div>
                      {ride.status === 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReceiptRide(ride)}
                          className="text-teal-600 hover:bg-teal-50 h-8 px-2"
                        >
                          <Receipt className="w-4 h-4 mr-1" /> Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RideReceiptDialog
        open={!!receiptRide}
        onOpenChange={(o) => !o && setReceiptRide(null)}
        ride={receiptRide}
        user={user}
      />
    </div>
  );
}
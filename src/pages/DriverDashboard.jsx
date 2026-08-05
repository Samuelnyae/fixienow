import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Bike, Truck, Star, Navigation, Power, Clock, CheckCircle2, XCircle, Phone, Wallet, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const VEHICLE_ICON = { cab: Car, bodaboda: Bike, truck: Truck };
const STATUS_FLOW = ['searching', 'assigned', 'in_progress', 'completed'];

export default function DriverDashboard() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => setUser(u)).catch(() => {}).finally(() => setAuthChecked(true));
  }, []);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['myDriverProfile', user?.id],
    queryFn: () => base44.entities.Driver.filter({ user_id: user.id }, '-created_date', 5),
    enabled: !!user,
  });
  const driver = drivers[0];

  const { data: myRides = [] } = useQuery({
    queryKey: ['myRides', driver?.id],
    queryFn: () => base44.entities.Ride.filter({ driver_id: driver.id }, '-created_date', 50),
    enabled: !!driver?.id,
    refetchInterval: 5000,
  });

  const activeRide = myRides.find((r) => ['searching', 'assigned', 'in_progress'].includes(r.status));
  const completedRides = myRides.filter((r) => r.status === 'completed');
  const earnings = completedRides.reduce((s, r) => s + (r.final_fare || r.estimated_fare || 0), 0);

  const toggleMutation = useMutation({
    mutationFn: (val) => base44.entities.Driver.update(driver.id, { is_available: val }),
    onSuccess: () => queryClient.invalidateQueries(['myDriverProfile', user?.id]),
  });

  const advanceMutation = useMutation({
    mutationFn: async ({ ride, nextStatus }) => {
      const updated = await base44.entities.Ride.update(ride.id, { status: nextStatus, final_fare: nextStatus === 'completed' ? (ride.estimated_fare || ride.final_fare || 0) : ride.final_fare, payment_status: nextStatus === 'completed' ? 'paid' : ride.payment_status });
      if (nextStatus === 'completed') {
        const fare = ride.estimated_fare || ride.final_fare || 0;
        await base44.entities.Driver.update(driver.id, {
          total_trips: (driver.total_trips || 0) + 1,
          wallet_balance: (driver.wallet_balance || 0) + fare,
        });
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myRides', driver?.id]);
      queryClient.invalidateQueries(['myDriverProfile', user?.id]);
    },
  });

  if (!authChecked || isLoading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-base font-bold text-gray-900">Driver Dashboard</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {!driver ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Car className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900">You're not a driver yet</h2>
            <p className="text-sm text-gray-500 mt-1 mb-5">Register your cab, boda boda or truck to start earning on every trip.</p>
            <Button asChild className="bg-[#0B463C] hover:bg-[#0a3d34]">
              <Link to="/DriverRegister">Become a Driver</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Profile + status */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0B463C] text-white flex items-center justify-center text-lg font-bold">
                  {driver.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{driver.name}</p>
                  <p className="text-sm text-gray-500 truncate">{driver.vehicle_model} · {driver.vehicle_plate}</p>
                </div>
                <Badge className={
                  driver.verification_status === 'approved' ? 'bg-green-100 text-green-700'
                  : driver.verification_status === 'pending' ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
                }>
                  {driver.verification_status}
                </Badge>
              </div>

              {driver.verification_status === 'pending' && (
                <p className="text-sm text-amber-700 mt-3 bg-amber-50 rounded-xl p-3">
                  Your application is under review. You'll be able to go online once an admin approves it.
                </p>
              )}
              {driver.verification_status === 'rejected' && (
                <p className="text-sm text-red-700 mt-3 bg-red-50 rounded-xl p-3">
                  Your application was rejected. Please contact support or re-apply with correct documents.
                </p>
              )}
              {driver.verification_status === 'approved' && (
                <div className="mt-4">
                  <button
                    onClick={() => toggleMutation.mutate(!driver.is_available)}
                    disabled={toggleMutation.isPending}
                    className={`w-full flex items-center justify-center gap-2 h-12 rounded-xl font-semibold transition-colors ${
                      driver.is_available ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Power className="w-5 h-5" />
                    {driver.is_available ? "You're Online — receiving rides" : 'Go Online'}
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <Navigation className="w-5 h-5 text-[#0B463C] mx-auto mb-1" />
                <p className="text-lg font-bold">{driver.total_trips || 0}</p>
                <p className="text-xs text-gray-500">Trips</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-lg font-bold">{driver.rating?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <Wallet className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold">{(driver.wallet_balance || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Earnings</p>
              </div>
            </div>

            {/* Active ride */}
            {activeRide ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <p className="font-semibold text-gray-900">Active ride</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 capitalize">{activeRide.status.replace('_', ' ')}</Badge>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-start gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#0B463C] mt-1.5" /><div><p className="text-gray-500 text-xs">Pickup</p><p className="font-medium">{activeRide.pickup?.address}</p></div></div>
                  <div className="flex items-start gap-2"><span className="w-2.5 h-2.5 bg-[#111827] mt-1.5" /><div><p className="text-gray-500 text-xs">Destination</p><p className="font-medium">{activeRide.destination?.address}</p></div></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-gray-50 rounded-xl py-2"><p className="text-xs text-gray-500">Distance</p><p className="font-semibold">{(activeRide.distance_km || 0).toFixed(1)} km</p></div>
                  <div className="bg-gray-50 rounded-xl py-2"><p className="text-xs text-gray-500">Fare</p><p className="font-semibold">KES {(activeRide.estimated_fare || 0).toLocaleString()}</p></div>
                  <div className="bg-gray-50 rounded-xl py-2"><p className="text-xs text-gray-500">Customer</p><p className="font-semibold truncate">{activeRide.user_name || '—'}</p></div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" /> <a href={`tel:${activeRide.user_phone}`} className="text-[#0B463C] font-medium">{activeRide.user_phone || 'No phone'}</a>
                </div>
                {activeRide.status === 'assigned' && (
                  <Button onClick={() => advanceMutation.mutate({ ride: activeRide, nextStatus: 'in_progress' })} disabled={advanceMutation.isPending} className="w-full h-11 bg-[#0B463C] hover:bg-[#0a3d34]">
                    Arrived — Start Trip
                  </Button>
                )}
                {activeRide.status === 'in_progress' && (
                  <Button onClick={() => advanceMutation.mutate({ ride: activeRide, nextStatus: 'completed' })} disabled={advanceMutation.isPending} className="w-full h-11 bg-green-600 hover:bg-green-700">
                    Complete Trip
                  </Button>
                )}
                {activeRide.status === 'searching' && (
                  <p className="text-sm text-gray-500 text-center">Waiting for dispatch confirmation…</p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <Navigation className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No active ride right now. {driver.is_available ? 'Stay online to receive requests.' : 'Go online to start receiving rides.'}</p>
              </div>
            )}

            {/* Recent rides */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">Recent trips</p>
                <button onClick={() => queryClient.invalidateQueries(['myRides', driver?.id])} className="text-gray-400 hover:text-gray-600">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {completedRides.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No completed trips yet.</p>
              ) : (
                <div className="space-y-2">
                  {completedRides.slice(0, 8).map((r) => {
                    const Icon = VEHICLE_ICON[r.ride_type] || Car;
                    return (
                      <div key={r.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Icon className="w-4 h-4 text-gray-600" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.destination?.address || 'Trip'}</p>
                          <p className="text-xs text-gray-500">{r.ride_type} · {new Date(r.created_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">KES {(r.final_fare || r.estimated_fare || 0).toLocaleString()}</p>
                          {r.rating ? <p className="text-xs text-amber-500">★ {r.rating}</p> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
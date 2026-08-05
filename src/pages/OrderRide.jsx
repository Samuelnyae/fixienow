import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Crosshair,
  Search,
  X,
  Phone,
  Star,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import RideMap from '@/components/ride/RideMap';
import RideTypeCard from '@/components/ride/RideTypeCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  RIDE_TYPES,
  RIDE_TYPE_ORDER,
  haversineKm,
  estimateDurationMin,
  computeFare,
  resolveCoords,
  fallbackCoords,
  pickDriver,
  NAIROBI_CBD,
} from '@/lib/rideConfig';

export default function OrderRide() {
  const urlParams = new URLSearchParams(window.location.search);
  const preType = urlParams.get('type');

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [phase, setPhase] = useState('setup'); // setup | searching | assigned | in_progress | completed | cancelled
  const [pickupAddr, setPickupAddr] = useState('');
  const [destAddr, setDestAddr] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [rideType, setRideType] = useState(['cab', 'bodaboda', 'truck'].includes(preType) ? preType : 'cab');
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const timers = useRef([]);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => setUser(u))
      .catch(() => {})
      .finally(() => setAuthChecked(true));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const distanceKm = useMemo(() => haversineKm(pickupCoords, destCoords), [pickupCoords, destCoords]);
  const durationMin = useMemo(() => estimateDurationMin(distanceKm), [distanceKm]);
  const fare = useMemo(() => computeFare(rideType, distanceKm, durationMin), [rideType, distanceKm, durationMin]);

  // Animate the driver marker toward its target while the ride is live
  useEffect(() => {
    if (!['searching', 'assigned', 'in_progress'].includes(phase)) return;
    const target = phase === 'in_progress' ? destCoords : pickupCoords;
    if (!target) return;
    const id = setInterval(() => {
      setDriverPos((prev) => {
        if (!prev) return prev;
        const step = 0.25;
        const nextLat = prev.lat + (target.lat - prev.lat) * step;
        const nextLng = prev.lng + (target.lng - prev.lng) * step;
        if (Math.abs(nextLat - target.lat) < 0.0005 && Math.abs(nextLng - target.lng) < 0.0005) return prev;
        return { lat: nextLat, lng: nextLng };
      });
    }, 400);
    return () => clearInterval(id);
  }, [phase, pickupCoords, destCoords]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPickupAddr('Current location');
        setLocating(false);
      },
      () => {
        setPickupCoords(NAIROBI_CBD);
        setPickupAddr('Nairobi CBD');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePickup = (value) => {
    setPickupAddr(value);
    if (!value) return setPickupCoords(null);
    setPickupCoords(resolveCoords(value) || NAIROBI_CBD);
  };

  const handleDestination = (value) => {
    setDestAddr(value);
    if (!value) return setDestCoords(null);
    setDestCoords(resolveCoords(value) || fallbackCoords(value));
  };

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const requestRide = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!pickupCoords || !destCoords) {
      setError('Please set both pickup and destination.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const drv = pickDriver(rideType);
      const newRide = await base44.entities.Ride.create({
        user_id: user.id,
        user_name: user.full_name,
        user_phone: user.phone,
        ride_type: rideType,
        pickup: { address: pickupAddr, lat: pickupCoords.lat, lng: pickupCoords.lng },
        destination: { address: destAddr, lat: destCoords.lat, lng: destCoords.lng },
        distance_km: +distanceKm.toFixed(2),
        duration_min: durationMin,
        estimated_fare: fare,
        payment_method: 'cash',
        status: 'searching',
        booked_via: 'app',
      });
      setRide(newRide);
      setDriver(drv);
      // start the driver marker near the pickup
      setDriverPos({
        lat: pickupCoords.lat + 0.008,
        lng: pickupCoords.lng + 0.008,
      });
      setPhase('searching');
      base44.analytics.track({ eventName: 'ride_requested', properties: { ride_type: rideType, fare } });

      // searching -> assigned (driver found, en route to pickup)
      timers.current.push(
        setTimeout(async () => {
          const assigned = await base44.entities.Ride.update(newRide.id, {
            status: 'assigned',
            driver_name: drv.name,
            driver_phone: drv.phone,
            vehicle_model: drv.vehicle_model,
            vehicle_plate: drv.vehicle_plate,
          });
          setRide(assigned);
          setPhase('assigned');
        }, 3000)
      );

      // assigned -> in_progress (driver arrived, trip started)
      timers.current.push(
        setTimeout(async () => {
          const ip = await base44.entities.Ride.update(newRide.id, { status: 'in_progress' });
          setRide(ip);
          setPhase('in_progress');
        }, 10000)
      );

      // in_progress -> completed (trip done)
      timers.current.push(
        setTimeout(async () => {
          const comp = await base44.entities.Ride.update(newRide.id, {
            status: 'completed',
            final_fare: fare,
            payment_status: 'paid',
          });
          setRide(comp);
          setPhase('completed');
        }, 20000)
      );
    } catch (e) {
      setError(e.message || 'Could not request your ride. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRide = async () => {
    clearTimers();
    if (ride) {
      try {
        await base44.entities.Ride.update(ride.id, { status: 'cancelled' });
      } catch {}
    }
    setPhase('cancelled');
    setRide(null);
    setDriver(null);
    setDriverPos(null);
  };

  const submitRating = async () => {
    if (!ride || !rating) return;
    try {
      await base44.entities.Ride.update(ride.id, { rating });
    } catch {}
    setPhase('setup');
    setRide(null);
    setRating(0);
    setPickupAddr('');
    setDestAddr('');
    setPickupCoords(null);
    setDestCoords(null);
  };

  const resetToSetup = () => {
    setPhase('setup');
    setRide(null);
    setRating(0);
  };

  if (!authChecked) return <LoadingSpinner text="Loading..." />;

  const selectedType = RIDE_TYPES[rideType];
  const liveRideType = ride?.ride_type || rideType;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Top bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0B463C] text-white flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">Get a ride</h1>
              <p className="text-xs text-gray-500">Cab · Boda boda · Truck</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[42vh] sm:h-[52vh] w-full bg-gray-200">
        <RideMap
          pickup={pickupCoords}
          destination={destCoords}
          driverPos={driverPos}
          driverType={liveRideType}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* SETUP */}
        {phase === 'setup' && (
          <>
            {/* Location inputs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B463C] flex-shrink-0" />
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={pickupAddr}
                    onChange={(e) => handlePickup(e.target.value)}
                    placeholder="Pickup location (e.g. Westlands)"
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B463C]/20"
                  />
                </div>
                <button
                  onClick={useMyLocation}
                  disabled={locating}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0B463C] text-white flex items-center justify-center disabled:opacity-60"
                  title="Use my location"
                >
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-[#111827] flex-shrink-0" />
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={destAddr}
                    onChange={(e) => handleDestination(e.target.value)}
                    placeholder="Where to? (e.g. Kilimani, Karen, Thika)"
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B463C]/20"
                  />
                </div>
              </div>
            </div>

            {/* Trip estimate */}
            {pickupCoords && destCoords && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{distanceKm.toFixed(1)} km trip</span>
                  <span>~{durationMin} min</span>
                </div>
                <div className="space-y-1">
                  {RIDE_TYPE_ORDER.map((key) => (
                    <RideTypeCard
                      key={key}
                      config={RIDE_TYPES[key]}
                      selected={rideType === key}
                      fare={computeFare(key, distanceKm, durationMin)}
                      onSelect={() => setRideType(key)}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 border border-red-100">{error}</div>
            )}

            <Button
              onClick={requestRide}
              disabled={submitting || !pickupCoords || !destCoords}
              className="w-full h-13 py-3.5 bg-[#111827] hover:bg-black text-white rounded-2xl text-base font-semibold disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Requesting...
                </>
              ) : (
                <>Request {selectedType.label} · KES {fare ? fare.toLocaleString() : '—'}</>
              )}
            </Button>
            <p className="text-center text-xs text-gray-400">
              By requesting, you agree to Fixie's ride terms. Pay by cash, M-Pesa or wallet after the trip.
            </p>
          </>
        )}

        {/* SEARCHING */}
        {phase === 'searching' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#0B463C]/10 flex items-center justify-center mx-auto mb-3">
              <Loader2 className="w-7 h-7 text-[#0B463C] animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Finding your {selectedType.label}...</h2>
            <p className="text-sm text-gray-500 mt-1">Matching you with a nearby driver. This usually takes a few seconds.</p>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-amber-500" /> AI dispatch in progress
            </div>
            <Button onClick={cancelRide} variant="outline" className="w-full mt-5 h-11 rounded-xl">
              Cancel request
            </Button>
          </div>
        )}

        {/* ASSIGNED */}
        {phase === 'assigned' && driver && (
          <div className="space-y-3">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-800">
                <span className="font-semibold">{driver.name}</span> is on the way · arriving in ~{selectedType.eta}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0B463C] text-white flex items-center justify-center text-lg font-bold">
                  {driver.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{driver.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {driver.vehicle_model} · {driver.vehicle_plate}
                  </p>
                </div>
                <a
                  href={`tel:${driver.phone}`}
                  className="w-10 h-10 rounded-full bg-[#0B463C] text-white flex items-center justify-center"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-gray-50 rounded-xl py-2">
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="text-sm font-semibold">{distanceKm.toFixed(1)} km</p>
                </div>
                <div className="bg-gray-50 rounded-xl py-2">
                  <p className="text-xs text-gray-500">Est. fare</p>
                  <p className="text-sm font-semibold">KES {fare.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl py-2">
                  <p className="text-xs text-gray-500">Pay</p>
                  <p className="text-sm font-semibold">Cash</p>
                </div>
              </div>
            </div>
            <Button onClick={cancelRide} variant="outline" className="w-full h-11 rounded-xl">
              Cancel ride
            </Button>
          </div>
        )}

        {/* IN PROGRESS */}
        {phase === 'in_progress' && driver && (
          <div className="space-y-3">
            <div className="bg-[#0B463C] text-white rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-100">On trip</p>
                <p className="font-semibold">Heading to {destAddr}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-teal-100">Arriving</p>
                <p className="font-semibold">~{Math.max(2, durationMin)} min</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#0B463C] text-white flex items-center justify-center font-bold">
                {driver.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{driver.name}</p>
                <p className="text-sm text-gray-500 truncate">{driver.vehicle_model} · {driver.vehicle_plate}</p>
              </div>
              <a href={`tel:${driver.phone}`} className="w-10 h-10 rounded-full bg-[#0B463C] text-white flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* COMPLETED */}
        {phase === 'completed' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Trip completed</h2>
            <p className="text-sm text-gray-500 mt-1">You arrived at {destAddr}</p>
            <div className="bg-gray-50 rounded-2xl p-4 mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Distance</span>
                <span className="font-medium">{distanceKm.toFixed(1)} km</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-gray-500">Driver</span>
                <span className="font-medium">{driver?.name}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-semibold">Total paid</span>
                <span className="text-xl font-bold text-[#0B463C]">KES {fare.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Rate your trip</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="p-1">
                    <Star
                      className={`w-7 h-7 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={submitRating}
              disabled={!rating}
              className="w-full mt-5 h-12 bg-[#111827] hover:bg-black text-white rounded-2xl font-semibold"
            >
              Submit & book another
            </Button>
          </div>
        )}

        {/* CANCELLED */}
        {phase === 'cancelled' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <X className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-gray-900">Ride cancelled</h2>
            <p className="text-sm text-gray-500 mt-1">No charge was applied.</p>
            <Button onClick={resetToSetup} className="w-full mt-5 h-12 bg-[#111827] hover:bg-black text-white rounded-2xl font-semibold">
              Book another ride
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
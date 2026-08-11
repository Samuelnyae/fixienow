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
import RideSafetyPanel from '@/components/ride/RideSafetyPanel';
import SavedLocations from '@/components/ride/SavedLocations';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ShieldCheck, Calendar, Clock, Zap, History, BellRing } from 'lucide-react';
import { sendRideNotification, requestNotificationPermission } from '@/lib/rideNotifications';
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
  nearestDriverFromList,
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
  const [safeRide, setSafeRide] = useState(false);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [bookingType, setBookingType] = useState('instant'); // instant | scheduled
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [rideAlert, setRideAlert] = useState(null); // { kind, title, message }

  const timers = useRef([]);
  const nearbyFiredRef = useRef(false);
  const arrivedFiredRef = useRef(false);
  const completedFiredRef = useRef(false);

  // Realistic urban speeds (km/h) per ride type, plus a demo acceleration
  // factor so trips are watchable while still scaling with real distance.
  const SPEED_KMH = { cab: 35, bodaboda: 30, truck: 25 };
  const DEMO_ACCEL = 30;
  const speedKmH = SPEED_KMH[rideType] || 35;

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

  // Live distance + ETA from the driver's current position to the active target.
  const distToTarget =
    phase === 'in_progress' && driverPos && destCoords ? haversineKm(driverPos, destCoords) :
    phase === 'assigned' && driverPos && pickupCoords ? haversineKm(driverPos, pickupCoords) : 0;
  const liveEtaMin = Math.max(1, Math.round((distToTarget / speedKmH) * 60));

  // Move the driver marker toward its target at a constant (accelerated) speed
  // so travel time scales with real distance instead of fixed timers.
  useEffect(() => {
    if (!['assigned', 'in_progress'].includes(phase)) return;
    const target = phase === 'in_progress' ? destCoords : pickupCoords;
    if (!target) return;
    const TICK_MS = 400;
    const degPerTick = ((speedKmH / 3600) * DEMO_ACCEL * (TICK_MS / 1000)) / 111;
    const id = setInterval(() => {
      setDriverPos((prev) => {
        if (!prev) return prev;
        const dLat = target.lat - prev.lat;
        const dLng = target.lng - prev.lng;
        const distDeg = Math.hypot(dLat, dLng);
        if (distDeg <= degPerTick) return { lat: target.lat, lng: target.lng };
        const r = degPerTick / distDeg;
        return { lat: prev.lat + dLat * r, lng: prev.lng + dLng * r };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [phase, pickupCoords, destCoords, speedKmH]);

  // Drive phase transitions off the driver's actual position, not fixed timers.
  useEffect(() => {
    if (!driverPos || !ride) return;
    if (phase === 'assigned' && pickupCoords) {
      const d = haversineKm(driverPos, pickupCoords);
      if (d < 0.3 && !nearbyFiredRef.current) {
        nearbyFiredRef.current = true;
        setRideAlert({
          kind: 'nearby',
          title: `${driver?.name} is nearby`,
          message: 'Your driver is almost at your pickup location. Get ready to head out.',
        });
        sendRideNotification({ user, ride, driver, kind: 'nearby' });
      }
      if (d < 0.1 && !arrivedFiredRef.current) {
        arrivedFiredRef.current = true;
        (async () => {
          try {
            const ip = await base44.entities.Ride.update(ride.id, { status: 'in_progress' });
            setRide(ip);
          } catch {}
          setPhase('in_progress');
          setRideAlert({
            kind: 'arrived',
            title: `${driver?.name} has arrived`,
            message: 'Your driver is at your pickup location. Please head out to meet them.',
          });
          sendRideNotification({ user, ride, driver, kind: 'arrived' });
        })();
      }
    } else if (phase === 'in_progress' && destCoords) {
      const d = haversineKm(driverPos, destCoords);
      if (d < 0.1 && !completedFiredRef.current) {
        completedFiredRef.current = true;
        (async () => {
          try {
            const comp = await base44.entities.Ride.update(ride.id, {
              status: 'completed',
              final_fare: fare,
              payment_status: 'paid',
            });
            setRide(comp);
          } catch {}
          setPhase('completed');
        })();
      }
    }
  }, [driverPos, phase, pickupCoords, destCoords, ride, driver, user, fare]);

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

  // Quick-fill destination from a saved location
  const pickSavedDestination = (loc) => {
    if (!loc) return;
    setDestAddr(loc.address);
    setDestCoords(loc.lat && loc.lng ? { lat: loc.lat, lng: loc.lng } : (resolveCoords(loc.address) || fallbackCoords(loc.address)));
  };

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const isScheduled = bookingType === 'scheduled';

  const requestRide = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (!pickupCoords || !destCoords) {
      setError('Please set both pickup and destination.');
      return;
    }
    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      setError('Please choose a date and time for your scheduled ride.');
      return;
    }
    setError('');
    setSubmitting(true);
    setRideAlert(null);
    requestNotificationPermission();

    // Scheduled ride: book it for later — no live dispatch yet.
    if (isScheduled) {
      try {
        const newRide = await base44.entities.Ride.create({
          user_id: user.id,
          user_name: user.full_name,
          user_phone: user.phone,
          ride_type: rideType,
          booking_type: 'scheduled',
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          pickup: { address: pickupAddr, lat: pickupCoords.lat, lng: pickupCoords.lng },
          destination: { address: destAddr, lat: destCoords.lat, lng: destCoords.lng },
          distance_km: +distanceKm.toFixed(2),
          duration_min: durationMin,
          estimated_fare: fare,
          payment_method: 'cash',
          status: 'scheduled',
          booked_via: 'app',
          safe_ride: safeRide,
          emergency_contact_name: safeRide ? emergencyName.trim() : '',
          emergency_contact_phone: safeRide ? emergencyPhone.trim() : '',
        });
        setRide(newRide);
        setDriver(null);
        setDriverPos(null);
        setPhase('scheduled');
        base44.analytics.track({ eventName: 'ride_scheduled', properties: { ride_type: rideType, fare, when: `${scheduledDate} ${scheduledTime}` } });
      } catch (e) {
        setError(e.message || 'Could not schedule your ride. Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      nearbyFiredRef.current = false;
      arrivedFiredRef.current = false;
      completedFiredRef.current = false;
      // Prefer a real, available, verified driver; fall back to the simulated fleet
      let drv = null;
      try {
        const liveDrivers = await base44.entities.Driver.filter(
          { vehicle_type: rideType, verification_status: 'approved', is_available: true },
          '-rating', 50
        );
        drv = nearestDriverFromList(liveDrivers, pickupCoords) || liveDrivers[0] || null;
      } catch (e) { /* Driver entity unavailable — use simulated fleet */ }
      if (!drv) drv = pickDriver(rideType);

      const shareToken = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) + Date.now().toString(36);
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
        safe_ride: safeRide,
        emergency_contact_name: safeRide ? emergencyName.trim() : '',
        emergency_contact_phone: safeRide ? emergencyPhone.trim() : '',
        share_token: safeRide ? shareToken : '',
      });
      setRide(newRide);
      setDriver(drv);
      setDriverPos(null);
      setPhase('searching');
      base44.analytics.track({ eventName: 'ride_requested', properties: { ride_type: rideType, fare } });

      // searching -> assigned: driver is matched and placed ~1.5km from pickup,
      // then drives in at a realistic speed (distance-driven, not a fixed timer).
      timers.current.push(
        setTimeout(async () => {
          const bearing = Math.random() * 2 * Math.PI;
          const offsetDeg = 1.5 / 111;
          const startPos = {
            lat: pickupCoords.lat + Math.cos(bearing) * offsetDeg,
            lng: pickupCoords.lng + Math.sin(bearing) * offsetDeg,
          };
          const assigned = await base44.entities.Ride.update(newRide.id, {
            status: 'assigned',
            driver_id: drv.id,
            driver_name: drv.name,
            driver_phone: drv.phone,
            vehicle_model: drv.vehicle_model,
            vehicle_plate: drv.vehicle_plate,
          });
          setRide(assigned);
          setDriverPos(startPos);
          setPhase('assigned');
        }, 2500)
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
    nearbyFiredRef.current = false;
    arrivedFiredRef.current = false;
    completedFiredRef.current = false;
    setPhase('cancelled');
    setRide(null);
    setDriver(null);
    setDriverPos(null);
    setRideAlert(null);
  };

  const submitRating = async () => {
    if (!ride || !rating) return;
    try {
      await base44.entities.Ride.update(ride.id, { rating });
    } catch {}
    nearbyFiredRef.current = false;
    arrivedFiredRef.current = false;
    completedFiredRef.current = false;
    setPhase('setup');
    setRide(null);
    setRating(0);
    setPickupAddr('');
    setDestAddr('');
    setPickupCoords(null);
    setDestCoords(null);
  };

  const resetToSetup = () => {
    nearbyFiredRef.current = false;
    arrivedFiredRef.current = false;
    completedFiredRef.current = false;
    setPhase('setup');
    setRide(null);
    setRating(0);
    setScheduledDate('');
    setScheduledTime('');
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
          <Link to="/RideHistory" className="ml-auto flex items-center gap-1.5 text-sm font-medium text-[#0B463C] hover:underline">
            <History className="w-4 h-4" /> History
          </Link>
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
        {/* Driver proximity alert */}
        {rideAlert && (
          <div
            className={`rounded-2xl border p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
              rideAlert.kind === 'arrived'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                rideAlert.kind === 'arrived' ? 'bg-emerald-600' : 'bg-amber-500'
              } text-white`}
            >
              {rideAlert.kind === 'arrived' ? <MapPin className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${rideAlert.kind === 'arrived' ? 'text-emerald-900' : 'text-amber-900'}`}>
                {rideAlert.title}
              </p>
              <p className={`text-xs mt-0.5 ${rideAlert.kind === 'arrived' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {rideAlert.message}
              </p>
            </div>
            <button
              onClick={() => setRideAlert(null)}
              className="text-gray-400 hover:text-gray-700 flex-shrink-0"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SETUP */}
        {phase === 'setup' && (
          <>
            {/* Ride now / Schedule toggle */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex">
              <button
                onClick={() => setBookingType('instant')}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-colors ${
                  bookingType === 'instant' ? 'bg-[#0B463C] text-white' : 'text-gray-500'
                }`}
              >
                <Zap className="w-4 h-4" /> Ride now
              </button>
              <button
                onClick={() => setBookingType('scheduled')}
                className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-colors ${
                  bookingType === 'scheduled' ? 'bg-[#0B463C] text-white' : 'text-gray-500'
                }`}
              >
                <Calendar className="w-4 h-4" /> Schedule
              </button>
            </div>

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

            {/* Saved locations + schedule picker */}
            {user && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <SavedLocations
                  userId={user.id}
                  onPick={pickSavedDestination}
                  draft={destCoords ? { address: destAddr, lat: destCoords.lat, lng: destCoords.lng } : null}
                />
                {bookingType === 'scheduled' && (
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B463C]/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B463C]/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* Women Safe Ride */}
            <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4">
              <button
                onClick={() => setSafeRide((v) => !v)}
                className="flex items-center gap-3 w-full text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Women Safe Ride</p>
                  <p className="text-xs text-gray-500">Verified driver · share live trip · one-tap SOS</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors ${safeRide ? 'bg-pink-600' : 'bg-gray-200'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${safeRide ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>
              {safeRide && (
                <div className="mt-4 pt-4 border-t border-pink-100 space-y-3">
                  <p className="text-xs text-pink-700">
                    Add a trusted contact who can follow your trip live and be alerted if you trigger SOS.
                  </p>
                  <input
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Emergency contact name"
                    className="w-full h-11 px-3 rounded-xl bg-pink-50 border border-pink-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <input
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Emergency contact phone (e.g. 0712 345 678)"
                    className="w-full h-11 px-3 rounded-xl bg-pink-50 border border-pink-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700 border border-red-100">{error}</div>
            )}

            <Button
              onClick={requestRide}
              disabled={submitting || !pickupCoords || !destCoords || (isScheduled && (!scheduledDate || !scheduledTime))}
              className="w-full h-13 py-3.5 bg-[#111827] hover:bg-black text-white rounded-2xl text-base font-semibold disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {isScheduled ? 'Scheduling...' : 'Requesting...'}
                </>
              ) : isScheduled ? (
                <>Schedule {selectedType.label} · {scheduledDate && scheduledTime ? `${scheduledDate} ${scheduledTime}` : 'pick time'}</>
              ) : (
                <>Request {selectedType.label} · KES {fare ? fare.toLocaleString() : '—'}</>
              )}
            </Button>
            <p className="text-center text-xs text-gray-400">
              By requesting, you agree to Fixie's ride terms. Pay by cash, M-Pesa or wallet after the trip.
            </p>
          </>
        )}

        {/* SCHEDULED */}
        {phase === 'scheduled' && ride && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#0B463C]/10 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-[#0B463C]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Ride scheduled</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your {selectedType.label} is booked for <span className="font-medium text-gray-700">{scheduledDate} at {scheduledTime}</span>
            </p>
            <div className="bg-gray-50 rounded-2xl p-4 mt-4 text-left space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#0B463C]" /><span className="text-gray-600">{ride.pickup?.address || pickupAddr}</span></div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-[#111827]" /><span className="text-gray-600">{ride.destination?.address || destAddr}</span></div>
              <div className="flex items-center justify-between border-t pt-2 mt-2">
                <span className="text-gray-500">Est. fare</span>
                <span className="font-semibold text-[#0B463C]">KES {(ride.estimated_fare || fare).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">We'll match you with a nearby driver closer to your pickup time.</p>
            <Button onClick={resetToSetup} className="w-full mt-5 h-12 bg-[#111827] hover:bg-black text-white rounded-2xl font-semibold">
              Done
            </Button>
          </div>
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
                <span className="font-semibold">{driver.name}</span> is on the way · arriving in ~{liveEtaMin} min · {distToTarget.toFixed(1)} km away
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
            {ride?.safe_ride && <RideSafetyPanel ride={ride} onUpdate={(r) => setRide(r)} />}
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
                <p className="font-semibold">~{liveEtaMin} min · {distToTarget.toFixed(1)} km</p>
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
            {ride?.safe_ride && <RideSafetyPanel ride={ride} onUpdate={(r) => setRide(r)} />}
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
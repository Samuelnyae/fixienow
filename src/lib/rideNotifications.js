import { base44 } from '@/api/base44Client';

/**
 * Ask the browser for permission to show desktop notifications.
 * Safe to call repeatedly; no-ops if unsupported or already decided.
 */
export async function requestNotificationPermission() {
  try {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Send a ride lifecycle alert to the customer.
 * - kind: 'nearby' (driver approaching pickup) | 'arrived' (driver at pickup)
 * - Persists a Notification record so it surfaces in the app's notification bell.
 * - Fires a native browser notification when permission is granted.
 */
export async function sendRideNotification({ user, ride, driver, kind }) {
  if (!user?.id) return;
  const driverName = driver?.name || ride?.driver_name || 'Your driver';
  const vehicle = [driver?.vehicle_model || ride?.vehicle_model, driver?.vehicle_plate || ride?.vehicle_plate]
    .filter(Boolean)
    .join(' · ');
  const rideLabel = ride?.ride_type === 'bodaboda' ? 'boda boda' : ride?.ride_type || 'ride';

  const presets = {
    nearby: {
      title: `${driverName} is nearby`,
      message: `Your ${rideLabel} driver is approaching your pickup location${vehicle ? ' · ' + vehicle : ''}.`,
      type: 'booking_accepted',
    },
    arrived: {
      title: `${driverName} has arrived`,
      message: `Your driver is at your pickup location. Please head out to meet them${vehicle ? ' · ' + vehicle : ''}.`,
      type: 'booking_started',
    },
  };
  const preset = presets[kind];
  if (!preset) return;

  // 1. Persist so it appears in the in-app notification bell
  try {
    await base44.entities.Notification.create({
      user_id: user.id,
      type: preset.type,
      title: preset.title,
      message: preset.message,
      booking_id: ride?.id,
      metadata: { technician_name: driverName, amount: ride?.estimated_fare },
    });
  } catch {
    /* Notification entity unavailable — browser alert still fires below */
  }

  // 2. Native browser notification
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(preset.title, {
        body: preset.message,
        tag: `ride-${ride?.id || 'x'}-${kind}`,
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  } catch {
    /* ignore — silent fail */
  }
}
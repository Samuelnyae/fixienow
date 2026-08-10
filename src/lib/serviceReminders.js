import { base44 } from '@/api/base44Client';

// Reminder windows: fire a notification this far before the scheduled service time.
export const REMINDER_WINDOWS = [
  { key: '1h', msBefore: 60 * 60 * 1000, title: '⏰ Service in 1 hour' },
  { key: '15m', msBefore: 15 * 60 * 1000, title: '⏰ Technician arriving in 15 minutes' },
];

// Bookings still considered "upcoming" (not yet done or cancelled).
const UPCOMING_STATUSES = ['pending', 'accepted', 'en_route'];

function categoryLabel(category) {
  return (category || '').replace(/_/g, ' ').toLowerCase();
}

// Build the scheduled service moment as a UTC Date from scheduled_date (YYYY-MM-DD)
// and scheduled_time (HH:mm). Users are on UTC, so we treat the slot as UTC.
export function getServiceDateTime(booking) {
  if (!booking || !booking.scheduled_date) return null;
  const time = (booking.scheduled_time || '00:00').slice(0, 5);
  const iso = `${booking.scheduled_date}T${time}:00.000Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

/**
 * Scans the given user's upcoming scheduled bookings and creates in-app
 * `booking_reminder` notifications for any window that has come due (and not
 * already sent). Safe to call repeatedly — dedupes per booking + window.
 * Returns the number of new notifications created.
 */
export async function processServiceReminders(user) {
  if (!user || !user.id) return { created: 0, checked: 0 };

  const bookings = await base44.entities.Booking.filter({
    user_id: user.id,
    booking_type: 'scheduled',
  }, '-scheduled_date', 200);

  const now = Date.now();
  const upcoming = bookings.filter((b) => {
    if (!UPCOMING_STATUSES.includes(b.status)) return false;
    const ts = getServiceDateTime(b);
    return ts && ts.getTime() > now;
  });
  if (!upcoming.length) return { created: 0, checked: 0 };

  const existing = await base44.entities.Notification.filter({
    user_id: user.id,
    type: 'booking_reminder',
  }, '-created_date', 200);
  const seen = new Set(
    existing.map((n) => `${n.booking_id}::${n.metadata && n.metadata.reminder_window}`)
  );

  let created = 0;
  for (const b of upcoming) {
    const serviceDate = getServiceDateTime(b);
    const serviceTs = serviceDate.getTime();
    const tName = b.technician_name || 'Your technician';
    const svc = categoryLabel(b.category);
    const timeStr = formatTime(serviceDate);

    for (const w of REMINDER_WINDOWS) {
      const triggerAt = serviceTs - w.msBefore;
      if (now < triggerAt || now >= serviceTs) continue;

      const dedupeKey = `${b.id}::${w.key}`;
      if (seen.has(dedupeKey)) continue;

      const message =
        w.key === '1h'
          ? `${tName} arrives at ${timeStr} for your ${svc} service. Please be ready and available.`
          : `${tName} is on the way for your ${svc} service. Please have the work area ready.`;

      await base44.entities.Notification.create({
        user_id: user.id,
        type: 'booking_reminder',
        title: w.title,
        message,
        booking_id: b.id,
        is_read: false,
        metadata: { category: b.category, technician_name: tName, reminder_window: w.key },
      });

      seen.add(dedupeKey);
      created += 1;
    }
  }

  return { created, checked: upcoming.length };
}
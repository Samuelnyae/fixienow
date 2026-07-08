import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Limits how many bookings a user can create within a rolling time window
const MAX_BOOKINGS_PER_HOUR = 5;
const MAX_BOOKINGS_PER_DAY = 15;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_id } = await req.json();
    const targetUserId = user_id || user.id;

    // Only allow checking your own rate limit (admins can check others)
    if (targetUserId !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Cannot check rate limit for another user' }, { status: 403 });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch the user's recent bookings (service role to see all regardless of RLS)
    const recentBookings = await base44.asServiceRole.entities.Booking.filter({ user_id: targetUserId });

    const bookingsLastHour = recentBookings.filter((b) => new Date(b.created_date) > oneHourAgo).length;
    const bookingsLastDay = recentBookings.filter((b) => new Date(b.created_date) > oneDayAgo).length;

    const hourlyExceeded = bookingsLastHour >= MAX_BOOKINGS_PER_HOUR;
    const dailyExceeded = bookingsLastDay >= MAX_BOOKINGS_PER_DAY;

    return Response.json({
      success: true,
      can_book: !hourlyExceeded && !dailyExceeded,
      bookings_last_hour: bookingsLastHour,
      bookings_last_day: bookingsLastDay,
      limits: { per_hour: MAX_BOOKINGS_PER_HOUR, per_day: MAX_BOOKINGS_PER_DAY },
      reason: hourlyExceeded
        ? `You've reached the maximum of ${MAX_BOOKINGS_PER_HOUR} bookings per hour. Please try again later.`
        : dailyExceeded
        ? `You've reached the maximum of ${MAX_BOOKINGS_PER_DAY} bookings per day. Please try again tomorrow.`
        : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
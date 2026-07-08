import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Allowed status transitions per action
const TRANSITIONS = {
  accept: { from: 'pending', to: 'accepted' },
  decline: { from: 'pending', to: 'cancelled' },
  en_route: { from: 'accepted', to: 'en_route' },
  start_work: { from: 'en_route', to: 'in_progress' },
  complete: { from: 'in_progress', to: 'completed' },
};

const NOTIFICATIONS = {
  accept: { type: 'booking_accepted', title: 'Booking Accepted' },
  decline: { type: 'booking_cancelled', title: 'Booking Declined' },
  en_route: { type: 'booking_started', title: 'Technician En Route' },
  start_work: { type: 'booking_started', title: 'Work Started' },
  complete: { type: 'booking_completed', title: 'Service Completed' },
};

const prettyCategory = (cat) => (cat || '').replace(/_/g, ' ');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id, action, final_price } = await req.json();
    if (!booking_id || !action) {
      return Response.json({ error: 'booking_id and action are required' }, { status: 400 });
    }
    const transition = TRANSITIONS[action];
    if (!transition) {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Load the booking (service role — technicians act on bookings assigned to them)
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Verify the acting user is the technician assigned to this booking
    const techs = await base44.asServiceRole.entities.Technician.filter({ user_id: user.id });
    const technician = techs[0];
    if (!technician) return Response.json({ error: 'You are not registered as a technician' }, { status: 403 });
    if (booking.technician_id !== technician.id) {
      return Response.json({ error: 'This booking is not assigned to you' }, { status: 403 });
    }

    // Enforce valid status transition
    if (booking.status !== transition.from) {
      return Response.json({
        error: `Cannot ${action} a booking that is "${booking.status}" (expected "${transition.from}")`,
        current_status: booking.status,
      }, { status: 409 });
    }

    // Apply the status change
    const update = { status: transition.to };
    if (action === 'complete') {
      const price = parseFloat(final_price);
      if (!price || price <= 0) {
        return Response.json({ error: 'A valid final_price is required to complete' }, { status: 400 });
      }
      update.final_price = price;
    }
    await base44.asServiceRole.entities.Booking.update(booking.id, update);

    // Analytics
    base44.analytics && base44.analytics.track && base44.analytics.track({
      eventName: action === 'complete' ? 'booking_completed' : `booking_${action}`,
      properties: { category: booking.category, action },
    });

    // On complete: update technician stats
    if (action === 'complete') {
      await base44.asServiceRole.entities.Technician.update(technician.id, {
        total_jobs: (technician.total_jobs || 0) + 1,
        wallet_balance: (technician.wallet_balance || 0) + update.final_price,
      });
    }

    // Notify the customer
    const notif = NOTIFICATIONS[action];
    const messages = {
      accept: `${technician.name || 'A technician'} has accepted your ${prettyCategory(booking.category)} service request`,
      decline: `Your ${prettyCategory(booking.category)} service request was declined. We'll find another technician.`,
      en_route: `${technician.name || 'Your technician'} is on the way to your location`,
      start_work: `${technician.name || 'Your technician'} has started working on your ${prettyCategory(booking.category)} service`,
      complete: `Your ${prettyCategory(booking.category)} service has been completed. Total: KES ${(update.final_price || booking.estimated_price || 0).toLocaleString()}`,
    };
    await base44.asServiceRole.entities.Notification.create({
      user_id: booking.user_id,
      type: notif.type,
      title: notif.title,
      message: messages[action],
      booking_id: booking.id,
      metadata: {
        category: booking.category,
        technician_name: technician.name,
        amount: action === 'complete' ? update.final_price : booking.estimated_price,
      },
    });

    return Response.json({
      success: true,
      booking_id: booking.id,
      status: transition.to,
      final_price: update.final_price,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
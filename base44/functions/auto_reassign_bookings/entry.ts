import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const prettyCategory = (cat) => (cat || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

// Bookings pending longer than this (in minutes) get auto-reassigned or cancelled
const STALE_THRESHOLD_MINUTES = 15;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - STALE_THRESHOLD_MINUTES * 60 * 1000);

    // Fetch all pending bookings (service role — admin operation)
    const pendingBookings = await base44.asServiceRole.entities.Booking.filter({
      status: 'pending',
    });

    const staleBookings = pendingBookings.filter((b) => {
      const created = new Date(b.created_date);
      return created < cutoff;
    });

    const results = {
      checked: pendingBookings.length,
      stale: staleBookings.length,
      reassigned: 0,
      cancelled: 0,
      details: [],
    };

    for (const booking of staleBookings) {
      const areaName = booking.location?.area;
      const category = booking.category;
      const oldTechId = booking.technician_id;

      // Find alternative approved technicians in the same area who weren't the original
      const candidates = await base44.asServiceRole.entities.Technician.filter({
        profession: category,
        verification_status: 'approved',
        is_available: true,
      });

      const alternatives = candidates.filter(
        (t) => t.id !== oldTechId && (t.service_areas || []).includes(areaName)
      );

      if (alternatives.length > 0) {
        // Pick the highest-rated alternative
        const newTech = alternatives.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

        await base44.asServiceRole.entities.Booking.update(booking.id, {
          technician_id: newTech.id,
          technician_name: newTech.name,
        });

        // Notify the new technician
        if (newTech.user_id) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: newTech.user_id,
            type: 'booking_new',
            title: 'New Job Request',
            message: `New ${prettyCategory(category)} service request from ${booking.user_name || 'a customer'} in ${areaName || 'your area'}`,
            booking_id: booking.id,
            metadata: { category, amount: booking.estimated_price },
          });
        }

        // Notify the customer about reassignment
        await base44.asServiceRole.entities.Notification.create({
          user_id: booking.user_id,
          type: 'booking_accepted',
          title: 'Technician Update',
          message: `We've reassigned your ${prettyCategory(category)} request to ${newTech.name} (rated ${newTech.rating || 0}★). They'll respond shortly.`,
          booking_id: booking.id,
          metadata: { category, technician_name: newTech.name },
        });

        results.reassigned++;
        results.details.push({ booking_id: booking.id, action: 'reassigned', new_tech: newTech.name });
      } else {
        // No alternatives — cancel the booking
        await base44.asServiceRole.entities.Booking.update(booking.id, { status: 'cancelled' });

        await base44.asServiceRole.entities.Notification.create({
          user_id: booking.user_id,
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: `We couldn't find an available technician for your ${prettyCategory(category)} request. Please try again later or choose a different area.`,
          booking_id: booking.id,
          metadata: { category },
        });

        results.cancelled++;
        results.details.push({ booking_id: booking.id, action: 'cancelled' });
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const prettyCategory = (cat) => (cat || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { dispute_id, resolution_type, resolution_notes, refund_amount } = await req.json();
    if (!dispute_id || !resolution_type) {
      return Response.json({ error: 'dispute_id and resolution_type are required' }, { status: 400 });
    }

    const validTypes = ['refund', 'partial_refund', 'rework', 'no_action', 'other'];
    if (!validTypes.includes(resolution_type)) {
      return Response.json({ error: `resolution_type must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    // Load the dispute
    const disputes = await base44.asServiceRole.entities.Dispute.filter({ id: dispute_id });
    const dispute = disputes[0];
    if (!dispute) return Response.json({ error: 'Dispute not found' }, { status: 404 });
    if (dispute.status === 'resolved' || dispute.status === 'dismissed') {
      return Response.json({ error: 'This dispute has already been resolved' }, { status: 409 });
    }

    // Load the related booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: dispute.booking_id });
    const booking = bookings[0];

    // Update the dispute
    await base44.asServiceRole.entities.Dispute.update(dispute.id, {
      status: resolution_type === 'no_action' ? 'dismissed' : 'resolved',
      resolution: resolution_notes || '',
      resolution_type,
      refund_amount: ['refund', 'partial_refund'].includes(resolution_type) ? refund_amount : 0,
      assigned_admin_id: user.id,
      resolved_at: new Date().toISOString(),
    });

    // Handle refund — create a Refund record (actual M-Pesa reversal would be a separate call)
    if (['refund', 'partial_refund'].includes(resolution_type) && refund_amount > 0) {
      // Find the original payment
      const payments = await base44.asServiceRole.entities.Payment.filter({
        booking_id: dispute.booking_id,
        status: 'completed',
      });
      const payment = payments[0];

      await base44.asServiceRole.entities.Refund.create({
        booking_id: dispute.booking_id,
        payment_id: payment?.id || '',
        user_id: dispute.raised_by_id,
        technician_id: booking?.technician_id || '',
        amount: refund_amount,
        reason: resolution_notes || `Dispute resolution: ${resolution_type}`,
        status: 'pending',
        refund_method: payment?.method || 'mpesa',
        approved_by_id: user.id,
        approved_at: new Date().toISOString(),
      });

      // Mark booking payment as refunded if full refund
      if (booking && resolution_type === 'refund') {
        await base44.asServiceRole.entities.Booking.update(booking.id, { payment_status: 'refunded' });
        if (payment) {
          await base44.asServiceRole.entities.Payment.update(payment.id, { status: 'refunded' });
        }
      }
    }

    // Notify the person who raised the dispute
    const resolutionMessages = {
      refund: `Your dispute has been resolved with a full refund of KES ${refund_amount?.toLocaleString() || 0}.`,
      partial_refund: `Your dispute has been resolved with a partial refund of KES ${refund_amount?.toLocaleString() || 0}.`,
      rework: `Your dispute has been resolved — the technician will return to redo the work.`,
      no_action: `Your dispute has been reviewed and dismissed. ${resolution_notes || ''}`,
      other: `Your dispute has been resolved. ${resolution_notes || ''}`,
    };

    await base44.asServiceRole.entities.Notification.create({
      user_id: dispute.raised_by_id,
      type: 'booking_completed',
      title: 'Dispute Resolved',
      message: resolutionMessages[resolution_type],
      booking_id: dispute.booking_id,
      metadata: { category: booking?.category },
    });

    // Notify the other party (technician if raised by user, user if raised by technician)
    let otherPartyId = null;
    if (dispute.raised_by_role === 'user' && booking?.technician_id) {
      const techs = await base44.asServiceRole.entities.Technician.filter({ id: booking.technician_id });
      otherPartyId = techs[0]?.user_id;
    } else if (dispute.raised_by_role === 'technician') {
      otherPartyId = booking?.user_id;
    }

    if (otherPartyId) {
      await base44.asServiceRole.entities.Notification.create({
        user_id: otherPartyId,
        type: 'booking_completed',
        title: 'Dispute Resolved',
        message: `A dispute on booking #${dispute.booking_id.slice(-6)} has been resolved. ${resolutionNotes || ''}`,
        booking_id: dispute.booking_id,
      });
    }

    return Response.json({
      success: true,
      dispute_id: dispute.id,
      status: resolution_type === 'no_action' ? 'dismissed' : 'resolved',
      refund_amount: ['refund', 'partial_refund'].includes(resolution_type) ? refund_amount : 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
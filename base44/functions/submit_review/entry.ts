import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id, rating, comment } = await req.json();
    if (!booking_id) return Response.json({ error: 'booking_id is required' }, { status: 400 });
    const numericRating = parseInt(rating, 10);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return Response.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
    }

    // Load the booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Only the booking owner can review
    if (booking.user_id !== user.id) {
      return Response.json({ error: 'You can only review your own booking' }, { status: 403 });
    }
    // Booking must be completed
    if (booking.status !== 'completed') {
      return Response.json({ error: 'You can only review completed bookings' }, { status: 400 });
    }
    // Prevent duplicate reviews
    const existing = await base44.asServiceRole.entities.Review.filter({ booking_id });
    if (existing.length > 0) {
      return Response.json({ error: 'A review already exists for this booking' }, { status: 409 });
    }

    // Create the review
    const review = await base44.asServiceRole.entities.Review.create({
      booking_id,
      user_id: user.id,
      user_name: user.full_name || '',
      technician_id: booking.technician_id,
      rating: numericRating,
      comment: comment || '',
    });

    // Recalculate technician rating
    if (booking.technician_id) {
      const techs = await base44.asServiceRole.entities.Technician.filter({ id: booking.technician_id });
      const technician = techs[0];
      if (technician) {
        const prevTotal = technician.total_reviews || 0;
        const prevRating = technician.rating || 0;
        const newTotal = prevTotal + 1;
        const newRating = (prevRating * prevTotal + numericRating) / newTotal;
        await base44.asServiceRole.entities.Technician.update(technician.id, {
          rating: Math.round(newRating * 10) / 10,
          total_reviews: newTotal,
        });

        // Notify the technician
        if (technician.user_id) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: technician.user_id,
            type: 'review_received',
            title: 'New Review',
            message: `You received a ${numericRating}-star review from ${user.full_name || 'a customer'}`,
            booking_id,
            metadata: { rating: numericRating },
          });
        }
      }
    }

    return Response.json({ success: true, review_id: review.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const prettyCategory = (cat) => (cat || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id, method, currency } = await req.json();
    if (!booking_id) return Response.json({ error: 'booking_id is required' }, { status: 400 });

    const paymentMethod = method || 'mpesa';
    const txnCurrency = currency || 'KES';

    // Load the booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Only the booking owner can pay
    if (booking.user_id !== user.id) {
      return Response.json({ error: 'You can only pay for your own booking' }, { status: 403 });
    }
    // Must be completed and not already paid
    if (booking.status !== 'completed') {
      return Response.json({ error: 'Booking must be completed before payment' }, { status: 400 });
    }
    if (booking.payment_status === 'paid') {
      return Response.json({ error: 'This booking is already paid' }, { status: 409 });
    }

    // Prevent duplicate payment records for the same booking
    const existing = await base44.asServiceRole.entities.Payment.filter({ booking_id, status: 'completed' });
    if (existing.length > 0) {
      return Response.json({ error: 'A completed payment already exists for this booking' }, { status: 409 });
    }

    const amount = booking.final_price || booking.estimated_price || 0;
    const receiptNo = `RCP-${booking.id.slice(-8).toUpperCase()}`;

    // 1. Create the payment record
    await base44.asServiceRole.entities.Payment.create({
      booking_id: booking.id,
      user_id: user.id,
      technician_id: booking.technician_id || '',
      amount,
      method: paymentMethod,
      status: 'completed',
    });

    // 2. Settle into wallets (customer → technician)
    const userWallets = await base44.asServiceRole.entities.Wallet.filter({ user_id: booking.user_id });
    let technicianUserId = booking.technician_id;
    // Resolve technician's user_id for their wallet
    if (booking.technician_id) {
      const techs = await base44.asServiceRole.entities.Technician.filter({ id: booking.technician_id });
      if (techs[0]) technicianUserId = techs[0].user_id;
    }
    const techWallets = technicianUserId
      ? await base44.asServiceRole.entities.Wallet.filter({ user_id: technicianUserId })
      : [];

    if (userWallets[0] && techWallets[0]) {
      const userWallet = userWallets[0];
      const techWallet = techWallets[0];

      await base44.asServiceRole.entities.Transaction.create({
        transaction_id: `tx_${Date.now()}_${booking.id.slice(-6)}`,
        from_wallet_id: userWallet.id,
        to_wallet_id: techWallet.id,
        from_address: userWallet.wallet_address || '',
        to_address: techWallet.wallet_address || '',
        amount,
        currency: txnCurrency,
        transaction_type: 'booking_payment',
        status: 'completed',
        payment_method: paymentMethod,
        description: `Payment for ${prettyCategory(booking.category)} service`,
        metadata: { booking_id: booking.id },
      });

      // Credit technician wallet
      const balances = [...(techWallet.balances || [])];
      const kesIndex = balances.findIndex((b) => b.currency === txnCurrency);
      if (kesIndex !== -1) {
        balances[kesIndex] = { ...balances[kesIndex], amount: balances[kesIndex].amount + amount };
      } else {
        balances.push({ currency: txnCurrency, amount, currency_symbol: txnCurrency === 'KES' ? 'KSh' : '' });
      }
      await base44.asServiceRole.entities.Wallet.update(techWallet.id, {
        balances,
        total_received: (techWallet.total_received || 0) + amount,
      });
    }

    // 3. Mark booking paid
    await base44.asServiceRole.entities.Booking.update(booking.id, { payment_status: 'paid' });

    // 4. In-app notification (receipt)
    await base44.asServiceRole.entities.Notification.create({
      user_id: booking.user_id,
      type: 'payment_received',
      title: 'Payment Confirmed ✓',
      message: `Your payment of ${txnCurrency} ${amount.toLocaleString()} for ${prettyCategory(booking.category)} service has been confirmed. Receipt: ${receiptNo}`,
      booking_id: booking.id,
      metadata: { amount, category: booking.category },
    });

    // 5. Email receipt
    if (user.email) {
      const receiptDate = new Date().toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' });
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `Payment Receipt – ${txnCurrency} ${amount.toLocaleString()} | Fixie`,
        body: [
          `Hi ${user.full_name || 'there'},`,
          '',
          'Your payment has been confirmed. Here is your receipt:',
          '',
          '──────────────────────────────',
          '         FIXIE DIGITAL RECEIPT',
          '──────────────────────────────',
          `Receipt No:     ${receiptNo}`,
          `Date:           ${receiptDate}`,
          '',
          `Service:        ${prettyCategory(booking.category)} Service`,
          `Technician:     ${booking.technician_name || 'N/A'}`,
          `Location:       ${booking.location?.address || 'N/A'}`,
          `Payment Method: ${paymentMethod}`,
          '',
          '──────────────────────────────',
          `Total Paid:     ${txnCurrency} ${amount.toLocaleString()}`,
          '──────────────────────────────',
          '',
          'Thank you for using Fixie!',
          '',
          '– The Fixie Team',
        ].join('\n'),
      });
    }

    return Response.json({
      success: true,
      receipt_no: receiptNo,
      amount,
      currency: txnCurrency,
      method: paymentMethod,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
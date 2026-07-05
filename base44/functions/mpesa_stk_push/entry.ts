import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // GET = M-Pesa callback (no user auth — called by Safaricom)
    if (req.method === 'GET') {
      return Response.json({ error: 'Use POST' }, { status: 405 });
    }

    // POST callback from Safaricom (no Authorization header from user)
    const authHeader = req.headers.get('authorization') || '';
    const isCallback = !authHeader.startsWith('Bearer');

    if (isCallback) {
      const body = await req.json();
      const callback = body?.Body?.stkCallback;
      if (!callback) {
        return Response.json({ error: 'Invalid callback body' }, { status: 400 });
      }

      const checkoutRequestId = callback.CheckoutRequestID;
      const resultCode = callback.ResultCode;
      const resultDesc = callback.ResultDesc;

      // Find the pending payment by checkout_request_id
      const payments = await base44.asServiceRole.entities.Payment.filter({
        mpesa_transaction_code: checkoutRequestId,
      });
      const payment = payments[0];

      if (!payment) {
        return Response.json({ error: 'Payment not found for callback' }, { status: 404 });
      }

      if (resultCode === 0) {
        // Success — extract M-Pesa code from callback metadata
        let mpesaCode = '';
        const items = callback?.CallbackMetadata?.Item || [];
        const mpesaItem = items.find((i) => i.Name === 'MpesaReceiptNumber');
        if (mpesaItem) mpesaCode = mpesaItem.Value;

        await base44.asServiceRole.entities.Payment.update(payment.id, {
          status: 'completed',
          mpesa_transaction_code: mpesaCode || checkoutRequestId,
        });

        // Mark the booking paid
        if (payment.booking_id) {
          await base44.asServiceRole.entities.Booking.update(payment.booking_id, {
            payment_status: 'paid',
          });
        }
      } else {
        // Failed / cancelled
        await base44.asServiceRole.entities.Payment.update(payment.id, {
          status: 'failed',
        });
      }

      return Response.json({ success: true });
    }

    // ===== STK Push initiation (user-authenticated) =====
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id, phone, amount } = await req.json();

    if (!booking_id || !phone || !amount) {
      return Response.json({ error: 'booking_id, phone and amount are required' }, { status: 400 });
    }

    // Validate the booking exists and belongs to the user
    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.user_id && booking.user_id !== user.id) {
      return Response.json({ error: 'Not your booking' }, { status: 403 });
    }

    // Read M-Pesa secrets
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const shortcode = Deno.env.get('MPESA_SHORTCODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');
    const env = Deno.env.get('MPESA_ENV') || 'sandbox';
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL');

    if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
      return Response.json({ error: 'M-Pesa credentials are not configured' }, { status: 500 });
    }

    const baseUrl = BASE_URLS[env] || BASE_URLS.sandbox;

    // 1. Get OAuth access token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` },
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return Response.json({ error: 'Failed to get M-Pesa access token', tokenData }, { status: 502 });
    }

    // 2. Build password = base64(shortcode + passkey + timestamp)
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // Normalize phone: 07XX → 2547XX
    let normalizedPhone = phone.replace(/\s/g, '');
    if (normalizedPhone.startsWith('07')) {
      normalizedPhone = '254' + normalizedPhone.slice(1);
    } else if (normalizedPhone.startsWith('+254')) {
      normalizedPhone = normalizedPhone.slice(1);
    } else if (normalizedPhone.startsWith('254')) {
      // already correct
    } else {
      return Response.json({ error: 'Phone number must be a valid Kenyan number (07XX or +2547XX)' }, { status: 400 });
    }

    // 3. Create a Payment record (pending)
    const payment = await base44.asServiceRole.entities.Payment.create({
      booking_id,
      user_id: user.id,
      technician_id: booking.technician_id || '',
      amount,
      method: 'mpesa',
      status: 'pending',
      mpesa_phone: normalizedPhone,
      mpesa_transaction_code: '', // will hold CheckoutRequestID until callback
    });

    // 4. Trigger STK Push
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `Fixie ${booking_id.slice(-6)}`,
        TransactionDesc: `Payment for booking ${booking_id}`,
      }),
    });
    const stkData = await stkRes.json();

    if (stkData.errorCode || !stkData.CheckoutRequestID) {
      await base44.asServiceRole.entities.Payment.update(payment.id, { status: 'failed' });
      return Response.json({ error: stkData.errorMessage || 'STK Push failed', stkData }, { status: 502 });
    }

    // Store the CheckoutRequestID so the callback can find this payment
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      mpesa_transaction_code: stkData.CheckoutRequestID,
    });

    return Response.json({
      success: true,
      payment_id: payment.id,
      checkout_request_id: stkData.CheckoutRequestID,
      customer_message: stkData.CustomerMessage,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
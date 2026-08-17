import { base44 } from '@/api/base44Client';

/**
 * Settle a completed ride: mark it completed + paid and credit the driver's
 * wallet. Idempotent — it re-reads the ride first and does nothing if it is
 * already completed/paid, so it is safe to call from both the customer-side
 * auto-complete (OrderRide) and the driver dashboard's "Complete Trip".
 *
 * This mirrors the booking payment fallback: record the fare, credit the
 * provider, mark paid. Drivers use the Driver.wallet_balance earnings ledger
 * (same field the DriverDashboard reads).
 */
export async function settleRidePayment({ ride, driver, fare }) {
  if (!ride?.id) return { skipped: true };

  // Re-read to avoid double-settling if the other path already completed it.
  let current = ride;
  try {
    const fresh = await base44.entities.Ride.filter({ id: ride.id });
    if (fresh[0]) current = fresh[0];
  } catch (_) {}

  if (current.status === 'completed' && current.payment_status === 'paid') {
    return { alreadySettled: true, ride: current };
  }

  const amount = fare ?? current.final_fare ?? current.estimated_fare ?? 0;

  const updated = await base44.entities.Ride.update(ride.id, {
    status: 'completed',
    final_fare: amount,
    payment_status: 'paid',
  });

  // Credit the driver's earnings wallet + bump trip count (real drivers only).
  if (driver?.id) {
    try {
      const drivers = await base44.entities.Driver.filter({ id: driver.id });
      const d = drivers[0];
      if (d) {
        await base44.entities.Driver.update(driver.id, {
          total_trips: (d.total_trips || 0) + 1,
          wallet_balance: (d.wallet_balance || 0) + amount,
        });
      }
    } catch (_) { /* simulated driver or unavailable — skip crediting */ }
  }

  return { settled: true, amount, ride: updated };
}
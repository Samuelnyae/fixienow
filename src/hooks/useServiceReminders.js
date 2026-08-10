import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { processServiceReminders } from '@/lib/serviceReminders';

/**
 * Runs the service-reminder scan when `user` is present and re-runs it every
 * 60 seconds while the app is open, so upcoming scheduled bookings generate
 * their 1h and 15m in-app notifications. No-op for guests.
 */
export function useServiceReminders(user) {
  const qc = useQueryClient();
  const running = useRef(false);

  useEffect(() => {
    if (!user || !user.id) return;

    const run = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const res = await processServiceReminders(user);
        if (res.created > 0) {
          qc.invalidateQueries({ queryKey: ['unreadNotifications', user.id] });
          qc.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      } catch (_) {
        // reminder scan is best-effort; never break the app
      } finally {
        running.current = false;
      }
    };

    run();
    const id = setInterval(run, 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
}
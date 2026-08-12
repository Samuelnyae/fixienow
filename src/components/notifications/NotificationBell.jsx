import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playNotificationSound, requestNotificationPermission, showSystemNotification } from '@/lib/notificationSound';

export default function NotificationBell({ userId }) {
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadNotifications', userId],
    queryFn: async () => {
      const notifications = await base44.entities.Notification.filter(
        { user_id: userId, is_read: false },
        '-created_date',
        100
      );
      return notifications.length;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Play a chime + fire a system notification when a new unread notification arrives.
  const prevCountRef = useRef(0);
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevCountRef.current = unreadCount;
      return;
    }
    if (unreadCount > prevCountRef.current) {
      playNotificationSound();
      showSystemNotification('Fixie', 'You have a new notification');
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // Request browser notification permission on the first bell tap.
  const handleBellClick = () => {
    requestNotificationPermission();
  };

  return (
    <Link to={createPageUrl('NotificationCenter')} onClick={handleBellClick}>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
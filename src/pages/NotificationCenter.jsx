import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationItem from '../components/notifications/NotificationItem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function NotificationCenter() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => base44.entities.Notification.filter(
      { user_id: user.id },
      '-created_date',
      100
    ),
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(
        unread.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        notifications.map(n => base44.entities.Notification.delete(n.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifications']);
    },
  });

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  if (isLoading) {
    return <LoadingSpinner text="Loading notifications..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to={createPageUrl('Home')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                {unreadNotifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete all notifications?')) {
                      deleteAllMutation.mutate();
                    }
                  }}
                  disabled={deleteAllMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadNotifications.length > 0 
              ? `${unreadNotifications.length} unread notification${unreadNotifications.length > 1 ? 's' : ''}`
              : 'You\'re all caught up!'}
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="read">
              Read ({readNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                />
              ))
            ) : (
              <EmptyState
                icon={BellOff}
                title="No notifications yet"
                description="You'll see notifications here when there's activity on your bookings"
              />
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-3">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                />
              ))
            ) : (
              <EmptyState
                icon={BellOff}
                title="No unread notifications"
                description="You're all caught up!"
              />
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-3">
            {readNotifications.length > 0 ? (
              readNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                />
              ))
            ) : (
              <EmptyState
                icon={BellOff}
                title="No read notifications"
                description="Read notifications will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
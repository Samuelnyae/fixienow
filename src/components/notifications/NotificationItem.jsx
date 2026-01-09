import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { formatDistanceToNow } from 'date-fns';
import { 
  Calendar, 
  CheckCircle2, 
  Play, 
  XCircle, 
  CreditCard,
  Star,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  booking_new: Calendar,
  booking_accepted: CheckCircle2,
  booking_started: Play,
  booking_completed: CheckCircle2,
  booking_cancelled: XCircle,
  payment_received: CreditCard,
  review_received: Star,
};

const colorMap = {
  booking_new: 'bg-blue-100 text-blue-600',
  booking_accepted: 'bg-green-100 text-green-600',
  booking_started: 'bg-purple-100 text-purple-600',
  booking_completed: 'bg-teal-100 text-teal-600',
  booking_cancelled: 'bg-red-100 text-red-600',
  payment_received: 'bg-amber-100 text-amber-600',
  review_received: 'bg-pink-100 text-pink-600',
};

export default function NotificationItem({ notification, onMarkRead }) {
  const Icon = iconMap[notification.type] || Bell;
  const colorClass = colorMap[notification.type] || 'bg-gray-100 text-gray-600';

  const content = (
    <div 
      className={cn(
        "flex gap-4 p-4 rounded-xl transition-colors cursor-pointer",
        notification.is_read 
          ? "bg-white hover:bg-gray-50" 
          : "bg-teal-50 hover:bg-teal-100 border-l-4 border-teal-500"
      )}
      onClick={() => !notification.is_read && onMarkRead(notification.id)}
    >
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-gray-900">{notification.title}</h4>
          {!notification.is_read && (
            <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-2" />
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
        </p>
      </div>
    </div>
  );

  if (notification.booking_id) {
    return (
      <Link to={createPageUrl('BookingDetail') + `?id=${notification.booking_id}`}>
        {content}
      </Link>
    );
  }

  return content;
}
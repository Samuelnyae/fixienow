import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';
import { 
  MapPin, 
  Clock, 
  Phone,
  ChevronRight,
  Wrench, 
  Droplets, 
  Zap, 
  Hammer, 
  Paintbrush, 
  Wind, 
  Refrigerator, 
  Key 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const iconMap = {
  mechanic: Wrench,
  plumber: Droplets,
  electrician: Zap,
  carpenter: Hammer,
  painter: Paintbrush,
  hvac: Wind,
  appliance_repair: Refrigerator,
  locksmith: Key,
};

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-700' },
  en_route: { label: 'En Route', color: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export default function BookingCard({ booking, showTechnician = true }) {
  const Icon = iconMap[booking.category] || Wrench;
  const status = statusConfig[booking.status] || statusConfig.pending;

  return (
    <Link 
      to={createPageUrl(`BookingDetail?id=${booking.id}`)}
      className="block"
    >
      <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-teal-100 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 capitalize">
                {booking.category?.replace('_', ' ')} Service
              </h3>
              <p className="text-sm text-gray-500">
                #{booking.id?.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {booking.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          {booking.location?.address && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[150px]">{booking.location.address}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>
              {booking.scheduled_date 
                ? format(new Date(booking.scheduled_date), 'MMM d')
                : format(new Date(booking.created_date), 'MMM d')}
            </span>
          </div>
        </div>

        {showTechnician && booking.technician_name && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                  {booking.technician_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{booking.technician_name}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        )}

        {booking.estimated_price && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
            <span className="text-sm text-gray-500">Estimated</span>
            <span className="font-semibold text-teal-600">
              KES {booking.estimated_price?.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
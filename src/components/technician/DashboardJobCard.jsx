import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';
import {
  MapPin, Clock, ChevronRight,
  Wrench, Droplets, Zap, Hammer, Paintbrush, Wind, Refrigerator, Key
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const iconMap = {
  mechanic: Wrench, plumber: Droplets, electrician: Zap, carpenter: Hammer,
  painter: Paintbrush, hvac: Wind, appliance_repair: Refrigerator, locksmith: Key,
};

const statusConfig = {
  pending:     { label: 'New Request', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  accepted:    { label: 'Accepted',    color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400' },
  en_route:    { label: 'En Route',    color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-400' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700',  dot: 'bg-green-400' },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700',      dot: 'bg-red-400' },
};

export default function DashboardJobCard({ job, onAccept, onDecline, isLoading }) {
  const Icon = iconMap[job.category] || Wrench;
  const status = statusConfig[job.status] || statusConfig.pending;
  const price = job.final_price || job.estimated_price;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-teal-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 capitalize truncate">
              {job.category?.replace('_', ' ')} Service
            </h3>
            <Badge className={`shrink-0 ${status.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5 inline-block`} />
              {status.label}
            </Badge>
          </div>

          <p className="text-sm text-gray-500 line-clamp-1 mb-2">{job.description}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            {job.location?.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location.address}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {job.booking_type === 'scheduled' && job.scheduled_date
                ? `${format(new Date(job.scheduled_date), 'MMM d')} at ${job.scheduled_time}`
                : format(new Date(job.created_date), 'MMM d, h:mm a')}
            </span>
            {price && (
              <span className="font-semibold text-teal-600">
                KES {price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {job.status === 'pending' ? (
              <>
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 h-8 text-xs"
                  onClick={() => onAccept(job)}
                  disabled={isLoading}
                >
                  Accept Job
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDecline(job)}
                  disabled={isLoading}
                >
                  Decline
                </Button>
              </>
            ) : (
              <Link
                to={`${createPageUrl('TechnicianJobs')}?id=${job.id}`}
                className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                View Details
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
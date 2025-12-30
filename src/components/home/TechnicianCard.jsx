import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Star, MapPin, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function TechnicianCard({ technician }) {
  const professionLabels = {
    mechanic: 'Mechanic',
    plumber: 'Plumber',
    electrician: 'Electrician',
    carpenter: 'Carpenter',
    painter: 'Painter',
    hvac: 'HVAC Technician',
    appliance_repair: 'Appliance Repair',
    locksmith: 'Locksmith',
  };

  return (
    <Link 
      to={createPageUrl(`TechnicianDetail?id=${technician.id}`)}
      className="block"
    >
      <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg hover:border-teal-100 transition-all duration-300">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 ring-2 ring-teal-50">
            <AvatarImage src={technician.profile_photo} />
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-lg">
              {technician.name?.[0] || 'T'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{technician.name}</h3>
              {technician.verification_status === 'approved' && (
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              )}
            </div>
            
            <p className="text-sm text-gray-500 mt-0.5">
              {professionLabels[technician.profession] || technician.profession}
            </p>
            
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{technician.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-xs text-gray-400">({technician.total_reviews || 0})</span>
              </div>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">{technician.total_jobs || 0} jobs</span>
            </div>

            {technician.location?.address && (
              <div className="flex items-center gap-1 mt-2 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="text-xs truncate">{technician.location.address}</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-teal-600">
              KES {technician.hourly_rate?.toLocaleString() || '500'}
            </p>
            <p className="text-xs text-gray-400">/hour</p>
            {technician.is_available && (
              <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-100">
                Available
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
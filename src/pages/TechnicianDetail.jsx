import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  Briefcase,
  Calendar,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function TechnicianDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const techId = urlParams.get('id');

  const { data: technician, isLoading } = useQuery({
    queryKey: ['technician', techId],
    queryFn: async () => {
      const techs = await base44.entities.Technician.filter({ id: techId });
      return techs[0];
    },
    enabled: !!techId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['technicianReviews', techId],
    queryFn: () => base44.entities.Review.filter({ technician_id: techId }, '-created_date', 20),
    enabled: !!techId,
  });

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

  if (isLoading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (!technician) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Technician not found</h2>
          <Button asChild variant="outline">
            <Link to={createPageUrl('Services')}>Browse Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link 
            to={createPageUrl('Services')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Services
          </Link>

          <div className="flex flex-col md:flex-row items-start gap-6 pb-8">
            <Avatar className="w-28 h-28 ring-4 ring-white/20">
              <AvatarImage src={technician.profile_photo} />
              <AvatarFallback className="bg-white text-teal-600 text-3xl font-bold">
                {technician.name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{technician.name}</h1>
                {technician.verification_status === 'approved' && (
                  <Badge className="bg-white/20 text-white border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <p className="text-teal-100 text-lg mb-4">
                {professionLabels[technician.profession] || technician.profession}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-medium text-white">{technician.rating?.toFixed(1) || '0.0'}</span>
                  <span>({technician.total_reviews || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{technician.total_jobs || 0} jobs completed</span>
                </div>
                {technician.years_experience && (
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    <span>{technician.years_experience} years experience</span>
                  </div>
                )}
              </div>

              {technician.location?.address && (
                <div className="flex items-center gap-1 mt-3 text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span>{technician.location.address}</span>
                </div>
              )}
            </div>

            <div className="w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold">KES {technician.hourly_rate?.toLocaleString() || '500'}</p>
                <p className="text-sm text-white/70 mb-4">per hour</p>
                <Button 
                  asChild
                  className="w-full bg-white text-teal-600 hover:bg-white/90 font-semibold"
                >
                  <Link to={createPageUrl(`BookService?technician=${technician.id}&category=${technician.profession}`)}>
                    Book Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full md:w-auto bg-white border mb-6">
            <TabsTrigger value="about" className="flex-1 md:flex-none">About</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 md:flex-none">
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Bio */}
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {technician.bio || `Professional ${professionLabels[technician.profession]?.toLowerCase() || 'technician'} with years of experience providing quality service to customers in the area.`}
                  </p>
                </div>

                {/* Service Areas */}
                {technician.service_areas?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Service Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {technician.service_areas.map((area, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100">
                          <MapPin className="w-3 h-3 mr-1" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Response Time</span>
                      <span className="font-medium">~15 mins</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Completion Rate</span>
                      <span className="font-medium">98%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Availability</span>
                      {technician.is_available ? (
                        <Badge className="bg-green-100 text-green-700">Available</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">Busy</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {technician.is_available && (
                  <Button 
                    asChild
                    className="w-full bg-teal-600 hover:bg-teal-700 h-12"
                  >
                    <Link to={createPageUrl(`BookService?technician=${technician.id}&category=${technician.profession}`)}>
                      <Calendar className="w-5 h-5 mr-2" />
                      Book Appointment
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="bg-white rounded-2xl p-6">
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-teal-100 text-teal-700">
                              {review.user_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{review.user_name || 'Customer'}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(review.created_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating 
                                  ? 'text-amber-400 fill-amber-400' 
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 ml-13">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">No reviews yet</h3>
                  <p className="text-gray-500 text-sm">Be the first to review this technician</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
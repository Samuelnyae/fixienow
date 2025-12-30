import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  Star,
  CheckCircle2,
  XCircle,
  Navigation,
  CreditCard,
  Loader2,
  Wrench, 
  Droplets, 
  Zap, 
  Hammer, 
  Paintbrush, 
  Wind, 
  Refrigerator, 
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', desc: 'Waiting for technician' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-700', desc: 'Technician confirmed' },
  en_route: { label: 'En Route', color: 'bg-purple-100 text-purple-700', desc: 'Technician on the way' },
  in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700', desc: 'Work in progress' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', desc: 'Job completed' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', desc: 'Booking cancelled' },
};

export default function BookingDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [showPayment, setShowPayment] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ id: bookingId });
      return bookings[0];
    },
    enabled: !!bookingId,
  });

  const { data: technician } = useQuery({
    queryKey: ['bookingTechnician', booking?.technician_id],
    queryFn: async () => {
      const techs = await base44.entities.Technician.filter({ id: booking.technician_id });
      return techs[0];
    },
    enabled: !!booking?.technician_id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => base44.entities.Booking.update(bookingId, { status: 'cancelled' }),
    onSuccess: () => queryClient.invalidateQueries(['booking', bookingId]),
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Review.create({
        booking_id: bookingId,
        technician_id: booking.technician_id,
        rating,
        comment: reviewComment,
      });
      
      // Update technician rating
      if (technician) {
        const newTotal = (technician.total_reviews || 0) + 1;
        const newRating = ((technician.rating || 0) * (technician.total_reviews || 0) + rating) / newTotal;
        await base44.entities.Technician.update(technician.id, {
          rating: newRating,
          total_reviews: newTotal,
        });
      }
    },
    onSuccess: () => {
      setShowReview(false);
      queryClient.invalidateQueries(['booking', bookingId]);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Payment.create({
        booking_id: bookingId,
        user_id: booking.user_id,
        technician_id: booking.technician_id,
        amount: booking.final_price || booking.estimated_price,
        method: 'mpesa',
        mpesa_phone: mpesaPhone,
        status: 'completed',
      });
      await base44.entities.Booking.update(bookingId, { payment_status: 'paid' });
    },
    onSuccess: () => {
      setShowPayment(false);
      queryClient.invalidateQueries(['booking', bookingId]);
    },
  });

  if (isLoading) {
    return <LoadingSpinner text="Loading booking..." />;
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Booking not found</h2>
          <Button asChild variant="outline">
            <Link to={createPageUrl('MyBookings')}>View All Bookings</Link>
          </Button>
        </div>
      </div>
    );
  }

  const Icon = iconMap[booking.category] || Wrench;
  const status = statusConfig[booking.status] || statusConfig.pending;
  const canCancel = ['pending', 'accepted'].includes(booking.status);
  const canPay = booking.status === 'completed' && booking.payment_status !== 'paid';
  const canReview = booking.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link 
            to={createPageUrl('MyBookings')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Bookings
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status Banner */}
        <div className={`rounded-2xl p-4 ${status.color.replace('text-', 'bg-').replace('700', '50')}`}>
          <div className="flex items-center justify-between">
            <div>
              <Badge className={status.color}>{status.label}</Badge>
              <p className="mt-1 text-sm text-gray-600">{status.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Booking ID</p>
              <p className="font-mono text-sm">#{booking.id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-start gap-4 pb-4 border-b">
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
              <Icon className="w-7 h-7 text-gray-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold capitalize">
                {booking.category?.replace('_', ' ')} Service
              </h2>
              <p className="text-gray-500 mt-1">{booking.description}</p>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{booking.location?.address || 'Address not specified'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>
                {booking.booking_type === 'instant' 
                  ? `Created ${format(new Date(booking.created_date), 'MMM d, yyyy')}`
                  : `Scheduled: ${format(new Date(booking.scheduled_date), 'MMM d, yyyy')} at ${booking.scheduled_time}`}
              </span>
            </div>
          </div>
        </div>

        {/* Technician Card */}
        {technician && (
          <div className="bg-white rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Your Technician</h3>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={technician.profile_photo} />
                <AvatarFallback className="bg-teal-100 text-teal-700 text-xl">
                  {technician.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{technician.name}</p>
                  {technician.verification_status === 'approved' && (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm">{technician.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-sm text-gray-400">({technician.total_reviews || 0} reviews)</span>
                </div>
              </div>
            </div>

            {['accepted', 'en_route', 'in_progress'].includes(booking.status) && (
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Price Summary */}
        <div className="bg-white rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Payment</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Service Fee</span>
              <span>KES {(booking.final_price || booking.estimated_price)?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t font-semibold">
              <span>Total</span>
              <span className="text-teal-600">
                KES {(booking.final_price || booking.estimated_price)?.toLocaleString()}
              </span>
            </div>
            {booking.payment_status === 'paid' && (
              <Badge className="bg-green-100 text-green-700 mt-2">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Paid
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {canPay && (
            <Button 
              onClick={() => setShowPayment(true)}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay Now
            </Button>
          )}

          {canReview && (
            <Button 
              onClick={() => setShowReview(true)}
              variant="outline"
              className="w-full h-12"
            >
              <Star className="w-5 h-5 mr-2" />
              Leave Review
            </Button>
          )}

          {canCancel && (
            <Button 
              onClick={() => cancelMutation.mutate()}
              variant="ghost"
              className="w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-5 h-5 mr-2" />
              )}
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with M-Pesa</DialogTitle>
            <DialogDescription>
              Enter your phone number to receive the payment prompt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <input
                type="tel"
                placeholder="254700000000"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full h-12 px-4 border rounded-xl"
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">
                  KES {(booking?.final_price || booking?.estimated_price)?.toLocaleString()}
                </span>
              </div>
            </div>
            <Button 
              onClick={() => paymentMutation.mutate()}
              className="w-full h-12 bg-green-600 hover:bg-green-700"
              disabled={!mpesaPhone || paymentMutation.isPending}
            >
              {paymentMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Send Payment Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${
                      star <= rating 
                        ? 'text-amber-400 fill-amber-400' 
                        : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Share your experience (optional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={() => submitReviewMutation.mutate()}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700"
              disabled={submitReviewMutation.isPending}
            >
              {submitReviewMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
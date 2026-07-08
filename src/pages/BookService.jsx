import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle2,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const categoryLabels = {
  mechanic: 'Mechanic',
  plumber: 'Plumber',
  electrician: 'Electrician',
  carpenter: 'Carpenter',
  painter: 'Painter',
  hvac: 'HVAC',
  appliance_repair: 'Appliance Repair',
  locksmith: 'Locksmith',
};

const basePrices = {
  mechanic: 500,
  plumber: 400,
  electrician: 450,
  carpenter: 600,
  painter: 350,
  hvac: 800,
  appliance_repair: 500,
  locksmith: 300,
};

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function BookService() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedTechId = urlParams.get('technician');
  const preselectedCategory = urlParams.get('category');

  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    category: preselectedCategory || '',
    description: '',
    booking_type: 'instant',
    scheduled_date: null,
    scheduled_time: '',
    address: '',
    service_area: '',
    technician_id: preselectedTechId || '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData.default_address?.address) {
          setFormData(prev => ({ ...prev, address: userData.default_address.address }));
        }
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const { data: selectedTechnician } = useQuery({
    queryKey: ['technician', preselectedTechId],
    queryFn: async () => {
      if (!preselectedTechId) return null;
      const techs = await base44.entities.Technician.filter({ id: preselectedTechId });
      return techs[0];
    },
    enabled: !!preselectedTechId,
  });

  const { data: allCategoryTechnicians = [] } = useQuery({
    queryKey: ['availableTechs', formData.category],
    queryFn: async () => {
      if (!formData.category) return [];
      return base44.entities.Technician.filter({
        profession: formData.category,
        verification_status: 'approved',
        is_available: true
      }, '-rating', 20);
    },
    enabled: !!formData.category && !preselectedTechId,
  });

  const { data: serviceAreas = [] } = useQuery({
    queryKey: ['activeServiceAreas'],
    queryFn: () => base44.entities.ServiceArea.filter({ is_active: true }, 'name', 100),
  });

  // Filter technicians to those covering the selected service area
  const availableTechnicians = formData.service_area
    ? allCategoryTechnicians.filter(t => (t.service_areas || []).includes(formData.service_area))
    : allCategoryTechnicians;

  // AI dispatch: pick best technician using AI reasoning
  const { data: aiDispatchResult } = useQuery({
    queryKey: ['aiDispatch', formData.category, formData.address, availableTechnicians.map(t => t.id).join(',')],
    queryFn: async () => {
      if (availableTechnicians.length === 0) return null;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a smart job dispatcher for a home services platform.

A customer needs a service and you must select the single BEST technician from the list below.

Customer request:
- Service needed: ${formData.category}
- Location: ${formData.address || 'not specified'}
- Description: ${formData.description || 'not provided'}

Available technicians:
${availableTechnicians.map((t, i) => `${i + 1}. ID: ${t.id}, Name: ${t.name}, Rating: ${t.rating || 0}/5, Reviews: ${t.total_reviews || 0}, Experience: ${t.years_experience || 0} years, Areas: ${(t.service_areas || []).join(', ')}`).join('\n')}

Select the BEST technician based on:
1. Rating (higher is better)
2. Number of reviews (more = more reliable)
3. Years of experience
4. Service area match with customer location

Return ONLY the id of the best technician and a brief reason.`,
        response_json_schema: {
          type: 'object',
          properties: {
            technician_id: { type: 'string' },
            reason: { type: 'string' }
          }
        }
      });
      return result;
    },
    enabled: availableTechnicians.length > 1 && !!formData.category && !!formData.description,
    staleTime: 1000 * 60 * 5,
  });

  const bestTechnicianId = aiDispatchResult?.technician_id || availableTechnicians[0]?.id;

  const [rateLimitError, setRateLimitError] = useState(null);

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      // Check rate limit before creating
      const rateCheck = await base44.functions.invoke('check_booking_rate_limit', {});
      if (rateCheck.data && !rateCheck.data.can_book) {
        throw new Error(rateCheck.data.reason || 'Rate limit exceeded. Please try again later.');
      }

      const booking = await base44.entities.Booking.create(bookingData);

      // Track analytics
      base44.analytics.track({
        eventName: 'booking_created',
        properties: {
          category: bookingData.category,
          booking_type: bookingData.booking_type,
          estimated_price: bookingData.estimated_price,
        },
      });

      // Create notification for technician if assigned
      if (bookingData.technician_id) {
        const techs = await base44.entities.Technician.filter({ id: bookingData.technician_id });
        if (techs.length > 0 && techs[0].user_id) {
          await base44.entities.Notification.create({
            user_id: techs[0].user_id,
            type: 'booking_new',
            title: 'New Job Request',
            message: `New ${categoryLabels[bookingData.category]} service request from ${bookingData.user_name}`,
            booking_id: booking.id,
            metadata: {
              category: bookingData.category,
              amount: bookingData.estimated_price
            }
          });
        }
      }

      return booking;
    },
    onSuccess: (booking) => {
      navigate(createPageUrl(`BookingDetail?id=${booking.id}`));
    },
    onError: (error) => {
      setRateLimitError(error.message || 'Something went wrong. Please try again.');
    },
  });

  const handleSubmit = async () => {
    const techId = formData.technician_id || bestTechnicianId;
    const tech = selectedTechnician || availableTechnicians.find(t => t.id === techId);
    
    const bookingData = {
      user_id: user.id,
      user_name: user.full_name,
      user_phone: user.phone,
      technician_id: techId,
      technician_name: tech?.name,
      category: formData.category,
      description: formData.description,
      booking_type: formData.booking_type,
      scheduled_date: formData.scheduled_date ? format(formData.scheduled_date, 'yyyy-MM-dd') : null,
      scheduled_time: formData.scheduled_time,
      location: { address: formData.address, area: formData.service_area },
      estimated_price: basePrices[formData.category] || 500,
      status: 'pending',
    };

    createBookingMutation.mutate(bookingData);
  };

  const estimatedPrice = basePrices[formData.category] || 500;
  const Icon = iconMap[formData.category] || Wrench;

  if (!user) {
    return <LoadingSpinner text="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link 
            to={createPageUrl('Services')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          
          <h1 className="text-2xl font-bold text-gray-900">Book a Service</h1>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Step 1: Service Details */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Selected Technician */}
            {selectedTechnician && (
              <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
                <p className="text-sm text-teal-700 mb-2">Booking with</p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedTechnician.profile_photo} />
                    <AvatarFallback className="bg-teal-600 text-white">
                      {selectedTechnician.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedTechnician.name}</p>
                    <p className="text-sm text-teal-600">
                      {categoryLabels[selectedTechnician.profession]}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Category Selection */}
            {!preselectedCategory && (
              <div>
                <Label className="text-base mb-3 block">What service do you need?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(categoryLabels).map(([slug, label]) => {
                    const CategoryIcon = iconMap[slug];
                    const isSelected = formData.category === slug;
                    return (
                      <button
                        key={slug}
                        onClick={() => setFormData({ ...formData, category: slug })}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected 
                            ? 'border-teal-600 bg-teal-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CategoryIcon className={`w-6 h-6 mb-2 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                        <p className={`font-medium ${isSelected ? 'text-teal-600' : 'text-gray-900'}`}>{label}</p>
                        <p className="text-sm text-gray-500">From KES {basePrices[slug]}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base mb-3 block">
                Describe the problem
              </Label>
              <Textarea
                id="description"
                placeholder="E.g., My kitchen sink is leaking under the cabinet..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[120px] resize-none"
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.category || !formData.description}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Scheduling */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="text-base mb-3 block">When do you need the service?</Label>
              <RadioGroup
                value={formData.booking_type}
                onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                className="grid grid-cols-2 gap-3"
              >
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.booking_type === 'instant' ? 'border-teal-600 bg-teal-50' : 'border-gray-200'
                }`}>
                  <RadioGroupItem value="instant" />
                  <div>
                    <p className="font-medium">Right Now</p>
                    <p className="text-sm text-gray-500">ASAP service</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.booking_type === 'scheduled' ? 'border-teal-600 bg-teal-50' : 'border-gray-200'
                }`}>
                  <RadioGroupItem value="scheduled" />
                  <div>
                    <p className="font-medium">Schedule</p>
                    <p className="text-sm text-gray-500">Pick a time</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {formData.booking_type === 'scheduled' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-12">
                        <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                        {formData.scheduled_date 
                          ? format(formData.scheduled_date, 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.scheduled_date}
                        onSelect={(date) => setFormData({ ...formData, scheduled_date: date })}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="mb-2 block">Select Time</Label>
                  <Select
                    value={formData.scheduled_time}
                    onValueChange={(value) => setFormData({ ...formData, scheduled_time: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Pick a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Service Area */}
            <div>
              <Label className="text-base mb-3 block">
                <MapPin className="w-4 h-4 inline mr-1" />
                Your Area
              </Label>
              <Select
                value={formData.service_area}
                onValueChange={(value) => setFormData({ ...formData, service_area: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select your area" />
                </SelectTrigger>
                <SelectContent>
                  {serviceAreas.map((area) => (
                    <SelectItem key={area.id} value={area.name}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.service_area && availableTechnicians.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  No technicians available in {formData.service_area} for this service. Try another area.
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address" className="text-base mb-3 block">
                <MapPin className="w-4 h-4 inline mr-1" />
                Detailed Address
              </Label>
              <Input
                id="address"
                placeholder="Enter your street address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-12"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.service_area || !formData.address || (formData.booking_type === 'scheduled' && (!formData.scheduled_date || !formData.scheduled_time))}
                className="flex-1 h-12 bg-teal-600 hover:bg-teal-700"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border">
              <h2 className="font-semibold text-lg mb-4">Booking Summary</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{categoryLabels[formData.category]} Service</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{formData.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500">When</span>
                  <span className="font-medium">
                    {formData.booking_type === 'instant' 
                      ? 'As soon as possible'
                      : `${format(formData.scheduled_date, 'MMM d, yyyy')} at ${formData.scheduled_time}`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500">Area</span>
                  <span className="font-medium">{formData.service_area}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500">Address</span>
                  <span className="font-medium text-right max-w-[200px] truncate">{formData.address}</span>
                </div>

                {(selectedTechnician || availableTechnicians.length > 0) && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-500">Technician</span>
                    <div className="text-right">
                      <p className="font-medium">
                        {selectedTechnician?.name || availableTechnicians.find(t => t.id === bestTechnicianId)?.name || 'Auto-assigned'}
                      </p>
                      {!preselectedTechId && aiDispatchResult?.reason && (
                        <p className="text-xs text-indigo-600 max-w-[180px]">✨ AI matched: {aiDispatchResult.reason}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-4 border-t mt-4">
                  <span className="text-lg font-semibold">Estimated Total</span>
                  <span className="text-2xl font-bold text-teal-600">
                    KES {estimatedPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
              <p>💡 Final price may vary based on the actual work required. You'll only pay after the job is completed.</p>
            </div>

            {rateLimitError && (
              <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700 border border-red-100">
                <p>{rateLimitError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createBookingMutation.isPending}
                className="flex-1 h-12 bg-teal-600 hover:bg-teal-700"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Upload,
  CheckCircle2,
  Loader2,
  FileText,
  User,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  DollarSign,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';


export default function TechnicianRegister() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profession: '',
    bio: '',
    years_experience: '',
    hourly_rate: '',
    service_areas: '',
    location: { address: '' },
  });
  const [idDocument, setIdDocument] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.full_name || '',
          email: userData.email || '',
        }));
      } catch (e) {
        // Continue without user
      }
    };
    loadUser();
  }, []);

  const registerMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      
      let idDocUrl = '';
      let certUrl = '';

      if (idDocument) {
        const result = await base44.integrations.Core.UploadFile({ file: idDocument });
        idDocUrl = result.file_url;
      }
      if (certificate) {
        const result = await base44.integrations.Core.UploadFile({ file: certificate });
        certUrl = result.file_url;
      }

      const techData = {
        user_id: user?.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        profession: formData.profession,
        bio: formData.bio,
        years_experience: parseInt(formData.years_experience) || 0,
        hourly_rate: parseInt(formData.hourly_rate) || 500,
        service_areas: formData.service_areas.split(',').map(s => s.trim()).filter(Boolean),
        location: formData.location,
        id_document_url: idDocUrl,
        certificate_url: certUrl,
        verification_status: 'pending',
        is_available: false,
      };

      const tech = await base44.entities.Technician.create(techData);

      // Update user type
      if (user) {
        await base44.auth.updateMe({ user_type: 'technician' });
      }

      return tech;
    },
    onSuccess: () => {
      setStep(4); // Success step
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === 'id') {
      setIdDocument(file);
    } else {
      setCertificate(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link 
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Join Fixie as a Technician
          </h1>
          <p className="text-gray-500">
            {step < 4 
              ? 'Complete your profile to start receiving job requests'
              : 'Your application has been submitted'}
          </p>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  s <= step ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Personal Information</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="254700000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="profession">Profession / Skill</Label>
                <Input
                  id="profession"
                  placeholder="e.g., Plumber, Electrician, Welder..."
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">About You</Label>
              <Textarea
                id="bio"
                placeholder="Tell customers about your experience and skills..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1 min-h-[100px]"
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.phone || !formData.profession}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Work Details */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Work Details</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rate">Hourly Rate (KES)</Label>
                <Input
                  id="rate"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="areas">Service Areas</Label>
              <Input
                id="areas"
                placeholder="e.g., Westlands, Kilimani, Lavington"
                value={formData.service_areas}
                onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">Separate areas with commas</p>
            </div>

            <div>
              <Label htmlFor="address">Your Location/Address</Label>
              <Input
                id="address"
                placeholder="Your base location"
                value={formData.location.address}
                onChange={(e) => setFormData({ ...formData, location: { address: e.target.value } })}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.hourly_rate}
                className="flex-1 h-12 bg-teal-600 hover:bg-teal-700"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Upload Documents</h2>
            <p className="text-gray-500 text-sm">
              Upload your ID and professional certificate for verification
            </p>

            <div className="space-y-4">
              <div>
                <Label>ID Document (National ID/Passport)</Label>
                <div className="mt-2 border-2 border-dashed rounded-xl p-6 text-center relative">
                  {idDocument ? (
                    <div className="flex items-center justify-center gap-2 text-teal-600 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">{idDocument.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Click to upload or drag and drop</p>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('id-upload').click();
                    }}
                  >
                    Select File
                  </Button>
                  <input
                    id="id-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'id')}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <Label>Professional Certificate (Optional)</Label>
                <div className="mt-2 border-2 border-dashed rounded-xl p-6 text-center relative">
                  {certificate ? (
                    <div className="flex items-center justify-center gap-2 text-teal-600 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">{certificate.name}</span>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Upload certification documents</p>
                    </>
                  )}
                  <Button 
                    variant="outline"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('cert-upload').click();
                    }}
                  >
                    Select File
                  </Button>
                  <input
                    id="cert-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'cert')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                Back
              </Button>
              <Button
                onClick={() => registerMutation.mutate()}
                disabled={!idDocument || registerMutation.isPending}
                className="flex-1 h-12 bg-teal-600 hover:bg-teal-700"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Thank you for applying to become a Fixie technician. Our team will review your application and documents within 24-48 hours.
            </p>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link to={createPageUrl('Home')}>Back to Home</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Upload, CheckCircle2, Loader2, FileText, Car, Bike, Truck, Phone, Mail, User, MapPin, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import TagInput from '@/components/common/TagInput';

const VEHICLE_TYPES = [
  { key: 'cab', label: 'Cab', desc: 'Car · up to 4 passengers', icon: Car },
  { key: 'bodaboda', label: 'Boda boda', desc: 'Motorbike · 1 passenger', icon: Bike },
  { key: 'truck', label: 'Truck', desc: 'Cargo & moving', icon: Truck },
];

export default function DriverRegister() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', bio: '', years_experience: '',
    vehicle_type: 'cab', vehicle_model: '', vehicle_plate: '', license_number: '',
    service_areas: [], location: { address: '' },
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setFormData((p) => ({ ...p, name: u.full_name || '', email: u.email || '' }));
    }).catch(() => {});
  }, []);

  const registerMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let licenseUrl = '';
      let insuranceUrl = '';
      // Uploads are optional — integration credits may be exhausted
      try {
        if (licenseFile) { const r = await base44.integrations.Core.UploadFile({ file: licenseFile }); licenseUrl = r.file_url; }
      } catch (e) { console.warn('License upload skipped:', e.message); }
      try {
        if (insuranceFile) { const r = await base44.integrations.Core.UploadFile({ file: insuranceFile }); insuranceUrl = r.file_url; }
      } catch (e) { console.warn('Insurance upload skipped:', e.message); }

      const driverData = {
        user_id: user?.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicle_type: formData.vehicle_type,
        vehicle_model: formData.vehicle_model,
        vehicle_plate: formData.vehicle_plate.toUpperCase(),
        license_number: formData.license_number,
        license_url: licenseUrl,
        insurance_url: insuranceUrl,
        bio: formData.bio,
        years_experience: parseInt(formData.years_experience) || 0,
        service_areas: formData.service_areas,
        location: formData.location,
        verification_status: 'pending',
        is_available: false,
      };
      await base44.entities.Driver.create(driverData);
      if (user) await base44.auth.updateMe({ user_type: 'driver' });
    },
    onSuccess: () => setStep(4),
    onSettled: () => setUploading(false),
  });

  const handleFile = (e, kind) => {
    if (kind === 'license') setLicenseFile(e.target.files[0]);
    else setInsuranceFile(e.target.files[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white pb-16">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" /> Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0B463C] to-[#197B6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Drive with Fixie</h1>
          <p className="text-gray-500">
            {step < 4 ? 'Register your vehicle to start receiving ride requests' : 'Your application has been submitted'}
          </p>
        </div>

        {step < 4 && (
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-[#0B463C]' : 'bg-gray-200'}`} />
            ))}
          </div>
        )}

        {/* Step 1: Personal */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input placeholder="254700000000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Years of Experience</Label>
                <Input type="number" placeholder="e.g. 3" value={formData.years_experience} onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>About You</Label>
              <Textarea placeholder="Tell us about your driving experience..." value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="mt-1 min-h-[90px]" />
            </div>
            <Button onClick={() => setStep(2)} disabled={!formData.name || !formData.phone} className="w-full h-12 bg-[#0B463C] hover:bg-[#0a3d34]">
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Vehicle */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Vehicle Details</h2>
            <div>
              <Label className="mb-2 block">Vehicle Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {VEHICLE_TYPES.map((v) => {
                  const Icon = v.icon;
                  const sel = formData.vehicle_type === v.key;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, vehicle_type: v.key })}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${sel ? 'border-[#0B463C] bg-[#0B463C]/5' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Icon className={`w-7 h-7 mx-auto mb-2 ${sel ? 'text-[#0B463C]' : 'text-gray-400'}`} />
                      <p className={`font-medium text-sm ${sel ? 'text-[#0B463C]' : 'text-gray-900'}`}>{v.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{v.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Vehicle Make & Model</Label>
                <Input placeholder="e.g. Toyota Vitz" value={formData.vehicle_model} onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Number Plate</Label>
                <Input placeholder="e.g. KDA 100A" value={formData.vehicle_plate} onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label>Driving License Number</Label>
                <Input placeholder="e.g. 1234567" value={formData.license_number} onChange={(e) => setFormData({ ...formData, license_number: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <TagInput
                label="Operating Areas"
                placeholder="Type an area and press Enter (e.g. Westlands, Kilimani)..."
                value={formData.service_areas}
                onChange={(areas) => setFormData({ ...formData, service_areas: areas })}
                suggestions={['Westlands', 'Kilimani', 'Lavington', 'Karen', 'Kasarani', 'Embakasi', 'CBD', 'South B', 'South C', 'Eastleigh', 'Langata']}
              />
            </div>
            <div>
              <Label>Base Location / Address</Label>
              <Input placeholder="Where you usually start from" value={formData.location.address} onChange={(e) => setFormData({ ...formData, location: { address: e.target.value } })} className="mt-1" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">Back</Button>
              <Button onClick={() => setStep(3)} disabled={!formData.vehicle_model || !formData.vehicle_plate} className="flex-1 h-12 bg-[#0B463C] hover:bg-[#0a3d34]">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-semibold">Documents</h2>
            <p className="text-gray-500 text-sm">
              Upload your driving license and vehicle insurance for verification. If uploads are unavailable right now, you can still submit — our team will request documents during review.
            </p>

            <div>
              <Label>Driving License</Label>
              <div className="mt-2 border-2 border-dashed rounded-xl p-6 text-center">
                {licenseFile ? (
                  <div className="flex items-center justify-center gap-2 text-teal-600 mb-2">
                    <CheckCircle2 className="w-5 h-5" /><span className="text-sm">{licenseFile.name}</span>
                  </div>
                ) : (
                  <><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-500 mb-2">Click to upload license</p></>
                )}
                <Button variant="outline" type="button" onClick={() => document.getElementById('lic-upload').click()}>Select File</Button>
                <input id="lic-upload" type="file" accept="image/*,.pdf" onChange={(e) => handleFile(e, 'license')} className="hidden" />
              </div>
            </div>

            <div>
              <Label>Vehicle Insurance</Label>
              <div className="mt-2 border-2 border-dashed rounded-xl p-6 text-center">
                {insuranceFile ? (
                  <div className="flex items-center justify-center gap-2 text-teal-600 mb-2">
                    <CheckCircle2 className="w-5 h-5" /><span className="text-sm">{insuranceFile.name}</span>
                  </div>
                ) : (
                  <><FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-500 mb-2">Click to upload insurance</p></>
                )}
                <Button variant="outline" type="button" onClick={() => document.getElementById('ins-upload').click()}>Select File</Button>
                <input id="ins-upload" type="file" accept="image/*,.pdf" onChange={(e) => handleFile(e, 'insurance')} className="hidden" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">Back</Button>
              <Button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending} className="flex-1 h-12 bg-[#0B463C] hover:bg-[#0a3d34]">
                {registerMutation.isPending ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>) : 'Submit Application'}
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
              Thank you for applying to drive with Fixie. Our team will review your application within 24-48 hours. Once approved, you can go online and start receiving ride requests.
            </p>
            <Button asChild className="bg-[#0B463C] hover:bg-[#0a3d34]">
              <Link to="/DriverDashboard">Go to Driver Dashboard</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
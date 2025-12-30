import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Star,
  Edit2,
  Camera,
  CheckCircle2,
  Clock,
  LogOut,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '../components/common/LoadingSpinner';

const professions = [
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'hvac', label: 'HVAC Technician' },
  { value: 'appliance_repair', label: 'Appliance Repair' },
  { value: 'locksmith', label: 'Locksmith' },
];

export default function TechnicianProfile() {
  const [user, setUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({});
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

  const { data: technician, isLoading } = useQuery({
    queryKey: ['myTechnician', user?.id],
    queryFn: async () => {
      const techs = await base44.entities.Technician.filter({ user_id: user.id });
      return techs[0];
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Technician.update(technician.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myTechnician']);
      setShowEditDialog(false);
    },
  });

  const handleEdit = () => {
    setEditForm({
      name: technician?.name || '',
      phone: technician?.phone || '',
      profession: technician?.profession || '',
      bio: technician?.bio || '',
      hourly_rate: technician?.hourly_rate?.toString() || '',
      years_experience: technician?.years_experience?.toString() || '',
      service_areas: technician?.service_areas?.join(', ') || '',
    });
    setShowEditDialog(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      name: editForm.name,
      phone: editForm.phone,
      profession: editForm.profession,
      bio: editForm.bio,
      hourly_rate: parseFloat(editForm.hourly_rate) || 500,
      years_experience: parseInt(editForm.years_experience) || 0,
      service_areas: editForm.service_areas.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const result = await base44.integrations.Core.UploadFile({ file });
      updateMutation.mutate({ profile_photo: result.file_url });
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  const professionLabel = professions.find(p => p.value === technician?.profession)?.label || technician?.profession;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 text-center relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4"
            onClick={handleEdit}
          >
            <Edit2 className="w-5 h-5" />
          </Button>

          <div className="relative inline-block">
            <Avatar className="w-24 h-24 ring-4 ring-teal-50">
              <AvatarImage src={technician?.profile_photo} />
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-2xl">
                {technician?.name?.[0] || 'T'}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-700 transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload}
              />
            </label>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <h1 className="text-xl font-bold text-gray-900">{technician?.name}</h1>
            {technician?.verification_status === 'approved' && (
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
            )}
          </div>
          <p className="text-gray-500">{professionLabel}</p>

          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold">{technician?.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="font-semibold">{technician?.total_jobs || 0}</p>
              <p className="text-xs text-gray-500">Jobs</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="font-semibold">{technician?.total_reviews || 0}</p>
              <p className="text-xs text-gray-500">Reviews</p>
            </div>
          </div>

          {technician?.verification_status === 'pending' && (
            <Badge className="mt-4 bg-amber-100 text-amber-700">
              <Clock className="w-3 h-3 mr-1" />
              Verification Pending
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Profile Details</h2>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{technician?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{technician?.phone || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Experience</p>
              <p className="font-medium">{technician?.years_experience || 0} years</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Service Areas</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {technician?.service_areas?.map((area, i) => (
                  <Badge key={i} variant="secondary">{area}</Badge>
                )) || <span className="text-gray-400">Not set</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {technician?.bio && (
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-semibold mb-3">About</h2>
            <p className="text-gray-600">{technician.bio}</p>
          </div>
        )}

        {/* Hourly Rate */}
        <div className="bg-teal-50 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-teal-700 font-medium">Hourly Rate</p>
            <p className="text-sm text-teal-600">Your service rate</p>
          </div>
          <p className="text-3xl font-bold text-teal-700">
            KES {technician?.hourly_rate?.toLocaleString() || 500}
          </p>
        </div>

        {/* Wallet Link */}
        <Link 
          to={createPageUrl('Wallet')}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-2 border-teal-100"
        >
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium">My Wallet</p>
            <p className="text-sm text-gray-500">Manage earnings & payments</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        {/* Logout */}
        <button 
          onClick={() => base44.auth.logout()}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-red-600 hover:bg-red-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-medium">Log Out</span>
        </button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Profession</Label>
              <Select
                value={editForm.profession}
                onValueChange={(value) => setEditForm({ ...editForm, profession: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {professions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>About</Label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hourly Rate (KES)</Label>
                <Input
                  type="number"
                  value={editForm.hourly_rate}
                  onChange={(e) => setEditForm({ ...editForm, hourly_rate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Years Experience</Label>
                <Input
                  type="number"
                  value={editForm.years_experience}
                  onChange={(e) => setEditForm({ ...editForm, years_experience: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Service Areas</Label>
              <Input
                value={editForm.service_areas}
                onChange={(e) => setEditForm({ ...editForm, service_areas: e.target.value })}
                placeholder="Westlands, Kilimani, etc."
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
            </div>
            <Button 
              onClick={handleSave}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
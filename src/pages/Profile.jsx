import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { 
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Shield,
  LogOut,
  Wrench,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({ label: '', address: '' });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: (updatedUser) => setUser(updatedUser),
  });

  const handleSaveAddress = () => {
    const addresses = user.saved_addresses || [];
    if (editingAddress !== null) {
      addresses[editingAddress] = addressForm;
    } else {
      addresses.push(addressForm);
    }
    updateProfileMutation.mutate({ saved_addresses: addresses });
    setShowAddressDialog(false);
    setAddressForm({ label: '', address: '' });
    setEditingAddress(null);
  };

  const handleDeleteAddress = (index) => {
    const addresses = [...(user.saved_addresses || [])];
    addresses.splice(index, 1);
    updateProfileMutation.mutate({ saved_addresses: addresses });
  };

  const handleSetDefaultAddress = (address) => {
    updateProfileMutation.mutate({ default_address: address });
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-teal-50">
            <AvatarImage src={user?.profile_photo} />
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-2xl">
              {user?.full_name?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-gray-900">{user?.full_name || 'User'}</h1>
          <p className="text-gray-500">{user?.email}</p>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{user?.phone || 'Not set'}</p>
              </div>
              <Button variant="ghost" size="sm">
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Saved Addresses</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setAddressForm({ label: '', address: '' });
                setEditingAddress(null);
                setShowAddressDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {user?.default_address?.address && (
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 mb-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-teal-700">Default Address</p>
                  <p className="text-gray-700">{user.default_address.address}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {(user?.saved_addresses || []).map((addr, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl border hover:border-teal-200 transition-colors">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{addr.label}</p>
                  <p className="text-sm text-gray-500">{addr.address}</p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSetDefaultAddress(addr)}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setAddressForm(addr);
                      setEditingAddress(index);
                      setShowAddressDialog(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => handleDeleteAddress(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {(!user?.saved_addresses || user.saved_addresses.length === 0) && !user?.default_address && (
              <p className="text-center text-gray-500 py-4">No addresses saved</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <Link 
            to={createPageUrl('TechnicianRegister')}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b"
          >
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Become a Technician</p>
              <p className="text-sm text-gray-500">Join and start earning</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          {(user?.role === 'admin' || user?.user_type === 'admin') && (
            <Link 
              to={createPageUrl('AdminDashboard')}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Admin Dashboard</p>
                <p className="text-sm text-gray-500">Manage the platform</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          )}

          <button 
            onClick={() => base44.auth.logout()}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors text-red-600"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress !== null ? 'Edit Address' : 'Add Address'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Label</Label>
              <Input
                placeholder="e.g., Home, Office"
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                placeholder="Enter full address"
                value={addressForm.address}
                onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleSaveAddress}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={!addressForm.label || !addressForm.address}
            >
              Save Address
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Bell,
  Shield,
  Globe,
  Moon,
  HelpCircle,
  FileText,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    email_notifications: true,
    sms_notifications: true,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        if (userData.settings) {
          setSettings(prev => ({ ...prev, ...userData.settings }));
        }
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const updateMutation = useMutation({
    mutationFn: (newSettings) => base44.auth.updateMe({ settings: newSettings }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
  });

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    updateMutation.mutate(newSettings);
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading settings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link 
            to={createPageUrl('Profile')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Profile
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="font-semibold">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive push notifications</p>
              </div>
              <Switch
                checked={settings.notifications_enabled}
                onCheckedChange={() => handleToggle('notifications_enabled')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={() => handleToggle('email_notifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via SMS</p>
              </div>
              <Switch
                checked={settings.sms_notifications}
                onCheckedChange={() => handleToggle('sms_notifications')}
              />
            </div>
          </div>
        </div>

        {/* Support & Legal */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Help & Support</p>
              <p className="text-sm text-gray-500">Get help with your account</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Privacy Policy</p>
              <p className="text-sm text-gray-500">Read our privacy policy</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Terms of Service</p>
              <p className="text-sm text-gray-500">Read our terms</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* App Info */}
        <div className="text-center py-6">
          <p className="text-gray-400 text-sm">FixNow v1.0.0</p>
          <p className="text-gray-300 text-xs mt-1">© 2024 FixNow. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
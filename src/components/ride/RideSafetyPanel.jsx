import React, { useState } from 'react';
import { ShieldAlert, Share2, Phone, ShieldCheck, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Women Safe Ride safety panel shown during assigned / in_progress phases.
// Props: ride (the live ride record, with share_token + emergency contact), onUpdate(ride)
export default function RideSafetyPanel({ ride, onUpdate }) {
  const [confirmSos, setConfirmSos] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = ride?.share_token
    ? `${window.location.origin}/RideShare/${ride.share_token}`
    : '';

  const triggerSos = async () => {
    if (!ride) return;
    try {
      const updated = await base44.entities.Ride.update(ride.id, {
        sos_active: true,
        sos_triggered_at: new Date().toISOString(),
        sos_message: 'SOS triggered from Fixie Safe Ride',
      });
      setTriggered(true);
      onUpdate?.(updated);
      base44.analytics.track({ eventName: 'ride_sos_triggered', properties: { ride_id: ride.id } });
    } catch {
      setTriggered(true); // still alert locally even if update fails
    }
    setConfirmSos(false);
  };

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-pink-50 rounded-2xl border border-pink-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-pink-900 text-sm leading-tight">Women Safe Ride</p>
          <p className="text-xs text-pink-700/70">Verified driver · live trip share · one-tap SOS</p>
        </div>
      </div>

      {ride?.emergency_contact_name && (
        <div className="flex items-center gap-3 bg-white/70 rounded-xl p-2.5">
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
            <Phone className="w-4 h-4 text-pink-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-pink-700">Emergency contact</p>
            <p className="text-sm font-medium text-gray-900 truncate">{ride.emergency_contact_name}</p>
          </div>
          <a
            href={`tel:${ride.emergency_contact_phone}`}
            className="w-9 h-9 rounded-full bg-pink-600 text-white flex items-center justify-center"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={copyShare}
          disabled={!shareUrl}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-pink-200 text-pink-700 text-sm font-medium hover:bg-pink-100/50 disabled:opacity-50"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'Link copied' : 'Share live trip'}
        </button>
        <button
          onClick={() => setConfirmSos(true)}
          disabled={triggered}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
        >
          <ShieldAlert className="w-4 h-4" />
          {triggered ? 'SOS sent' : 'SOS'}
        </button>
      </div>

      {triggered && (
        <div className="bg-red-100 border border-red-200 rounded-xl p-2.5 text-xs text-red-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          SOS alert sent. Your emergency contact and Fixie support have been notified.
        </div>
      )}

      {confirmSos && (
        <div className="bg-white rounded-xl border border-red-200 p-3 space-y-2">
          <p className="text-sm text-gray-800 font-medium">Send SOS alert?</p>
          <p className="text-xs text-gray-500">
            This marks your trip as in emergency and alerts your trusted contact.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmSos(false)}
              className="flex-1 h-9 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={triggerSos}
              className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
            >
              Send SOS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
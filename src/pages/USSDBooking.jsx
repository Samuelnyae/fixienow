import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RotateCcw, ChevronLeft } from 'lucide-react';

const SERVICES = [
  { key: '1', slug: 'mechanic', label: 'Mechanic' },
  { key: '2', slug: 'plumber', label: 'Plumber' },
  { key: '3', slug: 'electrician', label: 'Electrician' },
  { key: '4', slug: 'carpenter', label: 'Carpenter' },
  { key: '5', slug: 'painter', label: 'Painter' },
  { key: '6', slug: 'hvac', label: 'AC / HVAC' },
  { key: '7', slug: 'appliance_repair', label: 'Appliance Repair' },
  { key: '8', slug: 'locksmith', label: 'Locksmith' },
];

const initialState = {
  category: '', area: '', description: '',
  bookingType: 'instant', scheduledDate: '', scheduledTime: '', phone: '',
};

export default function USSDBooking() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialState);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [authed, setAuthed] = useState(true);

  useEffect(() => { base44.auth.isAuthenticated().then(setAuthed); }, []);

  const reset = () => {
    setStep(0); setData(initialState); setInput(''); setResult(null); setSubmitting(false);
  };

  const submitBooking = async () => {
    setSubmitting(true);
    try {
      const techs = await base44.entities.Technician.filter({
        verification_status: 'approved', is_available: true,
      });
      const cat = data.category.toLowerCase();
      const area = data.area.toLowerCase();

      const matched =
        techs.find((t) => {
          const skills = [...(t.skills || []), t.profession].filter(Boolean).map((s) => s.toLowerCase());
          const hasSkill = skills.some((s) => s.includes(cat) || cat.includes(s));
          const areas = (t.service_areas || []).map((a) => a.toLowerCase());
          const hasArea = areas.length === 0 || areas.some((a) => a.includes(area) || area.includes(a));
          return hasSkill && hasArea;
        }) ||
        techs.find((t) => {
          const skills = [...(t.skills || []), t.profession].filter(Boolean).map((s) => s.toLowerCase());
          return skills.some((s) => s.includes(cat) || cat.includes(s));
        });

      if (!matched) {
        setResult({ success: false, message: 'No technician available in your area right now. Try a nearby area or try again later.' });
        setStep(9); setSubmitting(false);
        return;
      }

      const booking = await base44.entities.Booking.create({
        user_id: 'guest',
        user_name: 'USSD User',
        user_phone: data.phone,
        category: data.category,
        description: data.description,
        technician_id: matched.id,
        technician_name: matched.name,
        booking_type: data.bookingType,
        scheduled_date: data.bookingType === 'scheduled' ? data.scheduledDate : undefined,
        scheduled_time: data.bookingType === 'scheduled' ? data.scheduledTime : undefined,
        status: 'pending',
        location: { address: data.area },
      });

      if (matched.user_id) {
        await base44.entities.Notification.create({
          user_id: matched.user_id,
          type: 'booking_new',
          title: 'New Booking Request',
          message: `New ${data.category} booking in ${data.area}. Problem: ${data.description}. Call ${data.phone} to confirm.`,
          booking_id: booking.id,
        });
      }

      setResult({
        success: true,
        technician_name: matched.name,
        profession: matched.profession,
        booking_id: booking.id,
      });
      setStep(9);
    } catch (e) {
      setResult({ success: false, message: e.message || 'Something went wrong. Please try again.' });
      setStep(9);
    }
    setSubmitting(false);
  };

  const proceed = () => {
    const v = input.trim();
    setInput('');
    if (step === 0) { if (v === '1') setStep(1); else if (v === '2') return; }
    else if (step === 1) {
      const svc = SERVICES.find((s) => s.key === v);
      if (svc) { setData((d) => ({ ...d, category: svc.slug })); setStep(2); }
    }
    else if (step === 2) { if (v) { setData((d) => ({ ...d, area: v })); setStep(3); } }
    else if (step === 3) { if (v) { setData((d) => ({ ...d, description: v })); setStep(4); } }
    else if (step === 4) {
      if (v === '1') setStep(6);
      else if (v === '2') setStep(5);
    }
    else if (step === 5) {
      if (v) {
        const parts = v.split(/\s+/);
        setData((d) => ({ ...d, bookingType: 'scheduled', scheduledDate: parts[0], scheduledTime: parts[1] || '09:00' }));
        setStep(6);
      }
    }
    else if (step === 6) { if (v) { setData((d) => ({ ...d, phone: v })); setStep(7); } }
    else if (step === 7) {
      if (v === '1') submitBooking();
      else if (v === '2') reset();
    }
  };

  const renderScreen = () => {
    if (step === 0) return 'Welcome to Fixie!\nBook a certified technician.\n\n1. Continue\n2. Exit';
    if (step === 1)
      return 'Select service:\n\n' + SERVICES.map((s) => `${s.key}. ${s.label}`).join('\n');
    if (step === 2) return 'Enter your area\n(e.g. Westlands, Kilimani):';
    if (step === 3) return 'Describe the problem briefly:\n(e.g. Leaking kitchen pipe)';
    if (step === 4) return 'When do you need help?\n\n1. Now (ASAP)\n2. Schedule for later';
    if (step === 5) return 'Enter date and time\n(DD/MM HH:mm):\n\ne.g. 05/08 14:00';
    if (step === 6) return 'Enter your phone number:\n(e.g. 0712345678)';
    if (step === 7) {
      const sched = data.bookingType === 'scheduled' ? `Date: ${data.scheduledDate} ${data.scheduledTime}\n` : '';
      return `Confirm booking:\n\nService: ${data.category}\nArea: ${data.area}\nProblem: ${data.description}\n${sched}Phone: ${data.phone}\n\n1. Confirm\n2. Cancel`;
    }
    return '';
  };

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-3xl p-6 text-center">
          <p className="text-green-400 font-mono text-sm mb-4">Sign in required to book via USSD menu.</p>
          <a href="/login" className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold">Sign In</a>
        </div>
      </div>
    );
  }

  if (step === 9) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-3xl p-6 text-green-400 font-mono text-sm whitespace-pre-wrap min-h-[260px]">
          {result?.success
            ? `✓ Booking confirmed!\n\nTechnician: ${result.technician_name}\nService: ${result.profession || data.category}\n\nThey will call you on ${data.phone} shortly.\n\nRef: ${String(result.booking_id || '').slice(-8)}\n\nThank you for using Fixie.`
            : `✗ ${result?.message || 'Booking failed.'}`}
        </div>
        <button onClick={reset} className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl font-mono text-sm flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> New Booking
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-gray-900 rounded-3xl p-6 min-h-[320px] flex flex-col">
        <div className="text-green-400 font-mono text-sm whitespace-pre-wrap flex-1">{renderScreen()}</div>
        {submitting && (
          <div className="text-green-400 font-mono text-sm flex items-center gap-2 mt-3">
            <Loader2 className="w-4 h-4 animate-spin" /> Finding technician...
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !submitting && proceed()}
          placeholder="Enter option..."
          className="flex-1 bg-gray-900 text-green-400 font-mono text-sm rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-green-500 placeholder-gray-600"
          disabled={submitting}
          autoFocus
        />
        <button
          onClick={() => !submitting && proceed()}
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl font-mono text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
      {step > 0 && (
        <button onClick={() => setStep((s) => s - 1)} className="mt-3 text-xs text-gray-400 font-mono flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" /> Back
        </button>
      )}
    </div>
  );
}
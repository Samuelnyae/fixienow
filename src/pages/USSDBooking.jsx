import React, { useState } from 'react';
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

const RIDE_TYPES = [
  { key: '1', slug: 'cab', label: 'Cab' },
  { key: '2', slug: 'bodaboda', label: 'Boda boda' },
  { key: '3', slug: 'truck', label: 'Truck' },
];

const TOOL_CATEGORIES = [
  { key: '1', slug: 'plumber', label: 'Plumbing' },
  { key: '2', slug: 'electrician', label: 'Electrical' },
  { key: '3', slug: 'mechanic', label: 'Mechanic' },
  { key: '4', slug: 'carpenter', label: 'Carpentry' },
  { key: '5', slug: 'painter', label: 'Painting' },
  { key: '6', slug: 'hvac', label: 'HVAC' },
];

const initialState = {
  mode: '', // 'tech' | 'ride' | 'tools'
  // technician
  category: '', area: '', description: '',
  bookingType: 'instant', scheduledDate: '', scheduledTime: '',
  // ride
  rideType: '', pickup: '', destination: '',
  // tools
  toolCategory: '', tools: [], toolIndex: null,
  // shared
  phone: '',
};

export default function USSDBooking() {
  const [step, setStep] = useState('home');
  const [data, setData] = useState(initialState);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const patch = (p) => setData((d) => ({ ...d, ...p }));

  const reset = () => {
    setStep('home'); setData(initialState); setInput(''); setResult(null); setSubmitting(false);
  };

  const submitTechnician = async () => {
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

    return {
      success: true,
      lines: [
        '✓ Booking confirmed!',
        '',
        `Technician: ${matched.name}`,
        `Service: ${matched.profession || data.category}`,
        '',
        `They will call you on ${data.phone} shortly.`,
        '',
        `Ref: ${String(booking.id || '').slice(-8)}`,
        '',
        'Thank you for using Fixie.',
      ],
    };
  };

  const submitRide = async () => {
    const drivers = await base44.entities.Driver.filter({
      is_available: true,
      verification_status: 'approved',
    });
    const driver = drivers.find((d) => d.vehicle_type === data.rideType);

    const ride = await base44.entities.Ride.create({
      user_id: 'guest',
      user_name: 'USSD User',
      user_phone: data.phone,
      ride_type: data.rideType,
      booking_type: 'instant',
      pickup: { address: data.pickup },
      destination: { address: data.destination },
      status: driver ? 'assigned' : 'searching',
      booked_via: 'ussd',
      driver_id: driver?.id,
      driver_name: driver?.name,
      driver_phone: driver?.phone,
      vehicle_model: driver?.vehicle_model,
      vehicle_plate: driver?.vehicle_plate,
    });

    if (!driver) {
      return {
        success: true,
        lines: [
          '✓ Ride requested!',
          '',
          `Type: ${data.rideType}`,
          `From: ${data.pickup}`,
          `To: ${data.destination}`,
          '',
          'Searching for a driver nearby.',
          `We will call you on ${data.phone} once assigned.`,
          '',
          `Ref: ${String(ride.id || '').slice(-8)}`,
        ],
      };
    }

    if (driver.user_id) {
      await base44.entities.Notification.create({
        user_id: driver.user_id,
        type: 'booking_new',
        title: 'New Ride Request',
        message: `New ${data.rideType} ride from ${data.pickup} to ${data.destination}. Call ${data.phone} to confirm.`,
        booking_id: ride.id,
      });
    }

    return {
      success: true,
      lines: [
        '✓ Ride assigned!',
        '',
        `Driver: ${driver.name}`,
        `Vehicle: ${driver.vehicle_model || ''} ${driver.vehicle_plate || ''}`.trim(),
        `Phone: ${driver.phone || ''}`,
        '',
        `From: ${data.pickup}`,
        `To: ${data.destination}`,
        '',
        `Ref: ${String(ride.id || '').slice(-8)}`,
        '',
        'Thank you for using Fixie Rides.',
      ],
    };
  };

  const submitTools = async () => {
    const tool = data.tools[data.toolIndex];
    if (!tool) {
      return { success: false, message: 'Invalid tool selection.' };
    }

    if (tool.seller_id) {
      await base44.entities.Notification.create({
        user_id: tool.seller_id,
        type: 'booking_new',
        title: 'New Tool Buyer',
        message: `A buyer is interested in "${tool.name}" (KES ${tool.price}). Ask them to call ${data.phone}.`,
      });
    }

    return {
      success: true,
      lines: [
        '✓ Interest sent to seller!',
        '',
        `Tool: ${tool.name}`,
        `Price: KES ${tool.price}`,
        tool.brand ? `Brand: ${tool.brand}` : '',
        '',
        `Seller: ${tool.seller_name || 'Fixie Store'}`,
        `Contact: ${data.phone}`,
        '',
        'The seller will reach out to you shortly.',
        '',
        'Thank you for using Fixie.',
      ].filter(Boolean),
    };
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      let res;
      if (data.mode === 'tech') res = await submitTechnician();
      else if (data.mode === 'ride') res = await submitRide();
      else if (data.mode === 'tools') res = await submitTools();
      setResult(res);
      setStep('done');
    } catch (e) {
      setResult({ success: false, message: e.message || 'Something went wrong. Please try again.' });
      setStep('done');
    }
    setSubmitting(false);
  };

  const proceed = () => {
    const v = input.trim();
    setInput('');
    if (!v) return;

    if (step === 'home') {
      if (v === '1') { patch({ mode: 'tech' }); setStep('t:svc'); }
      else if (v === '2') { patch({ mode: 'ride' }); setStep('r:type'); }
      else if (v === '3') { patch({ mode: 'tools' }); setStep('c:cat'); }
      return;
    }

    // Technician flow
    if (step === 't:svc') {
      const svc = SERVICES.find((s) => s.key === v);
      if (svc) { patch({ category: svc.slug }); setStep('t:area'); }
      return;
    }
    if (step === 't:area') { if (v) { patch({ area: v }); setStep('t:desc'); } return; }
    if (step === 't:desc') { if (v) { patch({ description: v }); setStep('t:when'); } return; }
    if (step === 't:when') {
      if (v === '1') { patch({ bookingType: 'instant' }); setStep('t:phone'); }
      else if (v === '2') setStep('t:sched');
      return;
    }
    if (step === 't:sched') {
      if (v) {
        const parts = v.split(/\s+/);
        patch({ bookingType: 'scheduled', scheduledDate: parts[0], scheduledTime: parts[1] || '09:00' });
        setStep('t:phone');
      }
      return;
    }
    if (step === 't:phone') { if (v) { patch({ phone: v }); setStep('t:confirm'); } return; }
    if (step === 't:confirm') {
      if (v === '1') submit();
      else if (v === '2') reset();
      return;
    }

    // Ride flow
    if (step === 'r:type') {
      const rt = RIDE_TYPES.find((r) => r.key === v);
      if (rt) { patch({ rideType: rt.slug }); setStep('r:pickup'); }
      return;
    }
    if (step === 'r:pickup') { if (v) { patch({ pickup: v }); setStep('r:dest'); } return; }
    if (step === 'r:dest') { if (v) { patch({ destination: v }); setStep('r:phone'); } return; }
    if (step === 'r:phone') { if (v) { patch({ phone: v }); setStep('r:confirm'); } return; }
    if (step === 'r:confirm') {
      if (v === '1') submit();
      else if (v === '2') reset();
      return;
    }

    // Tools flow
    if (step === 'c:cat') {
      const cat = TOOL_CATEGORIES.find((c) => c.key === v);
      if (cat) { patch({ toolCategory: cat.slug }); loadTools(cat.slug); }
      return;
    }
    if (step === 'c:list') {
      const idx = parseInt(v, 10) - 1;
      if (idx >= 0 && idx < data.tools.length) { patch({ toolIndex: idx }); setStep('c:phone'); }
      return;
    }
    if (step === 'c:phone') { if (v) { patch({ phone: v }); setStep('c:confirm'); } return; }
    if (step === 'c:confirm') {
      if (v === '1') submit();
      else if (v === '2') reset();
      return;
    }
  };

  const loadTools = async (cat) => {
    setSubmitting(true);
    try {
      const tools = await base44.entities.Tool.filter({ status: 'approved' });
      const filtered = tools.filter((t) => {
        const tc = (t.category || '').toLowerCase();
        return tc.includes(cat) || cat.includes(tc);
      });
      patch({ tools: filtered.slice(0, 6) });
      setStep('c:list');
    } catch (e) {
      setResult({ success: false, message: e.message || 'Could not load tools.' });
      setStep('done');
    }
    setSubmitting(false);
  };

  const renderScreen = () => {
    if (step === 'home')
      return 'Welcome to Fixie!\nChoose a service:\n\n1. Book a technician\n2. Get a ride\n3. Buy tools';

    // Technician
    if (step === 't:svc')
      return 'Select service:\n\n' + SERVICES.map((s) => `${s.key}. ${s.label}`).join('\n');
    if (step === 't:area') return 'Enter your area\n(e.g. Westlands, Kilimani):';
    if (step === 't:desc') return 'Describe the problem briefly:\n(e.g. Leaking kitchen pipe)';
    if (step === 't:when') return 'When do you need help?\n\n1. Now (ASAP)\n2. Schedule for later';
    if (step === 't:sched') return 'Enter date and time\n(DD/MM HH:mm):\n\ne.g. 05/08 14:00';
    if (step === 't:phone') return 'Enter your phone number:\n(e.g. 0712345678)';
    if (step === 't:confirm') {
      const sched = data.bookingType === 'scheduled' ? `Date: ${data.scheduledDate} ${data.scheduledTime}\n` : '';
      return `Confirm booking:\n\nService: ${data.category}\nArea: ${data.area}\nProblem: ${data.description}\n${sched}Phone: ${data.phone}\n\n1. Confirm\n2. Cancel`;
    }

    // Ride
    if (step === 'r:type') return 'Select ride type:\n\n1. Cab\n2. Boda boda\n3. Truck';
    if (step === 'r:pickup') return 'Enter pickup location:\n(e.g. Westlands)';
    if (step === 'r:dest') return 'Enter destination:\n(e.g. Kilimani)';
    if (step === 'r:phone') return 'Enter your phone number:\n(e.g. 0712345678)';
    if (step === 'r:confirm')
      return `Confirm ride:\n\nType: ${data.rideType}\nFrom: ${data.pickup}\nTo: ${data.destination}\nPhone: ${data.phone}\n\n1. Confirm\n2. Cancel`;

    // Tools
    if (step === 'c:cat')
      return 'Select tool category:\n\n' + TOOL_CATEGORIES.map((c) => `${c.key}. ${c.label}`).join('\n');
    if (step === 'c:list') {
      if (!data.tools.length) return 'No tools found in this category.\n\nTry another category or check back later.';
      const list = data.tools.map((t, i) => `${i + 1}. ${t.name} - KES ${t.price}`).join('\n');
      return `Available tools:\n\n${list}\n\nEnter the number to buy:`;
    }
    if (step === 'c:phone') return 'Enter your phone number:\n(e.g. 0712345678)';
    if (step === 'c:confirm') {
      const tool = data.tools[data.toolIndex];
      return `Confirm interest:\n\nTool: ${tool?.name}\nPrice: KES ${tool?.price}\nPhone: ${data.phone}\n\n1. Confirm\n2. Cancel`;
    }

    return '';
  };

  const backStep = () => {
    const order = [
      'home',
      't:svc', 't:area', 't:desc', 't:when', 't:sched', 't:phone', 't:confirm',
      'r:type', 'r:pickup', 'r:dest', 'r:phone', 'r:confirm',
      'c:cat', 'c:list', 'c:phone', 'c:confirm',
    ];
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]);
  };

  if (step === 'done') {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-3xl p-6 text-green-400 font-mono text-sm whitespace-pre-wrap min-h-[260px]">
          {result?.success
            ? (Array.isArray(result.lines) ? result.lines.join('\n') : `✓ ${result.lines || 'Done.'}`)
            : `✗ ${result?.message || 'Request failed.'}`}
        </div>
        <button onClick={reset} className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl font-mono text-sm flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> New Request
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
            <Loader2 className="w-4 h-4 animate-spin" /> Processing...
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
      {step !== 'home' && (
        <button onClick={backStep} className="mt-3 text-xs text-gray-400 font-mono flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" /> Back
        </button>
      )}
    </div>
  );
}
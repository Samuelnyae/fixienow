import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GIG_CATEGORIES } from '@/lib/gigMatch';
import { MapPin, Wallet, ArrowLeft, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

const AREAS = [
  'Westlands', 'Kilimani', 'Lavington', 'Kasarani', 'Embakasi', 'Ruaka',
  'Ngong Road', 'Industrial Area', 'CBD', 'Karen', 'Rongai', 'Thika Road',
  'Other',
];

export default function PostGig() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [me, setMe] = useState(undefined); // undefined = loading, null = guest
  const [form, setForm] = useState({
    category: 'electrician',
    title: '',
    description: '',
    budget: '',
    area_name: 'Westlands',
    address: '',
    neededByHours: '3',
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!me) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: 'Add a title and description', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const neededBy = new Date(Date.now() + Math.max(1, Number(form.neededByHours) || 3) * 3600000).toISOString();
      const gig = await base44.entities.Gig.create({
        customer_id: me.id,
        customer_name: me.full_name,
        customer_phone: me.phone,
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        budget: form.budget ? Number(form.budget) : null,
        area_name: form.area_name === 'Other' ? '' : form.area_name,
        location: { address: form.address.trim() || form.area_name },
        needed_by: neededBy,
        status: 'open',
        booked_via: 'app',
      });
      qc.invalidateQueries({ queryKey: ['myGigs', me.id] });
      qc.invalidateQueries({ queryKey: ['openGigs'] });
      toast({ title: 'Gig posted!', description: 'Nearby fundis will see it now.' });
      navigate(`/GigMatches?id=${gig.id}`);
    } catch (err) {
      toast({ title: 'Could not post gig', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (me === null) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Post a same-day gig</h1>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center mt-4">
          <h3 className="font-semibold text-gray-900 mb-1">Sign in to post a gig</h3>
          <p className="text-sm text-gray-500 mb-4">You need an account so fundis can reach you.</p>
          <Button asChild className="bg-[#0B463C] hover:bg-[#0a3d34]">
            <Link to="/login"><LogIn className="w-4 h-4" /> Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!me) {
    return <div className="max-w-xl mx-auto px-4 py-10 text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-800 inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Post a same-day gig</h1>
      <p className="text-sm text-gray-500 mb-5">Tell us the job and your budget — nearby fundis get matched and apply in minutes.</p>

      <form onSubmit={submit} className="space-y-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="category">What kind of help?</Label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
          >
            {GIG_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Headline</Label>
          <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Leaking kitchen tap, needs fixing today" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Describe the job</Label>
          <Textarea id="description" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What's broken, when you're home, anything the fundi should know..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="budget">Budget (KES)</Label>
            <Input id="budget" type="number" min={0} value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="neededByHours">Needed within</Label>
            <select
              id="neededByHours"
              value={form.neededByHours}
              onChange={(e) => set('neededByHours', e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="1">1 hour</option>
              <option value="3">3 hours</option>
              <option value="6">6 hours</option>
              <option value="24">Today (24h)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="area">Area</Label>
          <select
            id="area"
            value={form.area_name}
            onChange={(e) => set('area_name', e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Address / landmark</Label>
          <Input id="address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="e.g. Appt 4B, near Sarit Centre" />
        </div>

        <Button type="submit" disabled={saving} className="w-full bg-[#0B463C] hover:bg-[#0a3d34] h-11">
          {saving ? 'Posting...' : 'Post gig & match fundis'}
        </Button>
      </form>

      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
        <MapPin className="w-3 h-3" /> Matching uses your area + the fundi's skills, rating and availability.
      </p>
    </div>
  );
}
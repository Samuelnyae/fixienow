import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, Briefcase, MapPin, Plus, Loader2, Star } from 'lucide-react';

// Quick-select chips for a user's saved locations (UserAddress entity).
// Props:
//   userId   — current user id
//   onPick   — (location) => void, location = { address, lat, lng, label }
//   draft    — optional { address, lat, lng } of the current destination, to enable saving it
export default function SavedLocations({ userId, onPick, draft }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [label, setLabel] = useState('Home');

  const { data: addresses = [] } = useQuery({
    queryKey: ['savedLocations', userId],
    queryFn: () => base44.entities.UserAddress.filter({ user_id: userId }, '-created_date', 20),
    enabled: !!userId,
  });

  const iconFor = (lbl) => {
    const l = (lbl || '').toLowerCase();
    if (l.includes('home')) return Home;
    if (l.includes('work') || l.includes('office')) return Briefcase;
    return MapPin;
  };

  const save = async () => {
    if (!draft?.address) return;
    setSaving(true);
    try {
      const created = await base44.entities.UserAddress.create({
        user_id: userId,
        label,
        address: draft.address,
        lat: draft.lat,
        lng: draft.lng,
        area_name: draft.area_name || '',
        is_default: addresses.length === 0,
      });
      queryClient.invalidateQueries(['savedLocations', userId]);
      setShowSave(false);
      onPick?.({ address: created.address, lat: created.lat, lng: created.lng, label: created.label });
    } catch {
      /* ignore — surface nothing for now */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {addresses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {addresses.map((a) => {
            const Icon = iconFor(a.label);
            return (
              <button
                key={a.id}
                onClick={() => onPick?.({ address: a.address, lat: a.lat, lng: a.lng, label: a.label })}
                className="flex-shrink-0 flex items-center gap-2 bg-gray-50 hover:bg-[#0B463C]/5 border border-gray-100 rounded-full pl-2.5 pr-3.5 py-2 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-[#0B463C]" />
                </span>
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{a.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {draft?.address && (
        <div>
          {showSave ? (
            <div className="flex items-center gap-2">
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-9 rounded-xl bg-gray-50 border border-gray-100 text-sm px-2 focus:outline-none focus:ring-2 focus:ring-[#0B463C]/20"
              >
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#0B463C] text-white text-sm font-medium disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save
              </button>
              <button onClick={() => setShowSave(false)} className="h-9 px-3 rounded-xl text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              className="flex items-center gap-1.5 text-sm text-[#0B463C] font-medium hover:underline"
            >
              <Star className="w-3.5 h-3.5" />
              Save this destination
            </button>
          )}
        </div>
      )}
    </div>
  );
}
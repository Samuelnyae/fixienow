import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function FavoriteButton({ technician, className = '' }) {
  const [user, setUser] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await base44.auth.me();
        if (!mounted) return;
        setUser(u);
        const existing = await base44.entities.FavoriteTechnician.filter({
          user_id: u.id,
          technician_id: technician.id,
        });
        if (!mounted) return;
        if (existing.length > 0) {
          setIsFav(true);
          setFavId(existing[0].id);
        }
      } catch (e) {
        // not logged in — leave disabled
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [technician.id]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || toggling) return;
    setToggling(true);
    try {
      if (isFav && favId) {
        await base44.entities.FavoriteTechnician.delete(favId);
        setIsFav(false);
        setFavId(null);
      } else {
        const created = await base44.entities.FavoriteTechnician.create({
          user_id: user.id,
          technician_id: technician.id,
          technician_name: technician.name,
          technician_profession: technician.profession,
          technician_photo: technician.profile_photo,
        });
        setIsFav(true);
        setFavId(created.id);
      }
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch (err) {
      // keep current state on error
    } finally {
      setToggling(false);
    }
  };

  if (!user && !loading) {
    return null; // hide for anonymous users
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || toggling}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      className={`flex items-center justify-center rounded-full transition-all ${
        isFav
          ? 'bg-red-50 hover:bg-red-100'
          : 'bg-white/80 hover:bg-gray-100 backdrop-blur-sm'
      } ${className}`}
    >
      <Heart
        className={`w-5 h-5 transition-all ${
          isFav ? 'text-red-500 fill-red-500' : 'text-gray-400'
        }`}
      />
    </button>
  );
}
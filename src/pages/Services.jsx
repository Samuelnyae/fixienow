import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  SlidersHorizontal,
  Star,
  MapPin,
  X,
  Heart,
  Wrench, 
  Droplets, 
  Zap, 
  Hammer, 
  Paintbrush, 
  Wind, 
  Refrigerator, 
  Key,
  Car,
  Scissors,
  Sparkles,
  Home,
  Truck,
  Sprout,
  Shield,
  Baby,
  Utensils,
  Shirt
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import TechnicianCard from '../components/home/TechnicianCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ServicesMap from '../components/services/ServicesMap';

const categories = [
  { slug: 'all', name: 'All', icon: Filter },
  { slug: 'mechanic', name: 'Mechanic', icon: Wrench },
  { slug: 'plumber', name: 'Plumber', icon: Droplets },
  { slug: 'electrician', name: 'Electrician', icon: Zap },
  { slug: 'carpenter', name: 'Carpenter', icon: Hammer },
  { slug: 'painter', name: 'Painter', icon: Paintbrush },
  { slug: 'hvac', name: 'HVAC', icon: Wind },
  { slug: 'appliance_repair', name: 'Appliance', icon: Refrigerator },
  { slug: 'locksmith', name: 'Locksmith', icon: Key },
  { slug: 'driver', name: 'Driver', icon: Car },
  { slug: 'salonist', name: 'Salonist', icon: Scissors },
  { slug: 'cleaner', name: 'Cleaner', icon: Sparkles },
  { slug: 'house_manager', name: 'House Manager', icon: Home },
  { slug: 'mover', name: 'Mover', icon: Truck },
  { slug: 'gardener', name: 'Gardener', icon: Sprout },
  { slug: 'security', name: 'Security', icon: Shield },
  { slug: 'nanny', name: 'Nanny', icon: Baby },
  { slug: 'cook', name: 'Cook', icon: Utensils },
  { slug: 'laundry', name: 'Laundry', icon: Shirt },
];

export default function Services() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category') || 'all';
  const initialQuery = urlParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [location, setLocation] = useState('');

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      return base44.entities.Technician.list('-rating', 100);
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      try {
        const u = await base44.auth.me();
        return base44.entities.FavoriteTechnician.filter({ user_id: u.id });
      } catch (e) {
        return [];
      }
    },
  });

  const favoriteIds = new Set(favorites.map((f) => f.technician_id));

  const filteredTechnicians = technicians.filter((tech) => {
    const professionSlug = (tech.profession || '').toLowerCase().trim().replace(/ /g, '_');
    const matchesCategory = selectedCategory === 'all' || 
      professionSlug === selectedCategory ||
      professionSlug.includes(selectedCategory) ||
      selectedCategory.includes(professionSlug);
    
    const matchesSearch = !searchQuery || 
      tech.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = !tech.hourly_rate || 
      (tech.hourly_rate >= priceRange[0] && tech.hourly_rate <= priceRange[1]);
    
    const matchesAvailability = !showAvailableOnly || tech.is_available === true;
    const matchesFavorites = !showFavoritesOnly || favoriteIds.has(tech.id);
    
    return matchesCategory && matchesSearch && matchesPrice && matchesAvailability && matchesFavorites;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Search */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search technicians..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-gray-50 border-gray-200"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 px-4 rounded-xl">
                  <SlidersHorizontal className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Price Range (per hour)</label>
                    <Slider
                      value={priceRange}
                      max={10000}
                      step={100}
                      onValueChange={setPriceRange}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{priceRange[0]}</span>
                      <span>{priceRange[1]}</span>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={showAvailableOnly}
                        onChange={(e) => setShowAvailableOnly(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm font-medium">Available now only</span>
                    </label>
                  </div>

                  <Button 
                    onClick={() => setFiltersOpen(false)}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Enter your location to see pros near you (e.g. Westlands)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-gray-50 border-gray-200"
              />
              {location && (
                <button
                  onClick={() => setLocation('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {favorites.length > 0 && (
              <button
                onClick={() => setShowFavoritesOnly((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  showFavoritesOnly
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-white' : ''}`} />
                <span className="text-sm font-medium">Favorites ({favorites.length})</span>
              </button>
            )}
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {location.trim() && !isLoading && filteredTechnicians.length > 0 && (
          <ServicesMap location={location.trim()} technicians={filteredTechnicians} />
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-500 text-sm">
            {filteredTechnicians.length} technician{filteredTechnicians.length !== 1 ? 's' : ''} found
          </p>
          {(selectedCategory !== 'all' || searchQuery || showAvailableOnly || showFavoritesOnly || priceRange[0] !== 0 || priceRange[1] !== 10000) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setShowAvailableOnly(false);
                setShowFavoritesOnly(false);
                setPriceRange([0, 10000]);
              }}
              className="text-teal-600 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : filteredTechnicians.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredTechnicians.map((tech) => (
              <TechnicianCard key={tech.id} technician={tech} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No technicians found"
            description="Try adjusting your filters or search query"
            actionLabel="Clear Filters"
            onAction={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setShowAvailableOnly(false);
              setShowFavoritesOnly(false);
              setPriceRange([0, 10000]);
            }}
          />
        )}
      </div>
    </div>
  );
}
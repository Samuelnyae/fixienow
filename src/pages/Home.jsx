import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ArrowRight,
  Shield,
  Zap,
  Star,
  Wrench,
  Droplets,
  Zap as Bolt,
  Paintbrush,
  UserCheck,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const defaultCategories = [
  { id: '1', name: 'Mechanic', slug: 'mechanic', base_price: 500, description: 'Car repair & maintenance' },
  { id: '2', name: 'Plumber', slug: 'plumber', base_price: 400, description: 'Pipes, leaks & installations' },
  { id: '3', name: 'Electrician', slug: 'electrician', base_price: 450, description: 'Wiring, faults & installations' },
  { id: '4', name: 'Painter', slug: 'painter', base_price: 350, description: 'Walls, doors & finishes' },
  { id: '5', name: 'Carpenter', slug: 'carpenter', base_price: 600, description: 'Furniture & woodwork' },
  { id: '6', name: 'HVAC', slug: 'hvac', base_price: 800, description: 'Heating & cooling' },
  { id: '7', name: 'Appliance Repair', slug: 'appliance_repair', base_price: 500, description: 'Fridge, washer & more' },
  { id: '8', name: 'Locksmith', slug: 'locksmith', base_price: 300, description: 'Locks & keys' },
];

const categoryIcons = {
  mechanic: { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
  plumber: { icon: Droplets, color: 'text-teal-500', bg: 'bg-teal-50' },
  electrician: { icon: Bolt, color: 'text-amber-500', bg: 'bg-amber-50' },
  painter: { icon: Paintbrush, color: 'text-purple-500', bg: 'bg-purple-50' },
  carpenter: { icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50' },
  hvac: { icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  appliance_repair: { icon: Wrench, color: 'text-red-500', bg: 'bg-red-50' },
  locksmith: { icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50' },
};

const howItWorks = [
  { step: 1, title: 'Search', desc: 'Tell us what you need', icon: Search },
  { step: 2, title: 'Connect', desc: 'We match you with experts', icon: UserCheck },
  { step: 3, title: 'Book', desc: 'Choose time & confirm', icon: Calendar },
  { step: 4, title: 'Relax', desc: 'Get the job done right', icon: ShieldCheck },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const { data: categories = defaultCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.ServiceCategory.list(),
  });

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#004d40]">
        {/* Technician image - visible on all screens */}
        <img
          src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&q=80"
          alt="Technician"
          className="absolute right-0 top-0 h-full w-full sm:w-3/5 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#004d40] via-[#004d40]/85 to-[#004d40]/30 sm:to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 py-10 sm:py-16">
          <div className="max-w-lg text-white">
            {/* Badge */}
            <div className="inline-flex items-center bg-teal-600/40 backdrop-blur-sm border border-teal-400/30 rounded-full px-3 py-1 mb-5">
              <span className="text-xs font-medium text-teal-50">Trusted. Verified. Reliable.</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 leading-tight">
              Expert Help, <span className="text-yellow-400">Right When You Need It</span>
            </h1>
            <p className="text-teal-100/80 text-sm sm:text-base mb-6 max-w-md">
              Connect with certified technicians worldwide for fast, reliable service at your doorstep.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-xl p-1.5 flex items-center gap-1.5 mb-5">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="What do you need help with?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 border-0 text-base focus-visible:ring-0 bg-transparent"
                />
              </div>
              <Button
                asChild
                className="h-12 px-6 bg-[#004d40] hover:bg-[#003d33] rounded-xl font-medium"
              >
                <Link to={createPageUrl(`Services${searchQuery ? `?q=${searchQuery}` : ''}`)}>
                  Search
                </Link>
              </Button>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 sm:gap-4 text-white/90">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs sm:text-sm">4.8 avg rating</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Verified pros</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Fast response</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Services */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Browse Services</h2>
          <Link
            to={createPageUrl('Services')}
            className="text-[#004d40] font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {displayCategories.slice(0, 4).map((category) => {
            const config = categoryIcons[category.slug] || categoryIcons.mechanic;
            const Icon = config.icon;
            return (
              <Link
                key={category.id || category.slug}
                to={createPageUrl(`Services?category=${category.slug}`)}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-50 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center text-center"
              >
                <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{category.name}</h3>
                <p className="text-xs text-gray-500">{category.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How Fixie Works */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">How Fixie Works</h2>

          <div className="relative">
            {/* Dotted connector line behind circles */}
            <div className="absolute top-7 sm:top-8 left-[12%] right-[12%] border-t-2 border-dashed border-gray-200" />

            <div className="relative flex items-start justify-between gap-1 sm:gap-4">
              {howItWorks.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex flex-col items-center text-center flex-1">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center mb-3 z-10">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#004d40]" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.step}. {item.title}</h3>
                    <p className="text-xs text-gray-500 leading-tight">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 pb-24 md:pb-8">
        <div className="bg-[#004d40] rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Verified & Trusted</h3>
              <p className="text-teal-100/80 text-xs sm:text-sm">All pros are background-checked and highly rated.</p>
            </div>
          </div>
          <Button
            asChild
            variant="secondary"
            className="bg-white text-[#004d40] hover:bg-gray-100 font-medium rounded-xl flex-shrink-0"
          >
            <Link to={createPageUrl('Services')}>
              Learn more
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
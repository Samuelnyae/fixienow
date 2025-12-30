import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  MapPin, 
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Star
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ServiceCategoryCard from '../components/home/ServiceCategoryCard';
import TechnicianCard from '../components/home/TechnicianCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const defaultCategories = [
  { id: '1', name: 'Mechanic', slug: 'mechanic', base_price: 500 },
  { id: '2', name: 'Plumber', slug: 'plumber', base_price: 400 },
  { id: '3', name: 'Electrician', slug: 'electrician', base_price: 450 },
  { id: '4', name: 'Carpenter', slug: 'carpenter', base_price: 600 },
  { id: '5', name: 'Painter', slug: 'painter', base_price: 350 },
  { id: '6', name: 'HVAC', slug: 'hvac', base_price: 800 },
  { id: '7', name: 'Appliance Repair', slug: 'appliance_repair', base_price: 500 },
  { id: '8', name: 'Locksmith', slug: 'locksmith', base_price: 300 },
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

  const { data: topTechnicians = [], isLoading: techLoading } = useQuery({
    queryKey: ['topTechnicians'],
    queryFn: async () => {
      const techs = await base44.entities.Technician.filter(
        { verification_status: 'approved', is_available: true },
        '-rating',
        6
      );
      return techs;
    },
  });

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-teal-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-amber-400 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-16">
          <div className="text-center text-white mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Expert Help,{' '}
              <span className="text-amber-400">Right Now</span>
            </h1>
            <p className="text-teal-100 text-lg max-w-md mx-auto">
              Connect with certified technicians for fast, reliable service at your doorstep
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-2 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="What do you need help with?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 border-0 text-lg focus-visible:ring-0"
                />
              </div>
              <Button 
                asChild
                className="h-12 px-6 bg-teal-600 hover:bg-teal-700 rounded-xl"
              >
                <Link to={createPageUrl(`Services${searchQuery ? `?q=${searchQuery}` : ''}`)}>
                  Search
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-6 mt-6 text-white/90">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm">4.8 avg rating</span>
              </div>
              <div className="w-1 h-1 bg-white/50 rounded-full" />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Verified pros</span>
              </div>
              <div className="w-1 h-1 bg-white/50 rounded-full" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Fast response</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Browse Services</h2>
          <Link 
            to={createPageUrl('Services')}
            className="text-teal-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayCategories.slice(0, 8).map((category) => (
            <ServiceCategoryCard key={category.id || category.slug} category={category} />
          ))}
        </div>
      </section>

      {/* Top Technicians Section */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Top Rated Technicians</h2>
            <p className="text-gray-500 text-sm mt-1">Verified professionals near you</p>
          </div>
          <Link 
            to={createPageUrl('Services')}
            className="text-teal-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
          >
            See more <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {techLoading ? (
          <LoadingSpinner />
        ) : topTechnicians.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {topTechnicians.map((tech) => (
              <TechnicianCard key={tech.id} technician={tech} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <Sparkles className="w-10 h-10 text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Technicians Coming Soon</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              We're onboarding verified technicians in your area. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 py-10 pb-20">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">How FixNow Works</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Choose a Service',
              description: 'Browse categories and select the help you need',
              gradient: 'from-teal-500 to-teal-600'
            },
            {
              step: '2',
              title: 'Book a Technician',
              description: 'Pick a verified pro or get auto-matched instantly',
              gradient: 'from-amber-500 to-amber-600'
            },
            {
              step: '3',
              title: 'Get It Fixed',
              description: 'Technician arrives, completes the job, you pay securely',
              gradient: 'from-green-500 to-green-600'
            }
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold mb-4`}>
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA for Technicians */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Are you a skilled technician?
          </h2>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Join FixNow and grow your business. Get verified, find customers, and earn more.
          </p>
          <Button 
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-8 h-12 rounded-xl"
          >
            <Link to={createPageUrl('TechnicianRegister')}>
              Join as Technician
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
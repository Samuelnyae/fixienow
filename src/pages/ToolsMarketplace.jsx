import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, ShoppingCart, Star, Package, Filter,
  Wrench, Droplets, Zap, Hammer, Paintbrush, Wind,
  Refrigerator, Key, CheckCircle2, ArrowLeft, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ToolCard from '../components/marketplace/ToolCard';
import CartDrawer from '../components/marketplace/CartDrawer';

const CATEGORIES = [
  { label: 'All', value: 'all', icon: Package },
  { label: 'Plumbing', value: 'plumber', icon: Droplets },
  { label: 'Electrical', value: 'electrician', icon: Zap },
  { label: 'Mechanical', value: 'mechanic', icon: Wrench },
  { label: 'Carpentry', value: 'carpenter', icon: Hammer },
  { label: 'Painting', value: 'painter', icon: Paintbrush },
  { label: 'HVAC', value: 'hvac', icon: Wind },
  { label: 'Appliance', value: 'appliance_repair', icon: Refrigerator },
  { label: 'Locksmith', value: 'locksmith', icon: Key },
];

// Static marketplace items — rich catalog
const TOOLS_CATALOG = [
  { id: 't1', name: 'Heavy Duty Pipe Wrench 14"', category: 'plumber', price: 2800, rating: 4.8, reviews: 124, brand: 'Stanley', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80', badge: 'Best Seller', description: 'Industrial-grade pipe wrench with non-slip grip, perfect for plumbing work.' },
  { id: 't2', name: 'Pipe Threading Machine', category: 'plumber', price: 45000, rating: 4.7, reviews: 56, brand: 'Ridgid', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777540?w=400&q=80', badge: 'Professional', description: 'Electric pipe threading machine for fast, precise threads on pipes 1/2" to 2".' },
  { id: 't3', name: 'PEX Crimping Tool Kit', category: 'plumber', price: 5500, rating: 4.6, reviews: 89, brand: 'SharkBite', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', description: 'Complete PEX crimping set with rings for 1/2" to 1" pipes.' },
  { id: 't4', name: 'Digital Multimeter Pro', category: 'electrician', price: 6500, rating: 4.9, reviews: 201, brand: 'Fluke', image: 'https://images.unsplash.com/photo-1621905251189-08b45249681f?w=400&q=80', badge: 'Top Rated', description: 'True RMS digital multimeter with CAT III 600V safety rating.' },
  { id: 't5', name: 'Cable Wire Stripper Set', category: 'electrician', price: 1200, rating: 4.5, reviews: 178, brand: 'Klein Tools', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80', description: 'Professional wire stripper for 10-18 AWG cables.' },
  { id: 't6', name: 'Conduit Bender 1/2"', category: 'electrician', price: 3200, rating: 4.6, reviews: 67, brand: 'Ideal', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', description: 'Lightweight conduit bender with angle markings for precise bends.' },
  { id: 't7', name: 'OBD2 Car Diagnostic Scanner', category: 'mechanic', price: 8500, rating: 4.8, reviews: 312, brand: 'Autel', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80', badge: 'Best Seller', description: 'Full system OBD2 scanner with live data, code reader, and ABS bleeding.' },
  { id: 't8', name: 'Hydraulic Floor Jack 3T', category: 'mechanic', price: 12000, rating: 4.7, reviews: 145, brand: 'Torin', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', description: '3-ton low-profile hydraulic jack for cars and light trucks.' },
  { id: 't9', name: 'Impact Wrench 1/2" Drive', category: 'mechanic', price: 18000, rating: 4.9, reviews: 224, brand: 'Milwaukee', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80', badge: 'Top Rated', description: '700 ft-lb maximum fastening torque cordless impact wrench.' },
  { id: 't10', name: 'Circular Saw 7-1/4"', category: 'carpenter', price: 9500, rating: 4.7, reviews: 189, brand: 'DeWalt', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80', badge: 'Best Seller', description: '15-amp motor circular saw with magnesium blade guards.' },
  { id: 't11', name: 'Wood Chisel Set 6pcs', category: 'carpenter', price: 2200, rating: 4.5, reviews: 93, brand: 'Narex', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', description: 'Chrome-manganese steel chisels with ergonomic handles.' },
  { id: 't12', name: 'Random Orbital Sander', category: 'carpenter', price: 5800, rating: 4.6, reviews: 134, brand: 'Bosch', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', description: '5" random orbital sander with dust collection system.' },
  { id: 't13', name: 'Airless Paint Sprayer', category: 'painter', price: 22000, rating: 4.8, reviews: 78, brand: 'Graco', image: 'https://images.unsplash.com/photo-1621905251189-08b45249681f?w=400&q=80', badge: 'Professional', description: '515 spray tip for walls, ceilings and decks.' },
  { id: 't14', name: 'Roller Extension Pole 8ft', category: 'painter', price: 1500, rating: 4.4, reviews: 210, brand: 'Purdy', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', description: 'Adjustable aluminum extension pole, compatible with all rollers.' },
  { id: 't15', name: 'Manifold Gauge Set AC', category: 'hvac', price: 8800, rating: 4.7, reviews: 112, brand: 'Yellow Jacket', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80', description: 'R-410A/R-22 manifold gauge set with 60" hoses.' },
  { id: 't16', name: 'Refrigerant Recovery Machine', category: 'hvac', price: 35000, rating: 4.8, reviews: 45, brand: 'Robinair', image: 'https://images.unsplash.com/photo-1621905251189-08b45249681f?w=400&q=80', badge: 'Professional', description: 'High-speed refrigerant recovery machine, all refrigerant types.' },
  { id: 't17', name: 'Appliance Repair Toolkit', category: 'appliance_repair', price: 4500, rating: 4.6, reviews: 156, brand: 'iFixit', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80', description: '64-piece electronics and appliance repair driver kit.' },
  { id: 't18', name: 'Lockpick Professional Set', category: 'locksmith', price: 6200, rating: 4.5, reviews: 88, brand: 'Sparrows', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', description: 'Stainless steel lockpick set in leather case, 22 pieces.' },
];

export default function ToolsMarketplace() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  const filtered = TOOLS_CATALOG.filter(tool => {
    const matchCat = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchSearch = !search || tool.name.toLowerCase().includes(search.toLowerCase()) || tool.brand.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (tool) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === tool.id);
      if (existing) return prev.map(i => i.id === tool.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...tool, qty: 1 }];
    });
  };

  const removeFromCart = (toolId) => setCart(prev => prev.filter(i => i.id !== toolId));
  const updateQty = (toolId, qty) => {
    if (qty < 1) return removeFromCart(toolId);
    setCart(prev => prev.map(i => i.id === toolId ? { ...i, qty } : i));
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (!user) return <LoadingSpinner text="Loading marketplace..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('TechnicianDashboard')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-teal-600" />
                Tools Marketplace
              </h1>
              <p className="text-gray-500">Professional tools for every trade</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="relative"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tools, brands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-12 bg-white"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border hover:border-teal-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">{filtered.length} tools found</p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(tool => (
            <ToolCard key={tool.id} tool={tool} onAddToCart={addToCart} cart={cart} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No tools found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onRemove={removeFromCart}
        onUpdateQty={updateQty}
        total={totalPrice}
      />
    </div>
  );
}
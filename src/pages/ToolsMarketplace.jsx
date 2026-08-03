import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Search, ShoppingCart, Star, Package,
  Wrench, Droplets, Zap, Hammer, Paintbrush, Wind,
  Refrigerator, Key, ArrowLeft, Tag, PlusCircle, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ToolCard from '../components/marketplace/ToolCard';
import CartDrawer from '../components/marketplace/CartDrawer';
import SellToolDialog from '../components/marketplace/SellToolDialog';

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

export default function ToolsMarketplace() {
  const [user, setUser] = useState(null);
  const [technician, setTechnician] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        // Check if user is a technician
        if (userData.user_type === 'technician') {
          const techs = await base44.entities.Technician.filter({ user_id: userData.id });
          if (techs.length > 0) setTechnician(techs[0]);
        }
      } catch (e) {
        // Not logged in — still allow browsing
      }
    };
    loadUser();
  }, []);

  const { data: dbTools = [], isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: () => base44.entities.Tool.filter({ status: 'approved' }, '-created_date', 200),
  });

  const filtered = dbTools.filter(tool => {
    const matchCat = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchSearch = !search ||
      tool.name?.toLowerCase().includes(search.toLowerCase()) ||
      tool.brand?.toLowerCase().includes(search.toLowerCase());
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
  const totalPrice = cart.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  const isTechnician = user?.user_type === 'technician' && !!technician;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('TechnicianDashboard')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-teal-600" />
                Tools Marketplace
              </h1>
              <p className="text-gray-500">Professional tools & items for every trade</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isTechnician && (
              <Button
                onClick={() => setSellOpen(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <PlusCircle className="w-5 h-5 mr-1" />
                Sell an Item
              </Button>
            )}
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
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tools, brands, items..."
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
        <p className="text-sm text-gray-500 mb-4">
          {isLoading ? 'Loading...' : `${filtered.length} items found`}
        </p>

        {/* Grid */}
        {isLoading ? (
          <LoadingSpinner text="Loading marketplace..." />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(tool => (
                <ToolCard key={tool.id} tool={tool} onAddToCart={addToCart} cart={cart} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No items found</p>
                <p className="text-sm">Try a different search or category</p>
                {isTechnician && (
                  <Button onClick={() => setSellOpen(true)} variant="outline" className="mt-4">
                    <PlusCircle className="w-4 h-4 mr-1" /> Be the first to list an item
                  </Button>
                )}
              </div>
            )}
          </>
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

      {isTechnician && (
        <SellToolDialog
          open={sellOpen}
          onClose={() => setSellOpen(false)}
          technician={technician}
          user={user}
        />
      )}
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard,
  Briefcase,
  Wrench,
  CalendarClock,
  DollarSign,
  Star,
  ShieldAlert,
  Users,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  Clock,
  ShoppingBag,
  Car,
  HelpCircle,
  MessageCircle,
  X,
} from 'lucide-react';

const MAIN_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'gigs', label: 'Gigs', icon: Briefcase },
  { key: 'technicians', label: 'Technicians', icon: Wrench },
  { key: 'bookings', label: 'Bookings', icon: CalendarClock },
  { key: 'earnings', label: 'Earnings', icon: DollarSign },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'disputes', label: 'Disputes', icon: ShieldAlert },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'payments', label: 'Payments', icon: Wallet },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

const MGMT_NAV = [
  { key: 'pending', label: 'Pending Approvals', icon: Clock },
  { key: 'tools', label: 'Tools', icon: ShoppingBag },
  { key: 'drivers', label: 'Drivers', icon: Car },
];

export default function AdminSidebar({ activeNav, onNav, open, onClose, pendingCount = 0 }) {
  const renderLink = (item) => {
    const Icon = item.icon;
    const isActive = activeNav === item.key;
    return (
      <button
        key={item.key}
        onClick={() => { onNav(item.key); onClose?.(); }}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.key === 'pending' && pendingCount > 0 && (
          <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
            {pendingCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-0px)] w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2.5">
            <img
              src="https://media.base44.com/images/public/695420244ced3f7c551d2538/c32b9fbf9_Gemini_Generated_Image_5ukoir5ukoir5uko.png"
              alt="Fixie"
              className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
            />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Fixie</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          <div className="space-y-1">
            <p className="px-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Menu
            </p>
            {MAIN_NAV.map(renderLink)}
          </div>
          <div className="space-y-1">
            <p className="px-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Management
            </p>
            {MGMT_NAV.map(renderLink)}
          </div>
        </nav>

        {/* Bottom help */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-semibold text-gray-900">Need Help?</p>
            </div>
            <a href="#" className="text-xs text-emerald-600 font-medium hover:underline">
              Contact support
            </a>
          </div>
          <a
            href={base44.agents?.getWhatsAppConnectURL?.('fixie_booking_agent') || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl py-2.5 text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Book via WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, Sun, Menu, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function AdminTopbar({ user, onMenu, title, subtitle }) {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const today = format(new Date(), 'MMM d, yyyy');

  const toggleDark = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('fixie-theme', next ? 'dark' : 'light');
    setDark(next);
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900 backdrop-blur border-b border-gray-100 dark:border-slate-800">
      <div className="px-4 sm:px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={onMenu}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            {title || 'Welcome back, Admin 👋'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
            {subtitle || "Here's what's happening on Fixie today."}
          </p>
        </div>

        {/* Search */}
        <div className="hidden md:flex relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search anything..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <button
          onClick={() => navigate('/NotificationCenter')}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </button>

        <button
          onClick={toggleDark}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300">
          <Calendar className="w-4 h-4 text-gray-400" />
          {today}
        </div>

        <div className="flex items-center gap-2.5 pl-1">
          <Avatar className="w-9 h-9 ring-1 ring-gray-200 dark:ring-slate-700">
            <AvatarImage src={user?.profile_photo} />
            <AvatarFallback className="bg-emerald-50 text-emerald-700 text-sm font-semibold">
              {user?.full_name?.[0] || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.full_name || 'Admin'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Super Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
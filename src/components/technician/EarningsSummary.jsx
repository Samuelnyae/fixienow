import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { TrendingUp, Calendar, ArrowUpRight, Briefcase } from 'lucide-react';

export default function EarningsSummary({ dailyEarnings, weeklyEarnings, todayJobs, weekJobs }) {
  return (
    <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 rounded-3xl p-6 text-white relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-teal-100 text-sm font-medium">Today's Earnings</p>
            <h2 className="text-4xl font-bold mt-1">
              KES {dailyEarnings.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </h2>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-teal-200" />
              <span className="text-teal-100 text-xs">This Week</span>
            </div>
            <p className="font-bold text-base">KES {weeklyEarnings.toLocaleString()}</p>
            <p className="text-teal-200 text-xs mt-0.5">{weekJobs} jobs</p>
          </div>

          <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 mb-1">
              <Briefcase className="w-3.5 h-3.5 text-teal-200" />
              <span className="text-teal-100 text-xs">Today</span>
            </div>
            <p className="font-bold text-base">{todayJobs}</p>
            <p className="text-teal-200 text-xs mt-0.5">jobs done</p>
          </div>

          <Link
            to={createPageUrl('TechnicianEarnings')}
            className="bg-white/15 rounded-xl p-3 backdrop-blur-sm hover:bg-white/25 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-teal-100 text-xs">Full Report</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-teal-200" />
            </div>
            <p className="font-semibold text-sm mt-2">View →</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
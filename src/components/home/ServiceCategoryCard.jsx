import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { 
  Wrench, 
  Droplets, 
  Zap, 
  Hammer, 
  Paintbrush, 
  Wind, 
  Refrigerator, 
  Key 
} from 'lucide-react';

const iconMap = {
  mechanic: Wrench,
  plumber: Droplets,
  electrician: Zap,
  carpenter: Hammer,
  painter: Paintbrush,
  hvac: Wind,
  appliance_repair: Refrigerator,
  locksmith: Key,
};

const colorMap = {
  mechanic: 'from-blue-500 to-blue-600',
  plumber: 'from-cyan-500 to-cyan-600',
  electrician: 'from-amber-500 to-amber-600',
  carpenter: 'from-orange-500 to-orange-600',
  painter: 'from-pink-500 to-pink-600',
  hvac: 'from-indigo-500 to-indigo-600',
  appliance_repair: 'from-purple-500 to-purple-600',
  locksmith: 'from-slate-500 to-slate-600',
};

const bgColorMap = {
  mechanic: 'bg-blue-50',
  plumber: 'bg-cyan-50',
  electrician: 'bg-amber-50',
  carpenter: 'bg-orange-50',
  painter: 'bg-pink-50',
  hvac: 'bg-indigo-50',
  appliance_repair: 'bg-purple-50',
  locksmith: 'bg-slate-50',
};

export default function ServiceCategoryCard({ category }) {
  const Icon = iconMap[category.slug] || Wrench;
  const gradient = colorMap[category.slug] || 'from-teal-500 to-teal-600';
  const bgColor = bgColorMap[category.slug] || 'bg-teal-50';

  return (
    <Link 
      to={createPageUrl(`Services?category=${category.slug}`)}
      className="group"
    >
      <div className={`${bgColor} rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 group-hover:shadow-md transition-shadow`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
        <p className="text-sm text-gray-500">
          From KES {category.base_price?.toLocaleString() || '500'}
        </p>
      </div>
    </Link>
  );
}
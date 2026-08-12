import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SPARK_COLORS = {
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  violet: '#8b5cf6',
};

export default function AdminStatCard({ icon: Icon, label, value, change, trend = [], accent = 'emerald', bg = 'bg-emerald-50', color = 'text-emerald-600' }) {
  const stroke = SPARK_COLORS[accent] || '#10b981';
  const up = change > 0;
  const flat = change === 0;
  const trendText = flat ? 'No change' : `${up ? '↑' : '↓'} ${Math.abs(change)}% vs last month`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          {Icon && <Icon className={`w-5 h-5 ${color}`} />}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${flat ? 'text-gray-500' : up ? 'text-emerald-600' : 'text-red-500'}`}>
          {flat ? <Minus className="w-3 h-3" /> : up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendText}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none truncate">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
      {trend.length > 1 && (
        <div className="h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend.map((v, i) => ({ i, v }))}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={stroke}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
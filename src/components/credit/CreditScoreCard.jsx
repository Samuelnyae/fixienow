import React from 'react';
import { TrendingUp, ShieldCheck } from 'lucide-react';
import { computeCreditScore, bandFor, tierFor } from '@/lib/creditScore';

// Reusable credit-score card for technician / driver dashboards.
// Props: profile (the normalised record) — see computeCreditScore input shape.
export default function CreditScoreCard({ profile, compact = false }) {
  const data = React.useMemo(() => computeCreditScore(profile), [profile]);

  const band = bandFor(data.score);
  const tier = tierFor(data.score);
  const circumference = 2 * Math.PI * 52;
  const dash = (data.score / 850) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#0B463C]/10 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-[#0B463C]" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">Fixie Credit Score</h3>
          <p className="text-xs text-gray-500">Your hustle, turned into credit</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Gauge */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke={band.ring} strokeWidth="10"
              strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{data.score}</span>
            <span className={`text-xs font-medium ${band.tailwind}`}>{band.label}</span>
          </div>
        </div>

        {/* Tier + factors */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 bg-[#0B463C]/5 text-[#0B463C] rounded-full px-3 py-1 text-xs font-semibold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            {tier}
          </div>
          {!compact && (
            <div className="space-y-1.5">
              {data.factors.slice(0, 4).map((f) => (
                <div key={f.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 truncate mr-2">{f.label}</span>
                  <span className="font-medium text-gray-700 whitespace-nowrap">
                    +{f.points}<span className="text-gray-400">/{f.max}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <p className="text-xs text-gray-400 mt-4">
          A score of 670+ makes you eligible for partner micro-loans, asset finance and insurance.
        </p>
      )}
    </div>
  );
}
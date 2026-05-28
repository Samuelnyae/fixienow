import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Shield, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const severityConfig = {
  high: { color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', icon: 'text-red-500', bar: 'bg-red-500' },
  medium: { color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500', bar: 'bg-amber-500' },
  low: { color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-500', bar: 'bg-blue-400' },
};

export default function FraudAlertCard({ alert }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig[alert.severity] || severityConfig.low;

  return (
    <div className={`rounded-xl border p-4 ${cfg.color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.icon}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cfg.badge}>{alert.severity?.toUpperCase()}</Badge>
              <span className="text-xs text-gray-500 bg-white/70 px-2 py-0.5 rounded-full border">{alert.type}</span>
            </div>
            <p className="font-semibold text-gray-900 mt-1">{alert.title}</p>
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{alert.description}</p>

            {/* Confidence bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cfg.bar}`}
                  style={{ width: `${alert.confidence}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{alert.confidence}% confidence</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-gray-400 hover:text-gray-600 mt-1 shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-current/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Target className="w-3 h-3" /> Affected
              </p>
              <p className="text-sm font-mono font-medium">
                #{alert.affected_id} <span className="text-gray-400 text-xs">({alert.affected_type})</span>
              </p>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Recommendation
              </p>
              <p className="text-sm">{alert.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
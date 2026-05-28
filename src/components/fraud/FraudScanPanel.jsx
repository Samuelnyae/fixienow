import React from 'react';
import { Shield, Zap, Eye, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: AlertTriangle, color: 'text-red-500 bg-red-50', title: 'Anomaly Detection', desc: 'Spots unusual booking or payment patterns' },
  { icon: Eye, color: 'text-blue-500 bg-blue-50', title: 'Identity Risk', desc: 'Flags suspicious technician profiles' },
  { icon: TrendingUp, color: 'text-amber-500 bg-amber-50', title: 'Price Manipulation', desc: 'Detects inflated or fake pricing' },
  { icon: Shield, color: 'text-green-500 bg-green-50', title: 'Account Security', desc: 'Monitors for account takeover signals' },
];

export default function FraudScanPanel({ onScan, isScanning }) {
  return (
    <div className="bg-white rounded-2xl border p-8 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Shield className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">AI Fraud Detection</h2>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Run an AI-powered scan of all platform activity to detect suspicious patterns, fraud attempts, and security risks.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {features.map((f, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 text-left">
            <div className={`w-9 h-9 rounded-lg ${f.color} flex items-center justify-center mb-2`}>
              <f.icon className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-gray-900">{f.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>

      <Button
        onClick={onScan}
        disabled={isScanning}
        size="lg"
        className="bg-red-600 hover:bg-red-700 px-8"
      >
        {isScanning ? (
          <><Zap className="w-5 h-5 mr-2 animate-pulse" />Analyzing Data...</>
        ) : (
          <><Zap className="w-5 h-5 mr-2" />Start AI Scan</>
        )}
      </Button>
      <p className="text-xs text-gray-400 mt-3">Takes 10–20 seconds to analyze all platform data</p>
    </div>
  );
}
import React from 'react';
import { ShieldCheck, IdCard, Award } from 'lucide-react';

/**
 * Trust card shown on technician profiles explaining what "Verified" means.
 * Only renders when the technician is approved.
 */
export default function VerificationCard({ technician }) {
  if (technician?.verification_status !== 'approved') return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-teal-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Fixie Verified</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        This technician has passed Fixie's identity and qualification checks.
      </p>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <IdCard className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>National ID confirmed</span>
          <ShieldCheck className="w-4 h-4 text-green-600 ml-auto" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Award className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>Professional certificate checked</span>
          <ShieldCheck className="w-4 h-4 text-green-600 ml-auto" />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Backed by the Fixie Guarantee on every booking.
      </p>
    </div>
  );
}
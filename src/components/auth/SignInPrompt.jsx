import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignInPrompt({ title = 'Sign in to continue', message }) {
  const next = window.location.pathname + window.location.search;
  const encoded = encodeURIComponent(next);
  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-teal-900">{title}</p>
          <p className="text-sm text-teal-800/80 mt-0.5">
            {message ||
              "You can browse and build your request freely — we only ask for sign-in now so your booking is saved to your account for tracking, payment, and support."}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button asChild className="flex-1 h-11 bg-teal-600 hover:bg-teal-700">
          <Link to={`/login?next=${encoded}`}>
            <LogIn className="w-4 h-4 mr-2" /> Sign in
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 h-11 border-teal-200 text-teal-700 hover:bg-teal-50">
          <Link to={`/register?next=${encoded}`}>
            <UserPlus className="w-4 h-4 mr-2" /> Create account
          </Link>
        </Button>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';

/**
 * Inline quick sign-in / sign-up that runs on the booking/ride confirm screen
 * (no redirect). On success calls onSuccess(user) so the caller can persist the
 * user and proceed with the pending action.
 *
 * Platform auth is email + password with email OTP verification, so sign-up
 * takes one extra step (the emailed code) — similar to Bolt/Uber's OTP step.
 */
export default function InlineAuthPanel({ onSuccess, message }) {
  const [mode, setMode] = useState('signup'); // 'signup' | 'signin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('form'); // 'form' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finish = async () => {
    let me;
    try {
      me = await base44.auth.me();
    } catch (e) {
      setError('Signed in, but we could not load your account. Please refresh the page.');
      return;
    }
    if (name && !me.full_name) {
      try {
        await base44.auth.updateMe({ full_name: name });
        me = { ...me, full_name: name };
      } catch {
        /* name is optional for the booking flow */
      }
    }
    onSuccess(me);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        await base44.auth.loginViaEmailPassword(email, password);
        setLoading(false);
        await finish();
      } else {
        await base44.auth.register({ email, password });
        setStage('otp');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await base44.auth.verifyOtp({ email, otpCode: otp });
      if (res?.access_token) base44.auth.setToken(res.access_token);
      setLoading(false);
      await finish();
    } catch (err) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-teal-900">
            {stage === 'otp' ? 'Enter the code we sent you' : mode === 'signin' ? 'Sign in to continue' : 'Create your account to continue'}
          </p>
          <p className="text-sm text-teal-800/80 mt-0.5">
            {message || 'Just one quick step so your booking is saved to your account for tracking, payment, and support.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 px-3 py-2">
          {error}
        </div>
      )}

      {stage === 'otp' ? (
        <form onSubmit={verify} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ia-otp" className="text-teal-900 text-sm font-medium">Verification code</Label>
            <Input
              id="ia-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="h-11 border-teal-200 focus:border-teal-600 focus:ring-teal-600 tracking-[0.3em] text-center"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-teal-600 hover:bg-teal-700">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : 'Verify & continue'}
          </Button>
        </form>
      ) : (
        <>
          <div className="flex gap-1 p-1 bg-teal-100/60 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-teal-800 shadow-sm' : 'text-teal-700/70'}`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${mode === 'signin' ? 'bg-white text-teal-800 shadow-sm' : 'text-teal-700/70'}`}
            >
              I have an account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="ia-name" className="text-teal-900 text-sm font-medium">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                  <Input
                    id="ia-name"
                    type="text"
                    placeholder="Jane Wanjiru"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 pl-9 border-teal-200 focus:border-teal-600 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="ia-email" className="text-teal-900 text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                <Input
                  id="ia-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-9 border-teal-200 focus:border-teal-600 focus:ring-teal-600"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ia-pw" className="text-teal-900 text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                <Input
                  id="ia-pw"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-9 border-teal-200 focus:border-teal-600 focus:ring-teal-600"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-teal-600 hover:bg-teal-700">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Please wait...</>
                : mode === 'signin'
                  ? <><LogIn className="w-4 h-4 mr-2" /> Sign in & confirm</>
                  : <><UserPlus className="w-4 h-4 mr-2" /> Continue</>}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
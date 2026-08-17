import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import GoogleIcon from "@/components/GoogleIcon";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  UserRound,
  CalendarClock,
  ShieldCheck,
  Globe,
  ChevronDown,
  Fingerprint,
  Zap,
  Users,
  Wrench,
} from "lucide-react";

const BRANDING_POINTS = [
  { icon: UserRound, text: "Verified & trusted technicians: All professionals are vetted and reviewed" },
  { icon: CalendarClock, text: "Book in minutes: Quick booking, easy scheduling" },
  { icon: ShieldCheck, text: "Secure & reliable: Your data and payments are protected" },
];

const FOOTER_CARDS = [
  { icon: ShieldCheck, title: "Secure Authentication", desc: "Your data is encrypted and always protected." },
  { icon: Fingerprint, title: "Multiple Sign-in Options", desc: "Choose what works best for you – email, Google or Apple." },
  { icon: Zap, title: "Fast & Simple", desc: "Get in, book and get help in just a few taps." },
  { icon: Users, title: "Built for Everyone", desc: "A seamless experience across all your devices." },
];

const AVATAR_COLORS = ["bg-amber-400", "bg-rose-400", "bg-sky-400", "bg-violet-400"];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nextParam = new URLSearchParams(window.location.search).get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = next;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", next);
  const handleApple = () => base44.auth.loginWithProvider("apple", next);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Branding panel */}
        <aside
          className="hidden md:flex lg:w-1/2 relative overflow-hidden text-white"
          style={{
            backgroundImage:
              "linear-gradient(160deg, rgba(10,28,22,0.92) 0%, rgba(10,28,22,0.78) 45%, rgba(10,28,22,0.92) 100%), url(https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1400&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 flex flex-col justify-between p-8 lg:p-12 w-full">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 w-fit">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <Wrench className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Fixie</span>
            </Link>

            {/* Hero copy */}
            <div className="max-w-md space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Reliable help, right when you need it.
              </h2>
              <p className="text-white/70 text-base lg:text-lg">
                Fixie connects you with trusted technicians for any job. Fast. Reliable. Near you.
              </p>
              <ul className="space-y-4 pt-2">
                {BRANDING_POINTS.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4.5 h-4.5 text-emerald-300" />
                      </div>
                      <span className="text-sm text-white/80 leading-relaxed pt-1.5">{p.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {["A", "M", "K"].map((c, i) => (
                  <div
                    key={i}
                    className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i]} ring-2 ring-[#0A1C16] flex items-center justify-center text-xs font-bold text-white/90`}
                  >
                    {c}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/70">Join 10,000+ happy customers across Kenya</p>
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <main className="flex-1 lg:w-1/2 flex flex-col">
          <div className="flex-1 flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 sm:px-10 pt-6">
              <Link to="/" className="md:hidden flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#0A1C16] flex items-center justify-center">
                  <Wrench className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <span className="text-xl font-bold text-gray-900">Fixie</span>
              </Link>
              <div className="ml-auto">
                <button className="flex items-center gap-2 h-10 px-3.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  <Globe className="w-4 h-4" />
                  English
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-8">
              <div className="w-full max-w-md">
                <div className="mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back 👋</h1>
                  <p className="text-gray-500 mt-1.5">Sign in to your Fixie account to continue</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-gray-100 mb-7">
                  <span className="pb-3 text-sm font-semibold text-[#228B22] border-b-2 border-[#228B22] -mb-px">
                    Login
                  </span>
                  <Link
                    to={`/register?next=${encodeURIComponent(next)}`}
                    className="pb-3 text-sm font-medium text-gray-400 hover:text-gray-700"
                  >
                    Create Account
                  </Link>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
                      Email or Phone number
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="text"
                        autoComplete="username"
                        autoFocus
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-[#228B22] focus:ring-[#228B22]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                        Password
                      </Label>
                      <Link to="/forgot-password" className="text-xs font-medium text-[#228B22] hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-gray-200 focus:border-[#228B22] focus:ring-[#228B22]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" className="border-gray-300 data-[state=checked]:bg-[#228B22] data-[state=checked]:border-[#228B22]" />
                    <label htmlFor="remember" className="text-sm text-gray-600 select-none cursor-pointer">
                      Remember me
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-[#228B22] hover:bg-[#1c6f1c] text-white shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">or continue with</span>
                  </div>
                </div>

                {/* Social buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-11 text-sm font-medium border-gray-200 hover:bg-gray-50"
                    onClick={handleGoogle}
                    type="button"
                  >
                    <GoogleIcon className="w-4 h-4 mr-2" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 text-sm font-medium border-gray-200 hover:bg-gray-50"
                    onClick={handleApple}
                    type="button"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-current" aria-hidden="true">
                      <path d="M16.365 1.43c0 1.14-.42 2.21-1.18 3.04-.84.92-2.2 1.62-3.32 1.53-.14-1.08.45-2.22 1.13-2.94.78-.84 2.16-1.5 3.37-1.63zM20.94 17.02c-.62 1.42-.92 2.06-1.72 3.32-1.1 1.74-2.66 3.9-4.58 3.92-1.72.02-2.16-1.12-4.5-1.1-2.34.02-2.82 1.13-4.54 1.11-1.92-.02-3.4-1.97-4.5-3.71C-1.06 16.4-1.36 11.4 1.6 8.76c1.2-1.06 2.76-1.66 4.32-1.66 1.6 0 2.6 1.12 3.92 1.12 1.28 0 2.06-1.12 3.9-1.12 1.4 0 2.88.76 3.94 2.08-3.46 1.9-2.9 6.84-.74 7.84z" />
                    </svg>
                    Apple
                  </Button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Don't have an account?{" "}
                  <Link to={`/register?next=${encodeURIComponent(next)}`} className="text-[#228B22] font-medium hover:underline">
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer feature cards */}
      <footer className="hidden lg:grid grid-cols-4 gap-4 px-10 py-6 bg-gray-50 border-t border-gray-100">
        {FOOTER_CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#228B22]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{c.desc}</p>
              </div>
            </div>
          );
        })}
      </footer>
    </div>
  );
}
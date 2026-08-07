import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, Car, Wrench, TrendingUp, Users, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { computeCreditScore, bandFor, tierFor, technicianProfile, driverProfile } from '@/lib/creditScore';

// Straight neomorphism tokens — no skew, evenly aligned.
const NEO_BASE = 'bg-[#e6ebf2]';
const NEO_RAISED = 'bg-[#eef2f7] shadow-[6px_6px_14px_#c9cfdb,-6px_-6px_14px_#ffffff] border border-white/60';

const BANDS = [
  { min: 800, label: 'Excellent', color: '#15803d' },
  { min: 740, label: 'Very Good', color: '#166534' },
  { min: 670, label: 'Good', color: '#1d4ed8' },
  { min: 580, label: 'Fair', color: '#b45309' },
  { min: 0, label: 'Needs Work', color: '#b91c1c' },
];

function bandLabel(score) {
  return BANDS.find((b) => score >= b.min).label;
}

function ScorePill({ score }) {
  const band = bandFor(score);
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: band.color }}>
      <span className="w-2 h-2 rounded-full" style={{ background: band.ring }} />
      {score} · {band.label}
    </span>
  );
}

// Compact circular gauge for a single aggregate score.
function ScoreGauge({ score, size = 120 }) {
  const band = bandFor(score);
  const r = size / 2 - 10;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 850) * circumference;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={band.ring} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 leading-none">{score}</span>
        <span className="text-[11px] font-medium mt-1" style={{ color: band.color }}>{band.label}</span>
      </div>
    </div>
  );
}

export default function CreditReadiness() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u.role !== 'admin' && u.user_type !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setUser(u);
    }).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: technicians = [], isLoading: tLoading } = useQuery({
    queryKey: ['allTechnicians'],
    queryFn: () => base44.entities.Technician.list('-created_date', 200),
    enabled: !!user,
  });
  const { data: drivers = [] } = useQuery({
    queryKey: ['allDrivers'],
    queryFn: () => base44.entities.Driver.list('-created_date', 200),
    enabled: !!user,
  });

  const techRows = technicians
    .map((t) => ({ kind: 'technician', record: t, score: computeCreditScore(technicianProfile(t)) }))
    .sort((a, b) => b.score.score - a.score.score);
  const driverRows = drivers
    .map((d) => ({ kind: 'driver', record: d, score: computeCreditScore(driverProfile(d)) }))
    .sort((a, b) => b.score.score - a.score.score);

  const allRows = [...techRows, ...driverRows].sort((a, b) => b.score.score - a.score.score);
  const creditReady = allRows.filter((r) => r.score.score >= 670);

  if (!user || tLoading) return <LoadingSpinner text="Loading credit readiness…" />;

  // Aggregate overview metrics
  const avg = (rows) => rows.length ? Math.round(rows.reduce((s, r) => s + r.score.score, 0) / rows.length) : 0;
  const platformAvg = avg(allRows);
  const techAvg = avg(techRows);
  const driverAvg = avg(driverRows);
  const readyPct = allRows.length ? Math.round((creditReady.length / allRows.length) * 100) : 0;
  const activeDrivers = drivers.filter((d) => d.is_available).length;

  const bandCounts = BANDS.map((b) => ({
    ...b,
    count: allRows.filter((r) => bandLabel(r.score.score) === b.label).length,
  }));
  const maxBandCount = Math.max(1, ...bandCounts.map((b) => b.count));

  const statCards = [
    { icon: Users, color: 'text-teal-600', bg: 'bg-teal-100', value: allRows.length, label: 'Providers scored' },
    { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100', value: creditReady.length, label: 'Credit-ready (670+)' },
    { icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-100', value: techRows.length, label: 'Technicians' },
    { icon: Car, color: 'text-amber-600', bg: 'bg-amber-100', value: activeDrivers, label: 'Active drivers' },
  ];

  const Row = ({ row }) => {
    const Icon = row.kind === 'driver' ? Car : Wrench;
    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Icon className="w-4 h-4 text-gray-600" /></div>
            <div>
              <p className="font-medium">{row.record.name}</p>
              <p className="text-sm text-gray-500 capitalize">{row.kind}{row.record.vehicle_type ? ` · ${row.record.vehicle_type}` : ''}</p>
            </div>
          </div>
        </TableCell>
        <TableCell><ScorePill score={row.score.score} /></TableCell>
        <TableCell><Badge className="bg-[#0B463C]/10 text-[#0B463C]">{tierFor(row.score.score)}</Badge></TableCell>
        <TableCell className="text-sm text-gray-600">{row.record.rating?.toFixed(1) || '0.0'} ★</TableCell>
        <TableCell className="text-sm text-gray-600">{(row.record.total_jobs || row.record.total_trips || 0)}</TableCell>
        <TableCell className="text-sm text-gray-600">KES {(row.record.wallet_balance || 0).toLocaleString()}</TableCell>
      </TableRow>
    );
  };

  return (
    <div className={`min-h-screen ${NEO_BASE}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-6">
        {/* Header */}
        <div className={`${NEO_RAISED} rounded-2xl px-5 py-4 flex items-center gap-4`}>
          <Link to={createPageUrl('AdminDashboard')} className="text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Credit Readiness</h1>
            <p className="text-gray-500 text-sm hidden sm:block">Provider scores for partner banks & SACCOs</p>
          </div>
        </div>

        {/* Overview: platform average + credit-ready share */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className={`${NEO_RAISED} rounded-2xl p-6 flex items-center gap-6`}>
            <ScoreGauge score={platformAvg} />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Platform average</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{platformAvg}<span className="text-sm text-gray-400 font-normal">/850</span></p>
              <Badge className="bg-[#0B463C]/10 text-[#0B463C] mt-2">{tierFor(platformAvg)}</Badge>
            </div>
          </div>

          <div className={`${NEO_RAISED} rounded-2xl p-6 flex flex-col justify-center`}>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Credit-ready share</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{readyPct}<span className="text-lg text-gray-400 font-normal">%</span></p>
            <p className="text-sm text-gray-500 mt-1">{creditReady.length} of {allRows.length} providers</p>
            <div className="w-full h-2.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${readyPct}%` }} />
            </div>
          </div>

          <div className={`${NEO_RAISED} rounded-2xl p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#0B463C]" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Group averages</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2"><Wrench className="w-3.5 h-3.5 text-blue-600" />Technicians</span>
                <span className="font-semibold text-gray-900">{techAvg}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(techAvg / 850) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2"><Car className="w-3.5 h-3.5 text-amber-600" />Drivers</span>
                <span className="font-semibold text-gray-900">{driverAvg}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(driverAvg / 850) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Band distribution */}
        <div className={`${NEO_RAISED} rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-[#0B463C]" />
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Score distribution</p>
          </div>
          <div className="space-y-2.5">
            {bandCounts.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">{b.label}</span>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(b.count / maxBandCount) * 100}%`, background: b.color }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-8 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`${NEO_RAISED} rounded-2xl p-5 flex flex-col items-center text-center gap-2`}>
                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${s.color}`} /></div>
                <p className="text-xl sm:text-2xl font-bold leading-none">{s.value}</p>
                <p className="text-xs sm:text-sm text-gray-500">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Provider tables */}
        <Tabs defaultValue="all">
          <TabsList className="bg-white border rounded-2xl w-full flex">
            <TabsTrigger value="all" className="flex-1 rounded-xl">All ({allRows.length})</TabsTrigger>
            <TabsTrigger value="ready" className="flex-1 rounded-xl">Credit-ready ({creditReady.length})</TabsTrigger>
            <TabsTrigger value="tech" className="flex-1 rounded-xl">Technicians ({techRows.length})</TabsTrigger>
            <TabsTrigger value="drivers" className="flex-1 rounded-xl">Drivers ({driverRows.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="bg-white rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Score</TableHead><TableHead>Tier</TableHead><TableHead>Rating</TableHead><TableHead>Completed</TableHead><TableHead>Wallet</TableHead></TableRow></TableHeader>
                <TableBody>{allRows.map((r) => <Row key={`${r.kind}-${r.record.id}`} row={r} />)}</TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="ready" className="mt-4">
            <div className="bg-white rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Score</TableHead><TableHead>Tier</TableHead><TableHead>Rating</TableHead><TableHead>Completed</TableHead><TableHead>Wallet</TableHead></TableRow></TableHeader>
                <TableBody>{creditReady.map((r) => <Row key={`${r.kind}-${r.record.id}`} row={r} />)}</TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="tech" className="mt-4">
            <div className="bg-white rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Technician</TableHead><TableHead>Score</TableHead><TableHead>Tier</TableHead><TableHead>Rating</TableHead><TableHead>Jobs</TableHead><TableHead>Wallet</TableHead></TableRow></TableHeader>
                <TableBody>{techRows.map((r) => <Row key={`${r.kind}-${r.record.id}`} row={r} />)}</TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="drivers" className="mt-4">
            <div className="bg-white rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Score</TableHead><TableHead>Tier</TableHead><TableHead>Rating</TableHead><TableHead>Trips</TableHead><TableHead>Wallet</TableHead></TableRow></TableHeader>
                <TableBody>{driverRows.map((r) => <Row key={`${r.kind}-${r.record.id}`} row={r} />)}</TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-gray-400">
          Scores are computed from verified activity: KYC, ratings, completed jobs/trips, and wallet transaction history. They indicate credit readiness, not a guaranteed loan — partners run their own underwriting.
        </p>
      </div>
    </div>
  );
}
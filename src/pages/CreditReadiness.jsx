import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, Car, Wrench, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { computeCreditScore, bandFor, tierFor, technicianProfile, driverProfile } from '@/lib/creditScore';

const NEO_BASE = 'bg-[#e6ebf2]';
const NEO_RAISED = 'bg-[#e6ebf2] shadow-[6px_6px_14px_#c3cad8,-6px_-6px_14px_#ffffff] border border-white/40';
const SKEW = 'skew-y-[-2deg]';

function ScorePill({ score }) {
  const band = bandFor(score);
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: band.color }}>
      <span className="w-2 h-2 rounded-full" style={{ background: band.ring }} />
      {score} · {band.label}
    </span>
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

  const stats = [
    { icon: Users, color: 'text-teal-600', bg: 'bg-teal-100', value: allRows.length, label: 'Providers scored' },
    { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-100', value: creditReady.length, label: 'Credit-ready (670+)' },
    { icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-100', value: techRows.length, label: 'Technicians' },
    { icon: Car, color: 'text-amber-600', bg: 'bg-amber-100', value: driverRows.length, label: 'Drivers' },
  ];

  const Row = ({ row }) => {
    const Icon = row.kind === 'driver' ? Car : Wrench;
    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><Icon className="w-4 h-4 text-gray-600" /></div>
            <div><p className="font-medium">{row.record.name}</p><p className="text-sm text-gray-500 capitalize">{row.kind}{row.record.vehicle_type ? ` · ${row.record.vehicle_type}` : ''}</p></div>
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
        <div className={`flex items-center gap-4 ${NEO_RAISED} rounded-2xl px-5 py-4 ${SKEW}`}>
          <div className="flex items-center gap-4 -skew-y-[2deg] flex-1 min-w-0">
            <Link to={createPageUrl('AdminDashboard')} className="text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Credit Readiness</h1>
              <p className="text-gray-500 text-sm hidden sm:block">Provider scores for partner banks & SACCOs</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`${NEO_RAISED} rounded-2xl p-5 ${SKEW}`}>
                <div className="-skew-y-[2deg] flex flex-col items-center text-center gap-2">
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${s.color}`} /></div>
                  <p className="text-xl sm:text-2xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

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
          Scores are computed from verified activity: KYC, ratings, completed jobs/trips, wallet history, experience and documents. They indicate credit readiness, not a guaranteed loan — partners run their own underwriting.
        </p>
      </div>
    </div>
  );
}
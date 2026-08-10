import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import GigCard from '@/components/gig/GigCard';
import ApplyGigDialog from '@/components/gig/ApplyGigDialog';
import { isSkillMatch, scoreGigForTechnician } from '@/lib/gigMatch';
import { Button } from '@/components/ui/button';
import { Briefcase, RefreshCw, Wrench, LogIn } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function GigBoard() {
  const [activeGig, setActiveGig] = useState(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const meQ = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const me = meQ.data;

  const techQ = useQuery({
    queryKey: ['myTechnicianProfile', me?.id],
    queryFn: () =>
      base44.entities.Technician.filter({ user_id: me.id }).then((r) => r[0] || null),
    enabled: !!me,
  });
  const technician = techQ.data;

  const gigsQ = useQuery({
    queryKey: ['openGigs'],
    queryFn: () => base44.entities.Gig.filter({ status: 'open' }, '-created_date', 100),
    refetchInterval: 30000,
  });

  const myAppsQ = useQuery({
    queryKey: ['myGigApplications', technician?.id],
    queryFn: () =>
      base44.entities.GigApplication.filter({ technician_id: technician.id }, '-created_date', 100),
    enabled: !!technician,
  });

  const appliedIds = useMemo(() => {
    return new Set((myAppsQ.data || []).map((a) => a.gig_id));
  }, [myAppsQ.data]);

  const scored = useMemo(() => {
    if (!technician || !gigsQ.data) return [];
    return gigsQ.data
      .map((g) => ({ gig: g, score: scoreGigForTechnician(g, technician) }))
      .filter((x) => x.score > 0 || isSkillMatch(technician, x.gig.category))
      .sort((a, b) => b.score - a.score);
  }, [technician, gigsQ.data]);

  const onApplied = () => {
    qc.invalidateQueries({ queryKey: ['myGigApplications', technician?.id] });
    qc.invalidateQueries({ queryKey: ['openGigs'] });
  };

  if (!meQ.isLoading && !me) {
    return (
      <Shell title="Same-day gigs">
        <Empty title="Sign in to see gigs" body="Fundi sign in to browse nearby same-day jobs.">
          <Button asChild className="bg-[#0B463C] hover:bg-[#0a3d34]">
            <Link to="/login">
              <LogIn className="w-4 h-4" /> Sign in
            </Link>
          </Button>
        </Empty>
      </Shell>
    );
  }

  if (me && techQ.isSuccess && !technician) {
    return (
      <Shell title="Same-day gigs">
        <Empty
          title="Register as a fundi first"
          body="The gig board matches you by your skills and service areas. Add a technician profile to start receiving same-day gigs."
        >
          <Button asChild className="bg-[#0B463C] hover:bg-[#0a3d34]">
            <Link to={createPageUrl('TechnicianRegister')}>
              <Wrench className="w-4 h-4" /> Register as a fundi
            </Link>
          </Button>
        </Empty>
      </Shell>
    );
  }

  return (
    <Shell title="Same-day gigs">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {technician
            ? `Matched to your skills${technician.profession ? ` · ${technician.profession}` : ''}`
            : 'Loading your profile...'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ['openGigs'] });
            toast({ title: 'Refreshed' });
          }}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {gigsQ.isLoading && <p className="text-sm text-gray-500">Loading gigs...</p>}

      {!gigsQ.isLoading && scored.length === 0 && (
        <Empty
          title="No matching gigs right now"
          body="New same-day gigs show up here automatically. Make sure your skills and service areas are set on your profile."
        />
      )}

      <div className="space-y-3">
        {scored.map(({ gig, score }) => {
          const applied = appliedIds.has(gig.id);
          return (
            <GigCard
              key={gig.id}
              gig={gig}
              score={score}
              footer={
                applied ? (
                  <div className="text-sm font-medium text-green-600 inline-flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" /> Applied
                  </div>
                ) : (
                  <Button
                    className="w-full bg-[#0B463C] hover:bg-[#0a3d34]"
                    onClick={() => setActiveGig(gig)}
                  >
                    Apply now
                  </Button>
                )
              }
            />
          );
        })}
      </div>

      {activeGig && technician && (
        <ApplyGigDialog
          gig={activeGig}
          technician={technician}
          open={!!activeGig}
          onOpenChange={(v) => !v && setActiveGig(null)}
          onApplied={onApplied}
        />
      )}
    </Shell>
  );
}

function Shell({ title, children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
      <p className="text-sm text-gray-500 mb-5">Reverse job board — AI-matched, same-day work.</p>
      {children}
    </div>
  );
}

function Empty({ title, body, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">{body}</p>
      {children}
    </div>
  );
}
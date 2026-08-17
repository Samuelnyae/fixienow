import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import GigCard from '@/components/gig/GigCard';
import { categoryLabel, gigCategoryToBooking } from '@/lib/gigMatch';
import { Button } from '@/components/ui/button';
import { Star, Wallet, MessageSquare, CheckCircle2, Plus, LogIn, Briefcase } from 'lucide-react';

export default function GigMatches() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pickingId, setPickingId] = useState(null);

  const meQ = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const me = meQ.data;

  const gigsQ = useQuery({
    queryKey: ['myGigs', me?.id],
    queryFn: () => base44.entities.Gig.filter({ customer_id: me.id }, '-created_date', 50),
    enabled: !!me,
    refetchInterval: 30000,
  });

  const gigs = gigsQ.data || [];
  const selectedId = params.get('id') || gigs[0]?.id || null;
  const selectedGig = gigs.find((g) => g.id === selectedId) || null;

  const appsQ = useQuery({
    queryKey: ['gigApplications', selectedId],
    queryFn: () => base44.entities.GigApplication.filter({ gig_id: selectedId }, '-match_score', 50),
    enabled: !!selectedId,
    refetchInterval: 15000,
  });

  const apps = appsQ.data || [];

  const pick = async (app) => {
    if (!selectedGig) return;
    setPickingId(app.id);
    try {
      await base44.entities.GigApplication.update(app.id, { status: 'accepted' });

      // Create a Booking from the matched gig so chat, live tracking, payment,
      // review and loyalty all reuse the existing booking engine.
      const agreedPrice =
        app.proposed_price != null ? app.proposed_price
        : selectedGig.budget != null ? selectedGig.budget : 0;
      const booking = await base44.entities.Booking.create({
        user_id: me.id,
        user_name: me.full_name,
        user_phone: me.phone,
        technician_id: app.technician_id,
        technician_name: app.technician_name,
        category: gigCategoryToBooking(selectedGig.category),
        description: selectedGig.description || selectedGig.title,
        status: 'accepted',
        booking_type: 'instant',
        location: selectedGig.location || {},
        estimated_price: agreedPrice,
        payment_status: 'pending',
      });

      await base44.entities.Gig.update(selectedGig.id, {
        status: 'matched',
        matched_technician_id: app.technician_id,
        matched_technician_name: app.technician_name,
        matched_application_id: app.id,
        booking_id: booking.id,
      });

      const others = apps.filter((a) => a.id !== app.id && a.status === 'pending');
      if (others.length) {
        await base44.entities.GigApplication.bulkUpdate(
          others.map((o) => ({ id: o.id, status: 'declined' }))
        );
      }

      try {
        const tech = await base44.entities.Technician.get(app.technician_id);
        if (tech && tech.user_id) {
          await base44.entities.Notification.create({
            user_id: tech.user_id,
            type: 'booking_accepted',
            title: 'Gig matched! 🎉',
            message: `You were picked for "${selectedGig.title}". A booking has been created — open it to confirm timing and start the job.`,
            booking_id: booking.id,
            is_read: false,
            metadata: { category: selectedGig.category, technician_name: app.technician_name },
          });
        }
      } catch (_) {}

      toast({ title: 'Fundi picked!', description: `${app.technician_name} has been notified. Opening your booking…` });
      qc.invalidateQueries({ queryKey: ['gigApplications', selectedId] });
      qc.invalidateQueries({ queryKey: ['myGigs', me.id] });
      navigate(`/BookingDetail?id=${booking.id}`);
    } catch (e) {
      toast({ title: 'Could not pick fundi', description: e.message, variant: 'destructive' });
    } finally {
      setPickingId(null);
    }
  };

  if (!meQ.isLoading && !me) {
    return (
      <Shell>
        <Empty title="Sign in to manage your gigs" body="Post a same-day gig and pick from matched fundis.">
          <Button asChild className="bg-[#0B463C] hover:bg-[#0a3d34]">
            <Link to="/login"><LogIn className="w-4 h-4" /> Sign in</Link>
          </Button>
        </Empty>
      </Shell>
    );
  }

  if (me && gigsQ.isSuccess && gigs.length === 0) {
    return (
      <Shell>
        <Empty title="No gigs yet" body="Post your first same-day gig and we'll match nearby fundis.">
          <Button asChild className="bg-[#0B463C] hover:bg-[#0a3d34]">
            <Link to="/PostGig"><Plus className="w-4 h-4" /> Post a gig</Link>
          </Button>
        </Empty>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your same-day gigs</h1>
          <p className="text-sm text-gray-500">Pick from the fundis who applied.</p>
        </div>
        <Button asChild className="bg-[#0B463C] hover:bg-[#0a3d34]" size="sm">
          <Link to="/PostGig"><Plus className="w-4 h-4" /> New gig</Link>
        </Button>
      </div>

      <div className="space-y-5">
        {/* Gig selector */}
        <div className="space-y-3">
          {gigs.map((g) => {
            const count = g.id === selectedId ? apps.filter((a) => a.status === 'pending').length : null;
            return (
              <GigCard
                key={g.id}
                gig={g}
                selected={g.id === selectedId}
                onClick={() => setParams({ id: g.id })}
                footer={
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {g.status === 'open' && count != null
                        ? `${count} application${count === 1 ? '' : 's'} so far`
                        : g.status === 'matched'
                        ? `Matched: ${g.matched_technician_name || 'a fundi'}`
                        : g.status}
                    </span>
                    {g.status === 'matched' && g.booking_id ? (
                      <Link to={`/BookingDetail?id=${g.booking_id}`} className="text-[#0B463C] font-medium inline-flex items-center gap-1">
                        Open booking →
                      </Link>
                    ) : (
                      <span className="text-[#0B463C] font-medium">{g.id === selectedId ? 'Viewing' : 'View'}</span>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>

        {/* Applications for selected gig */}
        {selectedGig && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Applicants · {categoryLabel(selectedGig.category)}
            </h2>

            {appsQ.isLoading && <p className="text-sm text-gray-500">Loading applications...</p>}

            {!appsQ.isLoading && apps.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <Briefcase className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No applications yet. We're notifying nearby fundis — check back shortly.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {apps.map((a) => (
                <ApplicationRow
                  key={a.id}
                  app={a}
                  gig={selectedGig}
                  onPick={() => pick(a)}
                  picking={pickingId === a.id}
                  disabled={selectedGig.status !== 'open'}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

function ApplicationRow({ app, gig, onPick, picking, disabled }) {
  const isAccepted = app.status === 'accepted' || gig.status === 'matched' && gig.matched_application_id === app.id;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{app.technician_name}</h3>
            {app.match_score ? (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {Math.round(app.match_score)}% match
              </span>
            ) : null}
            {app.status === 'accepted' && (
              <span className="text-xs font-medium text-green-600 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Picked
              </span>
            )}
            {app.status === 'declined' && (
              <span className="text-xs text-gray-400">declined</span>
            )}
          </div>
          {app.message && (
            <p className="text-sm text-gray-600 mb-2 inline-flex items-start gap-1.5">
              <MessageSquare className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
              {app.message}
            </p>
          )}
          {app.proposed_price != null && (
            <p className="text-xs text-gray-500 inline-flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Offer: KES {Number(app.proposed_price).toLocaleString()}
            </p>
          )}
        </div>

        {gig.status === 'open' && app.status === 'pending' && (
          <Button
            size="sm"
            onClick={onPick}
            disabled={picking}
            className="bg-[#0B463C] hover:bg-[#0a3d34]"
          >
            {picking ? 'Picking...' : 'Pick fundi'}
          </Button>
        )}
      </div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
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
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { categoryLabel, scoreGigForTechnician } from '@/lib/gigMatch';

export default function ApplyGigDialog({ gig, technician, open, onOpenChange, onApplied }) {
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setPrice(gig?.budget != null ? String(gig.budget) : '');
      setMessage('');
    }
  }, [open, gig]);

  const handleApply = async () => {
    if (!gig || !technician) return;
    setSaving(true);
    try {
      const existing = await base44.entities.GigApplication.filter({
        gig_id: gig.id,
        technician_id: technician.id,
      });
      if (existing.length) {
        toast({ title: 'Already applied', description: 'You already applied to this gig.' });
        onOpenChange?.(false);
        onApplied?.();
        return;
      }

      const score = scoreGigForTechnician(gig, technician);
      const app = await base44.entities.GigApplication.create({
        gig_id: gig.id,
        customer_id: gig.customer_id,
        technician_id: technician.id,
        technician_name: technician.name,
        proposed_price: Number(price) || gig.budget || 0,
        message,
        status: 'pending',
        match_score: score,
      });

      try {
        await base44.entities.Notification.create({
          user_id: gig.customer_id,
          type: 'booking_new',
          title: 'New gig application',
          message: `${technician.name} applied to "${gig.title}".`,
          is_read: false,
          metadata: { category: gig.category, technician_name: technician.name },
        });
      } catch (_) {
        // notification is best-effort
      }

      toast({ title: 'Application sent', description: 'The customer will see your offer.' });
      onOpenChange?.(false);
      onApplied?.(app);
    } catch (e) {
      toast({ title: 'Could not apply', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply: {gig?.title}</DialogTitle>
          <DialogDescription>
            {categoryLabel(gig?.category)} · {gig?.area_name || 'Location not specified'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="offer">Your offer (KES)</Label>
            <Input
              id="offer"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={gig?.budget ? String(gig.budget) : 'Your price'}
            />
            {gig?.budget != null && (
              <p className="text-xs text-gray-500">Customer budget: KES {Number(gig.budget).toLocaleString()}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg">Message to customer</Label>
            <Textarea
              id="msg"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I can come by 2pm, I'll bring my own tools..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={saving} className="bg-[#0B463C] hover:bg-[#0a3d34]">
            {saving ? 'Sending...' : 'Send application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
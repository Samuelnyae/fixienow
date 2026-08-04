import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const COMMON_ISSUES = [
  'Technician did not show up',
  'Poor quality of work',
  'Damaged property',
  'Overcharged',
  'Rude or unprofessional behavior',
  'Incomplete work',
];

export default function FileDisputeDialog({ booking, user, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const disputeMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        booking_id: booking.id,
        raised_by_id: user.id,
        raised_by_name: user.full_name || user.email,
        raised_by_role: 'user',
        subject: subject.trim(),
        description: description.trim(),
        status: 'open',
      };
      return base44.entities.Dispute.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['disputes']);
      queryClient.invalidateQueries(['bookingDisputes', booking.id]);
      toast({
        title: 'Dispute filed',
        description: 'Our team will review your report and follow up shortly.',
      });
      setSubject('');
      setDescription('');
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'Could not file dispute',
        description: err?.message || 'Please try again.',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    disputeMutation.mutate();
  };

  if (!booking || !user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            File a dispute for booking #{booking.id?.slice(-8).toUpperCase()} ({booking.category?.replace('_', ' ')} service). Our team will review and follow up.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              className="mt-1"
              required
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMON_ISSUES.map((issue) => (
                <button
                  key={issue}
                  type="button"
                  onClick={() => setSubject(issue)}
                  className="text-xs bg-gray-100 hover:bg-amber-50 text-gray-600 hover:text-amber-700 px-2 py-1 rounded-md border border-gray-200"
                >
                  {issue}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened in detail..."
              className="mt-1 min-h-[120px]"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={disputeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={disputeMutation.isPending || !subject.trim() || !description.trim()}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {disputeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Filing...
                </>
              ) : (
                'File Dispute'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
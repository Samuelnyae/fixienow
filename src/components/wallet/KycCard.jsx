import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Camera,
  CreditCard,
  Home,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FileUploadField from './FileUploadField';

async function uploadFile(file) {
  if (!file) return null;
  const res = await base44.integrations.Core.UploadFile({ file });
  return res.file_url;
}

export default function KycCard({ wallet, user }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id_type: 'national_id',
    id_number: '',
    full_name: user?.full_name || '',
    date_of_birth: '',
    address_line: '',
    city: '',
    country: 'Kenya',
  });
  const [files, setFiles] = useState({ id_front: null, id_back: null, selfie: null, address_proof: null });
  const [error, setError] = useState('');

  const { data: submission, isLoading } = useQuery({
    queryKey: ['kycSubmission', user?.id],
    queryFn: async () => {
      const subs = await base44.entities.KYCSubmission.filter({ user_id: user.id }, '-created_date', 5);
      return subs[0] || null;
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!form.full_name?.trim() || !form.id_number?.trim()) {
        throw new Error('Please fill in your full name and ID number.');
      }
      if (!files.id_front || !files.selfie || !files.address_proof) {
        throw new Error('Please upload your ID front, a selfie, and proof of address.');
      }
      const [id_front_url, id_back_url, selfie_url, address_proof_url] = await Promise.all([
        uploadFile(files.id_front),
        uploadFile(files.id_back),
        uploadFile(files.selfie),
        uploadFile(files.address_proof),
      ]);
      return base44.entities.KYCSubmission.create({
        ...form,
        user_id: user.id,
        wallet_id: wallet?.id,
        id_front_url,
        id_back_url,
        selfie_url,
        address_proof_url,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kycSubmission']);
      setShowForm(false);
      setFiles({ id_front: null, id_back: null, selfie: null, address_proof: null });
    },
    onError: (err) => setError(err?.message || 'Failed to submit KYC. Please try again.'),
  });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setFile = (k) => (v) => setFiles((s) => ({ ...s, [k]: v }));

  const isVerified = submission?.status === 'approved';
  const isPending = submission?.status === 'pending';
  const isRejected = submission?.status === 'rejected';
  const needsBack = form.id_type !== 'passport';

  const startOver = () => {
    setError('');
    setFiles({ id_front: null, id_back: null, selfie: null, address_proof: null });
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          isVerified ? 'bg-green-100' : isPending ? 'bg-amber-100' : isRejected ? 'bg-red-100' : 'bg-teal-100'
        }`}>
          {isVerified ? <ShieldCheck className="w-6 h-6 text-green-600" />
            : isPending ? <Clock className="w-6 h-6 text-amber-600" />
            : isRejected ? <ShieldAlert className="w-6 h-6 text-red-600" />
            : <ShieldCheck className="w-6 h-6 text-teal-600" />}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Identity Verification (KYC)</h2>
          <p className="text-xs text-gray-500">
            {isVerified ? 'Your wallet is fully verified' : 'Required to unlock withdrawals & higher limits'}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Verified */}
        {isVerified && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800">Verification complete</p>
              <p className="text-green-700 text-xs mt-0.5">
                Submitted on {new Date(submission.created_date).toLocaleDateString()}. Your wallet limits are unlocked.
              </p>
            </div>
          </div>
        )}

        {/* Pending */}
        {isPending && !showForm && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-medium text-amber-800">Under review</p>
              <p className="text-amber-700 text-xs mt-0.5">
                We're reviewing your documents. This usually takes 1–2 business days.
              </p>
            </div>
          </div>
        )}

        {/* Rejected */}
        {isRejected && !showForm && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm flex-1">
                <p className="font-medium text-red-800">Verification declined</p>
                {submission.rejection_reason && (
                  <p className="text-red-700 text-xs mt-0.5">{submission.rejection_reason}</p>
                )}
              </div>
            </div>
            <Button onClick={startOver} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" /> Submit again
            </Button>
          </div>
        )}

        {/* Not started */}
        {!submission && !showForm && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Verify your identity to unlock wallet withdrawals, deposits, and higher transaction limits.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-teal-600" /> Government ID (front & back)</li>
              <li className="flex items-center gap-2"><Camera className="w-4 h-4 text-teal-600" /> A live selfie</li>
              <li className="flex items-center gap-2"><Home className="w-4 h-4 text-teal-600" /> Proof of address</li>
            </ul>
            <Button onClick={() => setShowForm(true)} className="w-full bg-teal-600 hover:bg-teal-700">
              <ShieldCheck className="w-4 h-4 mr-2" /> Start verification
            </Button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <form
            onSubmit={(e) => { e.preventDefault(); setError(''); submitMutation.mutate(); }}
            className="space-y-6"
          >
            {/* Identity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Identity details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>ID type</Label>
                  <Select value={form.id_type} onValueChange={(v) => setForm((f) => ({ ...f, id_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>ID number</Label>
                  <Input value={form.id_number} onChange={update('id_number')} placeholder="e.g. 12345678" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Full legal name</Label>
                  <Input value={form.full_name} onChange={update('full_name')} placeholder="As on your ID" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of birth</Label>
                  <Input type="date" value={form.date_of_birth} onChange={update('date_of_birth')} />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Documents</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <FileUploadField label="ID — front" required icon={CreditCard} onChange={setFile('id_front')} hint="Upload ID front" />
                {needsBack && <FileUploadField label="ID — back" icon={CreditCard} onChange={setFile('id_back')} hint="Upload ID back" />}
                <FileUploadField label="Selfie" required icon={Camera} capture="user" onChange={setFile('selfie')} hint="Take / upload selfie" />
                <FileUploadField label="Proof of address" required icon={Home} onChange={setFile('address_proof')} hint="Utility bill / bank statement" />
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Residential address</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Street address</Label>
                  <Input value={form.address_line} onChange={update('address_line')} placeholder="House no, street, estate" />
                </div>
                <div className="space-y-1.5">
                  <Label>City / Town</Label>
                  <Input value={form.city} onChange={update('city')} placeholder="e.g. Nairobi" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(''); }} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitMutation.isPending} className="flex-1 bg-teal-600 hover:bg-teal-700">
                {submitMutation.isPending ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" /> Uploading…</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Submit for review</>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
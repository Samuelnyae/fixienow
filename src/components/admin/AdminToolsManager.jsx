import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, CheckCircle2, XCircle, Trash2, Pencil, Package, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const CATEGORIES = [
  { label: 'Plumbing', value: 'plumber' },
  { label: 'Electrical', value: 'electrician' },
  { label: 'Mechanical', value: 'mechanic' },
  { label: 'Carpentry', value: 'carpenter' },
  { label: 'Painting', value: 'painter' },
  { label: 'HVAC', value: 'hvac' },
  { label: 'Appliance', value: 'appliance_repair' },
  { label: 'Locksmith', value: 'locksmith' },
  { label: 'Other', value: 'other' },
];

const CONDITIONS = ['new', 'used', 'refurbished'];

export default function AdminToolsManager({ user }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['adminTools'],
    queryFn: () => base44.entities.Tool.list('-created_date', 200),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Tool.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(['adminTools']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tool.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['adminTools']),
  });

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (tool) => { setEditing(tool); setDialogOpen(true); };

  const pending = tools.filter(t => t.status === 'pending');

  if (isLoading) return <LoadingSpinner text="Loading tools..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Marketplace Tools</h2>
          <p className="text-sm text-gray-500">
            {tools.length} items · {pending.length} pending review
          </p>
        </div>
        <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-1" /> Add Tool
        </Button>
      </div>

      {/* Pending listings */}
      {pending.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 shadow-[4px_4px_10px_#d6c3b0,-4px_-4px_10px_#fff5e6]">
          <h3 className="font-medium text-amber-800 mb-3">
            Pending Technician Listings ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map(tool => (
              <div key={tool.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-amber-100">
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {tool.image_url && <img src={tool.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{tool.name}</p>
                  <p className="text-xs text-gray-500">
                    by {tool.seller_name} · KES {(tool.price || 0).toLocaleString()} · <span className="capitalize">{tool.condition}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => statusMutation.mutate({ id: tool.id, status: 'approved' })}
                  disabled={statusMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => statusMutation.mutate({ id: tool.id, status: 'rejected' })}
                  disabled={statusMutation.isPending}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {tools.map(tool => (
          <div key={tool.id} className="bg-[#e6ebf2] shadow-[6px_6px_14px_#c3cad8,-6px_-6px_14px_#ffffff] border border-white/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {tool.image_url && <img src={tool.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{tool.name}</p>
                <p className="text-xs text-gray-500">KES {(tool.price || 0).toLocaleString()} · <span className="capitalize">{tool.condition || 'new'}</span></p>
                <p className="text-xs text-gray-400 truncate">{tool.seller_name || '—'} · {tool.brand || '—'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge className={
                tool.status === 'approved' ? 'bg-green-100 text-green-700'
                : tool.status === 'pending' ? 'bg-amber-100 text-amber-700'
                : tool.status === 'rejected' ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
              }>
                {tool.status}
              </Badge>
              <div className="flex gap-1">
                {tool.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => statusMutation.mutate({ id: tool.id, status: 'approved' })} disabled={statusMutation.isPending} className="bg-green-600 hover:bg-green-700 h-8">
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => statusMutation.mutate({ id: tool.id, status: 'rejected' })} disabled={statusMutation.isPending} className="h-8">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => openEdit(tool)} className="h-8">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete this listing?')) deleteMutation.mutate(tool.id); }} className="h-8 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-[#e6ebf2] shadow-[6px_6px_14px_#c3cad8,-6px_-6px_14px_#ffffff] border border-white/40 rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.map(tool => (
              <TableRow key={tool.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                      {tool.image_url && <img src={tool.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{tool.name}</p>
                      <p className="text-xs text-gray-400">{tool.brand || '—'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{tool.seller_name || '—'}</p>
                    <Badge variant="outline" className="text-xs capitalize mt-0.5">{tool.seller_type}</Badge>
                  </div>
                </TableCell>
                <TableCell className="font-medium">KES {(tool.price || 0).toLocaleString()}</TableCell>
                <TableCell className="capitalize text-sm">{tool.condition || 'new'}</TableCell>
                <TableCell>
                  <Badge className={
                    tool.status === 'approved' ? 'bg-green-100 text-green-700'
                    : tool.status === 'pending' ? 'bg-amber-100 text-amber-700'
                    : tool.status === 'rejected' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                  }>
                    {tool.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(tool)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { if (confirm('Delete this listing?')) deleteMutation.mutate(tool.id); }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {tools.length === 0 && (
          <div className="text-center py-12 text-gray-400 col-span-full">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tools yet. Click "Add Tool" to create one.</p>
          </div>
        )}
      </div>

      <ToolEditDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tool={editing}
        user={user}
      />
    </div>
  );
}

function ToolEditDialog({ open, onClose, tool, user }) {
  const queryClient = useQueryClient();
  const isEdit = !!tool;

  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', brand: '', condition: 'new',
    stock: '1', image_url: '', badge: '', status: 'approved',
  });
  const [imageFile, setImageFile] = useState(null);

  // Sync form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (tool) {
        setForm({
          name: tool.name || '',
          description: tool.description || '',
          price: String(tool.price || ''),
          category: tool.category || '',
          brand: tool.brand || '',
          condition: tool.condition || 'new',
          stock: String(tool.stock || '1'),
          image_url: tool.image_url || '',
          badge: tool.badge || '',
          status: tool.status || 'approved',
        });
      } else {
        setForm({ name: '', description: '', price: '', category: '', brand: '', condition: 'new', stock: '1', image_url: '', badge: '', status: 'approved' });
      }
      setImageFile(null);
    }
  }, [open, tool]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let image_url = form.image_url;
      if (imageFile) {
        const result = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = result.file_url;
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        category: form.category,
        brand: form.brand,
        condition: form.condition,
        stock: parseInt(form.stock) || 1,
        badge: form.badge,
        image_url,
        status: form.status,
      };

      if (isEdit) {
        return base44.entities.Tool.update(tool.id, payload);
      }
      return base44.entities.Tool.create({
        ...payload,
        seller_id: user?.id,
        seller_name: 'Fixie Store',
        seller_type: 'admin',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminTools']);
      queryClient.invalidateQueries(['tools']);
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Image URL or upload</Label>
            <Input
              value={form.image_url}
              onChange={e => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="mt-1"
            />
            <input
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files[0])}
              className="mt-2 text-xs"
            />
            {form.image_url && !imageFile && (
              <img src={form.image_url} alt="" className="mt-2 max-h-32 rounded-lg" />
            )}
          </div>

          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-[70px]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price (KES)</Label>
              <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Condition</Label>
              <select
                value={form.condition}
                onChange={e => setForm({ ...form, condition: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {CONDITIONS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Brand (optional)</Label>
              <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Badge (optional)</Label>
              <Input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="e.g. Best Seller" className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!form.name || !form.price || !form.category || saveMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isEdit ? 'Save Changes' : 'Add Tool'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
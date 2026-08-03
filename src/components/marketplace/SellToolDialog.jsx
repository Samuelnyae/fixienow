import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Upload, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

export default function SellToolDialog({ open, onClose, technician, user }) {
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    condition: 'new',
    stock: '1',
  });

  useEffect(() => {
    if (!open) {
      setForm({ name: '', description: '', price: '', category: '', brand: '', condition: 'new', stock: '1' });
      setImageFile(null);
      setImagePreview('');
    }
  }, [open]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const createListing = useMutation({
    mutationFn: async () => {
      let image_url = '';
      if (imageFile) {
        const result = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = result.file_url;
      }

      return base44.entities.Tool.create({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        category: form.category,
        brand: form.brand,
        condition: form.condition,
        stock: parseInt(form.stock) || 1,
        image_url,
        seller_id: user?.id,
        seller_name: technician?.name || user?.full_name || 'Technician',
        seller_type: 'technician',
        technician_id: technician?.id,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tools']);
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List an Item for Sale</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image upload */}
          <div>
            <Label>Item Photo</Label>
            <div className="mt-1.5 border-2 border-dashed rounded-xl p-4 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="max-h-40 mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => document.getElementById('sell-image-upload').click()}
                  className="flex flex-col items-center gap-1 text-gray-400 py-4"
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">Click to upload photo</span>
                </button>
              )}
              <input
                id="sell-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sell-name">Item Name</Label>
            <Input
              id="sell-name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Bosch Drill Machine"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="sell-desc">Description</Label>
            <Textarea
              id="sell-desc"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the item, condition, specs..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sell-price">Price (KES)</Label>
              <Input
                id="sell-price"
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 5000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sell-stock">Quantity</Label>
              <Input
                id="sell-stock"
                type="number"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                placeholder="1"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sell-cat">Category</Label>
              <select
                id="sell-cat"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select...</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="sell-cond">Condition</Label>
              <select
                id="sell-cond"
                value={form.condition}
                onChange={e => setForm({ ...form, condition: e.target.value })}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CONDITIONS.map(c => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="sell-brand">Brand (optional)</Label>
            <Input
              id="sell-brand"
              value={form.brand}
              onChange={e => setForm({ ...form, brand: e.target.value })}
              placeholder="e.g. Bosch, DeWalt"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => createListing.mutate()}
            disabled={!form.name || !form.price || !form.category || createListing.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {createListing.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
            ) : (
              'Submit for Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
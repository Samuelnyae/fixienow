import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ServiceAreaManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    name: '', city: 'Nairobi', county: '', center_lat: '', center_lng: '',
    radius_km: '10', base_delivery_fee: '0', is_active: true,
  });
  const queryClient = useQueryClient();

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ['serviceAreas'],
    queryFn: () => base44.entities.ServiceArea.list('-created_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        center_lat: parseFloat(data.center_lat) || null,
        center_lng: parseFloat(data.center_lng) || null,
        radius_km: parseFloat(data.radius_km) || 10,
        base_delivery_fee: parseFloat(data.base_delivery_fee) || 0,
      };
      if (editingArea) {
        return base44.entities.ServiceArea.update(editingArea.id, payload);
      }
      return base44.entities.ServiceArea.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['serviceAreas']);
      setShowDialog(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceArea.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['serviceAreas']),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ServiceArea.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries(['serviceAreas']),
  });

  const handleAdd = () => {
    setEditingArea(null);
    setFormData({
      name: '', city: 'Nairobi', county: '', center_lat: '', center_lng: '',
      radius_km: '10', base_delivery_fee: '0', is_active: true,
    });
    setShowDialog(true);
  };

  const handleEdit = (area) => {
    setEditingArea(area);
    setFormData({
      name: area.name || '',
      city: area.city || 'Nairobi',
      county: area.county || '',
      center_lat: area.center_lat?.toString() || '',
      center_lng: area.center_lng?.toString() || '',
      radius_km: area.radius_km?.toString() || '10',
      base_delivery_fee: area.base_delivery_fee?.toString() || '0',
      is_active: area.is_active !== false,
    });
    setShowDialog(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {areas.length} service area{areas.length !== 1 ? 's' : ''} defined.
            Technicians are matched to bookings based on these areas.
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-1" /> Add Area
        </Button>
      </div>

      {areas.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900">No service areas yet</h3>
          <p className="text-gray-500 mb-4">Define areas so bookings are matched to technicians in the right location.</p>
          <Button onClick={handleAdd} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-1" /> Add Service Area
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {areas.map((area) => (
              <div key={area.id} className="bg-white rounded-xl border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{area.name}</p>
                    <p className="text-sm text-gray-500">{area.city}{area.county ? `, ${area.county}` : ''}</p>
                  </div>
                  <Badge className={area.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {area.is_active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Radius</span>
                  <span>{area.radius_km || 10} km</span>
                </div>
                {area.base_delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Callout fee</span>
                    <span>KES {area.base_delivery_fee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(area)} className="flex-1">
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Switch
                    checked={area.is_active !== false}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: area.id, is_active: checked })}
                  />
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(area.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>County</TableHead>
                  <TableHead>Radius</TableHead>
                  <TableHead>Callout Fee</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.city}</TableCell>
                    <TableCell>{area.county || '—'}</TableCell>
                    <TableCell>{area.radius_km || 10} km</TableCell>
                    <TableCell>{area.base_delivery_fee ? `KES ${area.base_delivery_fee.toLocaleString()}` : '—'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={area.is_active !== false}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: area.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(area)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(area.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArea ? 'Edit Service Area' : 'Add Service Area'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Area Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Westlands"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>County</Label>
                <Input
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  placeholder="e.g. Nairobi"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Center Latitude</Label>
                <Input
                  type="number"
                  value={formData.center_lat}
                  onChange={(e) => setFormData({ ...formData, center_lat: e.target.value })}
                  placeholder="-1.2676"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Center Longitude</Label>
                <Input
                  type="number"
                  value={formData.center_lng}
                  onChange={(e) => setFormData({ ...formData, center_lng: e.target.value })}
                  placeholder="36.8236"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Service Radius (km)</Label>
                <Input
                  type="number"
                  value={formData.radius_km}
                  onChange={(e) => setFormData({ ...formData, radius_km: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Base Callout Fee (KES)</Label>
                <Input
                  type="number"
                  value={formData.base_delivery_fee}
                  onChange={(e) => setFormData({ ...formData, base_delivery_fee: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="cursor-pointer">Active (available for bookings)</Label>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.name || saveMutation.isPending}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Car, Bike, Truck, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const VEHICLE_ICON = { cab: Car, bodaboda: Bike, truck: Truck };
const NEO_RAISED = 'bg-[#e6ebf2] shadow-[6px_6px_14px_#c3cad8,-6px_-6px_14px_#ffffff] border border-white/40';
const NEO_INSET = 'bg-[#e6ebf2] shadow-[inset_5px_5px_10px_#c3cad8,inset_-5px_-5px_10px_#ffffff] border border-white/30';
const SKEW = 'skew-y-[-2deg]';

export default function AdminDriversManager({ user }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('pending');

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['allDrivers'],
    queryFn: () => base44.entities.Driver.list('-created_date', 200),
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Driver.update(id, { verification_status: status }),
    onSuccess: () => queryClient.invalidateQueries(['allDrivers']),
    onError: (e) => alert('Failed to update driver: ' + (e?.message || 'Permission denied.')),
  });

  const pending = drivers.filter((d) => d.verification_status === 'pending');
  const approved = drivers.filter((d) => d.verification_status === 'approved');

  const Row = ({ d }) => {
    const Icon = VEHICLE_ICON[d.vehicle_type] || Car;
    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9"><AvatarImage src={d.profile_photo} /><AvatarFallback>{d.name?.[0]}</AvatarFallback></Avatar>
            <div><p className="font-medium">{d.name}</p><p className="text-sm text-gray-500">{d.phone}</p></div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-500" />
            <span className="capitalize">{d.vehicle_type}</span>
          </div>
        </TableCell>
        <TableCell>{d.vehicle_model}<p className="text-xs text-gray-500">{d.vehicle_plate}</p></TableCell>
        <TableCell>
          <div className="flex gap-2">
            {d.license_url && <a href={d.license_url} target="_blank" rel="noopener noreferrer"><Badge variant="outline" className="cursor-pointer hover:bg-gray-100"><FileText className="w-3 h-3 mr-1" />License</Badge></a>}
            {d.insurance_url && <a href={d.insurance_url} target="_blank" rel="noopener noreferrer"><Badge variant="outline" className="cursor-pointer hover:bg-gray-100"><FileText className="w-3 h-3 mr-1" />Insurance</Badge></a>}
            {!d.license_url && !d.insurance_url && <span className="text-xs text-gray-400">No docs</span>}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={d.verification_status === 'approved' ? 'bg-green-100 text-green-700' : d.verification_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
            {d.verification_status}
          </Badge>
        </TableCell>
        <TableCell>{d.total_trips || 0}</TableCell>
        <TableCell>
          {d.verification_status === 'pending' ? (
            <div className="flex gap-2">
              <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: d.id, status: 'approved' })} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: d.id, status: 'rejected' })}>
                <XCircle className="w-4 h-4 mr-1" /> Reject
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: d.id, status: 'pending' })}>
              Reset
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-2 gap-4`}>
        <div className={`${NEO_RAISED} rounded-2xl p-4 ${SKEW}`}>
          <div className="-skew-y-[2deg] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Car className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xl font-bold leading-none">{pending.length}</p><p className="text-xs text-gray-500">Pending drivers</p></div>
          </div>
        </div>
        <div className={`${NEO_RAISED} rounded-2xl p-4 ${SKEW}`}>
          <div className="-skew-y-[2deg] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-xl font-bold leading-none">{approved.length}</p><p className="text-xs text-gray-500">Approved drivers</p></div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={`${NEO_INSET} border-0 w-full flex rounded-2xl p-1.5 gap-1.5`}>
          <TabsTrigger value="pending" className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-[#0B463C] data-[state=active]:text-white data-[state=inactive]:text-gray-600">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="all" className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-[#0B463C] data-[state=active]:text-white data-[state=inactive]:text-gray-600">All drivers ({drivers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <div className={`${NEO_RAISED} rounded-2xl p-10 text-center`}>
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-semibold">No pending driver applications</p>
            </div>
          ) : (
            <div className={`${NEO_RAISED} rounded-2xl overflow-hidden`}>
              <Table>
                <TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Vehicle</TableHead><TableHead>Details</TableHead><TableHead>Docs</TableHead><TableHead>Status</TableHead><TableHead>Trips</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>{pending.map((d) => <Row key={d.id} d={d} />)}</TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {drivers.length === 0 ? (
            <div className={`${NEO_RAISED} rounded-2xl p-10 text-center`}>
              <Car className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold">No drivers registered yet</p>
              <p className="text-sm text-gray-500">Drivers will appear here after they register.</p>
            </div>
          ) : (
            <div className={`${NEO_RAISED} rounded-2xl overflow-hidden`}>
              <Table>
                <TableHeader><TableRow><TableHead>Driver</TableHead><TableHead>Vehicle</TableHead><TableHead>Details</TableHead><TableHead>Docs</TableHead><TableHead>Status</TableHead><TableHead>Trips</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>{drivers.map((d) => <Row key={d.id} d={d} />)}</TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
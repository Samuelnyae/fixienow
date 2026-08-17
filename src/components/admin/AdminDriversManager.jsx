import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Bike, Truck, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const VEHICLE_ICON = { cab: Car, bodaboda: Bike, truck: Truck };

function statusBadgeClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-red-50 text-red-700 border-red-100';
}

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

  const DriversTable = ({ rows }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Docs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trips</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => {
              const Icon = VEHICLE_ICON[d.vehicle_type] || Car;
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={d.profile_photo} />
                        <AvatarFallback>{d.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-gray-500">{d.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="capitalize">{d.vehicle_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{d.vehicle_model}</p>
                    <p className="text-xs text-gray-500">{d.vehicle_plate}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {d.license_url && (
                        <a href={d.license_url} target="_blank" rel="noopener noreferrer">
                          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100"><FileText className="w-3 h-3 mr-1" />License</Badge>
                        </a>
                      )}
                      {d.insurance_url && (
                        <a href={d.insurance_url} target="_blank" rel="noopener noreferrer">
                          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100"><FileText className="w-3 h-3 mr-1" />Insurance</Badge>
                        </a>
                      )}
                      {!d.license_url && !d.insurance_url && <span className="text-xs text-gray-400">No docs</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusBadgeClass(d.verification_status)}`}>
                      {d.verification_status}
                    </span>
                  </TableCell>
                  <TableCell>{d.total_trips || 0}</TableCell>
                  <TableCell>
                    {d.verification_status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: d.id, status: 'approved' })} className="bg-emerald-600 hover:bg-emerald-700">
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
            })}
          </TableBody>
        </Table>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {rows.map((d) => {
          const Icon = VEHICLE_ICON[d.vehicle_type] || Car;
          return (
            <div key={d.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={d.profile_photo} />
                  <AvatarFallback>{d.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{d.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    <span className="capitalize">{d.vehicle_type}</span> · {d.vehicle_model}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusBadgeClass(d.verification_status)}`}>
                  {d.verification_status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plate / Trips</span>
                <span>{d.vehicle_plate} · {d.total_trips || 0}</span>
              </div>
              {d.verification_status === 'pending' ? (
                <div className="flex gap-2">
                  <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: d.id, status: 'approved' })} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: d.id, status: 'rejected' })} className="flex-1">
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate({ id: d.id, status: 'pending' })} className="w-full">
                  Reset status
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Stat cards — strict 2x2 grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Car className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{pending.length}</p>
              <p className="text-xs text-gray-500 mt-1">Pending drivers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{approved.length}</p>
              <p className="text-xs text-gray-500 mt-1">Approved drivers</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white border border-gray-100 shadow-sm w-full flex rounded-2xl p-1.5 gap-1.5 h-auto">
          <TabsTrigger value="pending" className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-[#0B463C] data-[state=active]:text-white data-[state=inactive]:text-gray-600">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="all" className="flex-1 rounded-xl py-2.5 data-[state=active]:bg-[#0B463C] data-[state=active]:text-white data-[state=inactive]:text-gray-600">All drivers ({drivers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">No pending driver applications</h3>
              <p className="text-sm text-gray-500 mt-1">All driver verifications are up to date.</p>
            </div>
          ) : (
            <DriversTable rows={pending} />
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {drivers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">No drivers registered yet</h3>
              <p className="text-sm text-gray-500 mt-1">Drivers will appear here after they register.</p>
            </div>
          ) : (
            <DriversTable rows={drivers} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Search, Users as UsersIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export default function AdminUsers() {
  const [q, setQ] = React.useState('');
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const filtered = users.filter((u) => {
    const t = `${u.full_name} ${u.email} ${u.role}`.toLowerCase();
    return t.includes(q.toLowerCase());
  });

  const admins = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="text-xs text-gray-500">Total Users</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{admins}</p>
          <p className="text-xs text-gray-500">Admins</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-2xl font-bold text-gray-900">{users.length - admins}</p>
          <p className="text-xs text-gray-500">Members</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">All Users</h3>
            <p className="text-xs text-gray-500">{filtered.length} shown</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users..." className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-500">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No users found.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={u.profile_photo} />
                            <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs">{u.full_name?.[0] || u.email?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{u.full_name || 'Unnamed'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.role === 'admin' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 capitalize' : 'capitalize'}>{u.role || 'user'}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(u.created_date), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y divide-gray-50">
              {filtered.map((u) => (
                <div key={u.id} className="p-4 flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={u.profile_photo} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs">{u.full_name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{u.role || 'user'}</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
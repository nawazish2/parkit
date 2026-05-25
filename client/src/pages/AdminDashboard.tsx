import React, { useState, useEffect } from 'react';
import {
  Shield, Users, MapPin, DollarSign, CheckCircle2, XCircle,
  Clock, Loader2, AlertTriangle, TrendingUp, Building2, Search, RefreshCw,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { ParkingLot, User } from '../types';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdminStats {
  totalUsers: number;
  totalLots: number;
  totalRevenue: number;
  pendingLots: ParkingLot[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'lots' | 'users'>('lots');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [lotSearch, setLotSearch] = useState('');
  const [lotFilter, setLotFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    setFeedback('');
    try {
      const [statsRes, lotsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/lots'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setLots(lotsRes.data);
      setUsers(usersRes.data);
      if (silent) setFeedback('Dashboard refreshed.');
      if (silent) toast({ title: 'Dashboard refreshed', description: 'Admin data is up to date.', variant: 'success' });
    } catch (err) {
      console.error('Failed to fetch admin data', err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (lotId: number, status: 'approved' | 'rejected') => {
    setUpdatingId(lotId);
    setFeedback('');
    try {
      await api.put(`/admin/lots/${lotId}/status`, { status });
      await fetchData(true);
      setFeedback(`Lot ${status} successfully.`);
      toast({ title: `Lot ${status}`, description: 'Property status updated.', variant: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update lot status');
      toast({ title: 'Update failed', description: err.response?.data?.message || 'Failed to update lot status', variant: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLots = lots.filter(lot => {
    const matchesFilter = lotFilter === 'all' || lot.status === lotFilter;
    const matchesSearch = lot.name?.toLowerCase().includes(lotSearch.toLowerCase()) ||
      lot.city?.toLowerCase().includes(lotSearch.toLowerCase()) ||
      lot.address?.toLowerCase().includes(lotSearch.toLowerCase()) ||
      lot.owner?.name?.toLowerCase().includes(lotSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl border border-white/[0.06] bg-[#111118] animate-pulse" />
            ))}
          </div>
          <div className="h-12 rounded-lg border border-white/[0.06] bg-[#111118] animate-pulse" />
          <div className="h-72 rounded-xl border border-white/[0.06] bg-[#111118] animate-pulse" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Platform Revenue',
      value: `₹${stats?.totalRevenue?.toLocaleString('en-IN') ?? 0}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
      subtext: 'Cumulative booking revenue',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/15 border-blue-500/25 text-blue-400',
      onClick: () => setActiveTab('users'),
      subtext: 'Click to view users',
    },
    {
      label: 'Total Properties',
      value: stats?.totalLots ?? 0,
      icon: <Building2 className="w-5 h-5" />,
      color: 'text-violet-400',
      iconBg: 'bg-violet-500/15 border-violet-500/25 text-violet-400',
      onClick: () => {
        setActiveTab('lots');
        setLotFilter('all');
      },
      subtext: 'Click to view properties',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingLots?.length ?? 0,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-amber-400',
      iconBg: 'bg-amber-500/15 border-amber-500/25 text-amber-400',
      pulse: (stats?.pendingLots?.length ?? 0) > 0,
      onClick: () => {
        setActiveTab('lots');
        setLotFilter('pending');
      },
      subtext: (stats?.pendingLots?.length ?? 0) > 0 ? 'Requires attention' : 'All reviewed',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col pb-16">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-80 w-80 rounded-full bg-rose-600/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-[26rem] h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 mt-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-rose-500/15 rounded-lg flex items-center justify-center border border-rose-500/25">
                <Shield className="w-5 h-5 text-rose-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Admin Panel</h1>
            </div>
            <p className="text-slate-400 text-sm ml-[52px]">
              Platform oversight, approvals, and user management
            </p>
            <div className="ml-[52px] mt-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Mobile-friendly review and moderation tools
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            aria-label="Refresh admin dashboard"
            className="border-white/[0.08] hover:bg-white/[0.04] text-slate-300 font-semibold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {feedback && !error && (
          <div role="status" aria-live="polite" className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const isClickable = !!card.onClick;
            return (
              <Card
                key={card.label}
                onClick={card.onClick}
                className={`p-5 rounded-xl border-white/[0.06] bg-[#111118] relative overflow-hidden ${
                  isClickable
                    ? 'cursor-pointer hover:border-rose-500/30 transition-colors'
                    : ''
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-slate-400">{card.label}</span>
                  <div className={`w-9 h-9 ${card.iconBg} border rounded-lg flex items-center justify-center relative`}>
                    {card.icon}
                    {card.pulse && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                {card.subtext && (
                  <div className={`text-xs mt-1 ${
                    card.label === 'Pending Approvals' && (stats?.pendingLots?.length ?? 0) > 0
                      ? 'text-amber-400 font-semibold'
                      : 'text-slate-500'
                  }`}>
                    {card.subtext}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {(stats?.pendingLots?.length ?? 0) > 0 && (
          <Card className="bg-amber-500/10 border-amber-500/20 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/15 rounded-lg flex items-center justify-center shrink-0 border border-amber-500/25">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-300">
                  {stats!.pendingLots.length} property request{stats!.pendingLots.length > 1 ? 's' : ''} pending
                </h4>
                <p className="text-xs text-amber-400/70 mt-0.5">Review and approve or reject submissions.</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setActiveTab('lots');
                setLotFilter('pending');
              }}
              className="px-3 py-2 text-xs font-bold text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg"
            >
              Review →
            </Button>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="bg-[#111118] border border-white/[0.06] p-1 rounded-lg mb-6">
            <TabsTrigger
              value="lots"
              className="px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 hover:text-white"
            >
              <MapPin className="w-4 h-4" />
              <span>Properties</span>
              <Badge className="ml-1 px-1.5 py-0 bg-white/[0.08] text-white border-none text-[10px] rounded-md">{lots.length}</Badge>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 hover:text-white"
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
              <Badge className="ml-1 px-1.5 py-0 bg-white/[0.08] text-white border-none text-[10px] rounded-md">{users.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lots" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="bg-[#111118] border border-white/[0.06] p-1 flex gap-1 rounded-lg w-full sm:w-fit overflow-x-auto">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => {
                  const count = filter === 'all'
                    ? lots.length
                    : lots.filter(l => l.status === filter).length;
                  return (
                    <Button
                      key={filter}
                      variant="ghost"
                      onClick={() => setLotFilter(filter)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize border transition-colors h-auto hover:bg-white/[0.04] hover:text-white ${
                        lotFilter === filter
                          ? filter === 'pending'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : filter === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : filter === 'rejected'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'border-transparent text-slate-400'
                      }`}
                    >
                      {filter}
                      <span className="ml-1 text-[10px] opacity-80">({count})</span>
                    </Button>
                  );
                })}
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search properties..."
                  className="pl-10 text-sm py-2 bg-[#111118] border-white/[0.08] focus:border-blue-500/50"
                  value={lotSearch}
                  onChange={e => setLotSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredLots.length === 0 ? (
              <Card className="p-12 text-center text-slate-500 space-y-2 border-white/[0.06] bg-[#111118]">
                <Building2 className="w-10 h-10 mx-auto opacity-30 text-blue-400" />
                <p className="font-medium text-slate-400">No properties found.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredLots.map((lot: any) => (
                  <Card
                    key={lot.id}
                    className="admin-lot-card p-5 flex flex-col gap-4 border-white/[0.06] bg-[#111118] hover:border-rose-500/30 group relative overflow-hidden transition-colors"
                  >
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-transparent group-hover:bg-rose-500 transition-colors" />
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-white leading-tight">{lot.name}</h3>
                          <Badge className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${
                            lot.status === 'approved'
                              ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
                              : lot.status === 'pending'
                              ? 'text-amber-400 border-amber-500/25 bg-amber-500/10'
                              : 'text-rose-400 border-rose-500/25 bg-rose-500/10'
                          }`}>
                            {lot.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-300 flex items-start gap-1.5 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                          <span>{lot.address}, {lot.city}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 bg-white/[0.02] w-full sm:w-fit px-2.5 py-1 rounded-md border border-white/[0.06] mt-2">
                          <span className="font-semibold text-slate-300">Owner:</span>
                          <span className="text-slate-300 font-medium truncate max-w-[12rem]">{lot.owner?.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-white/[0.06] w-full sm:w-auto">
                        <div className="text-left sm:text-right">
                          <div className="text-xs text-slate-500">Rate</div>
                          <div className="text-xl font-bold text-rose-400">₹{lot.pricePerHour}<span className="text-xs text-slate-500 font-normal">/hr</span></div>
                        </div>

                        {lot.status === 'pending' && (
                          <div className="flex items-center gap-2 sm:w-auto w-full justify-end flex-wrap">
                            <Button
                              id={`approve-lot-${lot.id}`}
                              onClick={() => handleUpdateStatus(lot.id, 'approved')}
                              disabled={updatingId === lot.id}
                              aria-label={`Approve parking lot ${lot.name}`}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
                            >
                              {updatingId === lot.id
                                ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                : <CheckCircle2 className="w-4 h-4 mr-1.5" />
                              }
                              Approve
                            </Button>
                            <Button
                              id={`reject-lot-${lot.id}`}
                              onClick={() => handleUpdateStatus(lot.id, 'rejected')}
                              disabled={updatingId === lot.id}
                              aria-label={`Reject parking lot ${lot.name}`}
                              variant="outline"
                              className="border-rose-500/25 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400 font-bold text-sm"
                            >
                              <XCircle className="w-4 h-4 mr-1.5" /> Reject
                            </Button>
                          </div>
                        )}
                        {lot.status !== 'pending' && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                            lot.status === 'approved'
                              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                              : 'bg-rose-500/15 border-rose-500/25 text-rose-400'
                          }`}>
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search users..."
                className="pl-10 text-sm py-2.5 bg-[#111118] border-white/[0.08] focus:border-blue-500/50"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>

            <Card className="overflow-hidden border-white/[0.06] bg-[#111118] hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                      <TableHead className="p-4 pl-6 font-bold text-slate-300 text-xs uppercase tracking-wide">ID</TableHead>
                      <TableHead className="p-4 font-bold text-slate-300 text-xs uppercase tracking-wide">User</TableHead>
                      <TableHead className="p-4 font-bold text-slate-300 text-xs uppercase tracking-wide">Email</TableHead>
                      <TableHead className="p-4 font-bold text-slate-300 text-xs uppercase tracking-wide">Role</TableHead>
                      <TableHead className="p-4 pr-6 font-bold text-slate-300 text-xs uppercase tracking-wide">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/[0.04]">
                    {filteredUsers.map(u => (
                      <TableRow key={u.id} className="hover:bg-white/[0.02] border-none transition-colors group">
                        <TableCell className="p-4 pl-6 font-mono text-blue-400 font-bold text-xs">#{u.id}</TableCell>
                        <TableCell className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                              {(u.name ? u.name[0] : 'U').toUpperCase()}
                            </div>
                            <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">{u.name || 'Unnamed'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-slate-300">{u.email}</TableCell>
                        <TableCell className="p-4">
                          <Badge className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border ${
                            u.role === 'admin'
                              ? 'text-rose-400 border-rose-500/25 bg-rose-500/10'
                              : u.role === 'owner'
                              ? 'text-violet-400 border-violet-500/25 bg-violet-500/10'
                              : 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
                          }`}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4 pr-6 text-slate-400 text-xs">
                          {new Date((u as any).createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-10 text-center text-slate-500 font-medium">
                          No users match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="space-y-3 md:hidden">
              {filteredUsers.map(u => (
                <Card key={u.id} className="p-4 bg-[#111118] border-white/[0.06] rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(u.name ? u.name[0] : 'U').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{u.name || 'Unnamed'}</div>
                          <div className="text-xs text-slate-400 truncate">{u.email}</div>
                        </div>
                      </div>
                    </div>
                    <Badge className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border shrink-0 ${
                      u.role === 'admin'
                        ? 'text-rose-400 border-rose-500/25 bg-rose-500/10'
                        : u.role === 'owner'
                        ? 'text-violet-400 border-violet-500/25 bg-violet-500/10'
                        : 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
                    }`}>
                      {u.role}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400">
                    Joined {new Date((u as any).createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </Card>
              ))}
              {filteredUsers.length === 0 && (
                <Card className="p-10 text-center text-slate-500 space-y-2 border-white/[0.06] bg-[#111118] rounded-xl">
                  <p className="font-medium text-slate-400">No users match your search.</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;

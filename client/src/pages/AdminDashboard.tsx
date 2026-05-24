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

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const [statsRes, lotsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/lots'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setLots(lotsRes.data);
      setUsers(usersRes.data);
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
    try {
      await api.put(`/admin/lots/${lotId}/status`, { status });
      await fetchData(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update lot status');
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
      <div className="min-h-screen bg-[#06060a] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-slate-400 font-medium">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Platform Revenue',
      value: `₹${stats?.totalRevenue?.toLocaleString('en-IN') ?? 0}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-white',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      glow: 'bg-indigo-600/10',
      subtext: 'Cumulative booking revenue',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'bg-emerald-600/10',
      onClick: () => setActiveTab('users'),
      subtext: 'Click to view registered users',
    },
    {
      label: 'Total Properties',
      value: stats?.totalLots ?? 0,
      icon: <Building2 className="w-5 h-5" />,
      color: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
      glow: 'bg-violet-600/10',
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
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      glow: 'bg-amber-600/10',
      pulse: (stats?.pendingLots?.length ?? 0) > 0,
      onClick: () => {
        setActiveTab('lots');
        setLotFilter('pending');
      },
      subtext: (stats?.pendingLots?.length ?? 0) > 0 ? 'Requires attention ↑' : 'All properties reviewed',
    },
  ];

  return (
    <div className="min-h-screen bg-[#06060a] text-white flex flex-col pb-20 relative overflow-hidden bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      {/* Ambient background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 -right-48 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 mt-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slideUp">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-red-500/15 rounded-2xl flex items-center justify-center border border-red-500/25">
                <Shield className="w-5 h-5 text-red-400 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">Admin Superuser Panel</h1>
            </div>
            <p className="text-slate-400 text-sm ml-13">
              Platform oversight, property approvals, and member directory management
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="border-white/10 hover:bg-white/5 hover:text-white transition-all text-slate-300 font-semibold"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, i) => {
            const isClickable = !!card.onClick;
            return (
              <Card
                key={card.label}
                onClick={card.onClick}
                className={`p-6 rounded-2xl animate-fadeIn transition-all duration-300 relative overflow-hidden group border-white/5 bg-slate-950/40 backdrop-blur-2xl ${
                  isClickable
                    ? 'cursor-pointer hover:scale-[1.02] hover:border-indigo-500/30 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500/50'
                    : ''
                }`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${card.glow} rounded-full blur-xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <span className="text-xs font-semibold text-slate-400">{card.label}</span>
                  <div className={`w-9 h-9 ${card.iconBg} border rounded-xl flex items-center justify-center relative`}>
                    {card.icon}
                    {card.pulse && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                    )}
                  </div>
                </div>
                <div className={`text-3xl font-black ${card.color} relative z-10 font-display`}>{card.value}</div>
                {card.subtext && (
                  <div className={`text-xs mt-1.5 relative z-10 transition-colors duration-300 ${
                    card.label === 'Pending Approvals' && (stats?.pendingLots?.length ?? 0) > 0
                      ? 'text-amber-400/80 font-semibold'
                      : 'text-slate-500 group-hover:text-slate-400/80'
                  }`}>
                    {card.subtext}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Pending Approvals Alert */}
        {(stats?.pendingLots?.length ?? 0) > 0 && (
          <Card className="bg-amber-500/5 border-amber-500/20 p-5 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/25">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-300 font-display">
                  {stats!.pendingLots.length} property request{stats!.pendingLots.length > 1 ? 's' : ''} awaiting approval
                </h4>
                <p className="text-xs text-amber-400/70 mt-0.5">Please review safety details and capacity before approving.</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setActiveTab('lots');
                setLotFilter('pending');
              }}
              className="px-4 py-2 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-all"
            >
              Review Now →
            </Button>
          </Card>
        )}

        {/* Tabs Control */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="bg-slate-950/65 border border-white/5 p-1 rounded-xl mb-6">
            <TabsTrigger
              value="lots"
              className="px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
            >
              <MapPin className="w-4 h-4" />
              <span>Properties</span>
              <Badge className="ml-1 px-1.5 py-0 bg-white/10 text-white border-none shadow-none text-[10px]">{lots.length}</Badge>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="px-5 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white text-slate-400 hover:text-white"
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
              <Badge className="ml-1 px-1.5 py-0 bg-white/10 text-white border-none shadow-none text-[10px]">{users.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lots" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Filter pills */}
              <div className="bg-slate-950/40 border border-white/5 p-1 flex gap-1 rounded-xl w-fit">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => {
                  const count = filter === 'all'
                    ? lots.length
                    : lots.filter(l => l.status === filter).length;
                  return (
                    <Button
                      key={filter}
                      variant="ghost"
                      onClick={() => setLotFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-all h-auto hover:bg-white/5 hover:text-white ${
                        lotFilter === filter
                          ? filter === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : filter === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : filter === 'rejected'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'border-transparent text-slate-400'
                      }`}
                    >
                      {filter}
                      <span className="ml-1.5 text-[10px] opacity-85">({count})</span>
                    </Button>
                  );
                })}
              </div>

              {/* Search properties */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search properties..."
                  className="pl-10 text-sm py-2 bg-slate-900/85 border-white/5 focus:border-indigo-500/50"
                  value={lotSearch}
                  onChange={e => setLotSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredLots.length === 0 ? (
              <Card className="p-14 text-center text-slate-500 space-y-2 border-white/5 bg-slate-950/40">
                <Building2 className="w-10 h-10 mx-auto opacity-30 text-indigo-400 animate-float" />
                <p className="font-medium text-slate-400">No properties found matching the criteria.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredLots.map((lot: any) => (
                  <Card
                    key={lot.id}
                    className="admin-lot-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 border-white/5 bg-slate-950/45 hover:border-indigo-500/30 group relative overflow-hidden transition-all duration-300"
                  >
                    <div className="absolute top-0 left-0 w-[2px] h-full transition-colors duration-300 bg-transparent group-hover:bg-indigo-500" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-bold text-white font-display">{lot.name}</h3>
                        <Badge className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-transparent hover:bg-transparent shadow-none ${
                          lot.status === 'approved'
                            ? 'text-emerald-400 border-emerald-500/20'
                            : lot.status === 'pending'
                            ? 'text-amber-400 border-amber-500/20'
                            : 'text-red-400 border-red-500/20'
                        }`}>
                          {lot.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        {lot.address}, {lot.city}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 bg-white/5 w-fit px-2.5 py-1 rounded-lg border border-white/10 mt-2">
                        <span className="font-semibold text-slate-300">Owner:</span>
                        <span className="text-slate-300 font-medium">{lot.owner?.name}</span>
                        <span className="text-slate-500">|</span>
                        <span className="text-slate-400 font-mono text-[11px]">{lot.owner?.email}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-white/5 md:w-auto w-full justify-between md:justify-end">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-slate-500">Rate</div>
                        <div className="text-xl font-black text-indigo-400 font-display">₹{lot.pricePerHour}<span className="text-xs text-slate-500 font-normal">/hr</span></div>
                      </div>

                      {lot.status === 'pending' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <Button
                            id={`approve-lot-${lot.id}`}
                            onClick={() => handleUpdateStatus(lot.id, 'approved')}
                            disabled={updatingId === lot.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20"
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
                            variant="outline"
                            className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400 font-bold text-sm"
                          >
                            <XCircle className="w-4 h-4 mr-1.5" /> Reject
                          </Button>
                        </div>
                      )}
                      {lot.status !== 'pending' && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                          lot.status === 'approved'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {/* Search filter */}
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search users..."
                className="pl-10 text-sm py-2.5 bg-slate-900/85 border-white/5 focus:border-indigo-500/50"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>

            <Card className="overflow-hidden border-white/5 bg-slate-950/40 backdrop-blur-2xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="p-4 pl-6 font-bold text-slate-300 text-xs uppercase tracking-wider">ID</TableHead>
                      <TableHead className="p-4 font-bold text-slate-300 text-xs uppercase tracking-wider">User</TableHead>
                      <TableHead className="p-4 font-bold text-slate-300 text-xs uppercase tracking-wider">Email</TableHead>
                      <TableHead className="p-4 font-bold text-slate-300 text-xs uppercase tracking-wider">Role</TableHead>
                      <TableHead className="p-4 pr-6 font-bold text-slate-300 text-xs uppercase tracking-wider">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <TableRow key={u.id} className="hover:bg-white/3 border-none transition-colors group">
                        <TableCell className="p-4 pl-6 font-mono text-indigo-400 font-bold text-xs">#{u.id}</TableCell>
                        <TableCell className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-black text-white shadow-md shadow-indigo-600/10">
                              {(u.name ? u.name[0] : 'U').toUpperCase()}
                            </div>
                            <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{u.name || 'Unnamed'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-slate-300">{u.email}</TableCell>
                        <TableCell className="p-4">
                          <Badge className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-transparent hover:bg-transparent shadow-none ${
                            u.role === 'admin'
                              ? 'text-red-400 border-red-500/20'
                              : u.role === 'owner'
                              ? 'text-violet-400 border-violet-500/20'
                              : 'text-emerald-400 border-emerald-500/20'
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;

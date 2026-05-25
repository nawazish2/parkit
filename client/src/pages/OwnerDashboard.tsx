import React, { useState, useEffect } from 'react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  BarChart3, Plus, DollarSign, Percent, Calendar,
  CheckCircle2, Loader2, Building2, RefreshCw, AlertTriangle,
  TrendingUp, Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { ParkingLot } from '../types';

import {
  Card,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

interface OwnerStats {
  revenue: number;
  totalBookings: number;
  occupancyRate: number;
  chartData: { date: string; revenue: number }[];
  recentBookings: any[];
  lots: ParkingLot[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dateStr = label ? new Date(label).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
    return (
      <div className="bg-[#111118] border border-white/[0.08] px-4 py-3 shadow-lg rounded-lg flex flex-col gap-1 z-50">
        <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">{dateStr || label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <p className="text-sm font-bold text-blue-400">₹{payload[0].value.toFixed(0)}</p>
        </div>
      </div>
    );
  }
  return null;
};

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newLot, setNewLot] = useState({
    name: '',
    address: '',
    city: '',
    pricePerHour: 50,
    amenities: 'CCTV, 24/7 Security, Valet',
  });
  const [creatingLot, setCreatingLot] = useState(false);
  const [lotError, setLotError] = useState('');

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    setFeedback('');
    try {
      const res = await api.get('/owner/stats');
      setStats(res.data);
      if (silent) setFeedback('Dashboard refreshed.');
    } catch (err) {
      console.error('Failed to fetch owner stats', err);
      setError('Failed to load dashboard. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    setMounted(true);
  }, []);

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLot(true);
    setLotError('');
    setFeedback('');
    try {
      const amenitiesArr = newLot.amenities.split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/lots', {
        ...newLot,
        amenities: amenitiesArr,
        photos: ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800'],
      });
      setShowModal(false);
      setNewLot({ name: '', address: '', city: '', pricePerHour: 50, amenities: 'CCTV, 24/7 Security, Valet' });
      await fetchStats(true);
      setFeedback('Lot submitted for approval.');
      toast({ title: 'Lot submitted', description: 'Your parking lot is pending approval.', variant: 'success' });
    } catch (err: any) {
      setLotError(err.response?.data?.message || 'Failed to create lot');
      toast({ title: 'Create lot failed', description: err.response?.data?.message || 'Failed to create lot', variant: 'error' });
    } finally {
      setCreatingLot(false);
    }
  };

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 rounded-xl border border-white/[0.06] bg-[#111118] animate-pulse" />
            <div className="h-80 rounded-xl border border-white/[0.06] bg-[#111118] animate-pulse" />
          </div>
          <div className="h-56 rounded-xl border border-white/[0.06] bg-[#111118] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-sm p-6 text-center space-y-4 bg-[#111118] border-white/[0.06]">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-white font-bold text-lg">Failed to load dashboard</h3>
            <p className="text-slate-400 text-sm">{error}</p>
            <Button onClick={() => fetchStats()} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold">Try again</Button>
          </Card>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...stats.chartData.map(d => d.revenue), 1);

  const statCards = [
    {
      label: 'Total Revenue',
      value: `₹${stats.revenue.toFixed(0)}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-emerald-400',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      sub: 'Confirmed bookings',
    },
    {
      label: 'Occupancy Rate',
      value: `${stats.occupancyRate}%`,
      icon: <Percent className="w-5 h-5" />,
      color: 'text-amber-400',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      sub: 'Current slot usage',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings.toString(),
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-blue-400',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      sub: 'Click to view details',
      onClick: () => setShowBookingsModal(true),
    },
    {
      label: 'Active Properties',
      value: stats.lots.length.toString(),
      icon: <Building2 className="w-5 h-5" />,
      color: 'text-violet-400',
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      sub: `${stats.lots.filter(l => l.status === 'approved').length} approved`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col pb-16">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-[28rem] h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 mt-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-violet-500/15 rounded-lg flex items-center justify-center border border-violet-500/20">
                <BarChart3 className="w-5 h-5 text-violet-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Owner Dashboard</h1>
            </div>
            <p className="text-slate-400 text-sm ml-[52px] max-w-xl leading-relaxed">Monitor earnings, occupancy, and manage properties</p>
            <div className="ml-[52px] mt-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live revenue and slot usage
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              aria-label="Refresh owner dashboard"
              className="border-white/[0.08] hover:bg-white/[0.04] text-slate-300 font-semibold"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              id="add-lot-btn"
              onClick={() => setShowModal(true)}
              aria-label="Add parking lot"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              <Plus className="w-5 h-5 mr-1" /> Add Lot
            </Button>
          </div>
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
                className={`p-5 rounded-xl border-white/[0.06] bg-[#111118] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20 ${
                  isClickable ? 'cursor-pointer hover:border-blue-500/30' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-slate-400">{card.label}</span>
                  <div className={`w-9 h-9 ${card.iconBg} border rounded-lg flex items-center justify-center ${card.iconColor}`}>
                    {card.icon}
                  </div>
                </div>
                <div className={`text-2xl font-bold tracking-tight ${card.color}`}>{card.value}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{card.sub}</div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <Card className="lg:col-span-2 p-6 border-white/[0.06] bg-[#111118] relative overflow-hidden rounded-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  7-Day Revenue
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">Daily revenue from confirmed bookings</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">7-Day Total</div>
                <div className="text-lg font-bold text-emerald-400">
                  ₹{stats.chartData.reduce((s, d) => s + d.revenue, 0).toFixed(0)}
                </div>
              </div>
            </div>

            <div className="h-72 w-full relative">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RechartsBarChart data={stats.chartData} barGap={4}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.4}/>
                      </linearGradient>
                      <linearGradient id="barGradientMax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95}/>
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.5}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={val => {
                        const d = new Date(val);
                        return d.toLocaleDateString('en-IN', { weekday: 'short' });
                      }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={val => `₹${val}`}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {stats.chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.revenue === maxRevenue ? 'url(#barGradientMax)' : 'url(#barGradient)'}
                        />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 grid grid-cols-7 gap-2 items-end px-4 pb-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-full flex items-end justify-center">
                      <div className="w-full max-w-[28px] rounded-t-md bg-white/[0.06] animate-pulse" style={{ height: `${25 + (i % 4) * 18}%` }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

            <Card className="p-6 border-white/[0.06] bg-[#111118] relative overflow-hidden rounded-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2 mb-5">
              <Package className="w-5 h-5 text-violet-500" />
              My Properties
            </CardTitle>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {stats.lots.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-white/[0.08] rounded-xl bg-white/[0.02] space-y-3">
                  <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mx-auto text-violet-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">No Properties Yet</h4>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                      Register your parking facility to start hosting drivers and generating revenue.
                    </p>
                  </div>
                  <Button onClick={() => setShowModal(true)} aria-label="Register parking lot" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 h-9 flex items-center gap-1.5 mx-auto cursor-pointer">
                    <Plus className="w-4 h-4" /> Register Lot
                  </Button>
                </div>
              ) : (
                stats.lots.map(lot => (
                  <Card
                    key={lot.id}
                    onClick={() => navigate(`/lot/${lot.id}`)}
                    className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg hover:border-violet-500/30 transition-all duration-200 group cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-violet-400 transition-colors">{lot.name}</h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{lot.city}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={`text-[9px] px-2 py-0.5 rounded-md font-bold border tracking-wide ${
                            lot.status === 'approved'
                              ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
                              : lot.status === 'pending'
                              ? 'text-amber-400 border-amber-500/25 bg-amber-500/10'
                              : 'text-rose-400 border-rose-500/25 bg-rose-500/10'
                          }`}>
                            {lot.status.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-blue-400 font-bold">₹{lot.pricePerHour}/hr</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded-md text-white">{(lot as any).slots?.length ?? 20} Slots</div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>

          <Card className="p-6 border-white/[0.06] bg-[#111118] relative overflow-hidden rounded-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
          <CardTitle className="text-lg font-bold text-white flex items-center justify-between mb-4">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Recent Bookings
            </span>
            {stats.recentBookings.length > 0 && (
              <Button onClick={() => setShowBookingsModal(true)} variant="ghost" className="text-xs text-blue-400 hover:text-blue-300 font-semibold p-0 h-auto hover:bg-transparent">
                View All
              </Button>
            )}
          </CardTitle>
          
          {stats.recentBookings.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-white/[0.06] rounded-xl bg-white/[0.02] space-y-3">
              <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center justify-center mx-auto text-slate-500">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-semibold">No Bookings Yet</p>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                  When drivers book slots at your properties, reservations will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentBookings.slice(0, 6).map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-mono font-bold text-blue-300">
                      {booking.slot?.slotNumber}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{booking.lot?.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">₹{booking.totalAmount}</div>
                    <span className={`text-[10px] uppercase font-bold tracking-wide ${
                      booking.status === 'confirmed' ? 'text-emerald-400' :
                      booking.status === 'cancelled' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg p-6 border-blue-500/25 bg-[#111118] text-white rounded-xl">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-blue-500/15 rounded-lg flex items-center justify-center border border-blue-500/20">
                <Plus className="w-5 h-5 text-blue-400" />
              </div>
              <DialogTitle className="text-xl font-bold text-white">Add Parking Lot</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-sm ml-12">
              Creates 20 parking slots automatically. Requires admin approval.
            </DialogDescription>
          </DialogHeader>

          {lotError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {lotError}
            </div>
          )}

          <form onSubmit={handleCreateLot} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Lot Name</label>
              <Input
                type="text"
                placeholder="e.g. Downtown Central Parking"
                value={newLot.name}
                onChange={e => setNewLot({ ...newLot, name: e.target.value })}
                className="bg-[#0A0A0F] border-white/[0.08] text-white placeholder:text-slate-500 rounded-lg py-3 focus:border-blue-500/50"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Street Address</label>
              <Input
                type="text"
                placeholder="e.g. 42 MG Road, Sector 12"
                value={newLot.address}
                onChange={e => setNewLot({ ...newLot, address: e.target.value })}
                className="bg-[#0A0A0F] border-white/[0.08] text-white placeholder:text-slate-500 rounded-lg py-3 focus:border-blue-500/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">City</label>
                <Input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={newLot.city}
                  onChange={e => setNewLot({ ...newLot, city: e.target.value })}
                  className="bg-[#0A0A0F] border-white/[0.08] text-white placeholder:text-slate-500 rounded-lg py-3"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Rate (₹/hr)</label>
                <Input
                  type="number"
                  value={newLot.pricePerHour}
                  onChange={e => setNewLot({ ...newLot, pricePerHour: Number(e.target.value) })}
                  className="bg-[#0A0A0F] border-white/[0.08] text-white placeholder:text-slate-500 rounded-lg py-3"
                  min="10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 block">Amenities (comma-separated)</label>
              <Input
                type="text"
                placeholder="CCTV, Security, EV Charging"
                value={newLot.amenities}
                onChange={e => setNewLot({ ...newLot, amenities: e.target.value })}
                className="bg-[#0A0A0F] border-white/[0.08] text-white placeholder:text-slate-500 rounded-lg py-3"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-3 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="border border-white/[0.08] text-slate-400 hover:bg-white/[0.04] hover:text-white rounded-lg py-4 px-5 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingLot}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg py-4 px-5"
              >
                {creatingLot ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5 mr-2" /> Create Lot</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showBookingsModal} onOpenChange={setShowBookingsModal}>
        <DialogContent className="max-w-4xl p-6 border-blue-500/25 bg-[#111118] text-white rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="text-left shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-blue-500/15 rounded-lg flex items-center justify-center border border-blue-500/20">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <DialogTitle className="text-xl font-bold text-white">All Bookings</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-sm ml-12">
              All bookings across your registered properties.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-3 my-3 shrink-0">
            <Input
              type="text"
              placeholder="Search by lot name or slot..."
              className="bg-[#0A0A0F] border-white/[0.08] text-white placeholder:text-slate-500 rounded-lg py-3 flex-1"
              value={bookingSearch}
              onChange={e => setBookingSearch(e.target.value)}
            />
            <div className="w-full sm:w-48 bg-[#0A0A0F] rounded-lg border border-white/[0.08]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-10 text-slate-300 border-none px-4 bg-transparent rounded-lg focus:ring-0">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-[#111118] border-white/[0.08] text-white rounded-lg">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 border border-white/[0.06] rounded-lg bg-[#0A0A0F]/50">
            {(() => {
              const filteredBookings = (stats?.recentBookings || []).filter((booking: any) => {
                const matchesSearch = 
                   (booking.lot?.name || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
                   (booking.slot?.slotNumber || '').toLowerCase().includes(bookingSearch.toLowerCase());
                
                const matchesStatus = 
                  statusFilter === 'all' || booking.status === statusFilter;
                  
                return matchesSearch && matchesStatus;
              });

              if (filteredBookings.length === 0) {
                return <div className="text-center py-12 text-slate-500 font-medium">No bookings match your filters.</div>;
              }

              return (
                <Table>
                  <TableHeader className="bg-[#0A0A0F] sticky top-0 z-10">
                    <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wide text-xs">Slot</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wide text-xs">Lot Name</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wide text-xs">Date</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wide text-xs">Timing</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wide text-xs text-right">Amount</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wide text-xs text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/[0.04]">
                    {filteredBookings.map((booking: any) => (
                      <TableRow key={booking.id} className="hover:bg-white/[0.02] border-none transition-colors">
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-md bg-blue-500/15 text-blue-300 font-mono font-bold text-xs">
                            {booking.slot?.slotNumber}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 font-medium text-white max-w-[150px] sm:max-w-none truncate">{booking.lot?.name}</TableCell>
                        <TableCell className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                          {new Date(booking.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">₹{booking.totalAmount}</TableCell>
                        <TableCell className="px-4 py-3 text-center whitespace-nowrap">
                          <Badge className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold capitalize border ${
                            booking.status === 'confirmed' ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10' :
                            booking.status === 'cancelled' ? 'text-rose-400 border-rose-500/25 bg-rose-500/10' : 'text-amber-400 border-amber-500/25 bg-amber-500/10'
                          }`}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </div>

          <DialogFooter className="flex justify-end pt-4 shrink-0">
            <Button
              onClick={() => setShowBookingsModal(false)}
              variant="ghost"
              className="border border-white/[0.08] text-slate-300 hover:bg-white/[0.04] hover:text-white rounded-lg py-2.5 px-5 text-sm font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerDashboard;

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
      <div className="bg-slate-950/95 border border-indigo-500/35 px-4 py-3.5 backdrop-blur-xl shadow-[0_0_25px_rgba(99,102,241,0.2)] rounded-2xl flex flex-col gap-1 z-50">
        <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">{dateStr || label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
          <p className="text-sm font-black text-indigo-300 font-display">₹{payload[0].value.toFixed(0)}</p>
        </div>
      </div>
    );
  }
  return null;
};

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Modal state
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
    try {
      const res = await api.get('/owner/stats');
      setStats(res.data);
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
    } catch (err: any) {
      setLotError(err.response?.data?.message || 'Failed to create lot');
    } finally {
      setCreatingLot(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060a] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-slate-400 font-medium">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#06060a] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-sm p-6 text-center space-y-4 bg-slate-950/40 border-white/5 backdrop-blur-2xl">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-white font-bold font-display text-lg">Failed to load dashboard</h3>
            <p className="text-slate-400 text-sm">{error}</p>
            <Button onClick={() => fetchStats()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Try again</Button>
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
      color: 'text-white',
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
      glow: 'bg-indigo-600/10',
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      sub: 'Confirmed bookings',
    },
    {
      label: 'Occupancy Rate',
      value: `${stats.occupancyRate}%`,
      icon: <Percent className="w-5 h-5" />,
      color: 'text-emerald-400',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      glow: 'bg-emerald-600/10',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      sub: 'Current slot usage',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings.toString(),
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-violet-400',
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      glow: 'bg-violet-600/10',
      border: 'border-indigo-500/20 hover:border-violet-500/40',
      sub: 'Click to view details',
      onClick: () => setShowBookingsModal(true),
    },
    {
      label: 'Active Properties',
      value: stats.lots.length.toString(),
      icon: <Building2 className="w-5 h-5" />,
      color: 'text-amber-400',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      glow: 'bg-amber-600/10',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      sub: `${stats.lots.filter(l => l.status === 'approved').length} approved`,
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
              <div className="w-10 h-10 bg-indigo-500/15 rounded-2xl flex items-center justify-center border border-indigo-500/25">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display">Owner Dashboard</h1>
            </div>
            <p className="text-slate-400 text-sm ml-13">Monitor earnings, occupancy, and manage your properties</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="border-white/10 hover:bg-white/5 hover:text-white transition-all text-slate-300 font-semibold"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              id="add-lot-btn"
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 border border-indigo-400/20"
            >
              <Plus className="w-5 h-5 mr-1" /> Add Lot
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, i) => {
            const isClickable = !!card.onClick;
            return (
              <Card
                key={card.label}
                onClick={card.onClick}
                className={`p-6 rounded-2xl animate-fadeIn transition-all duration-300 relative overflow-hidden group border-white/5 bg-slate-950/40 backdrop-blur-2xl ${
                  isClickable ? 'cursor-pointer hover:scale-[1.02] hover:border-indigo-500/30 active:scale-[0.98]' : ''
                }`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${card.glow} rounded-full blur-xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <span className="text-xs font-semibold text-slate-400">{card.label}</span>
                  <div className={`w-9 h-9 ${card.iconBg} border rounded-xl flex items-center justify-center ${card.iconColor}`}>
                    {card.icon}
                  </div>
                </div>
                <div className={`text-3xl font-black ${card.color} relative z-10 font-display`}>{card.value}</div>
                <div className="text-xs text-slate-500 mt-1.5 relative z-10 font-medium">{card.sub}</div>
              </Card>
            );
          })}
        </div>

        {/* Chart + Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 p-6 md:p-8 border-white/5 bg-slate-950/40 backdrop-blur-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2 font-display">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  7-Day Revenue Trend
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">Daily revenue from confirmed bookings</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">7-Day Total</div>
                <div className="text-lg font-black text-indigo-400 font-display">
                  ₹{stats.chartData.reduce((s, d) => s + d.revenue, 0).toFixed(0)}
                </div>
              </div>
            </div>

            <div className="h-72 w-full relative">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RechartsBarChart data={stats.chartData} barGap={4}>
                    <defs>
                      <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.85}/>
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      </linearGradient>
                      <linearGradient id="barGlowMax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95}/>
                        <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.35}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={val => {
                        const d = new Date(val);
                        return d.toLocaleDateString('en-IN', { weekday: 'short' });
                      }}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={val => `₹${val}`}
                      width={55}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {stats.chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.revenue === maxRevenue ? 'url(#barGlowMax)' : 'url(#barGlow)'}
                        />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-xs text-slate-500">Loading chart analytics...</span>
                </div>
              )}
            </div>
          </Card>

          {/* Properties List */}
          <Card className="p-6 border-white/5 bg-slate-950/40 backdrop-blur-2xl">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2 font-display mb-5">
              <Package className="w-5 h-5 text-indigo-400" />
              My Properties
            </CardTitle>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {stats.lots.length === 0 ? (
                <div className="text-center py-14 px-4 border border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-md space-y-4 animate-fadeIn">
                  <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] animate-float">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white font-display text-sm">No Properties Registered</h4>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                      Register your parking facility to start hosting drivers, configuring rates, and generating revenue.
                    </p>
                  </div>
                  <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 h-9 shadow-lg shadow-indigo-600/20 rounded-xl flex items-center gap-1.5 mx-auto transition-all cursor-pointer">
                    <Plus className="w-4 h-4" /> Register Lot
                  </Button>
                </div>
              ) : (
                stats.lots.map(lot => (
                  <Card
                    key={lot.id}
                    onClick={() => navigate(`/lot/${lot.id}`)}
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-indigo-500/30 hover:bg-white/8 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-indigo-300 transition-colors font-display">{lot.name}</h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{lot.city}</p>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <Badge className={`text-[9px] px-2 py-0.5 rounded-full font-bold border tracking-wider bg-transparent shadow-none hover:bg-transparent ${
                            lot.status === 'approved'
                              ? 'text-emerald-400 border-emerald-500/20'
                              : lot.status === 'pending'
                              ? 'text-amber-400 border-amber-500/20'
                              : 'text-red-400 border-red-500/20'
                          }`}>
                            {lot.status.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-indigo-400 font-bold">₹{lot.pricePerHour}/hr</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-white">{(lot as any).slots?.length ?? 20} Slots</div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="p-6 border-white/5 bg-slate-950/40 backdrop-blur-2xl">
          <CardTitle className="text-lg font-bold text-white flex items-center justify-between font-display mb-4">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Recent Bookings
            </span>
            {stats.recentBookings.length > 0 && (
              <Button onClick={() => setShowBookingsModal(true)} variant="ghost" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold p-0 h-auto hover:bg-transparent">
                View All Bookings
              </Button>
            )}
          </CardTitle>
          
          {stats.recentBookings.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-white/5 rounded-2xl bg-white/5 backdrop-blur-sm space-y-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-slate-500 animate-float">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-sm font-semibold">No Bookings Yet</p>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                  When drivers book slots at your properties, their reservation logs and status will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentBookings.slice(0, 6).map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/8 transition-colors border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-xs font-mono font-bold text-indigo-300">
                      {booking.slot?.slotNumber}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white font-display">{booking.lot?.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white font-display">₹{booking.totalAmount}</div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                      booking.status === 'confirmed' ? 'text-emerald-400' :
                      booking.status === 'cancelled' ? 'text-red-400' : 'text-amber-400'
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

      {/* Add Lot Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg p-8 border-indigo-500/30 bg-slate-950/95 backdrop-blur-2xl text-white shadow-2xl rounded-2xl">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-indigo-500/15 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Plus className="w-5 h-5 text-indigo-400" />
              </div>
              <DialogTitle className="text-xl font-black text-white font-display">Add Parking Lot</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-sm ml-12">
              Creates 20 parking slots automatically. Requires admin approval.
            </DialogDescription>
          </DialogHeader>

          {lotError && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {lotError}
            </div>
          )}

          <form onSubmit={handleCreateLot} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Lot Name</label>
              <Input
                type="text"
                placeholder="e.g. Downtown Central Parking"
                value={newLot.name}
                onChange={e => setNewLot({ ...newLot, name: e.target.value })}
                className="bg-slate-900/80 border-white/5 text-white placeholder:text-slate-500 rounded-xl py-3.5 focus:border-indigo-500/50"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Street Address</label>
              <Input
                type="text"
                placeholder="e.g. 42 MG Road, Sector 12"
                value={newLot.address}
                onChange={e => setNewLot({ ...newLot, address: e.target.value })}
                className="bg-slate-900/80 border-white/5 text-white placeholder:text-slate-500 rounded-xl py-3.5 focus:border-indigo-500/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">City</label>
                <Input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={newLot.city}
                  onChange={e => setNewLot({ ...newLot, city: e.target.value })}
                  className="bg-slate-900/80 border-white/5 text-white placeholder:text-slate-500 rounded-xl py-3.5"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Rate (₹/hr)</label>
                <Input
                  type="number"
                  value={newLot.pricePerHour}
                  onChange={e => setNewLot({ ...newLot, pricePerHour: Number(e.target.value) })}
                  className="bg-slate-900/80 border-white/5 text-white placeholder:text-slate-500 rounded-xl py-3.5"
                  min="10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Amenities (comma-separated)</label>
              <Input
                type="text"
                placeholder="CCTV, Security, EV Charging"
                value={newLot.amenities}
                onChange={e => setNewLot({ ...newLot, amenities: e.target.value })}
                className="bg-slate-900/80 border-white/5 text-white placeholder:text-slate-500 rounded-xl py-3.5"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-3 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="border border-white/5 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl py-5 px-6 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingLot}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-5 px-6"
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

      {/* Bookings Modal */}
      <Dialog open={showBookingsModal} onOpenChange={setShowBookingsModal}>
        <DialogContent className="max-w-4xl p-6 md:p-8 border-indigo-500/30 bg-slate-950/95 backdrop-blur-2xl text-white shadow-2xl rounded-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="text-left shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-indigo-500/15 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Calendar className="w-5 h-5 text-indigo-400" />
              </div>
              <DialogTitle className="text-xl md:text-2xl font-black text-white font-display">All Bookings</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-xs md:text-sm ml-12">
              Showing all bookings across your registered properties.
            </DialogDescription>
          </DialogHeader>

          {/* Filter controls */}
          <div className="flex flex-col sm:flex-row gap-3 my-2 shrink-0">
            <Input
              type="text"
              placeholder="Search by lot name or slot number..."
              className="bg-slate-900/80 border-white/5 text-white placeholder:text-slate-500 rounded-xl py-3.5 flex-1"
              value={bookingSearch}
              onChange={e => setBookingSearch(e.target.value)}
            />
            <div className="w-full sm:w-48 bg-[#11111a] rounded-xl border border-white/5">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-11 text-slate-300 border-none px-4 bg-slate-900/80 rounded-xl focus:ring-0">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10 text-white rounded-xl">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="overflow-y-auto flex-1 border border-white/5 rounded-xl bg-black/10">
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
                  <TableHeader className="bg-[#0e0e15] sticky top-0 z-10">
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Slot</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Lot Name</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Date</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-xs">Timing</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-xs text-right">Amount</TableHead>
                      <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-xs text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-white/5">
                    {filteredBookings.map((booking: any) => (
                      <TableRow key={booking.id} className="hover:bg-white/5 border-none transition-colors">
                        <TableCell className="px-4 py-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 font-mono font-bold text-xs">
                            {booking.slot?.slotNumber}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-medium text-white max-w-[150px] sm:max-w-none truncate font-display">{booking.lot?.name}</TableCell>
                        <TableCell className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                          {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-slate-400 whitespace-nowrap text-xs">
                          {new Date(booking.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right font-bold text-white whitespace-nowrap font-display">₹{booking.totalAmount}</TableCell>
                        <TableCell className="px-4 py-3.5 text-center whitespace-nowrap">
                          <Badge className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border shadow-none bg-transparent hover:bg-transparent ${
                            booking.status === 'confirmed' ? 'text-emerald-400 border-emerald-500/20' :
                            booking.status === 'cancelled' ? 'text-red-400 border-red-500/20' : 'text-amber-400 border-amber-500/20'
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
              className="border border-white/5 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl py-3 px-6 text-sm font-semibold"
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

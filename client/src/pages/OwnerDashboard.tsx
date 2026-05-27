import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
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
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KpiCard from '../components/dashboard/KpiCard';
import StatusBanner from '../components/dashboard/StatusBanner';
import EmptyStateCard from '../components/dashboard/EmptyStateCard';
import DataSectionCard from '../components/dashboard/DataSectionCard';
import api from '../api/axios';
import type { ParkingLot } from '../types';

import {
  Card,
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
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastBookingAt, setLastBookingAt] = useState<Date | null>(null);
  const [recentBookingFlash, setRecentBookingFlash] = useState(false);
  const [statsFlash, setStatsFlash] = useState(false);
  const [newBookingsCount, setNewBookingsCount] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lotFilter, setLotFilter] = useState('all');
  const [newLot, setNewLot] = useState({
    name: '',
    address: '',
    city: '',
    pricePerHour: 50,
    amenities: 'CCTV, 24/7 Security, Valet',
  });
  const [creatingLot, setCreatingLot] = useState(false);
  const [lotError, setLotError] = useState('');

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      toast({ title: 'Booking cancelled', description: 'The slot has been released.', variant: 'success' });
      await fetchStats(true);
    } catch (err: any) {
      toast({ title: 'Cancel failed', description: err.response?.data?.message || 'Could not cancel booking', variant: 'error' });
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await api.put(`/bookings/${bookingId}/complete`);
      toast({ title: 'Booking completed', description: 'Slot released and marked as completed.', variant: 'success' });
      await fetchStats(true);
    } catch (err: any) {
      toast({ title: 'Complete failed', description: err.response?.data?.message || 'Could not complete booking', variant: 'error' });
    }
  };

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

  // Real-time: connect to socket and listen for slot updates on owner's lots
  useEffect(() => {
    if (!stats?.lots?.length) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const socket = io(SOCKET_URL, { reconnection: true });

    socket.on('connect', () => {
      setIsLiveConnected(true);
      stats.lots.forEach(lot => socket.emit('joinLot', lot.id));
    });

    socket.on('reconnect', () => {
      setIsLiveConnected(true);
      stats.lots.forEach(lot => socket.emit('joinLot', lot.id));
      fetchStats(true);
    });

    socket.on('slotUpdate', ({ slotId: _slotId, isAvailable }) => {
      setLastUpdated(new Date());
      if (!isAvailable) {
        setLastBookingAt(new Date());
        setStatsFlash(true);
        setTimeout(() => setStatsFlash(false), 2000);
        setNewBookingsCount(c => c + 1);
        fetchStats(true);
        setRecentBookingFlash(true);
        setTimeout(() => setRecentBookingFlash(false), 2500);
      } else {
        fetchStats(true);
      }
    });

    socket.on('bookingCreated', ({ slotNumber, lotName, amount }: { slotNumber: string; lotName: string; amount: number }) => {
      toast({
        title: `New booking at ${lotName}`,
        description: `Slot ${slotNumber} booked for ₹${amount}. Dashboard updated.`,
        variant: 'success',
      });
    });

    socket.on('disconnect', () => {
      setIsLiveConnected(false);
    });

    return () => {
      setIsLiveConnected(false);
      stats.lots.forEach(lot => socket.emit('leaveLot', lot.id));
      socket.disconnect();
    };
  }, [stats?.lots]);

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
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all ${statsFlash ? 'ring-2 ring-emerald-500/30 rounded-xl' : ''}`}>
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
        <DashboardHeader
          icon={<div className="w-10 h-10 bg-violet-500/15 rounded-lg flex items-center justify-center border border-violet-500/20"><BarChart3 className="w-5 h-5 text-violet-400" /></div>}
          title="Owner Dashboard"
          description="Monitor occupancy, revenue trends, and booking operations in one place."
          statusText={isLiveConnected ? 'Live — real-time updates active' : 'Connecting to live updates...'}
          statusDotClassName={isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}
          badges={[
            { label: 'KPI Overview', className: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
            { label: 'Live Bookings', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
            { label: 'Property Controls', className: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
          ]}
          meta={
            <>
              {lastUpdated && <div className="ml-[52px] mt-1 text-[10px] text-slate-500">Updated just now</div>}
              {lastBookingAt && (
                <div className="ml-[52px] mt-1.5 text-[10px] text-emerald-400">
                  Last booking: {(() => { const secs = Math.floor((Date.now() - lastBookingAt.getTime()) / 1000); if (secs < 10) return 'just now'; if (secs < 60) return `${secs}s ago`; const mins = Math.floor(secs / 60); return `${mins}m ago`; })()}
                </div>
              )}
            </>
          }
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => { setNewBookingsCount(0); fetchStats(true); }}
                disabled={refreshing}
                aria-label="Refresh owner dashboard"
                className="border-white/[0.08] hover:bg-white/[0.04] text-slate-300 font-semibold"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      const id = window.setInterval(() => fetchStats(true), 30000);
                      (window as any).__ownerAutoRefresh = id;
                    } else {
                      const id = (window as any).__ownerAutoRefresh;
                      if (id) window.clearInterval(id);
                    }
                  }}
                />
                Auto 30s
              </label>
              <Button
                id="add-lot-btn"
                onClick={() => setShowModal(true)}
                aria-label="Add parking lot"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                <Plus className="w-5 h-5 mr-1" /> Add Lot
              </Button>
            </>
          }
        />

        {error && <StatusBanner variant="error" message={error} />}
        {feedback && !error && <StatusBanner variant="success" message={feedback} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              iconClassName={`${card.iconBg} ${card.iconColor}`}
              valueClassName={card.color}
              subtext={card.sub}
              onClick={card.onClick}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <DataSectionCard
              className="lg:col-span-2"
              gradient="diagonal"
              icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
              title="7-Day Revenue"
              description="Daily revenue from confirmed bookings"
              actions={
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">7-Day Total</div>
                <div className="text-lg font-bold text-emerald-400">
                  ₹{stats.chartData.reduce((s, d) => s + d.revenue, 0).toFixed(0)}
                </div>
              </div>
              }
            >
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
          </DataSectionCard>

           <DataSectionCard
            className={`transition-all ${recentBookingFlash ? 'ring-1 ring-emerald-500/40' : ''}`}
            icon={<Package className="w-5 h-5 text-violet-500" />}
            title="My Properties"
            bodyClassName="space-y-3 max-h-[380px] overflow-y-auto pr-1"
           >
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {stats.lots.length === 0 ? (
                <EmptyStateCard
                  className="border-dashed border-white/[0.08] bg-white/[0.02] p-8"
                  icon={<div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mx-auto text-violet-400"><Building2 className="w-6 h-6" /></div>}
                  title="No Properties Yet"
                  description="Register your parking facility to start hosting drivers and generating revenue."
                  action={<Button onClick={() => setShowModal(true)} aria-label="Register parking lot" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 h-9 inline-flex items-center gap-1.5 cursor-pointer"><Plus className="w-4 h-4" /> Register Lot</Button>}
                />
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
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <div className="text-[10px] font-bold px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded-md text-white">{(lot as any).slots?.length ?? 20} Slots</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); navigate(`/lots/${lot.id}`); }}
                          className="text-[10px] h-6 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DataSectionCard>
        </div>

          <DataSectionCard
            title={
               <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>Recent Bookings</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${recentBookingFlash ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'}`}>
                    LIVE
                  </span>
                  {newBookingsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500 text-white font-bold animate-pulse">
                      +{newBookingsCount} new
                    </span>
                  )}
               </div>
            }
            actions={<div className="flex items-center gap-2">
              {stats.recentBookings.length > 0 && (
                <>
                  <Button
                    onClick={() => {
                      const headers = ['Date', 'Lot', 'Slot', 'Amount', 'Status'];
                      const rows = stats.recentBookings.map((b: any) => [
                        new Date(b.createdAt).toLocaleDateString('en-IN'),
                        b.lot?.name || '',
                        b.slot?.slotNumber || '',
                        b.totalAmount,
                        b.status,
                      ]);
                      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `parkit-revenue-${Date.now()}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    variant="ghost"
                    className="text-xs text-emerald-400 hover:text-emerald-300 p-0 h-auto"
                  >
                    Export CSV
                  </Button>
                  <Button onClick={() => setShowBookingsModal(true)} variant="ghost" className="text-xs text-blue-400 hover:text-blue-300 font-semibold p-0 h-auto hover:bg-transparent">
                    View All
                  </Button>
                </>
              )}
            </div>}
          >
          
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
               {stats.recentBookings.slice(0, 6).map((booking: any, index: number) => (
                  <div key={booking.id} className={`flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.06] ${recentBookingFlash && index === 0 ? 'ring-2 ring-emerald-500/70 bg-emerald-500/10 scale-[1.01]' : ''}`}>
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
                      {index === 0 && recentBookingFlash && (
                        <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold animate-pulse">NEW! (live)</span>
                      )}
                      {index === 0 && recentBookingFlash && (
                        <span className="text-[9px] ml-1 text-emerald-400">just now</span>
                      )}
                      {index === 0 && recentBookingFlash && (
                        <span className="text-[9px] ml-1 text-emerald-400">• live update</span>
                      )}
                     {booking.status === 'confirmed' && (
                       <>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => handleCancelBooking(booking.id)}
                           className="text-[10px] h-6 px-1.5 ml-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                         >
                           Cancel
                         </Button>
                         <Button
                           size="sm"
                           variant="outline"
                            onClick={() => handleCompleteBooking(booking.id)}
                           className="text-[10px] h-6 px-1.5 ml-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                         >
                           Complete
                         </Button>
                       </>
                     )}
                   </div>
                 </div>
              ))}
            </div>
          )}
        </DataSectionCard>
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
            <StatusBanner variant="error" message={lotError} />
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
            <div className="w-full sm:w-48 bg-[#0A0A0F] rounded-lg border border-white/[0.08]">
              <Select value={lotFilter} onValueChange={setLotFilter}>
                <SelectTrigger className="w-full h-10 text-slate-300 border-none px-4 bg-transparent rounded-lg focus:ring-0">
                  <SelectValue placeholder="All Lots" />
                </SelectTrigger>
                <SelectContent className="bg-[#111118] border-white/[0.08] text-white rounded-lg max-h-60">
                  <SelectItem value="all">All Lots</SelectItem>
                  {(() => {
                    const lotNames = [...new Set((stats?.recentBookings || []).map((b: any) => b.lot?.name).filter(Boolean))] as string[];
                    return lotNames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ));
                  })()}
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

                const matchesLot = 
                  lotFilter === 'all' || (booking.lot?.name || '') === lotFilter;
                  
                return matchesSearch && matchesStatus && matchesLot;
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
                       <TableHead className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wide text-xs text-center">Actions</TableHead>
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
                         <TableCell className="px-4 py-3 text-center">
                           {booking.status === 'confirmed' && (
                             <div className="flex items-center justify-center gap-1">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleCancelBooking(booking.id)}
                                 className="text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                               >
                                 Cancel
                               </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => {
                                   toast({ title: 'Marked as completed', description: 'Demo: Booking completed for this slot.', variant: 'success' });
                                   fetchStats(true);
                                 }}
                                 className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                               >
                                 Complete
                               </Button>
                             </div>
                           )}
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

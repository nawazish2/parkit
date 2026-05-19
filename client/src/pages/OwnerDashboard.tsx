import React, { useState, useEffect } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Plus, MapPin, DollarSign, Percent, Calendar, CheckCircle2, Loader2, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { ParkingLot } from '../types';

interface OwnerStats {
  revenue: number;
  totalBookings: number;
  occupancyRate: number;
  chartData: { date: string; revenue: number }[];
  recentBookings: any[];
  lots: ParkingLot[];
}

const OwnerDashboard: React.FC = () => {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  // New lot modal
  const [showModal, setShowModal] = useState(false);
  const [newLot, setNewLot] = useState({
    name: '',
    address: '',
    city: '',
    pricePerHour: 50,
    amenities: 'CCTV, 24/7 Security, Valet',
  });
  const [creatingLot, setCreatingLot] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/owner/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch owner stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLot(true);
    try {
      const amenitiesArr = newLot.amenities.split(',').map(s => s.trim());
      await api.post('/lots', {
        ...newLot,
        amenities: JSON.stringify(amenitiesArr),
        photos: JSON.stringify(['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800']),
      });
      setShowModal(false);
      setNewLot({ name: '', address: '', city: '', pricePerHour: 50, amenities: 'CCTV, 24/7 Security, Valet' });
      await fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create lot');
    } finally {
      setCreatingLot(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10">
        {/* Portal Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-400" />
              Owner Revenue Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitor real-time earnings, occupancy rates, and manage your properties
            </p>
          </div>

          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 shadow-lg shadow-indigo-600/30">
            <Plus className="w-5 h-5" /> Add Parking Lot
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">Total Revenue</span>
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">₹{stats.revenue}</div>
          </div>

          <div className="card border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">Occupancy Rate</span>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">{stats.occupancyRate}%</div>
          </div>

          <div className="card border-violet-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">Total Bookings</span>
              <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 border border-violet-500/20">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.totalBookings}</div>
          </div>

          <div className="card border-amber-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">Active Properties</span>
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.lots.length}</div>
          </div>
        </div>

        {/* Analytics Chart & Properties Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Revenue Chart (2 cols) */}
          <div className="lg:col-span-2 glass p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-400" />
              Last 7 Days Revenue Trend
            </h2>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={stats.chartData}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `₹${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Properties List (1 col) */}
          <div className="glass p-6 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" /> My Parking Lots
            </h2>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {stats.lots.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No properties added yet.</div>
              ) : (
                stats.lots.map(lot => (
                  <div key={lot.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-colors">
                    <div>
                      <h3 className="font-semibold text-white">{lot.name}</h3>
                      <p className="text-xs text-slate-400">{lot.address}, {lot.city}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          lot.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          lot.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {lot.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-indigo-400 font-bold">₹{lot.pricePerHour}/hr</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-lg text-white">20 Slots</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Lot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass max-w-lg w-full p-8 space-y-6 relative border-indigo-500/40 shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-indigo-400" /> Add New Parking Lot
            </h3>
            <p className="text-slate-400 text-sm">
              Creating a new lot automatically scaffolds 20 standardized parking slots instantly.
            </p>

            <form onSubmit={handleCreateLot} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Lot Name</label>
                <input
                  type="text"
                  placeholder="e.g. Downtown Central Parking"
                  value={newLot.name}
                  onChange={e => setNewLot({ ...newLot, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 42 MG Road, Sector 12"
                  value={newLot.address}
                  onChange={e => setNewLot({ ...newLot, address: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={newLot.city}
                    onChange={e => setNewLot({ ...newLot, city: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Rate (₹/hr)</label>
                  <input
                    type="number"
                    value={newLot.pricePerHour}
                    onChange={e => setNewLot({ ...newLot, pricePerHour: Number(e.target.value) })}
                    className="input"
                    min="10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Amenities</label>
                <input
                  type="text"
                  placeholder="Comma-separated e.g. CCTV, Security, EV Charging"
                  value={newLot.amenities}
                  onChange={e => setNewLot({ ...newLot, amenities: e.target.value })}
                  className="input"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={creatingLot} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5">
                  {creatingLot ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {creatingLot ? 'Creating Lot & Slots...' : 'Create Parking Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;

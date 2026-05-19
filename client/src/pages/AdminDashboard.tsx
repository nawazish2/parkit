import React, { useState, useEffect } from 'react';
import { Shield, Users, MapPin, DollarSign, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { ParkingLot, User } from '../types';

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
  const [activeTab, setActiveTab] = useState<'lots' | 'users'>('lots');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchData = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (lotId: number, status: 'approved' | 'rejected') => {
    setUpdatingId(lotId);
    try {
      await api.put(`/admin/lots/${lotId}/status`, { status });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update lot status');
    } finally {
      setUpdatingId(null);
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            Admin Superuser Panel
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Supervise platform integrity, approve parking property submissions, and inspect member directories
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">Platform Revenue</span>
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">₹{stats.totalRevenue}</div>
          </div>

          <div className="card border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">Total Registered Users</span>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">{stats.totalUsers}</div>
          </div>

          <div className="card border-violet-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">Total Properties</span>
              <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 border border-violet-500/20">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.totalLots}</div>
          </div>

          <div className="card border-amber-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">Pending Approvals</span>
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-400">{stats.pendingLots.length}</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 gap-8">
          <button
            onClick={() => setActiveTab('lots')}
            className={`pb-4 text-base font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'lots' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-5 h-5" />
            Property Submissions ({lots.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-base font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'users' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            User Directory ({users.length})
          </button>
        </div>

        {/* Tab Content: Lots */}
        {activeTab === 'lots' && (
          <div className="space-y-4">
            {lots.length === 0 ? (
              <div className="glass p-12 text-center text-slate-500">No parking lots submitted yet.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {lots.map((lot: any) => (
                  <div key={lot.id} className="glass p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10 hover:border-indigo-500/30 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{lot.name}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          lot.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          lot.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {lot.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {lot.address}, {lot.city}
                      </p>
                      <p className="text-xs text-slate-500">Submitted by: <span className="text-slate-300 font-medium">{lot.owner?.name}</span> ({lot.owner?.email})</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/10 md:border-transparent">
                      <div>
                        <div className="text-xs text-slate-400">Hourly Rate</div>
                        <div className="text-xl font-extrabold text-indigo-400">₹{lot.pricePerHour}/hr</div>
                      </div>

                      {lot.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStatus(lot.id, 'approved')}
                            disabled={updatingId === lot.id}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(lot.id, 'rejected')}
                            disabled={updatingId === lot.id}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Users */}
        {activeTab === 'users' && (
          <div className="glass overflow-hidden border border-white/10 rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-semibold">
                    <th className="p-4">User ID</th>
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Platform Role</th>
                    <th className="p-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-indigo-400 font-bold">#{u.id}</td>
                      <td className="p-4 font-semibold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                          {(u.name ? u.name[0] : 'U').toUpperCase()}
                        </div>
                        {u.name || 'Unnamed User'}
                      </td>
                      <td className="p-4 text-slate-300">{u.email}</td>
                      <td className="p-4 capitalize font-medium text-indigo-300">{u.role}</td>
                      <td className="p-4 text-slate-400">{new Date((u as any).createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

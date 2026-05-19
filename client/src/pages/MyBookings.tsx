import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, QrCode, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { Booking } from '../types';

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking? The slot will be reopened immediately.')) return;
    setCancellingId(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      await fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status === 'confirmed');
  const pastOrCancelled = bookings.filter(b => b.status !== 'confirmed');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-400" />
            My Bookings & Passes
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your active reservations and view entry QR codes</p>
        </div>

        {/* Active Bookings Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Active Passes ({activeBookings.length})
          </h2>

          {activeBookings.length === 0 ? (
            <div className="glass p-12 text-center text-slate-500 space-y-3">
              <QrCode className="w-12 h-12 mx-auto opacity-30" />
              <p>No active parking reservations found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeBookings.map(booking => (
                <div key={booking.id} className="card relative overflow-hidden flex flex-col justify-between border-indigo-500/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-4 z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-white">{booking.lot?.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {booking.lot?.address}, {booking.lot?.city}
                        </p>
                      </div>
                      <span className="font-mono text-xl font-extrabold px-3 py-1 bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 rounded-xl">
                        {booking.slot?.slotNumber}
                      </span>
                    </div>

                    <div className="py-3 border-y border-white/10 space-y-2 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{new Date(booking.startTime).toLocaleString()}</span>
                        <span className="text-slate-500">to</span>
                        <span>{new Date(booking.endTime).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                        <span>Total Paid</span>
                        <span className="text-sm font-bold text-white">₹{booking.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6 z-10">
                    <button
                      onClick={() => setSelectedQR(booking)}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
                    >
                      <QrCode className="w-4 h-4" />
                      Show Access Pass
                    </button>
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                      title="Cancel Booking"
                    >
                      {cancellingId === booking.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past / Cancelled Bookings */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Clock className="w-5 h-5 text-slate-400" /> Past & Cancelled ({pastOrCancelled.length})
          </h2>

          {pastOrCancelled.length === 0 ? (
            <div className="glass p-12 text-center text-slate-500">No past bookings.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastOrCancelled.map(booking => (
                <div key={booking.id} className="glass p-5 flex items-center justify-between opacity-70">
                  <div>
                    <h3 className="font-semibold text-white">{booking.lot?.name}</h3>
                    <p className="text-xs text-slate-400">
                      Slot {booking.slot?.slotNumber} • {new Date(booking.startTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-white">₹{booking.totalAmount}</span>
                    <div className="text-xs capitalize font-medium mt-0.5 text-red-400">
                      {booking.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass max-w-sm w-full p-8 text-center space-y-6 relative border-indigo-500/40 shadow-2xl shadow-indigo-500/20">
            <h3 className="text-2xl font-extrabold text-white">Gate Access Pass</h3>
            <p className="text-xs text-slate-400">Scan at the barrier for automated entry/exit</p>

            <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-xl">
              <img src={selectedQR.qrCode} alt="Access QR Code" className="w-64 h-64 object-contain" />
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-2 text-sm font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">Parking Lot:</span> <span className="text-white">{selectedQR.lot?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Slot:</span>{' '}
                <span className="font-mono font-bold text-indigo-300">{selectedQR.slot?.slotNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Valid from:</span>{' '}
                <span>{new Date(selectedQR.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <button onClick={() => setSelectedQR(null)} className="btn-primary w-full py-3">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

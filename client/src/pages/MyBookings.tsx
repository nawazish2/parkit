import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, QrCode, XCircle, CheckCircle2,
  Loader2, Download, AlertTriangle, Ticket, Car, ChevronRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { Booking } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<Booking | null>(null);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<Booking | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const [extendBooking, setExtendBooking] = useState<Booking | null>(null);
  const [extendHours, setExtendHours] = useState<number>(1);
  const [extending, setExtending] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdownText = (startTimeStr: string, endTimeStr: string) => {
    const start = new Date(startTimeStr).getTime();
    const end = new Date(endTimeStr).getTime();
    const current = now.getTime();

    if (current < start) {
      const diff = start - current;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      return {
        text: `Starts in ${hours}h ${mins}m ${secs}s`,
        className: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
      };
    } else if (current >= start && current <= end) {
      const diff = end - current;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      const isUrgent = diff < 15 * 60 * 1000;
      return {
        text: `${hours}h ${mins}m ${secs}s left`,
        className: isUrgent
          ? 'bg-red-500/15 text-red-400 border-red-500/25 animate-pulse'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      };
    } else {
      return {
        text: 'Session Ended',
        className: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      };
    }
  };

  const fetchBookings = async () => {
    setError('');
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
      localStorage.setItem('parkit_bookings_cache', JSON.stringify(res.data));
      setIsOfflineMode(false);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
      const cached = localStorage.getItem('parkit_bookings_cache');
      if (cached) {
        try { setBookings(JSON.parse(cached)); } catch { setError('Cached data is corrupted. Please refresh.'); }
        setIsOfflineMode(true);
      } else {
        setError('Failed to load bookings. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: number) => {
    setCancellingId(bookingId);
    setConfirmCancelId(null);
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      await fetchBookings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleExtendBooking = async () => {
    if (!extendBooking) return;
    setExtending(true);
    setError('');

    try {
      const orderRes = await api.post('/payment/extend-order', {
        bookingId: extendBooking.id,
        additionalHours: extendHours,
      });

      const { order, key_id } = orderRes.data;

      if (key_id === 'demo_mode' || !(window as any).Razorpay) {
        await api.post('/payment/verify-extend', {
          bookingId: extendBooking.id,
          additionalHours: extendHours,
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_demo_extend_${Date.now()}`,
          razorpay_signature: 'demo_signature_valid',
        });
        await fetchBookings();
        setExtendBooking(null);
        setExtending(false);
        // Extension succeeded — bookings already refreshed
        return;
      }

      const rzpOptions = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'ParkIt Extension',
        description: `Extend booking for Slot ${extendBooking.slot?.slotNumber} by ${extendHours} hrs`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await api.post('/payment/verify-extend', {
              bookingId: extendBooking.id,
              additionalHours: extendHours,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await fetchBookings();
            setExtendBooking(null);
            setExtending(false);
            // Extension succeeded — bookings already refreshed
          } catch (verErr) {
            console.error('Extension verification failed', verErr);
            setError('Extension verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setExtending(false);
          },
        },
        theme: {
          color: '#10b981',
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to extend session');
      setExtending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePrintReceipt = (booking: Booking | null) => {
    if (!booking) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Pop-up blocker is active. Please enable pop-ups to print the receipt.');
      return;
    }

    const durationHrs = Math.max(1, Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60)));

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ParkIt Receipt - #PK-${booking.id}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #333;
            background-color: #fff;
            padding: 40px;
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #4f46e5;
            letter-spacing: 1px;
            margin: 0 0 5px 0;
          }
          .subtitle {
            font-size: 12px;
            color: #666;
            margin: 0;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 10px;
            font-weight: 700;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
          }
          .details-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .row:last-child {
            margin-bottom: 0;
          }
          .label {
            color: #666;
          }
          .value {
            font-weight: 600;
            color: #111;
          }
          .slot-badge {
            background-color: #e0e7ff;
            color: #4338ca;
            padding: 2px 8px;
            border-radius: 6px;
            font-family: monospace;
            font-weight: 700;
          }
          .time-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .time-col {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
          }
          .time-label {
            font-size: 10px;
            color: #666;
            font-weight: 700;
          }
          .time-val {
            font-size: 16px;
            font-weight: 800;
            color: #4f46e5;
            margin-top: 4px;
          }
          .time-date {
            font-size: 12px;
            color: #333;
            margin-top: 2px;
          }
          .divider {
            border-top: 1px dashed #ccc;
            margin: 15px 0;
          }
          .total-row {
            font-size: 18px;
            font-weight: 800;
            color: #10b981;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 11px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">PARKIT RECEIPT</h1>
          <p class="subtitle">Booking Ref: #PK-${booking.id}</p>
        </div>

        <div class="section">
          <div class="section-title">Location & Slot</div>
          <div class="details-card">
            <div class="row">
              <span class="label">Parking Lot</span>
              <span class="value">${booking.lot?.name}</span>
            </div>
            <div class="row">
              <span class="label">Address</span>
              <span class="value">${booking.lot?.address}, ${booking.lot?.city}</span>
            </div>
            <div class="row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <span class="label">Assigned Slot</span>
              <span class="slot-badge">Slot ${booking.slot?.slotNumber}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Reservation Time</div>
          <div class="time-grid">
            <div class="time-col">
              <div class="time-label">CHECK-IN</div>
              <div class="time-val">${formatTime(booking.startTime)}</div>
              <div class="time-date">${formatDate(booking.startTime)}</div>
            </div>
            <div class="time-col">
              <div class="time-label">CHECK-OUT</div>
              <div class="time-val">${formatTime(booking.endTime)}</div>
              <div class="time-date">${formatDate(booking.endTime)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Vehicle Details</div>
          <div class="details-card">
            <div class="row">
              <span class="label">Vehicle Type</span>
              <span class="value">${booking.vehicleType || 'Sedan'}</span>
            </div>
            ${booking.licensePlate ? `
            <div class="row">
              <span class="label">License Plate</span>
              <span class="value" style="text-transform: uppercase; font-family: monospace;">${booking.licensePlate}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment Summary</div>
          <div class="details-card">
            <div class="row">
              <span class="label">Base Fare (${durationHrs} hrs)</span>
              <span class="value">₹${booking.totalAmount}</span>
            </div>
            <div class="row">
              <span class="label">Taxes & Fees</span>
              <span class="value">₹0.00</span>
            </div>
            <div class="divider"></div>
            <div class="row total-row">
              <span style="color: #111;">Total Paid</span>
              <span>₹${booking.totalAmount}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          Thank you for choosing ParkIt!<br>
          For queries or support, contact support@parkit.com
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060a] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-slate-400 font-medium">Loading your bookings...</span>
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status === 'confirmed');
  const pastOrCancelled = bookings.filter(b => b.status !== 'confirmed');

  return (
    <div className="min-h-screen bg-[#06060a] text-white flex flex-col pb-20 relative overflow-hidden bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      {/* Ambient background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 -right-48 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      {isOfflineMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 px-4 py-3 text-center text-xs font-semibold backdrop-blur-md flex items-center justify-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
          You are currently viewing offline cached passes. Some details or actions may be unavailable.
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10 mt-6 relative z-10">
        {/* Header */}
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-500/15 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <Calendar className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display">My Bookings & Passes</h1>
          </div>
          <p className="text-slate-400 text-sm ml-13">Manage your active reservations and access QR entry passes</p>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Passes', value: activeBookings.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Total Bookings', value: bookings.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          ].map(stat => (
            <Card key={stat.label} className={`border ${stat.bg} p-4 text-center bg-slate-950/40 backdrop-blur-2xl rounded-2xl shadow-lg`}>
              <CardContent className="p-0">
                <div className={`text-2xl font-black font-display ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Active Bookings Section */}
        <section className="space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5 border-b border-white/5 pb-4 font-display">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Active Passes
            {activeBookings.length > 0 && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold ml-1 rounded-full">{activeBookings.length}</Badge>
            )}
          </h2>

          {activeBookings.length === 0 ? (
            <Card className="p-14 text-center space-y-4 bg-slate-950/40 border border-white/5 backdrop-blur-2xl rounded-2xl shadow-xl max-w-md mx-auto animate-fadeIn">
              <CardContent className="p-0 space-y-4">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 shadow-inner">
                  <Ticket className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white font-display">No Active Passes Found</h3>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                    You don't have any upcoming or active parking sessions. Book a slot at one of our premium locations to get started!
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/search')}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/20 text-xs transition-all duration-300 hover:scale-[1.02]"
                >
                  Find & Book a Spot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeBookings.map((booking, i) => (
                <Card
                  key={booking.id}
                  onClick={() => setSelectedBookingForReceipt(booking)}
                  className="bg-slate-950/40 border-white/5 backdrop-blur-2xl rounded-2xl shadow-xl ticket-pass relative overflow-hidden p-6 hover:border-emerald-500/30 transition-all duration-300 animate-fadeIn cursor-pointer"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  {/* Ticket cutouts (aligned with the dashed line) */}
                  <div className="absolute top-[52%] -translate-y-1/2 -left-3.5 w-7 h-7 bg-[#06060a] rounded-full border-r border-white/10 z-10" />
                  <div className="absolute top-[52%] -translate-y-1/2 -right-3.5 w-7 h-7 bg-[#06060a] rounded-full border-l border-white/10 z-10" />

                  {/* Glow */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-600/8 rounded-full blur-2xl pointer-events-none" />

                  <CardContent className="p-0 space-y-4 relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <Badge variant="outline" className="bg-slate-900/60 text-indigo-300 border-white/5 font-extrabold uppercase text-[9px] px-2 py-0.5 rounded-full">
                            Pass #{booking.id}
                          </Badge>
                          {(() => {
                            const countdown = getCountdownText(booking.startTime, booking.endTime);
                            return (
                              <Badge variant="outline" className={`font-bold uppercase text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${countdown.className}`}>
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                                {countdown.text}
                              </Badge>
                            );
                          })()}
                        </div>
                        <h3 className="font-bold text-lg text-white truncate font-display">{booking.lot?.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{booking.lot?.address}, {booking.lot?.city}</span>
                        </p>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="font-mono text-xl font-black px-3.5 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-xl">
                          {booking.slot?.slotNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Slot</div>
                      </div>
                    </div>

                    {/* Dashed divider */}
                    <div className="border-t border-dashed border-white/10 my-4" />

                    {/* Time & Amount */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-white font-medium">{formatDate(booking.startTime)}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-indigo-300 font-bold">{formatTime(booking.startTime)}</span>
                        <span className="text-slate-500">to</span>
                        <span className="text-indigo-300 font-bold">{formatTime(booking.endTime)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs text-slate-400">Total Paid</span>
                        <span className="text-base font-black text-emerald-400 font-display">₹{booking.totalAmount}</span>
                      </div>
                    </div>
                  </CardContent>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-6 relative z-10">
                    <Button
                      id={`show-qr-${booking.id}`}
                      onClick={(e) => { e.stopPropagation(); setSelectedQR(booking); }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl cursor-pointer animate-pulse-slot-dot"
                    >
                      <QrCode className="w-4 h-4" />
                      Show Access Pass
                    </Button>

                    {getCountdownText(booking.startTime, booking.endTime).text !== 'Session Ended' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExtendBooking(booking);
                          setExtendHours(1);
                        }}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold py-2.5 text-xs rounded-xl cursor-pointer h-9 px-4 shrink-0 transition-all"
                      >
                        Extend
                      </Button>
                    )}

                    {/* Inline cancel confirmation */}
                    {confirmCancelId === booking.id ? (
                      <div className="flex items-center gap-1.5 animate-fadeIn">
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleCancel(booking.id); }}
                          disabled={cancellingId === booking.id}
                          variant="destructive"
                          className="text-xs font-bold py-2.5 px-3.5 rounded-xl cursor-pointer h-9"
                        >
                          {cancellingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                        </Button>
                        <Button
                          onClick={(e) => { e.stopPropagation(); setConfirmCancelId(null); }}
                          variant="outline"
                          className="text-xs py-2.5 px-3.5 rounded-xl border-white/10 text-slate-400 bg-transparent hover:bg-white/5 hover:text-white cursor-pointer h-9"
                        >
                          Keep
                        </Button>
                      </div>
                    ) : (
                      <Button
                        id={`cancel-btn-${booking.id}`}
                        onClick={(e) => { e.stopPropagation(); setConfirmCancelId(booking.id); }}
                        variant="outline"
                        className="p-2.5 rounded-xl bg-red-500/8 hover:bg-red-500/15 text-red-400 border-red-500/15 hover:border-red-500/30 transition-all cursor-pointer h-9 w-9 flex items-center justify-center"
                        title="Cancel Booking"
                      >
                        <XCircle className="w-4.5 h-4.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Past / Cancelled Bookings */}
        {pastOrCancelled.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 border-b border-white/5 pb-4 font-display">
              <Clock className="w-5 h-5 text-slate-400" />
              Booking History
              <Badge variant="outline" className="border-white/10 text-slate-400 font-bold ml-1 rounded-full">{pastOrCancelled.length}</Badge>
            </h2>

            <div className="space-y-3">
              {pastOrCancelled.map(booking => (
                <Card
                  key={booking.id}
                  onClick={() => setSelectedBookingForReceipt(booking)}
                  className="p-4 flex items-center justify-between gap-4 opacity-60 hover:opacity-100 hover:border-indigo-500/30 cursor-pointer transition-all duration-300 border-white/5 bg-slate-950/40 backdrop-blur-2xl rounded-2xl shadow-md group"
                >
                  <CardContent className="p-0 flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                        <Car className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate text-sm font-display">{booking.lot?.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Slot {booking.slot?.slotNumber} · {formatDate(booking.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-sm text-white font-display">₹{booking.totalAmount}</div>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold mt-1 tracking-wider rounded-full px-2.5 py-0.5 ${
                          booking.status === 'cancelled' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-slate-400 border-white/10 bg-white/5'
                        }`}>
                          {booking.status}
                        </Badge>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* QR Code Modal using Shadcn Dialog */}
      <Dialog open={!!selectedQR} onOpenChange={(open) => { if (!open) setSelectedQR(null); }}>
        <DialogContent className="max-w-sm w-full p-8 text-center space-y-6 border-indigo-500/40 shadow-2xl shadow-indigo-500/20 bg-slate-950/95 text-white backdrop-blur-2xl rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6 text-emerald-400" />
            </div>
            <DialogTitle className="text-xl font-black text-white font-display text-center">Gate Access Pass</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 text-center">
              Scan at the barrier for automated entry/exit
            </DialogDescription>
          </DialogHeader>

          {selectedQR && (
            <>
              <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-xl ring-4 ring-indigo-500/20">
                <img
                  src={selectedQR.qrCode}
                  alt="Access QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Parking Lot</span>
                  <span className="font-semibold text-white truncate max-w-[180px]">{selectedQR.lot?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Assigned Slot</span>
                  <span className="font-mono font-black text-indigo-300 text-base">{selectedQR.slot?.slotNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vehicle Type</span>
                  <span className="font-semibold text-white">{selectedQR.vehicleType || 'Sedan'}</span>
                </div>
                {selectedQR.licensePlate && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">License Plate</span>
                    <span className="font-mono font-bold text-white uppercase">{selectedQR.licensePlate}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Entry Time</span>
                  <span className="font-semibold text-white">{formatTime(selectedQR.startTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Exit By</span>
                  <span className="font-semibold text-white">{formatTime(selectedQR.endTime)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/8">
                  <span className="text-slate-400">Amount Paid</span>
                  <span className="font-black text-emerald-400 font-display">₹{selectedQR.totalAmount}</span>
                </div>
              </div>
            </>
          )}

          <DialogFooter showCloseButton={false} className="sm:justify-center">
            <Button onClick={() => setSelectedQR(null)} className="bg-indigo-600 hover:bg-indigo-500 text-white w-full py-6 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" />
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Details Modal */}
      <Dialog open={!!selectedBookingForReceipt} onOpenChange={(open) => { if (!open) setSelectedBookingForReceipt(null); }}>
        <DialogContent className="max-w-md w-full p-6 border-indigo-500/30 shadow-2xl shadow-indigo-500/10 bg-slate-950/95 text-white backdrop-blur-2xl rounded-3xl">
          <DialogHeader className="pb-4 border-b border-white/10">
            <DialogTitle className="text-xl font-black text-center font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-400 to-emerald-400">
              PARKIT RECEIPT
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-400">
              Booking Ref: #PK-{selectedBookingForReceipt?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedBookingForReceipt && (
            <div className="space-y-6 my-4">
              {/* Status Badge & Logo */}
              <div className="flex justify-between items-center bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Car className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-300">ParkIt Security</div>
                    <div className="text-[10px] text-slate-500">Receipt Generated</div>
                  </div>
                </div>
                <Badge
                  className={`text-xs uppercase font-bold rounded-full px-3 py-1 ${
                    selectedBookingForReceipt.status === 'confirmed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : selectedBookingForReceipt.status === 'cancelled'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}
                >
                  {selectedBookingForReceipt.status}
                </Badge>
              </div>

              {/* Live Status Tracker for Active Bookings */}
              {selectedBookingForReceipt.status === 'confirmed' && (() => {
                const countdown = getCountdownText(selectedBookingForReceipt.startTime, selectedBookingForReceipt.endTime);
                return (
                  <div className={`p-3.5 rounded-2xl border text-center text-xs font-bold flex items-center justify-center gap-2 ${countdown.className}`}>
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>{countdown.text.toUpperCase()}</span>
                  </div>
                );
              })()}

              {/* Parking Lot Details */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Location & Slot</span>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="font-bold text-base text-white font-display">
                    {selectedBookingForReceipt.lot?.name}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{selectedBookingForReceipt.lot?.address}, {selectedBookingForReceipt.lot?.city}</span>
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                    <span className="text-xs text-slate-400">Assigned Slot</span>
                    <span className="font-mono text-lg font-black text-indigo-300 px-3 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      Slot {selectedBookingForReceipt.slot?.slotNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time Details */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reservation Time</span>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">CHECK-IN</span>
                    <span className="text-xs text-white font-bold block mt-0.5">{formatDate(selectedBookingForReceipt.startTime)}</span>
                    <span className="text-sm text-indigo-300 font-black block mt-0.5">{formatTime(selectedBookingForReceipt.startTime)}</span>
                  </div>
                  <div className="border-l border-white/5 pl-4">
                    <span className="text-[10px] text-slate-500 block">CHECK-OUT</span>
                    <span className="text-xs text-white font-bold block mt-0.5">{formatDate(selectedBookingForReceipt.endTime)}</span>
                    <span className="text-sm text-indigo-300 font-black block mt-0.5">{formatTime(selectedBookingForReceipt.endTime)}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vehicle Details</span>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Vehicle Type</span>
                    <span className="font-semibold text-white">{selectedBookingForReceipt.vehicleType || 'Sedan'}</span>
                  </div>
                  {selectedBookingForReceipt.licensePlate && (
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>License Plate</span>
                      <span className="font-mono font-bold text-white uppercase">{selectedBookingForReceipt.licensePlate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Summary */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Payment Breakdown</span>
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Base Fare ({
                      Math.max(1, Math.round((new Date(selectedBookingForReceipt.endTime).getTime() - new Date(selectedBookingForReceipt.startTime).getTime()) / (1000 * 60 * 60)))
                    } hrs)</span>
                    <span>₹{selectedBookingForReceipt.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Taxes & Fees</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="border-t border-dashed border-white/10 my-2 pt-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Amount Charged</span>
                    <span className="text-lg font-black text-emerald-400 font-display">₹{selectedBookingForReceipt.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            {selectedBookingForReceipt && selectedBookingForReceipt.lot?.id && (
              <Button
                variant="outline"
                onClick={() => {
                  const lotId = selectedBookingForReceipt.lot?.id;
                  setSelectedBookingForReceipt(null);
                  if (lotId) navigate(`/lot/${lotId}`);
                }}
                className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 flex-1 py-5 rounded-xl cursor-pointer text-xs gap-1.5"
              >
                <Car className="w-4 h-4" />
                View Parking Lot
              </Button>
            )}
            <Button
              onClick={() => handlePrintReceipt(selectedBookingForReceipt)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white flex-1 font-bold py-5 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Download className="w-4 h-4" />
              Print / Download
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedBookingForReceipt(null)}
              className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white flex-1 py-5 rounded-xl cursor-pointer text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Session Modal */}
      <Dialog open={!!extendBooking} onOpenChange={(open) => { if (!open) setExtendBooking(null); }}>
        <DialogContent className="max-w-sm w-full p-6 border-emerald-500/30 shadow-2xl shadow-emerald-500/10 bg-slate-950/95 text-white backdrop-blur-2xl rounded-3xl">
          <DialogHeader className="pb-3 border-b border-white/10">
            <DialogTitle className="text-lg font-black text-center font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-400 to-indigo-400">
              EXTEND RESERVATION
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-400">
              Slot {extendBooking?.slot?.slotNumber} · {extendBooking?.lot?.name}
            </DialogDescription>
          </DialogHeader>

          {extendBooking && (
            <div className="space-y-5 my-3 text-sm">
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Current Checkout</div>
                  <div className="text-white font-bold mt-1">
                    {formatDate(extendBooking.endTime)} @ {formatTime(extendBooking.endTime)}
                  </div>
                </div>
                <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/20">
                  ₹{extendBooking.lot?.pricePerHour}/hr
                </Badge>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Select Additional Hours
                </label>
                <select
                  value={extendHours}
                  onChange={e => setExtendHours(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 text-white rounded-xl h-10 px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    backgroundRepeat: 'no-repeat',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value={1} className="bg-slate-950 text-white">+1 Hour</option>
                  <option value={2} className="bg-slate-950 text-white">+2 Hours</option>
                  <option value={3} className="bg-slate-950 text-white">+3 Hours</option>
                  <option value={4} className="bg-slate-950 text-white">+4 Hours</option>
                </select>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Rate ({extendHours} hrs)</span>
                  <span className="text-white">₹{extendBooking.lot?.pricePerHour || 50}/hr</span>
                </div>
                <div className="border-t border-dashed border-white/10 my-2 pt-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Extension Amount</span>
                  <span className="text-base font-black text-emerald-400 font-display">
                    ₹{extendHours * (extendBooking.lot?.pricePerHour || 50)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-white/5">
            <Button
              onClick={handleExtendBooking}
              disabled={extending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 font-bold py-5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              {extending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <>Pay & Extend</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setExtendBooking(null)}
              className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white flex-1 py-5 rounded-xl cursor-pointer text-xs"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;

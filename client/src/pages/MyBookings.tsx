import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, QrCode, XCircle, CheckCircle2,
  Loader2, Download, AlertTriangle, Ticket, Car, ChevronRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import AppFooter from '../components/AppFooter';
import api from '../api/axios';
import type { Booking } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
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
  const [extendStep, setExtendStep] = useState('');
  const [feedback, setFeedback] = useState('');
  const { toast } = useToast();

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
        className: 'bg-blue-500/15 text-blue-400 border-blue-500/25'
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
          ? 'bg-rose-500/15 text-rose-400 border-rose-500/25 animate-pulse'
          : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
      };
    } else {
      return {
        text: 'Session Ended',
        className: 'bg-slate-500/15 text-slate-400 border-slate-500/25'
      };
    }
  };

  const fetchBookings = async () => {
    setError('');
    setFeedback('');
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
      localStorage.setItem('parkit_bookings_cache', JSON.stringify(res.data));
      setIsOfflineMode(false);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
      const cached = localStorage.getItem('parkit_bookings_cache');
      if (cached) {
        try { setBookings(JSON.parse(cached)); } catch { setError('Cached data is corrupted.'); }
        setIsOfflineMode(true);
      } else {
        setError('Failed to load bookings.');
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
    setFeedback('');
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      await fetchBookings();
      setFeedback('Booking cancelled.');
      toast({ title: 'Booking cancelled', description: 'Your reservation was cancelled.', variant: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
      toast({ title: 'Cancel failed', description: err.response?.data?.message || 'Failed to cancel booking', variant: 'error' });
    } finally {
      setCancellingId(null);
    }
  };

  const handleExtendBooking = async () => {
    if (!extendBooking) return;
    setExtending(true);
    setError('');
    setFeedback('');
    setExtendStep('Creating extension order...');

    try {
      const orderRes = await api.post('/payment/extend-order', {
        bookingId: extendBooking.id,
        additionalHours: extendHours,
      });

      const { order, key_id } = orderRes.data;

      if (key_id === 'demo_mode' || !(window as any).Razorpay) {
        setExtendStep('Confirming demo payment...');
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
        setExtendStep('');
        setFeedback('Reservation extended.');
        toast({ title: 'Reservation extended', description: 'Your booking has been extended.', variant: 'success' });
        return;
      }

      setExtendStep('Opening payment window...');

      const rzpOptions = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'ParkIt Extension',
        description: `Extend slot ${extendBooking.slot?.slotNumber} by ${extendHours} hrs`,
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
            setFeedback('Reservation extended.');
            toast({ title: 'Reservation extended', description: 'Your booking has been extended.', variant: 'success' });
          } catch (verErr) {
            console.error('Extension verification failed', verErr);
            setError('Extension verification failed.');
            toast({ title: 'Extend failed', description: 'Could not verify extension payment.', variant: 'error' });
          }
        },
        modal: {
          ondismiss: () => {
            setExtending(false);
            setExtendStep('');
            toast({ title: 'Payment cancelled', description: 'Extension not charged.', variant: 'warning' });
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
      setExtendStep('');
      toast({ title: 'Extend failed', description: err.response?.data?.message || 'Failed to extend session', variant: 'error' });
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
      alert('Pop-up blocker is active. Please enable pop-ups to print.');
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
            color: #2563eb;
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
            border-radius: 8px;
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
            background-color: #dbeafe;
            color: #2563eb;
            padding: 2px 8px;
            border-radius: 4px;
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
            border-radius: 8px;
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
            color: #2563eb;
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
      <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border border-white/[0.06] bg-[#111118] animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-xl border border-white/[0.06] bg-[#111118] animate-pulse" />
          <div className="h-64 rounded-xl border border-white/[0.06] bg-[#111118] animate-pulse" />
        </div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status === 'confirmed');
  const pastOrCancelled = bookings.filter(b => b.status !== 'confirmed');

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col pb-16">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-[-5rem] top-[24rem] h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      {isOfflineMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 px-4 py-2.5 text-center text-xs font-medium flex items-center justify-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-3.5 h-3.5" />
          Viewing offline cached data. Some actions may be unavailable.
        </div>
      )}

      {feedback && !error && (
        <div role="status" aria-live="polite" className="bg-blue-500/10 border-b border-blue-500/20 text-blue-300 px-4 py-2.5 text-center text-xs font-medium flex items-center justify-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {feedback}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 mt-6 relative z-10">
        <div className="animate-slideUp">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 bg-blue-500/15 rounded-lg flex items-center justify-center border border-blue-500/25">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">My Bookings</h1>
          </div>
          <p className="text-slate-400 text-xs ml-[46px]">Manage active reservations and access QR passes</p>
          <div className="ml-[46px] mt-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Active sessions, receipts, and extensions in one place
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Active', value: activeBookings.length, color: 'text-emerald-500', bg: 'bg-emerald-500/15 border-emerald-500/25' },
            { label: 'Total', value: bookings.length, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/25' },
            { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/25' },
          ].map(stat => (
            <Card key={stat.label} className={`border ${stat.bg} p-3.5 text-center bg-[#111118] rounded-lg relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20`}>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
              <CardContent className="p-0">
                <div className={`text-xl font-bold tracking-tight ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3.5 py-2.5 rounded-lg flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3 tracking-tight">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Active Passes
            {activeBookings.length > 0 && (
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/25 font-semibold ml-1 rounded-md text-[10px]">{activeBookings.length}</Badge>
            )}
          </h2>

          {activeBookings.length === 0 ? (
            <Card className="p-10 text-center space-y-3 bg-[#111118] border border-white/[0.06] rounded-xl max-w-md mx-auto animate-fadeIn relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
              <CardContent className="p-0 space-y-3">
                <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center mx-auto border border-blue-500/25">
                  <Ticket className="w-6 h-6 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">No Active Passes</h3>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                    You don't have any active parking sessions. Book a slot to get started!
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/search')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg cursor-pointer text-xs"
                >
                  Find Parking
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBookings.map((booking, i) => (
                <Card
                  key={booking.id}
                  onClick={() => setSelectedBookingForReceipt(booking)}
                className="bg-[#111118] border-white/[0.06] border-l-2 border-l-emerald-500 rounded-xl p-5 hover:border-white/[0.12] transition-all duration-200 animate-fadeIn cursor-pointer relative overflow-hidden hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
                  <CardContent className="p-0 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <Badge variant="outline" className="bg-white/[0.04] text-blue-400 border-white/[0.06] font-semibold uppercase text-[9px] px-2 py-0.5 rounded-md">
                            #{booking.id}
                          </Badge>
                          {(() => {
                            const countdown = getCountdownText(booking.startTime, booking.endTime);
                            return (
                              <Badge variant="outline" className={`font-semibold uppercase text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1 ${countdown.className}`}>
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                                {countdown.text}
                              </Badge>
                            );
                          })()}
                        </div>
                        <h3 className="font-semibold text-base text-white truncate">{booking.lot?.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">{booking.lot?.address}, {booking.lot?.city}</span>
                        </p>
                      </div>
                      <div className="text-center shrink-0">
                        <div className="font-mono text-lg font-bold px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg">
                          {booking.slot?.slotNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">Slot</div>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-white/[0.08] my-3" />

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-white font-medium">{formatDate(booking.startTime)}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-blue-400 font-semibold">{formatTime(booking.startTime)}</span>
                        <span className="text-slate-500">to</span>
                        <span className="text-blue-400 font-semibold">{formatTime(booking.endTime)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-xs text-slate-400">Paid</span>
                        <span className="text-base font-bold text-emerald-500">₹{booking.totalAmount}</span>
                      </div>
                    </div>
                  </CardContent>

                  <div className="flex flex-wrap items-center gap-2.5 mt-5">
                    <Button
                      id={`show-qr-${booking.id}`}
                      onClick={(e) => { e.stopPropagation(); setSelectedQR(booking); }}
                      aria-label={`Show QR pass for booking ${booking.id}`}
                      className="bg-blue-600 hover:bg-blue-500 text-white flex-1 min-w-[7.5rem] flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                       <QrCode className="w-3.5 h-3.5" />
                       Show Pass
                    </Button>

                    {getCountdownText(booking.startTime, booking.endTime).text !== 'Session Ended' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExtendBooking(booking);
                            setExtendHours(1);
                          }}
                          aria-label={`Extend booking ${booking.id}`}
                          className="bg-emerald-500/15 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-500 font-semibold py-2 text-xs rounded-lg cursor-pointer h-8 px-3 shrink-0 min-w-[5rem]"
                        >
                        Extend
                      </Button>
                    )}

                    {confirmCancelId === booking.id ? (
                      <div className="flex items-center gap-1 animate-fadeIn">
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleCancel(booking.id); }}
                          disabled={cancellingId === booking.id}
                          variant="destructive"
                          className="text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer h-8"
                        >
                          {cancellingId === booking.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm'}
                        </Button>
                        <Button
                          onClick={(e) => { e.stopPropagation(); setConfirmCancelId(null); }}
                          variant="outline"
                          className="text-xs py-2 px-3 rounded-lg border-white/[0.10] text-slate-400 bg-transparent hover:bg-white/[0.04] hover:text-white cursor-pointer h-8"
                        >
                          Keep
                        </Button>
                      </div>
                    ) : (
                        <Button
                          id={`cancel-btn-${booking.id}`}
                          onClick={(e) => { e.stopPropagation(); setConfirmCancelId(booking.id); }}
                          variant="outline"
                          aria-label={`Cancel booking ${booking.id}`}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border-rose-500/20 hover:border-rose-500/30 cursor-pointer h-8 w-8 flex items-center justify-center"
                          title="Cancel Booking"
                        >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {pastOrCancelled.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3 tracking-tight">
              <Clock className="w-4 h-4 text-slate-400" />
              History
              <Badge variant="outline" className="border-white/[0.10] text-slate-400 font-semibold ml-1 rounded-md text-[10px]">{pastOrCancelled.length}</Badge>
            </h2>

            <div className="space-y-2">
              {pastOrCancelled.map(booking => (
                <Card
                  key={booking.id}
                  onClick={() => setSelectedBookingForReceipt(booking)}
                  className="p-3.5 flex items-center justify-between gap-3 opacity-60 hover:opacity-100 hover:border-white/[0.12] cursor-pointer transition-all duration-200 border-white/[0.06] bg-[#111118] rounded-lg group hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15"
                >
                  <CardContent className="p-0 flex items-center justify-between w-full gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-white/[0.04] rounded-lg flex items-center justify-center border border-white/[0.06] shrink-0">
                        <Car className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate text-sm">{booking.lot?.name}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Slot {booking.slot?.slotNumber} · {formatDate(booking.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="font-semibold text-sm text-white">₹{booking.totalAmount}</div>
                        <Badge variant="outline" className={`text-[10px] uppercase font-semibold mt-0.5 tracking-wide rounded-md px-2 py-0.5 ${
                          booking.status === 'cancelled' ? 'text-rose-400 border-rose-500/25 bg-rose-500/10' : 'text-slate-400 border-white/[0.10] bg-white/[0.04]'
                        }`}>
                          {booking.status}
                        </Badge>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
      <AppFooter />

      <Dialog open={!!selectedQR} onOpenChange={(open) => { if (!open) setSelectedQR(null); }}>
        <DialogContent className="max-w-sm w-full p-6 text-center space-y-5 border-blue-500/30 bg-[#111118] text-white rounded-xl">
          <DialogHeader className="space-y-2.5">
            <div className="w-11 h-11 bg-emerald-500/15 border border-emerald-500/25 rounded-xl flex items-center justify-center mx-auto">
              <QrCode className="w-5 h-5 text-emerald-500" />
            </div>
            <DialogTitle className="text-lg font-bold text-white text-center">Gate Access Pass</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 text-center">
              Scan at barrier for entry/exit
            </DialogDescription>
          </DialogHeader>

          {selectedQR && (
            <>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl w-fit mx-auto ring-2 ring-blue-500/20">
                  <img
                    id="qr-pass-image"
                    src={selectedQR.qrCode}
                    alt="Access QR Code"
                    className="w-52 h-52 object-contain"
                  />
                </div>

                {/* QR Actions */}
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedQR.qrCode;
                      link.download = `parkit-pass-${selectedQR.id}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-xs"
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html><head><title>ParkIt Pass #${selectedQR.id}</title></head>
                          <body style="text-align:center; font-family:sans-serif; padding:40px;">
                            <h2>ParkIt Access Pass</h2>
                            <img src="${selectedQR.qrCode}" style="width:300px; height:300px;" />
                            <p><strong>Slot:</strong> ${selectedQR.slot?.slotNumber} | <strong>Lot:</strong> ${selectedQR.lot?.name}</p>
                            <p>Valid until: ${new Date(selectedQR.endTime).toLocaleString()}</p>
                          </body></html>
                        `);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => printWindow.print(), 500);
                      }
                    }}
                    className="text-xs"
                  >
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('Add to Wallet is a demo feature.')}
                    className="text-xs"
                  >
                    Add to Wallet
                  </Button>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-left space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Lot</span>
                  <span className="font-medium text-white truncate max-w-[180px]">{selectedQR.lot?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Slot</span>
                  <span className="font-mono font-bold text-blue-400 text-base">{selectedQR.slot?.slotNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vehicle</span>
                  <span className="font-medium text-white">{selectedQR.vehicleType || 'Sedan'}</span>
                </div>
                {selectedQR.licensePlate && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Plate</span>
                    <span className="font-mono font-semibold text-white uppercase">{selectedQR.licensePlate}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Entry</span>
                  <span className="font-medium text-white">{formatTime(selectedQR.startTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Exit By</span>
                  <span className="font-medium text-white">{formatTime(selectedQR.endTime)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/[0.06]">
                  <span className="text-slate-400">Paid</span>
                  <span className="font-bold text-emerald-500">₹{selectedQR.totalAmount}</span>
                </div>
              </div>
            </>
          )}

          <DialogFooter showCloseButton={false} className="sm:justify-center">
            <Button onClick={() => setSelectedQR(null)} className="bg-blue-600 hover:bg-blue-500 text-white w-full py-5 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5" />
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBookingForReceipt} onOpenChange={(open) => { if (!open) setSelectedBookingForReceipt(null); }}>
        <DialogContent className="max-w-md w-full p-5 border-blue-500/25 bg-[#111118] text-white rounded-xl">
          <DialogHeader className="pb-3 border-b border-white/[0.06]">
            <DialogTitle className="text-lg font-bold text-center tracking-tight text-blue-400">
              PARKIT RECEIPT
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-400">
              Ref: #PK-{selectedBookingForReceipt?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedBookingForReceipt && (
            <div className="space-y-4 my-3">
              <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Car className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-300">ParkIt</div>
                    <div className="text-[10px] text-slate-500">Receipt</div>
                  </div>
                </div>
                <Badge
                  className={`text-[10px] uppercase font-semibold rounded-md px-2 py-0.5 ${
                    selectedBookingForReceipt.status === 'confirmed'
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                      : selectedBookingForReceipt.status === 'cancelled'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  }`}
                >
                  {selectedBookingForReceipt.status}
                </Badge>
              </div>

              {selectedBookingForReceipt.status === 'confirmed' && (() => {
                const countdown = getCountdownText(selectedBookingForReceipt.startTime, selectedBookingForReceipt.endTime);
                return (
                  <div className={`p-3 rounded-lg border text-center text-xs font-semibold flex items-center justify-center gap-1.5 ${countdown.className}`}>
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{countdown.text.toUpperCase()}</span>
                  </div>
                );
              })()}

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Location & Slot</span>
                <div className="bg-white/[0.02] p-3.5 rounded-lg border border-white/[0.06] space-y-1.5">
                  <div className="font-semibold text-base text-white">
                    {selectedBookingForReceipt.lot?.name}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>{selectedBookingForReceipt.lot?.address}, {selectedBookingForReceipt.lot?.city}</span>
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] mt-2">
                    <span className="text-xs text-slate-400">Slot</span>
                    <span className="font-mono text-base font-bold text-blue-400 px-2.5 py-0.5 bg-blue-500/15 border border-blue-500/25 rounded-md">
                      {selectedBookingForReceipt.slot?.slotNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Time</span>
                <div className="bg-white/[0.02] p-3.5 rounded-lg border border-white/[0.06] grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block">CHECK-IN</span>
                    <span className="text-xs text-white font-semibold block mt-0.5">{formatDate(selectedBookingForReceipt.startTime)}</span>
                    <span className="text-sm text-blue-400 font-bold block mt-0.5">{formatTime(selectedBookingForReceipt.startTime)}</span>
                  </div>
                  <div className="border-l border-white/[0.06] pl-3">
                    <span className="text-[10px] text-slate-500 block">CHECK-OUT</span>
                    <span className="text-xs text-white font-semibold block mt-0.5">{formatDate(selectedBookingForReceipt.endTime)}</span>
                    <span className="text-sm text-blue-400 font-bold block mt-0.5">{formatTime(selectedBookingForReceipt.endTime)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Vehicle</span>
                <div className="bg-white/[0.02] p-3.5 rounded-lg border border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Type</span>
                    <span className="font-medium text-white">{selectedBookingForReceipt.vehicleType || 'Sedan'}</span>
                  </div>
                  {selectedBookingForReceipt.licensePlate && (
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Plate</span>
                      <span className="font-mono font-semibold text-white uppercase">{selectedBookingForReceipt.licensePlate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Payment</span>
                <div className="bg-white/[0.02] p-3.5 rounded-lg border border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Fare ({
                      Math.max(1, Math.round((new Date(selectedBookingForReceipt.endTime).getTime() - new Date(selectedBookingForReceipt.startTime).getTime()) / (1000 * 60 * 60)))
                    } hrs)</span>
                    <span>₹{selectedBookingForReceipt.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Taxes</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="border-t border-dashed border-white/[0.08] my-2 pt-2 flex justify-between items-center">
                    <span className="text-xs font-semibold text-white">Total</span>
                    <span className="text-lg font-bold text-emerald-500">₹{selectedBookingForReceipt.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-3">
            {selectedBookingForReceipt && selectedBookingForReceipt.lot?.id && (
              <Button
                variant="outline"
                onClick={() => {
                  const lotId = selectedBookingForReceipt.lot?.id;
                  setSelectedBookingForReceipt(null);
                  if (lotId) navigate(`/lot/${lotId}`);
                }}
                className="border-blue-500/25 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 flex-1 py-4 rounded-lg cursor-pointer text-xs gap-1.5"
              >
                <Car className="w-3.5 h-3.5" />
                View Lot
              </Button>
            )}
            <Button
              onClick={() => handlePrintReceipt(selectedBookingForReceipt)}
              className="bg-blue-600 hover:bg-blue-500 text-white flex-1 font-semibold py-4 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedBookingForReceipt(null)}
              className="border-white/[0.10] text-slate-300 hover:bg-white/[0.04] hover:text-white flex-1 py-4 rounded-lg cursor-pointer text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!extendBooking} onOpenChange={(open) => { if (!open) setExtendBooking(null); }}>
        <DialogContent className="max-w-sm w-full p-5 border-emerald-500/25 bg-[#111118] text-white rounded-xl">
          <DialogHeader className="pb-2.5 border-b border-white/[0.06]">
            <DialogTitle className="text-base font-bold text-center tracking-tight text-emerald-500">
              EXTEND RESERVATION
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-400">
              Slot {extendBooking?.slot?.slotNumber} · {extendBooking?.lot?.name}
            </DialogDescription>
          </DialogHeader>

          {extendBooking && (
            <div className="space-y-4 my-2.5 text-sm">
              <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.06] flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Checkout</div>
                  <div className="text-white font-semibold mt-0.5 text-sm">
                    {formatDate(extendBooking.endTime)} @ {formatTime(extendBooking.endTime)}
                  </div>
                </div>
                <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/25 text-xs">
                  ₹{extendBooking.lot?.pricePerHour}/hr
                </Badge>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                  Additional Hours
                </label>
                <select
                  value={extendHours}
                  onChange={e => setExtendHours(parseInt(e.target.value))}
                  className="w-full bg-[#111118] border border-white/[0.08] text-white rounded-lg h-9 px-3 text-sm focus:outline-none focus:border-emerald-500/50 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    backgroundRepeat: 'no-repeat',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value={1} className="bg-[#111118]">+1 Hour</option>
                  <option value={2} className="bg-[#111118]">+2 Hours</option>
                  <option value={3} className="bg-[#111118]">+3 Hours</option>
                  <option value={4} className="bg-[#111118]">+4 Hours</option>
                </select>
              </div>

              <div className="bg-white/[0.02] p-3.5 rounded-lg border border-white/[0.06] space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Rate ({extendHours} hrs)</span>
                  <span className="text-white">₹{extendBooking.lot?.pricePerHour || 50}/hr</span>
                </div>
                <div className="border-t border-dashed border-white/[0.08] my-1.5 pt-1.5 flex justify-between items-center">
                  <span className="text-xs font-semibold text-white">Total</span>
                  <span className="text-base font-bold text-emerald-500">
                    ₹{extendHours * (extendBooking.lot?.pricePerHour || 50)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/[0.06]">
            <Button
              onClick={handleExtendBooking}
              disabled={extending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 font-semibold py-4 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              {extending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {extendStep || 'Processing...'}</>
              ) : (
                <>Pay & Extend</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setExtendBooking(null)}
              className="border-white/[0.10] text-slate-300 hover:bg-white/[0.04] hover:text-white flex-1 py-4 rounded-lg cursor-pointer text-xs"
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

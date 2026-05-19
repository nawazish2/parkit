import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, ShieldCheck, Check, ArrowLeft, Loader2, Sparkles, QrCode } from 'lucide-react';
import Navbar from '../components/Navbar';
import SlotGrid from '../components/SlotGrid';
import api from '../api/axios';
import type { ParkingLot, Slot, Booking } from '../types';

const LotDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lot, setLot] = useState<ParkingLot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking config
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // Set default times (now to now + 2 hours)
    const now = new Date();
    const startStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setStartTime(startStr);
    setEndTime(endStr);

    const fetchLot = async () => {
      try {
        const res = await api.get(`/lots/${id}`);
        setLot(res.data);
      } catch (err) {
        console.error('Failed to fetch lot', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLot();
  }, [id]);

  if (loading || !lot) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  // Calculate pricing
  let hours = 1;
  if (startTime && endTime) {
    const s = new Date(startTime).getTime();
    const e = new Date(endTime).getTime();
    const diff = (e - s) / (1000 * 60 * 60);
    hours = Math.max(1, Math.ceil(diff));
  }
  const totalAmount = hours * lot.pricePerHour;

  const handleBookAndPay = async () => {
    if (!selectedSlot) return;
    setBookingInProgress(true);

    try {
      // 1. Create pending booking
      const bookRes = await api.post('/bookings', {
        lotId: lot.id,
        slotId: selectedSlot.id,
        startTime,
        endTime,
        totalAmount,
      });
      const newBooking = bookRes.data;

      // 2. Create Razorpay order
      const orderRes = await api.post('/payment/order', {
        bookingId: newBooking.id,
        amount: totalAmount,
      });

      const { order, key_id } = orderRes.data;

      if (key_id === 'demo_mode' || !(window as any).Razorpay) {
        // Fallback demo auto-verify
        const verifyRes = await api.post('/payment/verify', {
          bookingId: newBooking.id,
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'demo_signature_valid',
        });
        setSuccessBooking(verifyRes.data.booking);
        setBookingInProgress(false);
        return;
      }

      // Open real Razorpay checkout
      const rzpOptions = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'ParkIt Premium',
        description: `Reservation for Slot ${selectedSlot.slotNumber} at ${lot.name}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post('/payment/verify', {
              bookingId: newBooking.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccessBooking(verifyRes.data.booking);
          } catch (verErr) {
            console.error('Payment verification failed', verErr);
            alert('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setBookingInProgress(false);
            // Reopen slot if user dismissed modal
            api.put(`/bookings/${newBooking.id}/cancel`).catch(console.error);
          },
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Booking process failed. Please try again.');
      setBookingInProgress(false);
    }
  };

  const amenitiesList = JSON.parse(lot.amenities || '[]') as string[];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Back navigation */}
        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </button>

        {/* Lot Header */}
        <div className="glass p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 z-10">
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full w-fit border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Premium Certified Lot
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">{lot.name}</h1>
            <p className="text-slate-400 flex items-center gap-1.5 text-base">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              {lot.address}, {lot.city}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {amenitiesList.map(a => (
                <span key={a} className="text-xs font-medium bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-slate-300 shadow-sm">
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="glass bg-white/5 p-6 rounded-2xl border border-white/10 flex md:flex-col items-center gap-4 text-right shrink-0 w-full md:w-auto justify-between md:justify-center shadow-xl">
            <div>
              <div className="text-xs text-slate-400 font-medium">Standard Hourly Rate</div>
              <div className="text-3xl font-extrabold text-indigo-400 mt-0.5">
                ₹{lot.pricePerHour} <span className="text-sm font-normal text-slate-400">/hr</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> 24/7 Security
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Slot selection grid (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6">
              <h2 className="text-xl font-bold text-white mb-2">Select Your Parking Spot</h2>
              <p className="text-slate-400 text-sm mb-6">
                Click on any available green slot below. Selections are locked instantly to prevent double-booking.
              </p>
              <SlotGrid lotId={lot.id} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
            </div>
          </div>

          {/* Booking Summary Card (Right 1 col) */}
          <div className="glass p-6 space-y-6 sticky top-28 shadow-2xl border-indigo-500/30">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
              <Clock className="w-5 h-5 text-indigo-400" />
              Reservation Details
            </h2>

            {selectedSlot ? (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-between">
                  <span className="text-sm text-indigo-200">Selected Slot</span>
                  <span className="text-2xl font-mono font-extrabold text-white px-3 py-1 rounded-lg bg-indigo-600">
                    {selectedSlot.slotNumber}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="input text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="input text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Duration</span>
                    <span className="font-semibold text-white">{hours} {hours === 1 ? 'Hour' : 'Hours'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Rate</span>
                    <span className="font-semibold text-white">₹{lot.pricePerHour}/hr</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                    <span>Total Amount</span>
                    <span className="text-2xl font-extrabold text-indigo-400">₹{totalAmount}</span>
                  </div>
                </div>

                <button
                  onClick={handleBookAndPay}
                  disabled={bookingInProgress}
                  className="btn-primary w-full flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-lg py-4"
                >
                  {bookingInProgress ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {bookingInProgress ? 'Processing Secure Payment...' : `Pay ₹${totalAmount} Securely`}
                </button>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                  <MapPin className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-400">Please select an available slot from the grid first.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {successBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass max-w-md w-full p-8 text-center space-y-6 relative border-indigo-500/40 shadow-2xl shadow-indigo-500/20">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-white">Booking Confirmed!</h3>
              <p className="text-sm text-slate-400">
                Your spot is securely reserved. Present this QR code at the entrance barrier upon arrival.
              </p>
            </div>

            {successBooking.qrCode ? (
              <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-xl">
                <img src={successBooking.qrCode} alt="Access QR Code" className="w-56 h-56 mx-auto object-contain" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-white/5 border border-white/10 rounded-2xl">
                <QrCode className="w-12 h-12 text-slate-500" />
              </div>
            )}

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span> <span className="font-semibold">{lot.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slot:</span>{' '}
                <span className="font-mono font-bold text-indigo-300">
                  {selectedSlot?.slotNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Arrival:</span>{' '}
                <span>{new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/bookings')} className="btn-primary flex-1">
                View My Bookings
              </button>
              <button
                onClick={() => {
                  setSuccessBooking(null);
                  setSelectedSlot(null);
                }}
                className="btn-ghost"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotDetail;

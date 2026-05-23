import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, ShieldCheck, Check, ArrowLeft, Loader2, Sparkles, QrCode, AlertTriangle, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import SlotGrid from '../components/SlotGrid';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { ParkingLot, Slot, Booking } from '../types';
import { safeParseJSON } from '../utils/json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const LotDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lot, setLot] = useState<ParkingLot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking config
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [vehicleType, setVehicleType] = useState<string>('Sedan');
  const [licensePlate, setLicensePlate] = useState<string>('');

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

  useEffect(() => {
    if (user?.savedVehicles && user.savedVehicles.length > 0) {
      const defaultVehicle = user.savedVehicles.find(v => v.isDefault) || user.savedVehicles[0];
      setVehicleType(defaultVehicle.type);
      setLicensePlate(defaultVehicle.plate);
    }
  }, [user]);

  if (loading || !lot) {
    return (
      <div className="min-h-screen bg-[#06060a] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  // Calculate pricing with validation
  let hours = 1;
  let timeError = '';
  if (startTime && endTime) {
    const s = new Date(startTime).getTime();
    const e = new Date(endTime).getTime();
    if (e <= s) {
      timeError = 'End time must be after start time';
    } else {
      const diff = (e - s) / (1000 * 60 * 60);
      hours = Math.max(1, Math.ceil(diff));
    }
  }
  const totalAmount = hours * lot.pricePerHour;

  let validationError = timeError;
  if (!validationError && !licensePlate.trim()) {
    validationError = 'License plate number is required';
  }

  const handleBookAndPay = async () => {
    if (!selectedSlot) return;
    if (validationError) return;
    setBookingInProgress(true);

    try {
      // 1. Create pending booking
      const bookRes = await api.post('/bookings', {
        lotId: lot.id,
        slotId: selectedSlot.id,
        startTime,
        endTime,
        totalAmount,
        vehicleType,
        licensePlate: licensePlate.trim().toUpperCase(),
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
            setBookingInProgress(false);
          } catch (verErr) {
            console.error('Payment verification failed', verErr);
            setBookingInProgress(false);
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
      console.error('Booking failed:', err.response?.data?.message || err.message);
      setBookingInProgress(false);
    }
  };

  const amenitiesList = safeParseJSON(lot.amenities) as string[];

  return (
    <div className="min-h-screen bg-[#06060a] text-white flex flex-col pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 mt-4">
        {/* Back navigation */}
        <Button
          variant="ghost"
          onClick={() => navigate(user?.role === 'owner' ? '/owner' : '/search')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer w-fit p-0 h-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          {user?.role === 'owner' ? 'Back to Dashboard' : 'Back to Search'}
        </Button>

        {/* Lot Header */}
        <Card className="p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-white/5 bg-slate-950/40 backdrop-blur-2xl rounded-2xl shadow-xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 z-10 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-indigo-500/15 text-indigo-300 border-indigo-500/25 uppercase tracking-wider text-[9px] font-extrabold px-3 py-1 flex gap-1.5 items-center rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Premium Certified Lot
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase tracking-wider text-[9px] font-extrabold px-2.5 py-1 flex gap-1 items-center rounded-full">
                <Star className="w-3 h-3 fill-emerald-400/20" /> Verified
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight font-display">{lot.name}</h1>
            <p className="text-slate-400 flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              {lot.address}, {lot.city}
            </p>

            {amenitiesList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {amenitiesList.map(a => (
                  <Badge key={a} variant="outline" className="bg-indigo-500/5 text-indigo-300 border-indigo-500/15 font-semibold text-[10px] px-2.5 py-0.5 rounded-md">
                    {a}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Card className="bg-white/5 p-5 rounded-2xl border-white/5 flex md:flex-col items-center gap-4 shrink-0 w-full md:w-44 justify-between md:justify-center shadow-xl text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Hourly Rate</div>
              <div className="text-3xl font-black text-indigo-400 font-display">
                ₹{lot.pricePerHour}
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">/hour</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> 24/7 Security
            </div>
          </Card>
        </Card>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Slot selection grid (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-white/5 bg-slate-950/40 backdrop-blur-2xl rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold text-white mb-2 font-display">Select Your Parking Spot</h2>
              <p className="text-slate-400 text-sm mb-6">
                {user?.role === 'owner'
                  ? 'Click on any slot to inspect status. Green indicates available; red indicates occupied.'
                  : 'Click on any available green slot below. Selections are locked instantly to prevent double-booking.'
                }
              </p>
              <SlotGrid lotId={lot.id} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} isOwner={user?.role === 'owner'} />
            </Card>
          </div>

          {/* Booking Summary Card / Owner Inspector Panel (Right 1 col) */}
          <Card className="p-6 space-y-6 sticky top-28 shadow-2xl border-white/5 bg-slate-950/40 backdrop-blur-2xl relative overflow-hidden rounded-2xl">
            {/* Ticket Cutouts for sidebar */}
            <div className="absolute top-[48%] -translate-y-1/2 -left-3.5 w-7 h-7 bg-[#06060a] rounded-full border-r border-white/10 z-10" />
            <div className="absolute top-[48%] -translate-y-1/2 -right-3.5 w-7 h-7 bg-[#06060a] rounded-full border-l border-white/10 z-10" />

            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4 font-display">
              {user?.role === 'owner' ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Owner Inspector
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-indigo-400" />
                  Reservation
                </>
              )}
            </h2>

            {user?.role === 'owner' ? (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex flex-col gap-2.5">
                  <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider font-display">Property Management</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You are inspecting this property as the Owner. Drivers see a reservation and Razorpay checkout panel here to book slots.
                  </p>
                </div>
                {selectedSlot ? (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Slot Status</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                        selectedSlot.isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {selectedSlot.isAvailable ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Slot Number</span>
                      <span className="text-sm font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/5">{selectedSlot.slotNumber}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Click any slot in the grid to view its real-time status.</p>
                )}
              </div>
            ) : selectedSlot ? (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-between">
                  <span className="text-sm text-indigo-200 font-semibold">Selected Slot</span>
                  <span className="text-2xl font-mono font-extrabold text-white px-3.5 py-1 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/20">
                    {selectedSlot.slotNumber}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Start Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="bg-slate-950/60 border-white/10 text-white placeholder-slate-500 rounded-xl h-10 px-3 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      End Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="bg-slate-950/60 border-white/10 text-white placeholder-slate-500 rounded-xl h-10 px-3 text-sm font-medium"
                    />
                  </div>

                  {user?.savedVehicles && user.savedVehicles.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Use Registered Vehicle
                      </label>
                      <select
                        onChange={e => {
                          const val = e.target.value;
                          if (val) {
                            const found = user.savedVehicles?.find(v => v.plate === val);
                            if (found) {
                              setVehicleType(found.type);
                              setLicensePlate(found.plate);
                            }
                          }
                        }}
                        value={user.savedVehicles.some(v => v.plate === licensePlate) ? licensePlate : ''}
                        className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl h-10 px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none mb-4"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em',
                          backgroundRepeat: 'no-repeat',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="" className="bg-slate-950 text-slate-400">-- Choose saved vehicle --</option>
                        {user.savedVehicles.map(v => (
                          <option key={v.plate} value={v.plate} className="bg-slate-950 text-white">
                            {v.label ? `${v.label} (${v.plate})` : `${v.type} - ${v.plate}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleType}
                        onChange={e => setVehicleType(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl h-10 px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em',
                          backgroundRepeat: 'no-repeat',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="Sedan" className="bg-slate-950 text-white">Sedan</option>
                        <option value="SUV" className="bg-slate-950 text-white">SUV</option>
                        <option value="Hatchback" className="bg-slate-950 text-white">Hatchback</option>
                        <option value="Motorcycle" className="bg-slate-950 text-white">Motorcycle</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        License Plate
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. MH12AB1234"
                        value={licensePlate}
                        onChange={e => setLicensePlate(e.target.value)}
                        maxLength={15}
                        className="bg-slate-950/60 border-white/10 text-white placeholder-slate-500 rounded-xl h-10 px-3 text-sm font-medium uppercase"
                      />
                    </div>
                  </div>
                </div>

                {validationError && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {validationError}
                  </div>
                )}

                {/* Dashed divider */}
                <div className="border-t border-dashed border-white/10 my-4" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">Duration</span>
                    <span className="font-bold text-white">{hours} {hours === 1 ? 'Hour' : 'Hours'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">Rate</span>
                    <span className="font-bold text-white">₹{lot.pricePerHour}/hr</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="font-bold text-white font-display">Total</span>
                    <span className="text-2xl font-black text-indigo-400 font-display">₹{totalAmount}</span>
                  </div>
                </div>

                <Button
                  onClick={handleBookAndPay}
                  disabled={bookingInProgress || !!validationError}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white w-full flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-sm py-6 rounded-xl font-bold cursor-pointer disabled:opacity-50 mt-2"
                >
                  {bookingInProgress ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing Payment...</>
                  ) : (
                    <><CreditCard className="w-5 h-5" /> Pay ₹{totalAmount} Securely</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                  <MapPin className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-xs font-semibold text-slate-400 px-4">Please select an available slot from the grid first.</p>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Success Modal using Shadcn Dialog */}
      <Dialog open={!!successBooking} onOpenChange={(open) => { if (!open) { setSuccessBooking(null); setSelectedSlot(null); } }}>
        <DialogContent className="max-w-md w-full p-8 text-center space-y-6 border-indigo-500/40 shadow-2xl shadow-indigo-500/20 bg-slate-950/95 text-white backdrop-blur-2xl rounded-2xl">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <Check className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-extrabold text-white font-display text-center">Booking Confirmed!</DialogTitle>
            <DialogDescription className="text-sm text-slate-400 text-center">
              Your spot is securely reserved. Present this QR code at the entrance barrier upon arrival.
            </DialogDescription>
          </DialogHeader>

          {successBooking && (
            <>
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
                  <span className="text-slate-400">Location:</span> <span className="font-semibold text-white">{lot.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slot:</span>{' '}
                  <span className="font-mono font-bold text-indigo-300">
                    {selectedSlot?.slotNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle Type:</span>{' '}
                  <span className="font-semibold text-white">{successBooking.vehicleType || 'Sedan'}</span>
                </div>
                {successBooking.licensePlate && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">License Plate:</span>{' '}
                    <span className="font-mono font-bold text-white uppercase">{successBooking.licensePlate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Arrival:</span>{' '}
                  <span className="text-white">{new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </>
          )}

          <DialogFooter showCloseButton={false} className="flex gap-3 pt-2 sm:flex-row flex-col">
            <Button onClick={() => { setSuccessBooking(null); setSelectedSlot(null); navigate('/bookings'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white flex-1 rounded-xl h-11 font-bold cursor-pointer">
              View My Bookings
            </Button>
            <Button
              onClick={() => {
                setSuccessBooking(null);
                setSelectedSlot(null);
              }}
              variant="outline"
              className="border-white/10 bg-transparent text-slate-400 hover:bg-white/5 hover:text-white rounded-xl h-11 font-bold cursor-pointer"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LotDetail;

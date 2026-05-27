import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, ShieldCheck, Check, ArrowLeft, Loader2, QrCode, AlertTriangle, Star, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import AppFooter from '../components/AppFooter';
import SlotGrid from '../components/SlotGrid';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { ParkingLot, Slot, Booking } from '../types';
import { safeParseJSON } from '../utils/json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
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
  const { toast } = useToast();

  const [lot, setLot] = useState<ParkingLot | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLotData = async (lotId: string) => {
    try {
      const res = await api.get(`/lots/${lotId}`);
      setLot(res.data);
    } catch (err) {
      console.error('Failed to fetch lot', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLotData(id);
  }, [id]);

  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [durationHours, setDurationHours] = useState(2);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [vehicleType, setVehicleType] = useState<string>('Sedan');
  const [licensePlate, setLicensePlate] = useState<string>('DL3CAF1234'); // Pre-filled for smooth demo
  const [bookingError, setBookingError] = useState('');
  const [bookingStep, setBookingStep] = useState('');
  const plateValue = licensePlate.toUpperCase();

  useEffect(() => {
    const now = new Date();
    // Round to next 15-minute slot for cleaner demo experience
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    const start = new Date(now);
    start.setMinutes(roundedMinutes, 0, 0);
    
    if (start < now) start.setMinutes(start.getMinutes() + 15);

    const startStr = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setStartTime(startStr);
    setEndTime(endStr);
    setDurationHours(2);
  }, [id]);

  useEffect(() => {
    if (user?.savedVehicles && user.savedVehicles.length > 0) {
      const defaultVehicle = user.savedVehicles.find(v => v.isDefault) || user.savedVehicles[0];
      setVehicleType(defaultVehicle.type);
      setLicensePlate(defaultVehicle.plate);
    }
  }, [user]);

  // Sync end time when startTime or duration changes
  useEffect(() => {
    if (startTime) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
      const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEndTime(endStr);
    }
  }, [startTime, durationHours]);

  if (loading || !lot) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-4xl space-y-4 animate-fadeIn">
            <div className="h-28 rounded-2xl border border-white/[0.06] bg-[#111118] animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-[28rem] rounded-2xl border border-white/[0.06] bg-[#111118] animate-pulse" />
              <div className="h-[28rem] rounded-2xl border border-white/[0.06] bg-[#111118] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
  } else if (!validationError && licensePlate.trim().length < 6) {
    validationError = 'Enter a valid license plate';
  }

  const handleBookAndPay = async () => {
    if (!selectedSlot) return;
    if (validationError) return;
    setBookingInProgress(true);
    setBookingError('');
    setBookingStep('Creating your booking...');

    try {
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
      setBookingStep('Creating payment order...');

      const orderRes = await api.post('/payment/order', {
        bookingId: newBooking.id,
        amount: totalAmount,
      });

      const { order, key_id } = orderRes.data;

      if (key_id === 'demo_mode' || !(window as any).Razorpay) {
        setBookingStep('Confirming demo payment...');
        const verifyRes = await api.post('/payment/verify', {
          bookingId: newBooking.id,
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'demo_signature_valid',
        });
        setSuccessBooking(verifyRes.data.booking);
        setBookingInProgress(false);
        setBookingStep('');
        toast({ title: 'Booking confirmed', description: 'Your parking slot is reserved.', variant: 'success' });
        return;
      }

      setBookingStep('Opening payment window...');
      const rzpOptions = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'ParkIt',
        description: `Slot ${selectedSlot.slotNumber} at ${lot.name}`,
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
          } catch (verError) {
            console.error('Payment verification failed', verError);
            setBookingInProgress(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBookingInProgress(false);
            setBookingStep('');
            setBookingError('Payment was cancelled.');
            toast({ title: 'Payment cancelled', description: 'No charge was made.', variant: 'warning' });
            api.put(`/bookings/${newBooking.id}/cancel`).catch(console.error);
          },
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Booking failed';
      console.error('Booking failed:', message);
      const isOccupied = message.toLowerCase().includes('occupied');
      const friendly = isOccupied
        ? 'Slot taken by another driver. The grid updated live — please select a different slot.'
        : message;
      setBookingError(friendly);
      toast({ title: isOccupied ? 'Slot conflict' : 'Booking failed', description: friendly, variant: 'error' });
      setBookingInProgress(false);
      setBookingStep('');
    }
  };

  const amenitiesList = safeParseJSON(lot.amenities) as string[];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col pb-16">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-[-5rem] top-[24rem] h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 mt-6 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate(user?.role === 'owner' ? '/owner' : '/search')}
          aria-label={user?.role === 'owner' ? 'Back to dashboard' : 'Back to search'}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer w-fit p-0 h-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          {user?.role === 'owner' ? 'Back to Dashboard' : 'Back to Search'}
        </Button>

        <Card className="p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-white/[0.06] bg-[#111118] rounded-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
          <div className="space-y-2.5 z-10 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/25 uppercase tracking-wide text-[10px] font-semibold px-2 py-0.5 flex gap-1 items-center rounded-md">
                <Star className="w-3 h-3 fill-emerald-500/30" /> Verified
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">{lot.name}</h1>
            <p className="text-slate-400 flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
              {lot.address}, {lot.city}
            </p>

            {amenitiesList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {amenitiesList.map(a => (
                  <Badge key={a} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-medium text-[10px] px-2 py-0.5 rounded-md">
                    {a}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Card className="bg-white/[0.02] p-4 rounded-xl border-white/[0.06] flex md:flex-col items-center gap-3 shrink-0 w-full md:w-40 justify-between md:justify-center text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Rate</div>
              <div className="text-2xl font-bold text-blue-500">
                ₹{lot.pricePerHour}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">/hour</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/25 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 24/7 Security
            </div>
          </Card>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 border-white/[0.06] bg-[#111118] rounded-xl relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
              <h2 className="text-lg font-semibold text-white mb-1.5">Select Your Parking Spot</h2>
              <p className="text-slate-400 text-xs mb-5">
                {user?.role === 'owner'
                  ? 'Click any slot to inspect. Green = available, red = occupied.'
                  : 'Click an available green slot. Selections lock instantly to prevent double-booking.'
                }
              </p>
              <SlotGrid lotId={lot.id} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} isOwner={user?.role === 'owner'} onConflict={() => toast({ title: 'Slot taken', description: 'Someone just booked your selected slot. Pick another one below.', variant: 'error' })} />
            </Card>
          </div>

          <Card className="p-5 space-y-5 sticky top-20 border-white/[0.06] bg-[#111118] relative overflow-hidden rounded-xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/[0.06] pb-3">
              {user?.role === 'owner' ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  Owner Inspector
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-blue-500" />
                  Reservation
                </>
              )}
            </h2>

            {user?.role === 'owner' ? (
              <div className="space-y-5">
                 <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col gap-2">
                   <span className="text-xs text-blue-400 font-semibold uppercase tracking-wide">Property Management</span>
                   <p className="text-xs text-slate-400 leading-relaxed">
                     You're inspecting this property as the Owner. Drivers see a reservation panel here to book slots.
                   </p>
                   <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                     Live updates enabled
                   </div>
                   <div className="text-[10px] text-blue-400 mt-1">Manage all bookings from Owner Dashboard →</div>
                   <button
                     onClick={() => alert('Demo: Switch to Owner Dashboard to see full tools (cancel, complete, live updates)')}
                     className="text-[10px] mt-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                   >
                     Open Owner Dashboard (demo)
                   </button>
                   <button
                     onClick={() => {
                       alert('Demo: Live data refreshed (new bookings would appear instantly)');
                     }}
                     className="text-[10px] mt-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                   >
                     Refresh live data (demo)
                   </button>
                   <div className="text-[10px] text-emerald-400 mt-1">All actions here update live for drivers too</div>
                 </div>
                {selectedSlot ? (
                  <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Status</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase border ${
                        selectedSlot.isAvailable
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-500 border-rose-500/25'
                      }`}>
                        {selectedSlot.isAvailable ? 'Available' : 'Occupied'}
                      </span>
                    </div>
                     <div className="flex justify-between items-center">
                       <span className="text-xs text-slate-400">Slot</span>
                       <span className="text-sm font-mono font-semibold text-white bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">{selectedSlot.slotNumber}</span>
                     </div>

                     {/* Owner quick action: Block/Unblock slot */}
                     <Button
                       onClick={async () => {
                         try {
                           const newAvailability = !selectedSlot.isAvailable;
                           await api.patch(`/slots/${selectedSlot.id}/availability`, { isAvailable: newAvailability });
                           // Update local state so UI reflects immediately
                           setSelectedSlot({ ...selectedSlot, isAvailable: newAvailability });
                           toast({
                             title: newAvailability ? 'Slot unblocked' : 'Slot blocked',
                             description: newAvailability ? 'Drivers can now book this slot.' : 'This slot is now unavailable for booking.',
                             variant: 'success',
                           });
                         } catch (err: any) {
                           toast({
                             title: 'Action failed',
                             description: err.response?.data?.message || 'Could not update slot availability',
                             variant: 'error',
                           });
                         }
                       }}
                       className={`w-full mt-2 text-xs font-semibold ${selectedSlot.isAvailable 
                         ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                         : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                      >
                        {selectedSlot.isAvailable ? 'Block this slot' : 'Unblock this slot'}
                      </Button>

                      {!selectedSlot.isAvailable && (
                        <>
                          <Button
                            onClick={() => {
                              toast({ title: 'Booking cancelled (demo)', description: 'Slot freed instantly. Owners see this live.', variant: 'success' });
                              setSelectedSlot({ ...selectedSlot, isAvailable: true });
                            }}
                            className="w-full mt-1 text-xs bg-rose-600 hover:bg-rose-500 text-white"
                          >
                            Cancel booking for this slot (demo)
                          </Button>
                          <Button
                            onClick={() => {
                              toast({ title: 'Booking extended (demo)', description: 'Booking duration extended. Drivers see this live.', variant: 'success' });
                            }}
                            className="w-full mt-1 text-xs bg-blue-600 hover:bg-blue-500 text-white"
                          >
                            Extend booking (demo)
                          </Button>
                          <Button
                            onClick={() => {
                              toast({ title: 'Marked as completed', description: 'Booking marked complete. Slot released for new bookings.', variant: 'success' });
                              setSelectedSlot({ ...selectedSlot, isAvailable: true });
                            }}
                            className="w-full mt-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            Mark as completed
                          </Button>
                          <Button
                            onClick={() => {
                              toast({ title: 'Parking Pass (demo)', description: `QR pass for slot ${selectedSlot.slotNumber}. Scan at gate for entry.`, variant: 'success' });
                            }}
                            className="w-full mt-1 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                          >
                            <QrCode className="w-3 h-3 mr-1 inline" /> View pass (demo)
                          </Button>
                        </>
                      )}
                  </div>
                 ) : (
                  <p className="text-xs text-slate-500 text-center py-3">Click any slot to view status.</p>
                )}
              </div>
            ) : selectedSlot ? (
              <div className="space-y-5">
            <div className="p-3.5 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-between">
              <span className="text-sm text-blue-300 font-medium">Selected Slot</span>
              <span className="text-xl font-mono font-bold text-white px-3 py-1 rounded-md bg-blue-600">
                {selectedSlot.slotNumber}
              </span>
            </div>

            <div className="flex justify-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  now.setMinutes(now.getMinutes() + 1);
                  setStartTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                  setDurationHours(1);
                }}
                className="text-[10px] px-2.5 py-1 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
              >
                Quick 1hr
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  now.setMinutes(now.getMinutes() + 1);
                  setStartTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
                  setDurationHours(2);
                }}
                className="text-[10px] px-2.5 py-1 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
              >
                Quick 2hr
              </button>
            </div>
            <div className="text-center text-[10px] text-slate-500 mt-1">Demo tip: Your booking appears instantly in the owner’s live dashboard.</div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                      Start Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      aria-label="Start time"
                      className="bg-[#111118] border-white/[0.08] text-white rounded-lg h-9 px-3 text-sm"
                    />
                    <p className="text-[10px] text-blue-400/70 mt-1">
                      Arrives {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Duration Slider + Quick Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        Duration
                      </label>
                      <span className="text-sm font-bold text-white">{durationHours} Hour{durationHours > 1 ? 's' : ''}</span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />

                    <div className="flex gap-2 mt-2">
                      {[1, 2, 3, 4, 6, 8].map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setDurationHours(h)}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            durationHours === h
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-slate-300'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                      End Time
                    </label>
                    <Input
                      type="datetime-local"
                      value={endTime}
                      onChange={e => {
                        const newEnd = e.target.value;
                        setEndTime(newEnd);
                        // Update duration based on manual end time change
                        if (startTime) {
                          const s = new Date(startTime).getTime();
                          const e = new Date(newEnd).getTime();
                          const diffHours = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60)));
                          setDurationHours(Math.min(8, diffHours));
                        }
                      }}
                      aria-label="End time"
                      className="bg-[#111118] border-white/[0.08] text-white rounded-lg h-9 px-3 text-sm"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const start = new Date(now.getTime() + 15 * 60 * 1000);
                      const startStr = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                      setStartTime(startStr);
                      setDurationHours(2);
                    }}
                    className="w-full mt-1 text-sm bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 py-2 rounded-lg font-medium transition-colors"
                  >
                    ⚡ Suggest next available time
                  </button>

                  {user?.savedVehicles && user.savedVehicles.length > 0 && (
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                        Use Saved Vehicle
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
                        aria-label="Use saved vehicle"
                        className="w-full bg-[#111118] border border-white/[0.08] text-white rounded-lg h-9 px-3 text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none mb-3.5"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em',
                          backgroundRepeat: 'no-repeat',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="" className="bg-[#111118] text-slate-400">-- Choose saved vehicle --</option>
                        {user.savedVehicles.map(v => (
                          <option key={v.plate} value={v.plate} className="bg-[#111118] text-white">
                            {v.label ? `${v.label} (${v.plate})` : `${v.type} - ${v.plate}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleType}
                        onChange={e => setVehicleType(e.target.value)}
                        aria-label="Vehicle type"
                        className="w-full bg-[#111118] border border-white/[0.08] text-white rounded-lg h-9 px-3 text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '1.5em 1.5em',
                          backgroundRepeat: 'no-repeat',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="Sedan" className="bg-[#111118]">Sedan</option>
                        <option value="SUV" className="bg-[#111118]">SUV</option>
                        <option value="Hatchback" className="bg-[#111118]">Hatchback</option>
                        <option value="Motorcycle" className="bg-[#111118]">Motorcycle</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                        License Plate
                      </label>
                <Input
                  type="text"
                  placeholder="MH12AB1234"
                  value={plateValue}
                  onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                  maxLength={15}
                  autoComplete="off"
                  aria-label="License plate"
                  className="bg-[#111118] border-white/[0.08] text-white rounded-lg h-9 px-3 text-sm uppercase"
                />
                      </div>
                  </div>
                </div>

                {validationError && (
                  <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {validationError}
                  </div>
                )}

                {bookingError && !validationError && (
                  <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {bookingError}
                  </div>
                )}

                <div className="border-t border-dashed border-white/[0.08] my-3" />

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">Duration</span>
                    <span className="font-semibold text-white">{hours} {hours === 1 ? 'Hour' : 'Hours'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="text-slate-400">Rate</span>
                    <span className="font-semibold text-white">₹{lot.pricePerHour}/hr</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
                    <span className="font-semibold text-white">Total</span>
                    <span className="text-xl font-bold text-blue-500">₹{totalAmount}</span>
                  </div>
                </div>

                <Button
                  onClick={handleBookAndPay}
                  disabled={bookingInProgress || !!validationError}
                  className="bg-blue-600 hover:bg-blue-500 text-white w-full flex items-center justify-center gap-2 text-sm py-5 rounded-lg font-semibold cursor-pointer disabled:opacity-50 mt-2"
                >
                  {bookingInProgress ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {bookingStep || 'Processing payment...'}</>
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Pay ₹{totalAmount}</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="py-10 text-center space-y-2.5">
                <div className="w-11 h-11 bg-white/[0.04] rounded-xl flex items-center justify-center mx-auto border border-white/[0.06]">
                  <MapPin className="w-5 h-5 text-slate-500" />
                </div>
                <p className="text-xs font-medium text-slate-400 px-3">Select an available slot from the grid first.</p>
              </div>
            )}
          </Card>
        </div>
      </main>
      <AppFooter />

      <Dialog open={!!successBooking} onOpenChange={(open) => { if (!open) { setSuccessBooking(null); setSelectedSlot(null); } }}>
        <DialogContent className="max-w-md w-full p-6 text-center space-y-5 border-blue-500/30 bg-[#111118] text-white rounded-xl">
          <DialogHeader className="space-y-3">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto text-emerald-500">
              <Check className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl font-bold text-white text-center">Booking Confirmed!</DialogTitle>
            <DialogDescription className="text-sm text-slate-400 text-center">
              Your parking spot is reserved. Show the QR code at the gate.
            </DialogDescription>
            <p className="text-[10px] text-emerald-400/80 text-center">This booking appears instantly on the property owner's dashboard.</p>
          </DialogHeader>

          {successBooking && (
            <div className="space-y-4">
              {successBooking.qrCode ? (
                <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-lg">
                  <img 
                    src={successBooking.qrCode} 
                    alt="Access QR Code" 
                    className="w-48 h-48 mx-auto object-contain" 
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                  <QrCode className="w-10 h-10 text-slate-500" />
                </div>
              )}
            </div>
          )}

          {successBooking && (
            <>
              {successBooking.qrCode ? (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-xl w-fit mx-auto">
                    <img 
                      id="qr-code-image" 
                      src={successBooking.qrCode} 
                      alt="Access QR Code" 
                      className="w-52 h-52 mx-auto object-contain" 
                    />
                  </div>

                  {/* Live Countdown */}
                  <div className="text-center">
                    <div className="text-xs text-slate-400">Pass valid until</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">
                      {new Date(successBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* QR Actions */}
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = successBooking.qrCode;
                        link.download = `parkit-pass-${successBooking.id}.png`;
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
                            <html><head><title>ParkIt Pass #${successBooking.id}</title></head>
                            <body style="text-align:center; font-family:sans-serif; padding:40px;">
                              <h2>ParkIt Access Pass</h2>
                              <img src="${successBooking.qrCode}" style="width:300px; height:300px;" />
                              <p><strong>Slot:</strong> ${selectedSlot?.slotNumber} | <strong>Lot:</strong> ${lot.name}</p>
                              <p>Valid until: ${new Date(successBooking.endTime).toLocaleString()}</p>
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
                      onClick={() => alert('Add to Wallet is a demo feature. In production this would generate a .pkpass file.')}
                      className="text-xs"
                    >
                      Add to Wallet
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-44 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                  <QrCode className="w-10 h-10 text-slate-500" />
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-left space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span> <span className="font-medium text-white">{lot.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slot:</span>{' '}
                  <span className="font-mono font-semibold text-blue-400">
                    {selectedSlot?.slotNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle:</span>{' '}
                  <span className="font-medium text-white">{successBooking.vehicleType || 'Sedan'}</span>
                </div>
                {successBooking.licensePlate && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plate:</span>{' '}
                    <span className="font-mono font-semibold text-white uppercase">{successBooking.licensePlate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Arrival:</span>{' '}
                  <span className="text-white">{new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => {
                const addr = encodeURIComponent(lot?.address || lot?.name || '');
                window.open(`https://maps.google.com/?q=${addr}`, '_blank');
              }}
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-white/[0.08] text-slate-400 hover:text-white"
            >
              <MapPin className="w-3.5 h-3.5 mr-1" /> Navigate
            </Button>
            <Button
              onClick={() => {
                const text = `ParkIt Booking\nLot: ${lot?.name}\nSlot: ${selectedSlot?.slotNumber}\nArrival: ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                navigator.clipboard.writeText(text);
                toast({ title: 'Copied', description: 'Booking details copied to clipboard.', variant: 'success' });
              }}
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-white/[0.08] text-slate-400 hover:text-white"
            >
              Copy details
            </Button>
          </div>

          <DialogFooter showCloseButton={false} className="flex gap-2 pt-2 sm:flex-row flex-col">
            <Button 
              onClick={() => { 
                setSuccessBooking(null); 
                setSelectedSlot(null); 
                navigate('/bookings'); 
              }} 
              className="bg-blue-600 hover:bg-blue-500 text-white flex-1 rounded-lg h-11 font-semibold cursor-pointer shadow-lg shadow-blue-500/20"
            >
              View My Bookings
            </Button>
            <Button
              onClick={() => {
                if (!successBooking) return;
                const start = new Date(startTime);
                const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
                const ics = [
                  'BEGIN:VCALENDAR', 'VERSION:2.0',
                  'BEGIN:VEVENT',
                  `DTSTART:${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                  `DTEND:${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
                  `SUMMARY:ParkIt Booking - ${lot?.name || 'Parking'}`,
                  `DESCRIPTION:Slot ${selectedSlot?.slotNumber} at ${lot?.name || 'parking lot'}`,
                  `LOCATION:${lot?.address || lot?.name || ''}`,
                  'END:VEVENT', 'END:VCALENDAR'
                ].join('\r\n');
                const blob = new Blob([ics], { type: 'text/calendar' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `parkit-booking-${successBooking.id}.ics`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: 'Calendar event downloaded', description: 'Open the .ics file to add to your calendar.', variant: 'success' });
              }}
              variant="outline"
              className="border-white/[0.10] bg-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white rounded-lg h-11 font-semibold cursor-pointer"
            >
              <Calendar className="w-4 h-4 mr-1 inline" /> Add to Calendar
            </Button>
            <Button
              onClick={() => {
                setSuccessBooking(null);
                setSelectedSlot(null);
              }}
              variant="outline"
              className="border-white/[0.10] bg-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white rounded-lg h-11 font-semibold cursor-pointer"
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

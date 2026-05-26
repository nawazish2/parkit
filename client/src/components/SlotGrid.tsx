import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Car, CheckCircle2, XCircle, Loader2, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import type { Slot } from '../types';

interface Props {
  lotId: number;
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot) => void;
  isOwner?: boolean;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

const SlotGrid: React.FC<Props> = ({ lotId, selectedSlot, onSelectSlot, isOwner = false }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [conflictSlotId, setConflictSlotId] = useState<number | null>(null);

  const fetchSlots = async () => {
    try {
      const res = await api.get(`/slots/lot/${lotId}`);
      setSlots(res.data);
      setConflictSlotId(null); // clear any prior conflict on manual refresh
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinLot', lotId);
    });

    socket.on('reconnect', () => {
      socket.emit('joinLot', lotId);
      fetchSlots();
    });

    socket.on('slotUpdate', ({ slotId: updatedSlotId, isAvailable }) => {
      setSlots(prevSlots =>
        prevSlots.map(slot =>
          slot.id === updatedSlotId ? { ...slot, isAvailable } : slot
        )
      );

      // Real-time conflict detection for the driver's selected slot
      if (selectedSlot && updatedSlotId === selectedSlot.id && !isAvailable && !isOwner) {
        setConflictSlotId(updatedSlotId);
        // Deselect immediately so user can't book a now-taken slot
        onSelectSlot(null as any);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.emit('leaveLot', lotId);
      socket.disconnect();
    };
  }, [lotId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-[#111118] border border-white/[0.06] rounded-xl min-h-[300px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-slate-400 text-sm">Loading live parking grid...</p>
      </div>
    );
  }

  const availableCount = slots.filter(s => s.isAvailable).length;
  const occupiedCount = slots.length - availableCount;
  const occupancyPct = slots.length > 0 ? Math.round((occupiedCount / slots.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.06] bg-[#111118]">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-500" />
            Live Slot Availability
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            <span className="text-emerald-500 font-semibold">{availableCount}</span> available ·{' '}
            <span className="text-rose-500 font-semibold">{occupiedCount}</span> occupied
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-300">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-300">Selected</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-semibold ${
            isConnected
              ? 'bg-blue-500/15 border-blue-500/25 text-blue-400'
              : 'bg-amber-500/15 border-amber-500/25 text-amber-400'
          }`}>
            {isConnected
              ? <><Wifi className="w-3 h-3" /> Live Sync</>
              : <><WifiOff className="w-3 h-3" /> Reconnecting...</>
            }
          </div>
          <button
            onClick={fetchSlots}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.06] text-slate-400 hover:text-white transition-colors"
            title="Refresh slots"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {conflictSlotId && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 animate-fadeIn">
          <AlertTriangle className="w-3.5 h-3.5" />
          The slot you selected was just taken by someone else. Please pick another.
        </div>
      )}

      <div className="p-2.5 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111118]">
        <span className="text-xs text-slate-400 font-medium shrink-0">Occupancy</span>
        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${occupancyPct}%`,
              backgroundColor: occupancyPct > 80
                ? '#ef4444'
                : occupancyPct > 50
                ? '#f97316'
                : '#10b981',
            }}
          />
        </div>
        <span className="text-xs font-semibold text-white shrink-0">{occupancyPct}%</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 p-4 rounded-xl border border-white/[0.06] bg-[#070710]">
        {slots.map(slot => {
          const isSelected = selectedSlot?.id === slot.id;
          return (
            <button
              key={slot.id}
              onClick={() => {
                if ((slot.isAvailable || isOwner)) {
                  setConflictSlotId(null);
                  onSelectSlot(slot);
                }
              }}
              disabled={!slot.isAvailable && !isOwner}
              className={`relative h-24 rounded-lg p-2.5 flex flex-col items-center justify-between transition-colors border ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40'
                  : !slot.isAvailable
                  ? `bg-rose-500/10 border-rose-500/25 text-rose-300 ${isOwner ? 'cursor-pointer hover:border-rose-500/40' : 'cursor-not-allowed opacity-50'}`
                  : 'bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-500/40 text-emerald-300 cursor-pointer'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-blue-500/30 text-white' : 'bg-white/10 text-slate-300'
                }`}>
                  {slot.slotNumber}
                </span>
                {slot.isAvailable ? (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-emerald-500'}`} />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                )}
              </div>

              <Car
                className={`w-7 h-8 transition-colors ${
                  isSelected ? 'text-blue-300' : !slot.isAvailable ? 'text-rose-400/50' : 'text-emerald-500'
                }`}
              />

              <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-300' : !slot.isAvailable ? 'text-rose-400/70' : 'text-emerald-500/80'}`}>
                {slot.isAvailable ? (isSelected ? 'Selected' : 'Available') : 'Occupied'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SlotGrid;

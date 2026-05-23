import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Car, CheckCircle2, XCircle, Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
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

  const fetchSlots = async () => {
    try {
      const res = await api.get(`/slots/lot/${lotId}`);
      setSlots(res.data);
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Fetch initial slots
    fetchSlots();

    // 2. Initialize Socket.io connection
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinLot', lotId);
    });

    // IMP 6 Fix: Refresh slots on reconnect to get latest state
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
      <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-2xl min-h-[300px]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-slate-400 text-sm">Loading live parking grid...</p>
      </div>
    );
  }

  const availableCount = slots.filter(s => s.isAvailable).length;
  const occupiedCount = slots.length - availableCount;
  const occupancyPct = slots.length > 0 ? Math.round((occupiedCount / slots.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Grid Header & Live Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-400" />
            Live Slot Availability
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            <span className="text-emerald-400 font-bold">{availableCount}</span> available ·{' '}
            <span className="text-red-400 font-bold">{occupiedCount}</span> occupied
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/60 animate-pulse" />
            <span className="text-emerald-400 font-medium">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/60" />
            <span className="text-red-400 font-medium">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/60" />
            <span className="text-indigo-300 font-medium">Selected</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
            isConnected
              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
          }`}>
            {isConnected
              ? <><Wifi className="w-3 h-3" /> Live Sync</>
              : <><WifiOff className="w-3 h-3" /> Reconnecting...</>
            }
          </div>
          <button
            onClick={fetchSlots}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
            title="Refresh slots"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="p-3 flex items-center gap-4 rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-xl">
        <span className="text-xs text-slate-400 font-semibold shrink-0">Occupancy</span>
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${occupancyPct}%`,
              background: occupancyPct > 80
                ? 'linear-gradient(90deg, #f87171, #ef4444)'
                : occupancyPct > 50
                ? 'linear-gradient(90deg, #fb923c, #f97316)'
                : 'linear-gradient(90deg, #34d399, #10b981)',
            }}
          />
        </div>
        <span className="text-xs font-bold text-white shrink-0">{occupancyPct}%</span>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-5 rounded-2xl border border-white/5 bg-black/20">
        {slots.map(slot => {
          const isSelected = selectedSlot?.id === slot.id;
          return (
            <button
              key={slot.id}
              id={`slot-btn-${slot.id}`}
              onClick={() => (slot.isAvailable || isOwner) && onSelectSlot(slot)}
              disabled={!slot.isAvailable && !isOwner}
              className={`relative h-28 rounded-2xl p-3 flex flex-col items-center justify-between transition-all duration-300 ease-out border ${
                isSelected
                  ? 'bg-indigo-600/35 border-indigo-400 text-white shadow-[0_0_22px_rgba(99,102,241,0.45)] scale-105 z-10 ring-2 ring-indigo-500/60'
                  : !slot.isAvailable
                  ? `bg-red-500/8 border-red-500/20 text-red-300 ${isOwner ? 'cursor-pointer hover:scale-105 hover:border-red-500/50 hover:bg-red-500/15 shadow-md active:scale-98' : 'cursor-not-allowed opacity-50'}`
                  : 'bg-emerald-500/8 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/15 text-emerald-300 hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-emerald-500/5 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              }`}
            >
              {/* Slot number badge */}
              <div className="w-full flex items-center justify-between">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md transition-colors duration-300 ${
                  isSelected ? 'bg-indigo-500/40 text-white' : 'bg-white/10 text-slate-300'
                }`}>
                  {slot.slotNumber}
                </span>
                {slot.isAvailable ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slot-dot" />
                    <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-indigo-300' : 'text-emerald-400'}`} />
                  </div>
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              <div className="text-center">
                <Car
                  className={`w-8 h-8 mx-auto transition-all duration-300 ${
                    isSelected ? 'scale-125 text-indigo-200 drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]' : !slot.isAvailable ? 'text-red-400/40' : 'text-emerald-400 group-hover:scale-110'
                  }`}
                />
              </div>

              <span className={`text-[11px] font-bold tracking-wide transition-colors duration-300 ${isSelected ? 'text-indigo-200' : !slot.isAvailable ? 'text-red-400/60' : 'text-emerald-400/80'}`}>
                {slot.isAvailable ? (isSelected ? '✓ Selected' : 'Available') : 'Occupied'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SlotGrid;

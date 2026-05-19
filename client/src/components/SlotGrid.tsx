import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Car, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import type { Slot } from '../types';

interface Props {
  lotId: number;
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot) => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

const SlotGrid: React.FC<Props> = ({ lotId, selectedSlot, onSelectSlot }) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Fetch initial slots
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

    fetchSlots();

    // 2. Initialize Socket.io connection
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinLot', lotId);
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

  return (
    <div className="space-y-6">
      {/* Grid Header & Live Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass p-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-400" />
            Live Slot Availability
          </h3>
          <p className="text-sm text-slate-400">
            {availableCount} of {slots.length} slots available
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
            <span className="text-emerald-400 font-medium">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            <span className="text-red-400 font-medium">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-indigo-400' : 'bg-amber-400'}`} />
            {isConnected ? 'Live Syncing' : 'Connecting...'}
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6 glass bg-black/20">
        {slots.map(slot => {
          const isSelected = selectedSlot?.id === slot.id;
          return (
            <button
              key={slot.id}
              onClick={() => slot.isAvailable && onSelectSlot(slot)}
              disabled={!slot.isAvailable}
              className={`relative h-28 rounded-2xl p-4 flex flex-col items-center justify-between transition-all duration-300 border ${
                !slot.isAvailable
                  ? 'bg-red-500/10 border-red-500/20 text-red-300 cursor-not-allowed opacity-60'
                  : isSelected
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xl shadow-indigo-500/20 scale-105 z-10'
                  : 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/20 text-emerald-300 hover:scale-102 cursor-pointer shadow-md shadow-emerald-500/5'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/10 text-white">
                  {slot.slotNumber}
                </span>
                {slot.isAvailable ? (
                  <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-indigo-300' : 'text-emerald-400'}`} />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>

              <div className="text-center">
                <Car
                  className={`w-8 h-8 mx-auto transition-transform ${
                    isSelected ? 'scale-125 text-white' : !slot.isAvailable ? 'text-red-400/60' : 'text-emerald-400'
                  }`}
                />
              </div>

              <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-200 font-bold' : 'text-slate-400'}`}>
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

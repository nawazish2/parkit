import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ShieldCheck, Sparkles } from 'lucide-react';

const AppFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-white/[0.08] bg-[#0D0D14]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Car className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">ParkIt</span>
          </div>
          <p className="max-w-md text-xs text-slate-400">
            Smart parking for drivers, owners, and admins with real-time slot visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/15 px-2.5 py-1 text-blue-300">
            <Sparkles className="h-3 w-3" />
            Live Slot Sync
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 text-emerald-300">
            <ShieldCheck className="h-3 w-3" />
            Secure Booking
          </span>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-3 text-xs text-slate-500 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <span>© {year} ParkIt. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/search" className="hover:text-white transition-colors">Search</Link>
            <Link to="/bookings" className="hover:text-white transition-colors">Bookings</Link>
            <Link to="/profile" className="hover:text-white transition-colors">Profile</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;

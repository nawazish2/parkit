import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, ShieldCheck, Zap, QrCode, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'owner') navigate('/owner');
      else navigate('/search');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-600/20 via-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            ParkIt
          </span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <button onClick={handleGetStarted} className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
              <span>Go to Dashboard ({user.name})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm px-5 py-2.5">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-sm px-5 py-2.5 shadow-lg shadow-indigo-600/30">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 w-full pt-12 pb-24 text-center z-10 space-y-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Smart Parking System
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Seamless Parking.<br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Instant Verification.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Reserve premium parking spots in real-time, pay securely via Razorpay, and glide past entry barriers with your automated QR access pass.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4">
          <button onClick={handleGetStarted} className="btn-primary w-full sm:w-auto text-lg px-8 py-4 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group">
            <span>Find Parking Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          {!user && (
            <Link to="/register?role=owner" className="btn-ghost w-full sm:w-auto text-lg px-8 py-4 flex items-center justify-center">
              List Your Property
            </Link>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-16 text-left">
          <div className="glass p-8 space-y-4 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Live Slot Synchronization</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time Socket.io updates instantly lock slots when selected, guaranteeing zero double-booking conflicts.
            </p>
          </div>

          <div className="glass p-8 space-y-4 hover:border-violet-500/40 transition-all group">
            <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Automated QR Access</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every confirmed reservation generates an encrypted QR pass for touchless, automated entry and exit.
            </p>
          </div>

          <div className="glass p-8 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Verified Security</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              All listed parking lots are rigorously certified by platform admins with 24/7 security and CCTV monitoring.
            </p>
          </div>

          <div className="glass p-8 space-y-4 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Flexible Management</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Drivers can cancel reservations with 1-click instant refunds, instantly freeing up the slot across the grid.
            </p>
          </div>
        </div>

        {/* Live Preview Stats Banner */}
        <div className="glass p-8 max-w-4xl mx-auto mt-16 bg-gradient-to-r from-indigo-900/20 via-violet-900/20 to-purple-900/20 border-indigo-500/30 flex flex-col sm:flex-row items-center justify-around gap-8 text-center sm:text-left">
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-white">100%</div>
            <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">TiDB Serverless Uptime</div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden sm:block" />
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-emerald-400">Instant</div>
            <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Socket.io Broadcasts</div>
          </div>
          <div className="h-10 w-px bg-white/10 hidden sm:block" />
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-violet-400">Verified</div>
            <div className="text-xs text-violet-300 font-semibold uppercase tracking-wider">Razorpay Gateway</div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-slate-500 z-10">
        <p>© 2026 ParkIt. Developed for Premium Automated Parking Management.</p>
      </footer>
    </div>
  );
};

export default Landing;

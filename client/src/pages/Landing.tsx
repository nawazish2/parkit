import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car, ShieldCheck, Zap, QrCode, ArrowRight, Sparkles,
  Clock, MapPin, CreditCard, ChevronRight, Users, Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Animated counter hook
function useCounter(target: number, duration = 1600) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return count;
}

const StatCounter: React.FC<{ value: number; label: string; suffix?: string; color: string }> = ({ value, label, suffix = '', color }) => {
  const count = useCounter(value);
  return (
    <div className="text-center">
      <div className={`text-4xl font-black ${color}`}>{count}{suffix}</div>
      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
};

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

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Live Slot Sync',
      desc: "Socket.io broadcasts lock slots the instant they're selected — zero double-bookings, guaranteed.",
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      glowClass: 'glow-indigo',
    },
    {
      icon: <QrCode className="w-5 h-5" />,
      title: 'QR Access Passes',
      desc: 'Every confirmed booking auto-generates an encrypted QR code for touchless barrier entry.',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      glowClass: 'glow-violet',
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: 'Secure Payments',
      desc: 'Razorpay-powered checkout with full payment verification and instant booking confirmation.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      glowClass: 'glow-emerald',
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: 'Admin Verified',
      desc: 'Every lot is reviewed and approved by platform admins. 24/7 CCTV and security guaranteed.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      glowClass: 'glow-amber',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: '1-Click Cancel',
      desc: 'Cancel any active booking instantly — the slot reopens in real-time across all connected clients.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      glowClass: 'glow-rose',
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      title: 'Owner Dashboard',
      desc: '7-day revenue charts, occupancy analytics, and 1-click property onboarding for owners.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      glowClass: 'glow-indigo',
    },
  ];

  const steps = [
    { num: '01', title: 'Search Your City', desc: 'Browse verified parking lots near you filtered by city.', icon: <MapPin className="w-5 h-5" /> },
    { num: '02', title: 'Pick a Slot', desc: 'Select any live-available slot from the real-time grid.', icon: <Car className="w-5 h-5" /> },
    { num: '03', title: 'Pay Securely', desc: 'Complete checkout via Razorpay in seconds.', icon: <CreditCard className="w-5 h-5" /> },
    { num: '04', title: 'Scan & Park', desc: 'Use your QR pass at the barrier for instant entry.', icon: <QrCode className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#06060a] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 -right-48 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent tracking-tight font-display">
            ParkIt
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 border border-white/5 rounded-2xl px-2 py-1.5 backdrop-blur-md">
          <a href="#features" className="px-4 py-1.5 text-sm font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">Features</a>
          <a href="#how-it-works" className="px-4 py-1.5 text-sm font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">How It Works</a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Button onClick={handleGetStarted} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer h-10 px-5">
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Link to="/login" className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden sm:flex">Sign In</Link>
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer h-10 px-5">
                Get Started <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 w-full pt-16 pb-24 text-center">
          <div className="animate-slideUp">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              6th Semester College Project — Full Stack
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight max-w-5xl mx-auto leading-[1] mb-8 font-display">
              Smarter Parking.{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Zero Friction.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
              Reserve premium parking in real-time, pay securely via Razorpay, and glide past barriers with your automated QR access pass.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-base py-6 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 group w-full sm:w-auto justify-center cursor-pointer h-12"
              >
                <span>Find Parking Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              {!user && (
                <Link
                  to="/register?role=owner"
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 hover:text-white text-base py-6 px-8 rounded-xl flex items-center gap-2 w-full justify-center h-12"
                  >
                    <Building2 className="w-5 h-5" />
                    List Your Property
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Banner */}
          <Card className="mt-24 border-white/5 bg-slate-950/20 backdrop-blur-md max-w-4xl mx-auto animate-fadeIn relative p-8 rounded-3xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-around gap-8 relative z-10">
              <StatCounter value={100} label="Database Uptime" suffix="%" color="text-white" />
              <div className="h-12 w-px bg-white/5 hidden sm:block" />
              <StatCounter value={20} label="Slots Per Lot" suffix="+" color="text-indigo-400" />
              <div className="h-12 w-px bg-white/5 hidden sm:block" />
              <StatCounter value={3} label="User Roles" color="text-emerald-400" />
              <div className="h-12 w-px bg-white/5 hidden sm:block" />
              <StatCounter value={0} label="Double Bookings" color="text-violet-400" />
            </div>
          </Card>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 pb-28">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Platform Capabilities</div>
            <h2 className="text-3xl md:text-5xl font-black text-white font-display">Everything you need to park smarter</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-base">Built with a complete real-time backend, role-based auth, and integrated payments.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card
                key={i}
                className={`glass p-8 space-y-4 border border-white/5 glass-hover cursor-default bg-slate-900/40 rounded-2xl ${f.glowClass}`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className={`w-11 h-11 ${f.bg} border rounded-xl flex items-center justify-center ${f.color} group-hover:scale-105 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white font-display">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 pb-28">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Process</div>
            <h2 className="text-3xl md:text-5xl font-black text-white font-display">Park in 4 simple steps</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="absolute top-14 left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-indigo-500/0 hidden lg:block pointer-events-none" />

            {steps.map((s, i) => (
              <Card key={i} className="glass border-white/5 p-8 text-center space-y-4 glass-hover glow-indigo bg-slate-900/40 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto group-hover:scale-105 transition-all duration-300">
                  {s.icon}
                </div>
                <div className="text-xs font-black text-indigo-500 tracking-wider font-display uppercase">{s.num}</div>
                <h3 className="font-bold text-white text-lg font-display">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 pb-28">
          <Card className="glass bg-gradient-to-br from-indigo-900/15 via-violet-900/10 to-slate-950 border border-white/5 p-12 md:p-16 text-center relative overflow-hidden rounded-3xl">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
            <CardContent className="relative z-10 space-y-6 p-0">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-300">Join the smarter parking revolution</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white font-display">Ready to park smarter?</h2>
              <p className="text-slate-400 max-w-lg mx-auto text-base">Sign up as a driver to book spots, or as an owner to list your property and start earning today.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button onClick={handleGetStarted} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-base py-6 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer h-12">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10 px-6 z-10 bg-slate-950/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-300 text-sm font-display tracking-tight">ParkIt</span>
          </div>
          <p>© 2026 ParkIt — 6th Semester College Project. Smart Parking Management System.</p>
          <p>Built with React 19 · Node.js · Socket.io · TiDB</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

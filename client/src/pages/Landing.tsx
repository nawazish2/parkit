import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car, ShieldCheck, Zap, QrCode, ArrowRight, Sparkles,
  Clock, MapPin, CreditCard, ChevronRight, Users, Building2,
  TrendingUp, Check, Terminal, Shield, Mail,
  Send, Heart, Globe
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
  const [activeTab, setActiveTab] = useState<'driver' | 'owner' | 'admin'>('driver');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showGithubPopover, setShowGithubPopover] = useState(false);

  const handleSubscribeNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('loading');
    setTimeout(() => {
      setNewsletterStatus('success');
      setNewsletterEmail('');
      setTimeout(() => setNewsletterStatus('idle'), 4000);
    }, 1200);
  };

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

  const faqs = [
    {
      q: 'How does real-time slot locking work?',
      a: 'When a driver selects a slot in the grid, the frontend broadcasts a lock signal via Socket.io to the server. The slot is marked as occupied in the database inside an isolated database transaction, and a broadcast is sent to all other connected clients immediately to prevent double-booking.'
    },
    {
      q: 'Can I list multiple properties as an owner?',
      a: 'Yes! With our Partner/Owner plan, you can onboard as many parking locations as you own, configure individual slot grids (e.g. 20, 50, or 100 slots per lot), set custom hourly rates, and track consolidated revenue analytics on your dashboard.'
    },
    {
      q: 'What payment gateways are supported?',
      a: 'We use Razorpay for processing all card, UPI, netbanking, and wallet transactions. For development, the system falls back to a sandbox simulator to let you test bookings end-to-end without real transactions.'
    },
    {
      q: 'Is the QR pass compatible with offline scanners?',
      a: 'Each QR pass contains an encrypted, signed payload with the booking details and validation timestamps. Automated barrier systems can decrypt and verify the pass offline using the platform\'s public key.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#06060a] text-slate-100 flex flex-col relative overflow-hidden bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      {/* Ambient background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 -right-48 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-slate-950/60 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent tracking-tight font-display">
              ParkIt
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/5 rounded-xl p-1">
            <a href="#features" className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">Features</a>
            <a href="#demo" className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">Showcase</a>
            <a href="#pricing" className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">Pricing</a>
            <a href="#faqs" className="px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">FAQs</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </div>
            {user ? (
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer h-9 px-4">
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-xs font-bold text-slate-300 hover:text-white transition-colors hidden sm:flex">Sign In</Link>
                <Button onClick={handleGetStarted} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer h-9 px-4">
                  Get Started <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 w-full pt-20 pb-20 text-center">
          <div className="animate-slideUp">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-8">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Introducing ParkIt v2.0
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight max-w-5xl mx-auto leading-[1.05] mb-8 font-display text-white">
              Smarter Parking.{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Zero Friction.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Modern SaaS platform built for high-occupancy environments. Reserve parking spots in real-time, authenticate via automated QR codes, and track full revenue analytics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold py-6 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 group w-full sm:w-auto justify-center cursor-pointer h-12"
              >
                <span>Find Parking Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              {!user && (
                <Link
                  to="/register?role=owner"
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 hover:text-white text-sm font-bold py-6 px-8 rounded-xl flex items-center gap-2 w-full justify-center h-12 text-slate-300"
                  >
                    <Building2 className="w-4 h-4" />
                    List Your Property
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Stats Banner */}
          <Card className="mt-20 border-white/5 bg-slate-950/40 backdrop-blur-2xl max-w-4xl mx-auto animate-fadeIn relative p-8 rounded-3xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-around gap-8 relative z-10">
              <StatCounter value={100} label="System Uptime" suffix="%" color="text-white" />
              <div className="h-12 w-px bg-white/5 hidden sm:block" />
              <StatCounter value={20} label="Slots Per Lot" suffix="+" color="text-indigo-400" />
              <div className="h-12 w-px bg-white/5 hidden sm:block" />
              <StatCounter value={3} label="User Roles" color="text-emerald-400" />
              <div className="h-12 w-px bg-white/5 hidden sm:block" />
              <StatCounter value={0} label="Double Bookings" color="text-fuchsia-400" />
            </div>
          </Card>
        </section>

        {/* Product Showcase / Interactive Dashboard Preview */}
        <section id="demo" className="max-w-7xl mx-auto px-6 pb-28">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Live Platform Showcase</div>
            <h2 className="text-3xl md:text-5xl font-black text-white font-display">Experience the control panels</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm">Select a role below to preview how our dashboards adapt to different workflows in real time.</p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            {/* Tabs Selector */}
            <div className="flex justify-center gap-2 p-1.5 bg-slate-950/60 border border-white/5 rounded-2xl max-w-md mx-auto backdrop-blur-md">
              <button
                onClick={() => setActiveTab('driver')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'driver' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Driver View
              </button>
              <button
                onClick={() => setActiveTab('owner')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'owner' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Owner Console
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'admin' ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Suite
              </button>
            </div>

            {/* Showcase Display */}
            <div className="border border-white/10 bg-slate-950/40 rounded-3xl p-6 md:p-8 backdrop-blur-md min-h-[360px] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
              
              {activeTab === 'driver' && (
                <div className="relative z-10 space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-300 font-mono">Terminal: Book Slot / Delhi</span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">Active Search</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: grid representation */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="text-xs font-bold text-slate-400">Metropolis Central Hub — Available Slots</div>
                      <div className="grid grid-cols-5 gap-2.5">
                        {['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5'].map((slot, index) => {
                          const isBooked = index % 3 === 0;
                          return (
                            <div
                              key={slot}
                              className={`p-3 text-center text-xs font-bold rounded-xl border transition-all ${
                                isBooked
                                  ? 'bg-red-500/5 border-red-500/10 text-red-400/50 line-through'
                                  : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/50 shadow-sm shadow-indigo-500/5'
                              }`}
                            >
                              {slot}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Right: Mock Ticket */}
                    <div className="p-5 bg-slate-950/80 border border-white/5 rounded-2xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selected Slot Access Pass</div>
                        <div className="text-sm font-bold text-white">Slot B2 (General)</div>
                        <div className="text-xs text-slate-400">Metropolis Central Hub</div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase">Booking Status</div>
                          <div className="text-xs font-bold text-emerald-400">Ready to Book</div>
                        </div>
                        <QrCode className="w-8 h-8 text-indigo-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'owner' && (
                <div className="relative z-10 space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-bold text-slate-300 font-mono">Console: Analytics / Sarah Owner</span>
                    </div>
                    <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-bold">Consolidated Dashboard</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stats mini cards */}
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Earnings</div>
                        <div className="text-2xl font-black text-white mt-1">₹12,480</div>
                        <div className="text-[9px] text-emerald-400 mt-1 font-semibold">+14.2% from last week</div>
                      </div>
                      <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Occupancy Rate</div>
                        <div className="text-2xl font-black text-white mt-1">76%</div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-violet-500 h-full rounded-full" style={{ width: '76%' }} />
                        </div>
                      </div>
                    </div>
                    {/* Graph Mockup */}
                    <div className="md:col-span-2 p-5 bg-slate-950/80 border border-white/5 rounded-2xl flex flex-col justify-between">
                      <div className="text-xs font-bold text-slate-400 mb-2">7-Day Revenue Trend</div>
                      <div className="h-32 flex items-end justify-between gap-2.5 pt-4">
                        {[40, 65, 35, 80, 50, 70, 95].map((height, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            <div
                              className="w-full bg-gradient-to-t from-violet-600/30 to-violet-500 rounded-t-md relative group/bar hover:scale-[1.05] transition-all"
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-[8px] font-mono text-white opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                ₹{height * 3}
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-500 font-bold">Day {i+1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="relative z-10 space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-fuchsia-400" />
                      <span className="text-xs font-bold text-slate-300 font-mono">Suite: System Guard / Super Admin</span>
                    </div>
                    <span className="text-[10px] bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded-full font-bold">All Locks Engaged</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Approvals */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="text-xs font-bold text-slate-400">Pending Property Verifications</div>
                      <div className="p-4 bg-slate-950/80 border border-white/5 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">CyberCity Express Parking</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Owner ID: #204 (Sarah Owner)</div>
                        </div>
                        <button className="py-1 px-3 bg-fuchsia-600/15 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                          Approve Lot
                        </button>
                      </div>
                    </div>
                    {/* Logs */}
                    <div className="p-4 bg-black/60 border border-white/5 rounded-xl font-mono text-[9px] text-slate-400 space-y-1.5 h-36 overflow-hidden">
                      <div className="text-[8px] text-slate-600 font-bold uppercase tracking-wider mb-2 font-sans">Live System Logs</div>
                      <div>[sys] Database synced: 0 errors</div>
                      <div>[sockets] 104 clients connected</div>
                      <div>[sockets] room lot_3 joined</div>
                      <div className="text-fuchsia-400">[auth] token signed for user 2</div>
                      <div className="text-emerald-400">[payment] razorpay signature OK</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 pb-28">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Platform Capabilities</div>
            <h2 className="text-3xl md:text-5xl font-black text-white font-display">Everything you need to park smarter</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm leading-relaxed">Built with a complete real-time backend, role-based authentication, and integrated transaction processing.</p>
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

        {/* Pricing / Plan Section */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 pb-28">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Simple Pricing</div>
            <h2 className="text-3xl md:text-5xl font-black text-white font-display">SaaS Plans for Every Tier</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm leading-relaxed">No hidden setup fees. Scale your parking slots effortlessly as you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Driver Plan */}
            <Card className="glass border-white/5 p-8 flex flex-col justify-between bg-slate-900/40 rounded-2xl relative overflow-hidden group glow-indigo min-h-[420px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Driver Plan</h3>
                  <p className="text-xs text-slate-400 mt-1">Perfect for parking reservation</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white font-display">₹0</span>
                  <span className="text-xs text-slate-500 font-semibold">/ forever</span>
                </div>
                <div className="border-t border-white/5 pt-6 space-y-3">
                  {[
                    'Real-time slot searches',
                    'Interactive booking grid',
                    'Razorpay secure checkout',
                    'Encrypted QR access passes',
                    '1-click cancellation'
                  ].map(feat => (
                    <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleGetStarted} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl mt-8 border border-white/5 cursor-pointer h-11">
                Get Started Free
              </Button>
            </Card>

            {/* Owner Plan */}
            <Card className="p-8 flex flex-col justify-between bg-slate-950 border border-violet-500/40 shadow-xl shadow-violet-500/5 rounded-3xl relative overflow-hidden group min-h-[450px] scale-[1.03]">
              {/* Popular badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                Most Popular
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Property Owner</h3>
                  <p className="text-xs text-slate-400 mt-1">For commercial lot providers</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-display">1.5%</span>
                  <span className="text-xs text-slate-500 font-semibold">/ transaction fee</span>
                </div>
                <div className="border-t border-white/5 pt-6 space-y-3">
                  {[
                    'List unlimited properties',
                    '7-day revenue charts',
                    'Occupancy & slot metrics',
                    'Custom slot grid setups',
                    'Real-time webhook slot sync',
                    'Automatic weekly payouts'
                  ].map(feat => (
                    <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-200">
                      <Check className="w-4 h-4 text-violet-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link to="/register?role=owner" className="w-full">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl mt-8 shadow-lg shadow-violet-600/25 cursor-pointer h-11">
                  List Property Now
                </Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="glass border-white/5 p-8 flex flex-col justify-between bg-slate-900/40 rounded-2xl relative overflow-hidden group glow-indigo min-h-[420px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Enterprise</h3>
                  <p className="text-xs text-slate-400 mt-1">For corporate complexes & malls</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white font-display">Custom</span>
                  <span className="text-xs text-slate-500 font-semibold">/ pricing</span>
                </div>
                <div className="border-t border-white/5 pt-6 space-y-3">
                  {[
                    'Consolidated multi-lot views',
                    'IoT hardware barrier integration',
                    'Dedicated account manager',
                    'Priority 24/7 support SLA',
                    'White-labeled access passes',
                    'Custom database backup export'
                  ].map(feat => (
                    <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => window.location.href = 'mailto:sales@parkit.com'} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl mt-8 border border-white/5 cursor-pointer h-11">
                Contact Sales
              </Button>
            </Card>
          </div>
        </section>

        {/* FAQs Accordion Section */}
        <section id="faqs" className="max-w-4xl mx-auto px-6 pb-28">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-3">Help Center</div>
            <h2 className="text-3xl md:text-5xl font-black text-white font-display">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-white hover:text-indigo-300 text-sm cursor-pointer select-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-400' : ''}`} />
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isExpanded ? 'max-h-40 border-t border-white/5 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-6 py-5 text-xs text-slate-400 leading-relaxed bg-slate-950/20">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
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
              <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">Sign up as a driver to book spots, or as an owner to list your property and start tracking revenue today.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button onClick={handleGetStarted} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold py-6 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer h-12">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-slate-950/60 backdrop-blur-md pt-20 pb-10 px-6 z-10 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 text-xs pb-16 border-b border-white/5">
          {/* Column 1: Brand Info & Status */}
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-white text-lg font-display tracking-tight">ParkIt</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[12px] max-w-sm">
              The next-generation smart parking SaaS platform. Lock spots in real-time, generate secure QR passes instantly, and track full analytics across high-occupancy environments.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  API Systems Operational
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-wider">
                  SSL Secured
                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="flex items-center gap-3 text-slate-500 text-[10px] font-mono mt-1">
                <span className="border border-slate-800 px-2 py-0.5 rounded">SOC2 Compliant</span>
                <span className="border border-slate-800 px-2 py-0.5 rounded">PCI-DSS Level 1</span>
              </div>
            </div>
          </div>

          {/* Column 2: Platform Capabilities */}
          <div className="space-y-4">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Platform</div>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                  Live Slot Map
                  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </li>
              <li>
                <a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                  QR Access Barrier
                  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                  SaaS Pricing
                  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </li>
              <li>
                <a href="#faqs" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                  Interactive Demo
                  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Tech Architecture */}
          <div className="space-y-4">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tech Stack</div>
            <ul className="space-y-3 text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                React 19 & Vite 8
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                Node.js & Express
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                TiDB Serverless
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Socket.io Locking
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Razorpay Checkout
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Community */}
          <div className="space-y-4">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Subscribe for Updates</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Get the latest developer insights, status updates, and feature rollouts directly.
            </p>
            <form onSubmit={handleSubscribeNewsletter} className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-xs w-full pr-10"
                  required
                  disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
                  className="absolute right-1 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {newsletterStatus === 'loading' ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              
              {/* Status Message */}
              {newsletterStatus === 'success' && (
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                  <Check className="w-3 h-3" /> Subscribed successfully!
                </div>
              )}
            </form>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2 relative">
              <div className="relative">
                <button
                  onClick={() => setShowGithubPopover(!showGithubPopover)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="GitHub Developer Info"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                </button>
                
                {showGithubPopover && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowGithubPopover(false)} />
                    <div className="absolute bottom-10 left-0 w-64 bg-slate-950/95 border border-white/10 p-4 rounded-xl shadow-2xl z-50 animate-scaleIn space-y-3 backdrop-blur-md">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Developer Socials</div>
                      <div className="space-y-2">
                        <a
                          href="https://github.com/nawazish2"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white"
                        >
                          <svg className="w-4 h-4 fill-current text-indigo-400" viewBox="0 0 24 24">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                          </svg>
                          <div>
                            <div className="text-[10px] font-bold text-white">GitHub Profile</div>
                            <div className="text-[9px] text-slate-500">github.com/nawazish2</div>
                          </div>
                        </a>
                        <a
                          href="https://x.com/nawazish_khan1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white"
                        >
                          <svg className="w-4 h-4 fill-current text-sky-400" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <div>
                            <div className="text-[10px] font-bold text-white">X / Twitter</div>
                            <div className="text-[9px] text-slate-500">@nawazish_khan1</div>
                          </div>
                        </a>
                        <a
                          href="https://www.linkedin.com/in/nawazishkhan8/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white"
                        >
                          <svg className="w-4 h-4 fill-current text-blue-500" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 .784 1.75 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          <div>
                            <div className="text-[10px] font-bold text-white">LinkedIn</div>
                            <div className="text-[9px] text-slate-500">nawazishkhan8</div>
                          </div>
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <a href="https://x.com/nawazish_khan1" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all" aria-label="X / Twitter">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/nawazishkhan8/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 .784 1.75 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="mailto:support@parkit.com" className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
              <a href="https://parkit-kappa.vercel.app" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span>© 2026 ParkIt System. All rights reserved.</span>
            <span className="text-slate-800">|</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20 animate-pulse" /> for 6th Semester College Project
            </span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Security Portal</span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">SLA Agreement</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

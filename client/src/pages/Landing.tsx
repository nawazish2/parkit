import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Car,
  CheckCircle2,
  CreditCard,
  Menu,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Landing: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#dashboard', label: 'Dashboard' },
    { href: '#roles', label: 'Solutions' },
  ];

  const stats = [
    { value: '300+', label: 'Slots Seeded' },
    { value: '20', label: 'Lots Managed' },
    { value: '99.9%', label: 'Real-time Sync Uptime' },
    { value: '<2 min', label: 'Avg Booking Time' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-10rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-[20rem] h-[24rem] w-[24rem] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-[6rem] h-[20rem] w-[20rem] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0A0A0F]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">ParkIt</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              Sign In
            </Link>
            <Link to="/register">
              <Button className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                Start Free
              </Button>
            </Link>
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-2 text-slate-300 transition-colors hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/[0.06] bg-[#0A0A0F] md:hidden">
            <div className="space-y-3 px-4 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-sm font-medium text-slate-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="space-y-3 border-t border-white/[0.06] pt-3">
                <Link to="/login" className="block text-sm font-medium text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full cursor-pointer rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-500">
                    Start Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-14 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:pb-24 md:pt-20">
        <div>
          <Badge className="mb-6 border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-100">
            <Sparkles className="mr-1 h-3.5 w-3.5" /> Smart Parking for Drivers and Owners
          </Badge>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            ParkIt turns parking chaos
            <span className="block bg-gradient-to-r from-cyan-300 via-white to-blue-300 bg-clip-text text-transparent">
              into a live control system.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Discover available slots, pay securely, and enter with QR in minutes. Owners get occupancy, revenue, and lot operations in one dashboard.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/register">
              <Button className="h-12 cursor-pointer gap-2 rounded-lg bg-blue-600 px-7 text-base font-bold text-white hover:bg-blue-500">
                Book Parking
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="h-12 cursor-pointer rounded-lg border-white/[0.14] bg-white/[0.02] px-7 text-base font-bold text-white hover:bg-white/[0.06]">
                List Your Lot
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-4">
                <p className="text-lg font-bold text-white">{item.value}</p>
                <p className="mt-1 text-xs text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111118] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-200">Operations Snapshot</p>
              <p className="text-xs text-slate-500">Live owner dashboard preview</p>
            </div>
            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300">Live</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active Bookings', value: '58', trend: '+12%' },
              { label: 'Occupancy', value: '84%', trend: '+4%' },
              { label: 'Revenue Today', value: '₹12,400', trend: '+18%' },
              { label: 'Avg Slot Time', value: '2.6h', trend: '-6%' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-lg font-bold text-white">{kpi.value}</p>
                <p className="text-xs text-emerald-300">{kpi.trend} vs last week</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-white/[0.08] bg-black/20 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>Weekly Occupancy Trend</span>
              <span>Last 7 days</span>
            </div>
            <div className="flex h-24 items-end gap-2">
              {[38, 52, 46, 61, 58, 72, 84].map((value, index) => (
                <div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600/45 to-cyan-300/70" style={{ height: `${value}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Core Product Capabilities</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Designed to reduce booking friction for drivers and improve visibility for lot owners.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: 'Real-time Slot Updates',
              text: 'Availability refreshes instantly so users always book from live inventory.',
              tone: 'emerald',
            },
            {
              icon: QrCode,
              title: 'Instant QR Access',
              text: 'Every booking generates a QR pass for smooth entry and verified access.',
              tone: 'blue',
            },
            {
              icon: CreditCard,
              title: 'Secure Checkout',
              text: 'Razorpay integration supports UPI/cards with transparent payment flow.',
              tone: 'amber',
            },
          ].map(({ icon: Icon, title, text, tone }) => (
            <div key={title} className="rounded-xl border border-white/[0.08] bg-[#111118] p-5">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg border ${
                tone === 'emerald'
                  ? 'border-emerald-500/25 bg-emerald-500/15'
                  : tone === 'blue'
                    ? 'border-blue-500/25 bg-blue-500/15'
                    : 'border-amber-500/25 bg-amber-500/15'
              }`}>
                <Icon className={`h-5 w-5 ${
                  tone === 'emerald' ? 'text-emerald-300' : tone === 'blue' ? 'text-blue-300' : 'text-amber-300'
                }`} />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="dashboard" className="border-y border-white/[0.06] bg-[#0D0D14] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Dashboard-first for Operations</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              ParkIt is structured like an operations tool, not just a booking form. Track occupancy, revenue, and slot utilization with role-based views.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-slate-300">
              {[
                'KPI cards for occupancy, active bookings, revenue, and dwell time',
                'Filter-friendly tables for lot-level audits and booking history',
                'Drill-down flow from summary cards to detailed operational views',
                'State coverage for loading, empty, error, and partial data',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#111118] p-5">
            <p className="text-sm font-semibold text-slate-200">Example Dashboard Flow</p>
            <div className="mt-4 space-y-3">
              {[
                { icon: Search, title: 'Overview Layer', text: 'Scan KPIs and detect anomalies fast.' },
                { icon: BarChart3, title: 'Trend Layer', text: 'Analyze lot-wise occupancy and earnings.' },
                { icon: ShieldCheck, title: 'Action Layer', text: 'Update slots, rates, and issue handling.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-lg border border-white/[0.08] bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                    <Icon className="h-4 w-4 text-cyan-300" />
                    {title}
                  </div>
                  <p className="text-xs text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-[#111118] p-6 md:p-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/15">
              <Search className="h-5 w-5 text-blue-300" />
            </div>
            <h3 className="text-2xl font-bold">For Drivers</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>Real-time lot search with transparent availability</li>
              <li>Fast booking and secure checkout</li>
              <li>QR-based gate entry and booking management</li>
            </ul>
            <Link to="/register" className="mt-6 inline-block">
              <Button className="cursor-pointer bg-blue-600 font-semibold text-white hover:bg-blue-500">
                Join as Driver
              </Button>
            </Link>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#111118] p-6 md:p-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/15">
              <BarChart3 className="h-5 w-5 text-violet-300" />
            </div>
            <h3 className="text-2xl font-bold">For Owners</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>Manage inventory and pricing by lot</li>
              <li>Track bookings and 7-day revenue trends</li>
              <li>Monitor performance with actionable dashboard metrics</li>
            </ul>
            <Link to="/register" className="mt-6 inline-block">
              <Button className="cursor-pointer bg-violet-600 font-semibold text-white hover:bg-violet-500">
                List Your Lot
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 md:px-8 md:pb-24">
        <div className="mx-auto max-w-5xl rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-transparent p-8 text-center md:p-12">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to launch your smarter parking flow?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            Create your account and move from manual slot coordination to a real-time booking and operations system.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button className="h-12 cursor-pointer gap-2 rounded-lg bg-blue-600 px-7 text-base font-bold text-white hover:bg-blue-500">
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="h-12 cursor-pointer rounded-lg border-white/20 bg-transparent px-7 text-base font-bold text-white hover:bg-white/[0.06]">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;

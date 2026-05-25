import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Zap, QrCode, CreditCard, ArrowRight, Search, BarChart3, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Landing: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#for-owners', label: 'For Owners' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-8rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-[18rem] h-[22rem] w-[22rem] rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0F]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">ParkIt</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-400 hover:text-white font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-slate-400 hover:text-white font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link to="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm px-4 py-2 cursor-pointer">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#0A0A0F]">
            <nav className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-slate-400 hover:text-white font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-white/[0.06] space-y-3">
                <Link
                  to="/login"
                  className="block text-sm text-slate-400 hover:text-white font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm px-4 py-2 cursor-pointer">
                    Get Started
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Live parking, secure checkout, instant QR access
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] max-w-3xl">
          Park smarter.
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-slate-400 max-w-xl leading-relaxed">
          Real-time slot booking with QR access. Find parking, pay securely, and walk in — no hassle.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-10">
          <Link to="/register">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-base px-8 py-6 cursor-pointer gap-2">
              Find Parking
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" className="border-white/[0.12] text-white hover:bg-white/[0.04] font-bold rounded-lg text-base px-8 py-6 cursor-pointer">
              List Your Lot
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
          {[
            ['300+', 'Slots seeded'],
            ['20', 'Parking lots'],
            ['24/7', 'Live availability'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-left backdrop-blur-sm">
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 md:px-8 pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/25 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live Slot Sync</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              See real-time availability across all lots. Slots update instantly via WebSocket — no refreshing needed.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-12 h-12 bg-blue-500/15 border border-blue-500/25 rounded-xl flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">QR Access Passes</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Get an automated QR code after booking. Scan at the gate for instant entry and exit.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-12 h-12 bg-amber-500/15 border border-amber-500/25 rounded-xl flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure Payments</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pay via Razorpay with full support for UPI, cards, and net banking. Extend your session anytime.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 md:px-8 pb-20 md:pb-28 bg-[#111118]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Book parking in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/15 border border-blue-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400 mb-2">1</div>
              <h3 className="text-xl font-bold mb-2">Search</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Find available parking lots near your destination with real-time slot availability
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mb-2">2</div>
              <h3 className="text-xl font-bold mb-2">Book & Pay</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Select your slot, choose your duration, and pay securely via Razorpay
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mb-2">3</div>
              <h3 className="text-xl font-bold mb-2">Park</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Scan your QR code at the gate and park with confidence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section id="for-owners" className="px-4 md:px-8 pb-20 md:pb-28">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#111118] border border-white/[0.06] border-t-2 border-t-blue-500 rounded-xl p-6 md:p-8">
            <div className="w-11 h-11 bg-blue-500/15 border border-blue-500/25 rounded-lg flex items-center justify-center mb-5">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">For Drivers</h3>
            <ul className="space-y-2.5 text-sm text-slate-400 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                Search parking lots by city with live availability
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                Book and pay for slots in seconds
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                Manage bookings, extend sessions, view receipts
              </li>
            </ul>
            <Link to="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg w-full py-5 cursor-pointer">
                Get Started as Driver
              </Button>
            </Link>
          </div>

          <div className="bg-[#111118] border border-white/[0.06] border-t-2 border-t-violet-500 rounded-xl p-6 md:p-8">
            <div className="w-11 h-11 bg-violet-500/15 border border-violet-500/25 rounded-lg flex items-center justify-center mb-5">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">For Property Owners</h3>
            <ul className="space-y-2.5 text-sm text-slate-400 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                Register your parking lot and set your rates
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                Track 7-day revenue trends and occupancy rates
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                Manage bookings and slot availability in real-time
              </li>
            </ul>
            <Link to="/register">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg w-full py-5 cursor-pointer">
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-8 pb-20 md:pb-28">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Join thousands of drivers and property owners using ParkIt to simplify parking
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-base px-8 py-6 cursor-pointer gap-2">
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#111118]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">ParkIt</span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed">
                Smart parking management platform with real-time availability and secure payments.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#for-owners" className="text-sm text-slate-400 hover:text-white transition-colors">
                    For Owners
                  </a>
                </li>
                <li>
                  <Link to="/register" className="text-sm text-slate-400 hover:text-white transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className="font-semibold text-white mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="mailto:support@parkit.com" className="text-sm text-slate-400 hover:text-white transition-colors">
                    support@parkit.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © 2024 ParkIt. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              Built with React, Express, and TiDB
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, LogOut, Search as SearchIcon, Calendar, BarChart3, Shield, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const initial = (user.name?.[0] || '?').toUpperCase();
  const firstName = user.name?.split(' ')[0] || 'User';

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navLinks = [
    { to: '/search', label: 'Find Parking', icon: <SearchIcon className="w-4 h-4" />, roles: ['driver'] },
    { to: '/bookings', label: 'My Bookings', icon: <Calendar className="w-4 h-4" />, roles: ['driver'] },
    { to: '/owner', label: 'Owner Portal', icon: <BarChart3 className="w-4 h-4" />, roles: ['owner'] },
    { to: '/admin', label: 'Admin Panel', icon: <Shield className="w-4 h-4" />, roles: ['admin'] },
  ].filter(link => link.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="glass sticky top-4 z-50 mx-4 md:mx-8 px-4 md:px-6 py-2.5 flex items-center justify-between mb-8 shadow-2xl border-white/8 bg-slate-950/45">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 group-hover:from-indigo-400 group-hover:via-indigo-500 group-hover:to-violet-500 transition-all duration-300 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/25">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent group-hover:text-white transition-colors tracking-tight font-display">
            ParkIt
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950/60 px-2 py-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          {navLinks.map(link => (
            <Button
              key={link.to}
              variant="ghost"
              asChild
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                isActive(link.to)
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/25 scale-[1.02] hover:bg-indigo-600 hover:text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <Link to={link.to}>
                {link.icon}
                {link.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Right: User info + logout dropdown */}
        <div className="flex items-center gap-3">
          {/* User profile dropdown (desktop) */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button id="navbar-user-menu" variant="ghost" className="flex items-center gap-3 pl-3 h-10 pr-2 hover:bg-white/5 border border-transparent hover:border-white/5 rounded-xl cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-xs font-extrabold text-white shadow-md border border-white/10 font-display">
                    {initial}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-200 leading-none">{firstName}</div>
                    <div className="text-[9px] text-indigo-400 capitalize font-bold tracking-wider">{user.role}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-950/95 border-white/10 text-white p-2">
                <DropdownMenuLabel className="flex flex-col gap-1 p-2">
                  <span className="text-sm font-bold text-white">{user.name}</span>
                  <span className="text-xs text-slate-400 font-medium truncate">{user.email}</span>
                  <div className="mt-1.5">
                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 capitalize font-bold text-[10px] px-2 py-0.5">
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {user.role === 'driver' && (
                  <>
                    <DropdownMenuItem
                      onClick={() => navigate('/profile')}
                      className="text-slate-300 hover:text-white hover:bg-white/5 focus:text-white focus:bg-white/5 rounded-lg py-2 cursor-pointer gap-2"
                    >
                      <Car className="w-4 h-4 text-indigo-400" />
                      My Vehicles
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                  </>
                )}
                <DropdownMenuItem
                  id="navbar-logout"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-white hover:bg-red-600/20 focus:text-white focus:bg-red-600/20 rounded-lg py-2 cursor-pointer gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-fadeIn">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-20 left-4 right-4 glass border-white/10 p-5 space-y-2.5 shadow-2xl bg-[#0a0a0f]/95">
            {/* User info */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-base font-black text-white border border-white/15">
                {initial}
              </div>
              <div>
                <div className="font-extrabold text-white">{user.name}</div>
                <div className="text-xs text-indigo-400 capitalize font-medium">{user.role}</div>
              </div>
            </div>

            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                  isActive(link.to)
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/20'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  {link.icon}
                  {link.label}
                </span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            ))}

            {user.role === 'driver' && (
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                  isActive('/profile')
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/20'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Car className="w-4 h-4 text-indigo-400" />
                  My Vehicles
                </span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            )}

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-red-400 hover:bg-red-500/10 font-semibold transition-all duration-300 mt-3 border-red-500/15 cursor-pointer bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;


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
      <nav className="sticky top-0 z-50 bg-[#0A0A0F]/95 backdrop-blur-sm border-b border-white/[0.06] px-4 md:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            ParkIt
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'text-white bg-white/[0.05] border border-white/[0.08] shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2.5 pl-2.5 h-9 pr-2 hover:bg-white/5 rounded-lg cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    {initial}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-slate-200 leading-none">{firstName}</div>
                    <div className="text-[10px] text-slate-500 capitalize font-medium">{user.role}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#111118] border-white/[0.06] text-white p-2">
                <DropdownMenuLabel className="flex flex-col gap-1 p-2">
                  <span className="text-sm font-semibold text-white">{user.name}</span>
                  <span className="text-xs text-slate-400 truncate">{user.email}</span>
                  <div className="mt-1.5">
                    <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/25 capitalize font-semibold text-[10px] px-2 py-0.5">
                      {user.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                {user.role === 'driver' && (
                  <>
                    <DropdownMenuItem
                      onClick={() => navigate('/profile')}
                      className="text-slate-300 hover:text-white hover:bg-white/5 focus:text-white focus:bg-white/5 rounded-lg py-2 cursor-pointer gap-2"
                    >
                      <Car className="w-4 h-4 text-blue-400" />
                      My Vehicles
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/[0.06]" />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 hover:text-white hover:bg-red-600/20 focus:text-white focus:bg-red-600/20 rounded-lg py-2 cursor-pointer gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(o => !o)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-lg bg-white/5 border border-white/[0.06] text-slate-400 hover:text-white cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-fadeIn">
          <div className="absolute inset-0 bg-black/80" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-16 left-4 right-4 bg-[#111118] border border-white/[0.06] p-4 space-y-2 rounded-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06] mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                {initial}
              </div>
              <div>
                <div className="font-semibold text-white">{user.name}</div>
                <div className="text-xs text-slate-400 capitalize">{user.role}</div>
              </div>
            </div>

            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive('/profile')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Car className="w-4 h-4 text-blue-400" />
                  My Vehicles
                </span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            )}

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 font-medium mt-2 border-red-500/20 cursor-pointer bg-transparent"
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

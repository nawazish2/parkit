import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, LogOut, Search as SearchIcon, Calendar, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="glass sticky top-4 z-50 mx-4 md:mx-8 px-6 py-4 flex items-center justify-between mb-8 shadow-lg shadow-black/20">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-indigo-600 group-hover:bg-indigo-500 transition-colors rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            ParkIt
          </span>
        </Link>

        {/* Navigation links */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
          <Link
            to="/search"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/search') || isActive('/lot')
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <SearchIcon className="w-4 h-4" />
            Find Parking
          </Link>

          <Link
            to="/bookings"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/bookings')
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            My Bookings
          </Link>

          {['owner', 'admin'].includes(user.role) && (
            <Link
              to="/owner"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/owner')
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Owner Portal
            </Link>
          )}

          {user.role === 'admin' && (
            <Link
              to="/admin"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/admin')
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-indigo-500/20">
            {user.name[0].toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-white leading-tight">{user.name}</div>
            <div className="text-xs text-indigo-400 capitalize">{user.role}</div>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-white/10 hover:border-red-500/30 transition-all duration-200"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

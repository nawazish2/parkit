import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Car, Loader2, LogOut } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { ParkingLot } from '../types';
import { safeParseJSON } from '../utils/json';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [city, setCity] = useState('');
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLots = async (cityQuery?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/lots', { params: cityQuery ? { city: cityQuery } : {} });
      setLots(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLots(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLots(city);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Navbar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">ParkIt</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/bookings')} className="text-sm text-slate-400 hover:text-white transition-colors">My Bookings</button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-7 h-7 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs font-bold text-indigo-300">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {user?.name}
          </div>
          <button onClick={logout} className="text-slate-500 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero search */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          Find your <span className="text-indigo-400">perfect spot</span>
        </h1>
        <p className="text-slate-400 mb-8">Search across hundreds of parking lots in your city</p>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by city (e.g. Delhi, Mumbai)"
              className="input pl-11"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <SearchIcon className="w-4 h-4" />
            Search
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : lots.length === 0 ? (
        <div className="text-center text-slate-500 py-20">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No parking lots found. Try a different city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {lots.map(lot => (
            <div
              key={lot.id}
              onClick={() => navigate(`/lot/${lot.id}`)}
              className="card cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{lot.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />{lot.address}, {lot.city}
                  </p>
                </div>
                <span className="text-indigo-400 font-bold text-lg">₹{lot.pricePerHour}<span className="text-xs text-slate-500 font-normal">/hr</span></span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(safeParseJSON(lot.amenities) as string[]).slice(0, 3).map((a: string) => (
                  <span key={a} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-slate-400">{a}</span>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">Available</span>
                <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">View slots →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;

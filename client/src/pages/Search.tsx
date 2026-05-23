import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Car, Loader2, Sparkles, TrendingUp, Star, LayoutGrid, Map as MapIcon, Compass, ZoomIn, ZoomOut } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { ParkingLot } from '../types';
import { safeParseJSON } from '../utils/json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const POPULAR_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune'];

const AVAILABLE_FILTERS = ['CCTV', 'Security', 'Valet', 'EV Charging'];

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [city, setCity] = useState('');
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sorting and Filtering states
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name' | 'none'>('none');
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Map View states
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedLotOnMap, setSelectedLotOnMap] = useState<ParkingLot | null>(null);

  const fetchLots = async (cityQuery?: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/lots', { params: cityQuery ? { city: cityQuery } : {} });
      setLots(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLots(city || undefined);
  };

  const clearSearch = () => {
    setCity('');
    fetchLots();
  };

  // Price color helper
  const getPriceColor = (price: number) => {
    if (price < 40) return 'text-emerald-400';
    if (price < 80) return 'text-indigo-400';
    return 'text-amber-400';
  };

  // Map position generator
  const getMockCoordinates = (lotId: number) => {
    const seedX = (lotId * 157) % 800;
    const seedY = (lotId * 223) % 400;
    return {
      x: 100 + seedX, // Range 100 to 900
      y: 100 + seedY  // Range 100 to 500
    };
  };

  // Map zoom and pan controls
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-map-element')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Derived filtered & sorted list
  const filteredAndSortedLots = React.useMemo(() => {
    let result = [...lots];

    // 1. Filter by price
    result = result.filter(lot => lot.pricePerHour <= maxPrice);

    // 2. Filter by selected amenities
    if (selectedAmenities.length > 0) {
      result = result.filter(lot => {
        const lotAmenities = (safeParseJSON(lot.amenities) as string[]).map(a => a.toLowerCase().trim());
        return selectedAmenities.every(amenity =>
          lotAmenities.some(a => a.includes(amenity.toLowerCase().trim()))
        );
      });
    }

    // 3. Sort
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [lots, sortBy, maxPrice, selectedAmenities]);

  return (
    <div className="min-h-screen bg-[#06060a] text-white flex flex-col">
      <Navbar />

      {/* Hero search section */}
      <div className="relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-gradient-to-b from-indigo-600/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-10 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-5">
            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Find your spot'}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 leading-tight font-display">
            Find your{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              perfect spot
            </span>
          </h1>
          <p className="text-slate-400 mb-6 text-sm sm:text-base">Search verified parking lots across India — all with live slot availability</p>

          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto items-center">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
              <Input
                ref={inputRef}
                id="city-search-input"
                type="text"
                placeholder="Search by city (e.g. Mumbai, Delhi...)"
                className="pl-11 pr-4 bg-slate-950/60 border-white/10 h-11 text-white placeholder-slate-500 rounded-xl"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </div>
            <Button id="city-search-btn" type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 px-6 font-bold gap-2 shrink-0 cursor-pointer shadow-lg shadow-indigo-600/20">
              <SearchIcon className="w-4 h-4" />
              Search
            </Button>
          </form>

          {/* Quick-select cities */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-xl mx-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase self-center tracking-wider mr-1">Popular:</span>
            {POPULAR_CITIES.map(c => (
              <Button
                key={c}
                type="button"
                variant={city.toLowerCase() === c.toLowerCase() ? "default" : "outline"}
                onClick={() => { setCity(c); fetchLots(c); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer h-7 border ${
                  city.toLowerCase() === c.toLowerCase()
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </Button>
            ))}
          </div>

          {/* Filtering Toolbar */}
          <div className="max-w-xl mx-auto mt-6 p-4 rounded-2xl border border-white/5 bg-slate-950/40 backdrop-blur-xl space-y-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-slate-300 tracking-wide">Filters & Sort Options</span>
              {(sortBy !== 'none' || maxPrice !== 200 || selectedAmenities.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('none');
                    setMaxPrice(200);
                    setSelectedAmenities([]);
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sort + Max Price */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort Results</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 w-full"
                  >
                    <option value="none">Default Sort</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name">Alphabetical</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Price (₹/hr)</label>
                    <span className="text-xs text-indigo-300 font-extrabold">₹{maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    step="10"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div className="text-left space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amenities</span>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_FILTERS.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => {
                          setSelectedAmenities(prev =>
                            prev.includes(amenity)
                              ? prev.filter(a => a !== amenity)
                              : [...prev, amenity]
                          );
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/35 border-indigo-400 text-white shadow-sm'
                            : 'bg-white/5 border-white/5 hover:bg-white/8 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {city && (
            <Button variant="link" onClick={clearSearch} className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer h-auto p-0">
              ✕ Clear City Filter — show all lots
            </Button>
          )}
        </div>
      </div>

      {/* Results section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-20 flex-1">
        {/* Results header */}
        {!loading && searched && (
          <div className="flex items-center justify-between mb-6 animate-fadeIn flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span className="text-slate-400 text-sm">
                {filteredAndSortedLots.length > 0
                  ? <><span className="text-white font-bold">{filteredAndSortedLots.length}</span> parking lot{filteredAndSortedLots.length !== 1 ? 's' : ''} found{city ? ` in "${city}"` : ''}</>
                  : 'No results match filters'
                }
              </span>
            </div>

            {filteredAndSortedLots.length > 0 && (
              <div className="flex items-center bg-slate-950/60 border border-white/5 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Grid View
                </button>
                <button
                  type="button"
                  onClick={() => { setViewMode('map'); setSelectedLotOnMap(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  Map View
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fadeIn">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-sm">Searching available parking lots...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredAndSortedLots.length === 0 && searched && (
          <Card className="p-16 text-center max-w-md mx-auto space-y-4 border border-dashed border-white/10 bg-slate-950/40 backdrop-blur-2xl rounded-2xl shadow-xl animate-fadeIn">
            <CardContent className="p-0 space-y-4">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 text-indigo-400 animate-float">
                <Car className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">No Matches Found</h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
                {city
                  ? `We couldn't find any parking lots in "${city}" matching your selected filter settings. Try adjusting your price limit or amenities.`
                  : 'No parking lots match your current price or amenity filters. Try broadening your criteria.'}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSortBy('none');
                    setMaxPrice(200);
                    setSelectedAmenities([]);
                  }}
                  className="text-xs hover:bg-white/5 hover:text-white cursor-pointer rounded-xl border border-white/5"
                >
                  Reset Filters
                </Button>
                {city && (
                  <Button
                    variant="ghost"
                    onClick={clearSearch}
                    className="text-xs hover:bg-white/5 hover:text-white cursor-pointer rounded-xl border border-white/5"
                  >
                    Show All Cities
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lots content */}
        {!loading && filteredAndSortedLots.length > 0 && (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {filteredAndSortedLots.map((lot, i) => {
                const amenities = safeParseJSON(lot.amenities) as string[];
                return (
                  <Card
                    key={lot.id}
                    id={`lot-card-${lot.id}`}
                    onClick={() => navigate(`/lot/${lot.id}`)}
                    className="bg-slate-950/40 border-white/5 backdrop-blur-2xl hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all duration-300 cursor-pointer group relative overflow-hidden animate-fadeIn flex flex-col justify-between h-full rounded-2xl shadow-xl"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <CardHeader className="p-6 pb-4">
                      {/* Hover glow background element */}
                      <div className="absolute -top-8 -right-8 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      {/* Top: Name + Price */}
                      <div className="flex items-start justify-between relative z-10 gap-2">
                        <div className="flex-1 min-w-0 pr-1">
                          <CardTitle className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate text-lg leading-tight font-display">
                            {lot.name}
                          </CardTitle>
                          <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{lot.address}, {lot.city}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-xl font-black font-display ${getPriceColor(lot.pricePerHour)}`}>
                            ₹{lot.pricePerHour}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">/hour</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 pt-0 pb-4 relative z-10">
                      {/* Amenities */}
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {amenities.slice(0, 3).map((a: string) => (
                            <Badge key={a} variant="outline" className="bg-indigo-500/5 text-indigo-300 border-indigo-500/15 font-semibold text-[10px] px-2 py-0.5 rounded-md">
                              {a}
                            </Badge>
                          ))}
                          {amenities.length > 3 && (
                            <span className="text-[10px] text-slate-500 py-0.5 font-semibold">+{amenities.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </CardContent>

                    {/* Footer */}
                    <CardFooter className="p-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                        <span className="text-xs text-slate-400 font-medium">Verified</span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-1 animate-pulse" />
                        <span className="text-xs text-emerald-400 font-bold">Live</span>
                      </div>
                      <span className="text-xs text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View slots →
                      </span>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="relative h-[600px] w-full rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-2xl overflow-hidden shadow-2xl flex flex-col animate-fadeIn select-none">
              {/* Map Canvas with zoom and pan handlers */}
              <div
                className={`flex-1 relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* SVG & Markers Layer */}
                <div
                  className="absolute origin-center w-[1000px] h-[600px]"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    left: 'calc(50% - 500px)',
                    top: 'calc(50% - 300px)',
                  }}
                >
                  <svg
                    width="1000"
                    height="600"
                    viewBox="0 0 1000 600"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0 pointer-events-none"
                  >
                    <defs>
                      <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#06060a" stopOpacity="0" />
                      </radialGradient>
                      <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>

                    {/* Radial background glow */}
                    <rect width="1000" height="600" fill="url(#mapGlow)" />

                    {/* City Parks */}
                    <rect x="80" y="60" width="220" height="140" rx="16" fill="rgba(16, 185, 129, 0.03)" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="1.5" />
                    <text x="190" y="130" fill="rgba(16, 185, 129, 0.3)" className="text-[10px] font-bold tracking-wider font-display uppercase" textAnchor="middle">City Park Reserve</text>

                    {/* Industrial Area */}
                    <rect x="720" y="380" width="200" height="160" rx="12" fill="rgba(244, 63, 94, 0.015)" stroke="rgba(244, 63, 94, 0.05)" strokeWidth="1.5" strokeDasharray="4 4" />
                    <text x="820" y="465" fill="rgba(244, 63, 94, 0.2)" className="text-[10px] font-bold tracking-wider font-display uppercase" textAnchor="middle">Industrial Sector</text>

                    {/* Retail Hub */}
                    <circle cx="500" cy="180" r="90" fill="rgba(99, 102, 241, 0.02)" stroke="rgba(99, 102, 241, 0.06)" strokeWidth="1" strokeDasharray="6 4" />
                    <text x="500" y="185" fill="rgba(99, 102, 241, 0.2)" className="text-[10px] font-bold tracking-wider font-display uppercase" textAnchor="middle">Shopping Plaza</text>

                    {/* The River Sweeping Line */}
                    <path d="M -50,420 C 300,450 400,100 1050,130" fill="none" stroke="url(#riverGradient)" strokeWidth="40" strokeLinecap="round" opacity="0.06" />
                    <path d="M -50,420 C 300,450 400,100 1050,130" fill="none" stroke="url(#riverGradient)" strokeWidth="12" strokeLinecap="round" opacity="0.12" />
                    <path id="riverPath" d="M -50,420 C 300,450 400,100 1050,130" fill="none" />
                    <text fill="rgba(6, 182, 212, 0.25)" className="text-[8px] font-bold uppercase tracking-widest font-display">
                      <textPath href="#riverPath" startOffset="30%">Blue River Canal</textPath>
                    </text>

                    {/* Roads network */}
                    {/* Road 1: Expressway */}
                    <line x1="-50" y1="280" x2="1050" y2="280" stroke="rgba(255,255,255,0.05)" strokeWidth="20" />
                    <line x1="-50" y1="280" x2="1050" y2="280" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="8 8" />
                    <text x="780" y="273" fill="rgba(255,255,255,0.15)" className="text-[8px] font-semibold tracking-wider font-display uppercase">ParkIt Expressway</text>

                    {/* Road 2: Avenue */}
                    <line x1="420" y1="-50" x2="420" y2="650" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
                    <line x1="420" y1="-50" x2="420" y2="650" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="6 6" />
                    <text x="428" y="550" fill="rgba(255,255,255,0.15)" className="text-[8px] font-semibold tracking-wider font-display uppercase" transform="rotate(90 428 550)">Metropolitan Blvd</text>

                    {/* Road 3: Secondary Street */}
                    <line x1="-50" y1="-50" x2="1050" y2="550" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                    <line x1="-50" y1="-50" x2="1050" y2="550" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    
                    {/* Compass Rose Decoration */}
                    <circle cx="920" cy="80" r="25" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
                    <line x1="920" y1="50" x2="920" y2="110" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <line x1="890" y1="80" x2="950" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <text x="920" y="47" fill="rgba(255,255,255,0.3)" className="text-[9px] font-black" textAnchor="middle">N</text>
                  </svg>

                  {/* Lot Map Pin markers */}
                  {filteredAndSortedLots.map((lot) => {
                    const { x, y } = getMockCoordinates(lot.id);
                    const isSelected = selectedLotOnMap?.id === lot.id;
                    
                    return (
                      <div
                        key={lot.id}
                        className="absolute interactive-map-element cursor-pointer animate-fadeIn"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: 'translate(-50%, -100%)',
                          zIndex: isSelected ? 40 : 20,
                        }}
                        onClick={() => setSelectedLotOnMap(lot)}
                      >
                        {/* Selected Pulsing Glow Aura */}
                        {isSelected && (
                          <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-indigo-500/10 pointer-events-none flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 animate-ping" />
                          </div>
                        )}

                        {/* Pin Widget */}
                        <div className={`relative px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white ring-4 ring-indigo-500/20'
                            : 'bg-slate-900/90 border-white/10 hover:border-indigo-500/30 text-slate-300'
                        }`}>
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                          <span className="font-mono text-xs font-black">₹{lot.pricePerHour}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Float Map Control Buttons */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(s => Math.min(3, s + 0.25))}
                  className="w-9 h-9 p-0 rounded-xl bg-slate-950/80 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/90 cursor-pointer shadow-lg"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                  className="w-9 h-9 p-0 rounded-xl bg-slate-950/80 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/90 cursor-pointer shadow-lg"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); setSelectedLotOnMap(null); }}
                  className="w-9 h-9 p-0 rounded-xl bg-slate-950/80 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/90 cursor-pointer shadow-lg"
                  title="Reset View"
                >
                  <Compass className="w-4 h-4" />
                </Button>
              </div>

              {/* Map Info Legend */}
              <div className="absolute top-4 right-4 bg-slate-950/80 border border-white/5 rounded-xl px-3 py-2 z-30 backdrop-blur-md hidden sm:flex items-center gap-3 text-[10px] font-semibold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>&lt;₹40/hr</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>₹40-₹80/hr</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>&gt;₹80/hr</span>
                </div>
              </div>

              {/* Floating Hover/Select Popup Info Card */}
              {selectedLotOnMap && (
                <div className="absolute bottom-4 right-4 max-w-sm w-[calc(100%-2rem)] z-30 bg-slate-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl animate-slideUp">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/25 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full mb-1">
                        Selected Spot
                      </Badge>
                      <h4 className="font-bold text-white text-base leading-tight font-display">{selectedLotOnMap.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{selectedLotOnMap.address}, {selectedLotOnMap.city}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedLotOnMap(null)}
                      className="text-slate-400 hover:text-white text-sm font-semibold p-1 cursor-pointer bg-white/5 hover:bg-white/10 rounded-lg h-7 w-7 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 mb-3.5">
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Hourly Rate</div>
                      <div className={`text-base font-black font-display ${getPriceColor(selectedLotOnMap.pricePerHour)}`}>
                        ₹{selectedLotOnMap.pricePerHour}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Status</div>
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-emerald-400 font-bold uppercase">Live Availability</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/lot/${selectedLotOnMap.id}`)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs py-4 cursor-pointer shadow-lg shadow-indigo-600/20"
                    >
                      Book Slot Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedLotOnMap(null)}
                      className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl text-xs py-4 cursor-pointer"
                    >
                      Close Preview
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default Search;

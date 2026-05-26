import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Car, Loader2, TrendingUp, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { ParkingLot } from '../types';
import { safeParseJSON } from '../utils/json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

const POPULAR_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai'];

const AVAILABLE_FILTERS = ['CCTV', 'Security', 'Valet', 'EV Charging'];

const Search: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const { toast } = useToast();
  const [city, setCity] = useState('');
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name' | 'none'>('none');
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const fetchLots = async (cityQuery?: string) => {
    setLoading(true);
    setSearched(true);
    setNotice('');
    try {
      const res = await api.get('/lots', { params: cityQuery ? { city: cityQuery } : {} });
      setLots(res.data);
      localStorage.setItem('parkit_last_city', cityQuery || '');
      setNotice(cityQuery ? `Showing results for ${cityQuery}` : 'Showing all verified parking lots');
      toast({ title: 'Search updated', description: cityQuery ? `Loaded lots for ${cityQuery}.` : 'Loaded all verified lots.', variant: 'success' });
    } catch (e) {
      console.error(e);
      setNotice('Unable to refresh parking lots right now.');
      toast({ title: 'Search failed', description: 'Could not load parking lots.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedCity = localStorage.getItem('parkit_last_city') || '';
    if (savedCity) {
      setCity(savedCity);
      fetchLots(savedCity);
    } else {
      fetchLots();
    }
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLots(city || undefined);
  };

  const clearSearch = () => {
    setCity('');
    setSortBy('none');
    setMaxPrice(200);
    setSelectedAmenities([]);
    localStorage.removeItem('parkit_last_city');
    fetchLots();
  };

  const getPriceColor = (price: number) => {
    if (price < 40) return 'text-emerald-500';
    if (price < 80) return 'text-blue-500';
    return 'text-amber-500';
  };

  const parsedAmenities = React.useMemo(() => {
    const map = new Map<number, string[]>();
    lots.forEach(lot => {
      map.set(lot.id, safeParseJSON(lot.amenities) as string[]);
    });
    return map;
  }, [lots]);

  const filteredAndSortedLots = React.useMemo(() => {
    let result = [...lots];

    result = result.filter(lot => lot.pricePerHour <= maxPrice);

    if (selectedAmenities.length > 0) {
      result = result.filter(lot => {
        const lotAmenities = (parsedAmenities.get(lot.id) || []).map(a => a.toLowerCase().trim());
        return selectedAmenities.every(amenity =>
          lotAmenities.some(a => a.includes(amenity.toLowerCase().trim()))
        );
      });
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [lots, sortBy, maxPrice, selectedAmenities, parsedAmenities]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-[-4rem] top-[30rem] h-80 w-80 rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-10 text-center w-full sticky top-16 z-20 bg-[#0A0A0F]/90 backdrop-blur-sm border-b border-white/[0.04] sm:static sm:bg-transparent sm:border-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-slate-300 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Search verified lots with live slot sync
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
          Find your perfect spot
        </h1>
        <p className="text-slate-400 mb-6 text-sm sm:text-base">Search verified parking lots with live availability</p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto items-center">
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
            <Input
              ref={inputRef}
              id="city-search-input"
              type="text"
              placeholder="Search by city..."
              className="pl-10 pr-4 bg-[#111118] border-white/[0.08] h-10 text-white placeholder-slate-500 rounded-lg"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>
          <Button id="city-search-btn" type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg h-10 px-5 font-semibold gap-2 shrink-0 cursor-pointer">
            <SearchIcon className="w-4 h-4" />
            Search
          </Button>
        </form>

        <div className="mt-3 min-h-5 text-xs text-slate-400">
          {notice || 'Tip: search a city, then refine with filters.'}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto">
          <span className="text-xs font-medium text-slate-500 self-center mr-1">Popular:</span>
          {POPULAR_CITIES.map(c => (
            <Button
              key={c}
              type="button"
              variant={city.toLowerCase() === c.toLowerCase() ? "default" : "outline"}
              onClick={() => { setCity(c); fetchLots(c); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer h-7 border ${
                city.toLowerCase() === c.toLowerCase()
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] text-slate-400 hover:text-white'
              }`}
            >
              {c}
            </Button>
          ))}
        </div>

        <div className="max-w-2xl mx-auto mt-5 p-4 rounded-xl border border-white/[0.06] bg-[#111118]/95 backdrop-blur-sm space-y-4 animate-fadeIn shadow-xl shadow-black/10 sticky top-[11.5rem] z-20 sm:static sm:top-auto ring-1 ring-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <span className="text-xs font-semibold text-slate-300">Filters & Sort</span>
            {(sortBy !== 'none' || maxPrice !== 200 || selectedAmenities.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSortBy('none');
                  setMaxPrice(200);
                  setSelectedAmenities([]);
                }}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold uppercase transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Sort Results</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#111118] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 w-full shadow-inner shadow-black/10"
                  >
                  <option value="none">Default</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Max Price (₹/hr)</label>
                  <span className="text-xs text-blue-400 font-bold">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-white/[0.06] h-1.5 rounded-lg appearance-none cursor-pointer shadow-inner shadow-black/10"
                />
              </div>
            </div>

            <div className="text-left space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Amenities</span>
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
                    className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer shadow-sm ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/40 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] text-slate-400 hover:text-slate-300'
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
          <Button variant="link" onClick={clearSearch} className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer h-auto p-0">
            ✕ Clear filter — show all lots
          </Button>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-20 flex-1 relative z-10">
        {!loading && searched && (
          <div className="flex items-center justify-between mb-5 animate-fadeIn flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-slate-400 text-sm">
                {filteredAndSortedLots.length > 0
                  ? <><span className="text-white font-semibold">{filteredAndSortedLots.length}</span> lot{filteredAndSortedLots.length !== 1 ? 's' : ''} found{city ? ` in "${city}"` : ''}</>
                  : 'No results match filters'
                }
              </span>
            </div>

            <div className="text-xs text-slate-500 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1">
              Tip: combine amenities with price for faster results
            </div>


          </div>
        )}

        {loading && (
          <div className="animate-fadeIn space-y-5">
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-slate-400 text-sm">Searching parking lots...</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-[#111118] border-white/[0.06] rounded-xl overflow-hidden">
                  <CardHeader className="p-5 pb-3 space-y-3">
                    <div className="h-4 w-2/3 rounded bg-white/[0.06] animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-white/[0.04] animate-pulse" />
                  </CardHeader>
                  <CardContent className="p-5 pt-0 pb-3 space-y-3">
                    <div className="flex gap-2">
                      <div className="h-5 w-16 rounded bg-white/[0.06] animate-pulse" />
                      <div className="h-5 w-20 rounded bg-white/[0.06] animate-pulse" />
                      <div className="h-5 w-14 rounded bg-white/[0.06] animate-pulse" />
                    </div>
                  </CardContent>
                  <CardFooter className="p-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="h-3 w-20 rounded bg-white/[0.06] animate-pulse" />
                    <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!loading && filteredAndSortedLots.length === 0 && searched && (
          <Card className="p-12 text-center max-w-md mx-auto space-y-3 border border-dashed border-white/[0.10] bg-[#111118] rounded-xl animate-fadeIn">
            <CardContent className="p-0 space-y-3">
              <div className="w-14 h-14 bg-blue-500/15 rounded-xl flex items-center justify-center mx-auto border border-blue-500/25 text-blue-400">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-white">No Matches Found</h3>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
                {(() => {
                  const hasFilters = sortBy !== 'none' || maxPrice < 200 || selectedAmenities.length > 0;
                  if (city && hasFilters) {
                    return `No parking lots in "${city}" match your active filters. Try adjusting price or amenities.`;
                  }
                  if (city) {
                    return `No parking lots available in "${city}" yet. Try a different city or show all lots.`;
                  }
                  if (hasFilters) {
                    return 'No parking lots match your filters. Try broadening your criteria.';
                  }
                  return 'No parking lots found. Check back soon for new properties.';
                })()}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSortBy('none');
                    setMaxPrice(200);
                    setSelectedAmenities([]);
                  }}
                  className="text-xs hover:bg-white/[0.04] hover:text-white cursor-pointer rounded-lg border border-white/[0.06]"
                >
                  Reset Filters
                </Button>
                {city && (
                  <Button
                    variant="ghost"
                    onClick={clearSearch}
                    className="text-xs hover:bg-white/[0.04] hover:text-white cursor-pointer rounded-lg border border-white/[0.06]"
                  >
                    Show All Cities
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && filteredAndSortedLots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
              {filteredAndSortedLots.map((lot, i) => {
                const amenities = safeParseJSON(lot.amenities) as string[];
                return (
                  <Card
                    key={lot.id}
                    id={`lot-card-${lot.id}`}
                    onClick={() => navigate(`/lot/${lot.id}`)}
                    className="bg-[#111118] border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full rounded-xl hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 pr-1">
                          <CardTitle className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate text-base leading-tight">
                            {lot.name}
                          </CardTitle>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1.5">
                            <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="truncate">{lot.address}, {lot.city}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-lg font-bold ${getPriceColor(lot.pricePerHour)}`}>
                            ₹{lot.pricePerHour}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">/hour</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 pb-3">
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {amenities.slice(0, 3).map((a: string) => (
                            <Badge key={a} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-medium text-[10px] px-2 py-0.5 rounded-md">
                              {a}
                            </Badge>
                          ))}
                          {amenities.length > 3 && (
                            <span className="text-[10px] text-slate-500 py-0.5 font-medium">+{amenities.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500/30" />
                        <span className="text-[11px] text-slate-400 font-medium">Verified</span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full ml-1" />
                        <span className="text-[11px] text-emerald-500 font-semibold">Live</span>
                      </div>
                      <span className="text-xs text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        View slots →
                      </span>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
        )}
      </main>
    </div>
  );
};

export default Search;

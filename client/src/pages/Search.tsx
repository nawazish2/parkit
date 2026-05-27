import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Car, Loader2, TrendingUp, Star, SlidersHorizontal, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import EmptyStateCard from '../components/dashboard/EmptyStateCard';
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
    } catch {
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
    if (price < 40) return 'text-emerald-400';
    if (price < 80) return 'text-blue-400';
    return 'text-amber-400';
  };

  const parsedAmenities = React.useMemo(() => {
    const map = new Map<number, string[]>();
    lots.forEach((lot) => {
      map.set(lot.id, safeParseJSON(lot.amenities) as string[]);
    });
    return map;
  }, [lots]);

  const filteredAndSortedLots = React.useMemo(() => {
    let result = [...lots];
    result = result.filter((lot) => lot.pricePerHour <= maxPrice);

    if (selectedAmenities.length > 0) {
      result = result.filter((lot) => {
        const lotAmenities = (parsedAmenities.get(lot.id) || []).map((a) => a.toLowerCase().trim());
        return selectedAmenities.every((amenity) => lotAmenities.some((a) => a.includes(amenity.toLowerCase().trim())));
      });
    }

    if (sortBy === 'price_asc') result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    else if (sortBy === 'price_desc') result.sort((a, b) => b.pricePerHour - a.pricePerHour);
    else if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [lots, sortBy, maxPrice, selectedAmenities, parsedAmenities]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-6rem] top-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-[-4rem] top-[28rem] h-80 w-80 rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-7 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl border border-white/[0.08] bg-[#111118]/90 p-5 shadow-xl shadow-black/20 md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge className="border border-blue-500/25 bg-blue-500/15 text-blue-200"><Sparkles className="mr-1 h-3 w-3" />Verified Inventory</Badge>
            <span className="text-xs text-slate-400">{notice || 'Search lots and refine results with filters.'}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Find Parking Lots</h1>
          <p className="mt-1 text-sm text-slate-400">Live availability with pricing and amenities in one place.</p>

          <form onSubmit={handleSearch} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                ref={inputRef}
                id="city-search-input"
                type="text"
                placeholder="Search by city..."
                className="h-11 rounded-lg border-white/[0.08] bg-[#0A0A0F] pl-10 text-white"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <Button id="city-search-btn" type="submit" className="h-11 gap-2 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-500">
              <SearchIcon className="h-4 w-4" /> Search
            </Button>
            <Button type="button" variant="outline" onClick={clearSearch} className="h-11 rounded-lg border-white/[0.14] bg-transparent text-slate-300 hover:bg-white/[0.04]">
              Reset
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Popular:</span>
            {POPULAR_CITIES.map((c) => (
              <Button
                key={c}
                type="button"
                variant={city.toLowerCase() === c.toLowerCase() ? 'default' : 'outline'}
                onClick={() => {
                  setCity(c);
                  fetchLots(c);
                }}
                className={`h-7 rounded-md px-3 text-xs font-medium ${
                  city.toLowerCase() === c.toLowerCase()
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-white/[0.1] bg-white/[0.02] text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                {c}
              </Button>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-white/[0.08] bg-[#111118] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-200"><SlidersHorizontal className="h-4 w-4 text-blue-300" />Filters and Sort</p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSortBy('none');
                setMaxPrice(200);
                setSelectedAmenities([]);
              }}
              className="h-auto p-0 text-xs text-blue-400 hover:text-blue-300"
            >
              Reset filters
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#0A0A0F] px-3 text-sm text-white"
              >
                <option value="none">Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <label>Max Price</label><span className="text-blue-300">₹{maxPrice}/hr</span>
              </div>
              <input type="range" min="20" max="200" step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-2 w-full accent-blue-500" />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Amenities</label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_FILTERS.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => setSelectedAmenities((prev) => (prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]))}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                        isSelected ? 'border-blue-500/30 bg-blue-500/20 text-white' : 'border-white/[0.08] bg-white/[0.02] text-slate-300'
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {!loading && searched && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              {filteredAndSortedLots.length > 0
                ? <><span className="font-semibold text-white">{filteredAndSortedLots.length}</span> lots available{city ? ` in "${city}"` : ''}</>
                : 'No lots match current filters'}
            </p>
          </div>
        )}

        {loading && (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-3 text-sm text-slate-400">Searching parking lots...</p>
          </div>
        )}

        {!loading && filteredAndSortedLots.length === 0 && searched && (
          <EmptyStateCard
            className="mx-auto max-w-md border-dashed border-white/[0.12]"
            icon={<div className="flex h-14 w-14 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/15 text-blue-400"><Car className="h-7 w-7" /></div>}
            title="No matches found"
            description="Try another city or broaden price and amenities filters."
          />
        )}

        {!loading && filteredAndSortedLots.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedLots.map((lot) => {
              const amenities = safeParseJSON(lot.amenities) as string[];
              return (
                <Card
                  key={lot.id}
                  id={`lot-card-${lot.id}`}
                  onClick={() => navigate(`/lot/${lot.id}`)}
                  className="group flex h-full cursor-pointer flex-col justify-between rounded-xl border-white/[0.08] bg-[#111118] transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-black/20"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 pr-1">
                        <CardTitle className="truncate text-base font-semibold leading-tight text-white transition-colors group-hover:text-blue-300">{lot.name}</CardTitle>
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3 shrink-0 text-blue-500" /><span className="truncate">{lot.address}, {lot.city}</span></p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-lg font-bold ${getPriceColor(lot.pricePerHour)}`}>₹{lot.pricePerHour}</div>
                        <div className="text-[10px] font-medium text-slate-500">/hour</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 pb-3">
                    <div className="flex flex-wrap gap-1">
                      {amenities.slice(0, 3).map((a: string) => (
                        <Badge key={a} variant="outline" className="rounded-md border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">{a}</Badge>
                      ))}
                      {amenities.length > 3 && <span className="py-0.5 text-[10px] font-medium text-slate-500">+{amenities.length - 3} more</span>}
                    </div>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between border-t border-white/[0.06] p-5 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3 w-3 fill-amber-500/30 text-amber-500" />
                      <span className="text-[11px] font-medium text-slate-400">Verified</span>
                      <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-semibold text-emerald-500">Live</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-400 transition-transform group-hover:translate-x-0.5">View slots →</span>
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

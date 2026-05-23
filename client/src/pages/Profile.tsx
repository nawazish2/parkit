import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Plus, Trash2, Star, ArrowLeft, AlertTriangle, Loader2, Sparkles, Mail, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { Vehicle } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, syncProfile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [newType, setNewType] = useState('Sedan');
  const [newPlate, setNewPlate] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);

  useEffect(() => {
    if (user) {
      setVehicles(user.savedVehicles || []);
      setLoading(false);
    }
  }, [user]);

  const handleSetDefault = async (plate: string) => {
    setUpdating(true);
    setError('');
    const updated = vehicles.map(v => ({
      ...v,
      isDefault: v.plate === plate,
    }));

    try {
      await api.put('/auth/profile/vehicles', { vehicles: updated });
      await syncProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update default vehicle');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (plate: string) => {
    setUpdating(true);
    setError('');
    const wasDefault = vehicles.find(v => v.plate === plate)?.isDefault;
    const updated = vehicles.filter(v => v.plate !== plate);
    
    // If the default vehicle was deleted and there are remaining ones, set first as default
    if (wasDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }

    try {
      await api.put('/auth/profile/vehicles', { vehicles: updated });
      await syncProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) {
      setError('License plate number is required');
      return;
    }
    
    const uppercasePlate = newPlate.trim().toUpperCase();

    // Check if plate already exists in list
    if (vehicles.some(v => v.plate === uppercasePlate)) {
      setError('A vehicle with this license plate is already registered');
      return;
    }

    setUpdating(true);
    setError('');

    const newVehicle: Vehicle = {
      type: newType,
      plate: uppercasePlate,
      label: newLabel.trim() || undefined,
      isDefault: newIsDefault || vehicles.length === 0,
    };

    let updated = [...vehicles];
    if (newVehicle.isDefault) {
      updated = updated.map(v => ({ ...v, isDefault: false }));
    }
    updated.push(newVehicle);

    try {
      await api.put('/auth/profile/vehicles', { vehicles: updated });
      await syncProfile();
      
      // Reset form
      setNewType('Sedan');
      setNewPlate('');
      setNewLabel('');
      setNewIsDefault(false);
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#06060a] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060a] text-white flex flex-col pb-20">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8 mt-4">
        {/* Back navigation */}
        <Button
          variant="ghost"
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer w-fit p-0 h-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Button>

        {/* Profile Card Header */}
        <Card className="p-6 md:p-8 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-white/5 bg-slate-950/40 backdrop-blur-2xl rounded-2xl shadow-xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-2xl font-black text-white shadow-lg border border-white/10">
              {(user.name?.[0] || '?').toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-black tracking-tight text-white leading-tight font-display">{user.name}</h1>
              <p className="text-slate-400 flex items-center gap-1.5 text-xs font-medium">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                {user.email}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 capitalize font-bold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> {user.role} Account
                </Badge>
              </div>
            </div>
          </div>

          <Badge variant="outline" className="bg-indigo-500/5 text-indigo-300 border-indigo-500/15 uppercase tracking-wider text-[9px] font-extrabold px-3 py-1.5 flex gap-1.5 items-center rounded-full z-10 sm:mt-0 mt-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Live Sync Active
          </Badge>
        </Card>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
            {error}
          </div>
        )}

        {/* Vehicles Section */}
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 font-display">
              <Car className="w-5 h-5 text-indigo-400" />
              My Saved Vehicles
              {vehicles.length > 0 && (
                <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 font-bold ml-1 rounded-full">{vehicles.length}</Badge>
              )}
            </h2>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 text-xs px-4 py-2 h-9 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/25 transition-all duration-300 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <Card className="p-12 text-center space-y-4 bg-slate-950/40 border border-white/5 backdrop-blur-2xl rounded-2xl shadow-xl max-w-md mx-auto animate-fadeIn">
              <CardContent className="p-0 space-y-4">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 shadow-inner">
                  <Car className="w-7 h-7 text-indigo-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white font-display">No Registered Vehicles</h3>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                    Save vehicle details once here and quickly select them during checkout with one-click pre-filling.
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2 rounded-xl cursor-pointer text-xs shadow-lg shadow-indigo-600/20 transition-all duration-300"
                >
                  Register First Vehicle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle.plate}
                  className={`bg-slate-950/40 border-white/5 backdrop-blur-2xl rounded-2xl shadow-md p-5 flex justify-between items-center relative overflow-hidden transition-all duration-300 ${
                    vehicle.isDefault ? 'border-emerald-500/20 bg-emerald-500/5' : 'hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                      vehicle.isDefault 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm font-display">
                          {vehicle.label || `${vehicle.type}`}
                        </span>
                        {vehicle.isDefault && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-extrabold tracking-wider px-2 py-0.5 rounded-full uppercase">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono font-bold text-indigo-300 mt-1 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded w-fit uppercase">
                        {vehicle.plate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!vehicle.isDefault && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSetDefault(vehicle.plate)}
                        disabled={updating}
                        className="w-8 h-8 rounded-lg border border-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 cursor-pointer"
                        title="Set as Default"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(vehicle.plate)}
                      disabled={updating}
                      className="w-8 h-8 rounded-lg border border-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 cursor-pointer"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add Vehicle Modal using Shadcn Dialog */}
      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) setShowAddModal(false); }}>
        <DialogContent className="max-w-md w-full p-6 border-indigo-500/40 shadow-2xl bg-slate-950/95 text-white backdrop-blur-2xl rounded-2xl">
          <DialogHeader className="space-y-3 pb-3 border-b border-white/5">
            <DialogTitle className="text-xl font-black text-white font-display">Add Vehicle Profile</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Register vehicle specs below to enable quick bookings
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddVehicle} className="space-y-4 pt-4">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Vehicle Type
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 text-white rounded-xl h-10 px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    backgroundRepeat: 'no-repeat',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="Sedan" className="bg-slate-950 text-white">Sedan</option>
                  <option value="SUV" className="bg-slate-950 text-white">SUV</option>
                  <option value="Hatchback" className="bg-slate-950 text-white">Hatchback</option>
                  <option value="Motorcycle" className="bg-slate-950 text-white">Motorcycle</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  License Plate
                </label>
                <Input
                  type="text"
                  placeholder="e.g. MH12AB1234"
                  value={newPlate}
                  onChange={e => setNewPlate(e.target.value)}
                  maxLength={15}
                  required
                  className="bg-slate-950/60 border-white/10 text-white placeholder-slate-500 rounded-xl h-10 px-3 text-sm font-medium uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Custom Label (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. My Audi, Dad's Scooter"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  maxLength={20}
                  className="bg-slate-950/60 border-white/10 text-white placeholder-slate-500 rounded-xl h-10 px-3 text-sm font-medium"
                />
              </div>

              {vehicles.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="newIsDefault"
                    checked={newIsDefault}
                    onChange={e => setNewIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-slate-950/60 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="newIsDefault" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Set as default vehicle for checkout
                  </label>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2.5 pt-4 border-t border-white/5 sm:flex-row flex-col">
              <Button
                type="submit"
                disabled={updating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white flex-1 rounded-xl h-10 font-bold cursor-pointer"
              >
                {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Vehicle'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowAddModal(false)}
                variant="outline"
                className="border-white/10 bg-transparent text-slate-400 hover:bg-white/5 hover:text-white rounded-xl h-10 font-bold cursor-pointer"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

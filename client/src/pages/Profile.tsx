import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Plus, Trash2, Star, ArrowLeft, AlertTriangle, Loader2, Mail, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { Vehicle } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
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
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');

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
      toast({ title: 'Vehicle updated', description: 'Default vehicle saved.', variant: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update default vehicle');
      toast({ title: 'Vehicle update failed', description: err.response?.data?.message || 'Failed to update default vehicle', variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (plate: string) => {
    setUpdating(true);
    setError('');
    const wasDefault = vehicles.find(v => v.plate === plate)?.isDefault;
    const updated = vehicles.filter(v => v.plate !== plate);
    
    if (wasDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }

    try {
      await api.put('/auth/profile/vehicles', { vehicles: updated });
      await syncProfile();
      toast({ title: 'Vehicle deleted', description: 'Saved vehicle removed.', variant: 'success' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
      toast({ title: 'Delete failed', description: err.response?.data?.message || 'Failed to delete vehicle', variant: 'error' });
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

    if (uppercasePlate.length < 6) {
      setError('Enter a valid license plate');
      return;
    }

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
      toast({ title: 'Vehicle added', description: 'Saved for faster checkout.', variant: 'success' });
      
      setNewType('Sedan');
      setNewPlate('');
      setNewLabel('');
      setNewIsDefault(false);
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add vehicle');
      toast({ title: 'Add vehicle failed', description: err.response?.data?.message || 'Failed to add vehicle', variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 w-full mt-6 space-y-4 animate-pulse">
          <div className="h-24 rounded-xl bg-[#111118] border border-white/[0.06]" />
          <div className="h-10 w-40 bg-[#111118] rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-[#111118] border border-white/[0.06]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 mt-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer w-fit p-0 h-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Button>

        <Card className="p-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-white/[0.06] bg-[#111118] rounded-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
          <div className="flex items-center gap-4 z-10">
            <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-900/20">
              {(user.name?.[0] || '?').toUpperCase()}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">{user.name}</h1>
              <p className="text-slate-400 flex items-center gap-1.5 text-xs font-medium">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                {user.email}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/25 capitalize font-semibold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> {user.role}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
              <Car className="w-5 h-5 text-blue-500" />
              Saved Vehicles
              {vehicles.length > 0 && (
                <Badge variant="secondary" className="bg-blue-500/15 text-blue-400 border-blue-500/25 font-semibold ml-1 rounded-md text-[10px]">{vehicles.length}</Badge>
              )}
            </h2>
            <Button
              onClick={() => setShowAddModal(true)}
              aria-label="Add vehicle"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 text-xs px-4 py-2 h-9 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <Card className="p-10 text-center space-y-3 bg-[#111118] border border-white/[0.06] rounded-xl max-w-md mx-auto relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
              <CardContent className="p-0 space-y-3">
                <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center mx-auto border border-blue-500/25">
                  <Car className="w-6 h-6 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">No Vehicles Yet</h3>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                    Save vehicle details here to quickly select them during checkout.
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-lg cursor-pointer text-xs"
                >
                  Add First Vehicle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle.plate}
                  className={`bg-[#111118] border-white/[0.06] rounded-xl p-4 flex justify-between items-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/15 ${
                    vehicle.isDefault ? 'border-emerald-500/25 bg-emerald-500/[0.03]' : 'hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center border shrink-0 ${
                      vehicle.isDefault 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' 
                        : 'bg-white/[0.02] text-slate-400 border-white/[0.08]'
                    }`}>
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm tracking-tight">
                          {vehicle.label || `${vehicle.type}`}
                        </span>
                        {vehicle.isDefault && (
                          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-md uppercase">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono font-bold text-blue-400 mt-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md w-fit uppercase">
                        {vehicle.plate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!vehicle.isDefault && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSetDefault(vehicle.plate)}
                      disabled={updating}
                      aria-label={`Set ${vehicle.label || vehicle.type} as default vehicle`}
                      className="w-8 h-8 rounded-lg border border-white/[0.06] hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 cursor-pointer"
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
                      aria-label={`Delete ${vehicle.label || vehicle.type}`}
                      className="w-8 h-8 rounded-lg border border-white/[0.06] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 cursor-pointer"
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

      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) setShowAddModal(false); }}>
        <DialogContent className="max-w-md w-full p-5 border-blue-500/25 bg-[#111118] text-white rounded-xl">
          <DialogHeader className="space-y-2 pb-3 border-b border-white/[0.06]">
            <DialogTitle className="text-xl font-bold text-white">Add Vehicle</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Register vehicle details for quick bookings
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddVehicle} className="space-y-4 pt-4">
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                  Vehicle Type
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-white/[0.08] text-white rounded-lg h-10 px-3 text-sm font-medium focus:outline-none focus:border-blue-500/50 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    backgroundRepeat: 'no-repeat',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="Sedan" className="bg-[#111118]">Sedan</option>
                  <option value="SUV" className="bg-[#111118]">SUV</option>
                  <option value="Hatchback" className="bg-[#111118]">Hatchback</option>
                  <option value="Motorcycle" className="bg-[#111118]">Motorcycle</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                  License Plate
                </label>
                  <Input
                    type="text"
                    placeholder="e.g. MH12AB1234"
                    value={newPlate}
                    onChange={e => setNewPlate(e.target.value.toUpperCase())}
                    maxLength={15}
                    required
                    autoComplete="off"
                    className="bg-[#0A0A0F] border-white/[0.08] text-white placeholder-slate-500 rounded-lg h-10 px-3 text-sm font-medium uppercase"
                  />
                </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                  Custom Label (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. My Audi, Dad's Scooter"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  maxLength={20}
                  className="bg-[#0A0A0F] border-white/[0.08] text-white placeholder-slate-500 rounded-lg h-10 px-3 text-sm font-medium"
                />
              </div>

              {vehicles.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="newIsDefault"
                    checked={newIsDefault}
                    onChange={e => setNewIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-white/[0.10] bg-[#0A0A0F] text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="newIsDefault" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Set as default vehicle
                  </label>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 pt-3 border-t border-white/[0.06] sm:flex-row flex-col">
                <Button
                  type="submit"
                  disabled={updating}
                  aria-label="Save vehicle"
                  className="bg-blue-600 hover:bg-blue-500 text-white flex-1 rounded-lg h-10 font-bold cursor-pointer"
                >
                {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Vehicle'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowAddModal(false)}
                variant="outline"
                aria-label="Cancel add vehicle"
                className="border-white/[0.10] bg-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white rounded-lg h-10 font-bold cursor-pointer"
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

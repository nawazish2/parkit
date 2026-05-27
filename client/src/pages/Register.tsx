import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Car as DriverIcon, Building2, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'driver' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Full name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      toast({ title: 'Account created', description: 'Your profile is ready.', variant: 'success' });
      const role = res.data.user.role;
      if (role === 'owner') navigate('/owner');
      else navigate('/search');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'driver', label: 'Driver', desc: 'Find and book slots fast', icon: <DriverIcon className="h-5 w-5" />, active: 'blue' },
    { value: 'owner', label: 'Property Owner', desc: 'List lots and manage revenue', icon: <Building2 className="h-5 w-5" />, active: 'violet' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0F] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-12 h-[24rem] w-[24rem] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute right-[-8rem] bottom-0 h-[24rem] w-[24rem] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">ParkIt</span>
            </Link>
          </div>

          <Card className="overflow-hidden rounded-xl border-white/[0.08] bg-[#111118] shadow-2xl shadow-black/30">
            <CardHeader className="space-y-1.5 pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">Create your account</CardTitle>
              <CardDescription className="text-sm text-slate-400">Choose your role and start with your parking workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    {roleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, role: opt.value })}
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          form.role === opt.value
                            ? opt.active === 'blue'
                              ? 'border-blue-500/50 bg-blue-600/15'
                              : 'border-violet-500/50 bg-violet-600/15'
                            : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`mb-2 ${form.role === opt.value ? (opt.active === 'blue' ? 'text-blue-300' : 'text-violet-300') : 'text-slate-400'}`}>
                          {opt.icon}
                        </div>
                        <p className="text-sm font-semibold text-white">{opt.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Smith"
                      className={`h-10 rounded-lg border-white/[0.08] bg-[#0A0A0F] pl-10 text-white ${fieldErrors.name ? 'border-rose-500' : ''}`}
                      value={form.name}
                      onChange={e => { setForm({ ...form, name: e.target.value }); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' })); }}
                      required
                    />
                  </div>
                  {fieldErrors.name && <p className="text-xs text-rose-400">{fieldErrors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      className={`h-10 rounded-lg border-white/[0.08] bg-[#0A0A0F] pl-10 text-white ${fieldErrors.email ? 'border-rose-500' : ''}`}
                      value={form.email}
                      onChange={e => { setForm({ ...form, email: e.target.value }); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: '' })); }}
                      required
                    />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-rose-400">{fieldErrors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      className={`h-10 rounded-lg border-white/[0.08] bg-[#0A0A0F] pl-10 pr-10 text-white ${fieldErrors.password ? 'border-rose-500' : ''}`}
                      value={form.password}
                      onChange={e => { setForm({ ...form, password: e.target.value }); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: '' })); }}
                      minLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs text-rose-400">{fieldErrors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      className={`h-10 rounded-lg border-white/[0.08] bg-[#0A0A0F] pl-10 text-white ${fieldErrors.confirmPassword ? 'border-rose-500' : ''}`}
                      value={form.confirmPassword}
                      onChange={e => { setForm({ ...form, confirmPassword: e.target.value }); if (fieldErrors.confirmPassword) setFieldErrors(p => ({ ...p, confirmPassword: '' })); }}
                    />
                  </div>
                  {fieldErrors.confirmPassword && <p className="text-xs text-rose-400">{fieldErrors.confirmPassword}</p>}
                </div>

                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Your role determines your default dashboard after signup.</span>
                </div>

                <Button id="register-submit" type="submit" className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-400 transition-colors hover:text-blue-300">Sign in</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;

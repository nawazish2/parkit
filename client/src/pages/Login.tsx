import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, Zap, QrCode } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address';
    if (!form.password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      toast({ title: 'Signed in', description: 'Welcome back.', variant: 'success' });
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'owner') navigate('/owner');
      else navigate('/search');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0F] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-8rem] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-[-6rem] bottom-[-4rem] h-[20rem] w-[20rem] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:px-8">
        <section className="hidden md:block">
          <Link to="/" className="mb-8 inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ParkIt</span>
          </Link>
          <h1 className="max-w-md text-4xl font-black leading-tight tracking-tight">
            Sign in to your
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">parking workspace.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Access live slots, secure checkout flows, and role-based dashboards for drivers, owners, and admins.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Zap, text: 'Real-time lot availability and booking sync' },
              { icon: QrCode, text: 'Instant QR pass generation after booking' },
              { icon: ShieldCheck, text: 'Secure auth with role-based route access' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                <Icon className="h-4 w-4 text-cyan-300" />
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 text-center md:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">ParkIt</span>
            </Link>
          </div>

          <Card className="overflow-hidden rounded-xl border-white/[0.08] bg-[#111118] shadow-2xl shadow-black/30">
            <CardHeader className="space-y-1.5 pb-6">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">Welcome back</CardTitle>
              <CardDescription className="text-sm text-slate-400">Enter your credentials to continue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="animate-fadeIn rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      className={`h-10 rounded-lg border-white/[0.08] bg-[#0A0A0F] pl-10 text-white ${fieldErrors.email ? 'border-rose-500' : ''}`}
                      value={form.email}
                      onChange={e => { setForm({ ...form, email: e.target.value }); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined })); }}
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
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      className={`h-10 rounded-lg border-white/[0.08] bg-[#0A0A0F] pl-10 pr-10 text-white ${fieldErrors.password ? 'border-rose-500' : ''}`}
                      value={form.password}
                      onChange={e => { setForm({ ...form, password: e.target.value }); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined })); }}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs text-rose-400">{fieldErrors.password}</p>}
                </div>

                <Button id="login-submit" type="submit" className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-blue-400 transition-colors hover:text-blue-300">Create one</Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Login;

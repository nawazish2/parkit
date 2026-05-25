import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Car as DriverIcon, Building2 } from 'lucide-react';
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
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'driver' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    {
      value: 'driver',
      label: 'Driver',
      desc: 'Search & book parking slots',
      icon: <DriverIcon className="w-5 h-5" />,
      color: 'blue',
    },
    {
      value: 'owner',
      label: 'Property Owner',
      desc: 'List lots & track revenue',
      icon: <Building2 className="w-5 h-5" />,
      color: 'violet',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0F]">
      <div className="w-full max-w-md animate-slideUp">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ParkIt</span>
          </Link>
        </div>

        <Card className="border-white/[0.06] bg-[#111118] shadow-xl overflow-hidden rounded-xl">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl font-bold text-white tracking-tight">Create your account</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Join the smarter parking platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-lg flex items-start gap-2 animate-fadeIn">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: opt.value })}
                      className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                        form.role === opt.value
                          ? opt.color === 'blue'
                            ? 'bg-blue-600/15 border-blue-500/50'
                            : 'bg-violet-600/15 border-violet-500/50'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10]'
                      }`}
                    >
                      <div className={`mb-2 ${
                        form.role === opt.value
                          ? opt.color === 'blue' ? 'text-blue-400' : 'text-violet-400'
                          : 'text-slate-400'
                      }`}>
                        {opt.icon}
                      </div>
                      <div className={`font-semibold text-sm ${form.role === opt.value ? 'text-white' : 'text-slate-300'}`}>
                        {opt.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="John Smith"
                    className="pl-10 bg-[#111118] border-white/[0.08] text-white rounded-lg focus-visible:ring-blue-500/30 h-10"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 bg-[#111118] border-white/[0.08] text-white rounded-lg focus-visible:ring-blue-500/30 h-10"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    className="pl-10 pr-10 bg-[#111118] border-white/[0.08] text-white rounded-lg focus-visible:ring-blue-500/30 h-10"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                id="register-submit"
                type="submit"
                className="w-full flex items-center justify-center gap-2 mt-6 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors cursor-pointer h-10"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Sign in →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;

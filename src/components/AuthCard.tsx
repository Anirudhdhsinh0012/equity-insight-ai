"use client";
import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthService from '@/services/authService';
import { User as UserType } from '@/types';

/**
 * AuthCard Component
 * Modern glassmorphism login/register card with accessible form elements.
 * Uses localStorage-backed AuthService (demo only) – replace with real API before production.
 */
interface AuthCardProps {
  onAuthSuccess?: (user: UserType) => void;
  defaultMode?: 'login' | 'register';
  showTitle?: boolean;
}

const AuthCard: React.FC<AuthCardProps> = ({ onAuthSuccess, defaultMode = 'login', showTitle = true }) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); setError(null); setSuccess(null);
  };

  const validate = (): boolean => {
    if (!form.email) { setError('Email required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Invalid email'); return false; }
    if (!form.password || form.password.length < 8) { setError('Password min 8 chars'); return false; }
    if (mode === 'register') {
      if (!form.name.trim()) { setError('Name required'); return false; }
      if (form.password !== form.confirm) { setError('Passwords do not match'); return false; }
    }
    setError(null); return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === 'login') {
        const res = await AuthService.login(form.email, form.password);
        if (res.success && res.user) {
          setSuccess('Logged in successfully');
          onAuthSuccess?.(res.user);
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        const res = await AuthService.register({ email: form.email, password: form.password, name: form.name, phone: '' });
        if (res.success && res.user) {
          setSuccess('Account created');
          onAuthSuccess?.(res.user);
          setMode('login');
        } else {
          setError(res.error || 'Registration failed');
        }
      }
    } catch (err:any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-emerald-500/40 blur" aria-hidden="true" />
      <div className="relative rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-2xl p-8">
        {showTitle && (
          <div className="mb-6 text-center space-y-1">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Stock Advisor Pro</h2>
            <p className="text-sm text-slate-400">Start your trading journey today</p>
          </div>) }

        <div className="flex mb-6 rounded-xl overflow-hidden border border-white/10">
          <button type="button" onClick={() => switchMode('login')} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${mode==='login'?'bg-emerald-500 text-white':'bg-transparent text-slate-300 hover:text-white'}`} aria-pressed={mode==='login'}>
            <Lock size={16}/> Login
          </button>
          <button type="button" onClick={() => switchMode('register')} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${mode==='register'?'bg-emerald-500 text-white':'bg-transparent text-slate-300 hover:text-white'}`} aria-pressed={mode==='register'}>
            <User size={16}/> Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-slate-400">Name</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><User size={16}/></span>
                <input aria-label="Name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full pl-9 pr-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-400 outline-none text-sm" placeholder="Your name" />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-slate-400">Email</label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Mail size={16}/></span>
              <input type="email" aria-label="Email" autoComplete="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full pl-9 pr-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-400 outline-none text-sm" placeholder="you@example.com" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-slate-400">Password</label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Lock size={16}/></span>
              <input type={showPassword? 'text':'password'} aria-label="Password" autoComplete={mode==='login'? 'current-password':'new-password'} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="w-full pl-9 pr-10 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-400 outline-none text-sm" placeholder="••••••••" />
              <button type="button" onClick={()=>setShowPassword(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" aria-label={showPassword? 'Hide password':'Show password'}>{showPassword? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
          </div>
          {mode==='register' && (
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-slate-400">Confirm Password</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Lock size={16}/></span>
                <input type={showPassword? 'text':'password'} aria-label="Confirm Password" required value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} className="w-full pl-9 pr-3 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-emerald-400 outline-none text-sm" placeholder="Repeat password" />
              </div>
            </div>
          )}

          {error && <div role="alert" className="text-xs rounded-md bg-red-500/10 border border-red-500/40 text-red-300 px-3 py-2">{error}</div>}
          {success && <div className="text-xs rounded-md bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 px-3 py-2">{success}</div>}

          <button type="submit" disabled={loading} className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-semibold py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60 disabled:cursor-not-allowed">
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin"/>}
              {mode==='login'? 'Sign In':'Create Account'}
            </span>
            <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition" />
          </button>
          {mode==='login' && (
            <p className="text-[11px] text-center text-slate-400">Forgot password? <span className="text-emerald-400 hover:underline cursor-pointer">Reset</span></p>
          )}
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          {mode==='login'? (
            <span>Don't have an account? <button className="text-emerald-400 hover:underline" onClick={()=>switchMode('register')}>Register</button></span>
          ) : (
            <span>Already have an account? <button className="text-emerald-400 hover:underline" onClick={()=>switchMode('login')}>Login</button></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCard;

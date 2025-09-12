"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Development-only admin credentials (NEVER commit real credentials to version control)
// These are read from environment variables for security
const DEV_ADMIN_EMAIL = process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL || 'admin@example.com';
const DEV_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DEV_ADMIN_PASS || 'N3xT!Adm1n$Tst#2025';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

const AuthCard: React.FC<AuthCardProps> = ({ onAuthSuccess, defaultMode = 'login', showTitle = true }) => {
  const router = useRouter();
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); setError(null); setSuccess(null); setFocusedField(null);
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
        // Development-only admin bypass (NEVER enable in production)
        if (IS_DEVELOPMENT && form.email === DEV_ADMIN_EMAIL && form.password === DEV_ADMIN_PASSWORD) {
          // Mark admin flag locally (so dashboard can adapt if needed)
          try { localStorage.setItem('isAdmin', 'true'); } catch {}
          setSuccess('Admin login successful. Redirecting...');
          setTimeout(() => {
            router.push('/admin-activity');
          }, 900);
          return; 
        }
        
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
    <motion.div 
      className="relative w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced glow effect */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/50 via-cyan-500/50 to-purple-500/50 blur-lg animate-pulse" aria-hidden="true" />
      
      <motion.div 
        className="relative rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 overflow-hidden"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" aria-hidden="true" />
        
        {showTitle && (
          <motion.div 
            className="mb-6 text-center space-y-2 relative z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Stock Advisor Pro
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Start your trading journey today
            </p>
          </motion.div>
        )}

        {/* Mode Toggle with enhanced styling */}
        <motion.div 
          className="flex mb-6 rounded-2xl overflow-hidden border border-white/10 bg-black/20 p-1 relative z-10"
          layout
        >
          <motion.div
            className="absolute inset-y-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl shadow-lg"
            initial={false}
            animate={{
              x: mode === 'login' ? '0%' : '100%',
              width: '50%'
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
          <motion.button 
            type="button" 
            onClick={() => switchMode('login')} 
            className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 relative z-10 ${
              mode === 'login' ? 'text-black' : 'text-slate-300 hover:text-white'
            }`}
            whileTap={{ scale: 0.98 }}
            aria-pressed={mode === 'login'}
          >
            <Lock size={16}/> Login
          </motion.button>
          <motion.button 
            type="button" 
            onClick={() => switchMode('register')} 
            className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 relative z-10 ${
              mode === 'register' ? 'text-black' : 'text-slate-300 hover:text-white'
            }`}
            whileTap={{ scale: 0.98 }}
            aria-pressed={mode === 'register'}
          >
            <User size={16}/> Register
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={mode}
            onSubmit={handleSubmit} 
            className="space-y-4 relative z-10" 
            noValidate
            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Name field for registration */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div 
                  className="space-y-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative group">
                    <motion.div 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                      animate={{ 
                        color: focusedField === 'name' || form.name ? '#10b981' : '#94a3b8',
                        scale: focusedField === 'name' ? 1.1 : 1
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <User size={18}/>
                    </motion.div>
                    
                    <input 
                      aria-label="Name" 
                      required 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black/30 border border-white/10 focus:border-emerald-400 focus:bg-black/40 outline-none text-sm transition-all duration-300 placeholder-slate-500 hover:border-white/20" 
                      placeholder="Your full name" 
                    />
                    
                    <motion.label 
                      className="absolute left-12 text-xs font-medium text-slate-400 pointer-events-none transition-all duration-300"
                      animate={{
                        y: focusedField === 'name' || form.name ? -28 : 0,
                        scale: focusedField === 'name' || form.name ? 0.85 : 1,
                        color: focusedField === 'name' ? '#10b981' : '#94a3b8'
                      }}
                      style={{ top: focusedField === 'name' || form.name ? '0px' : '50%', transform: 'translateY(-50%)' }}
                    >
                      {!(focusedField === 'name' || form.name) && 'Your full name'}
                      {(focusedField === 'name' || form.name) && 'FULL NAME'}
                    </motion.label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            <div className="space-y-2">
              <div className="relative group">
                <motion.div 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                  animate={{ 
                    color: focusedField === 'email' || form.email ? '#10b981' : '#94a3b8',
                    scale: focusedField === 'email' ? 1.1 : 1
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Mail size={18}/>
                </motion.div>
                
                <input 
                  type="email" 
                  aria-label="Email" 
                  autoComplete="email" 
                  required 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black/30 border border-white/10 focus:border-emerald-400 focus:bg-black/40 outline-none text-sm transition-all duration-300 placeholder-slate-500 hover:border-white/20" 
                  placeholder="you@example.com" 
                />
                
                <motion.label 
                  className="absolute left-12 text-xs font-medium text-slate-400 pointer-events-none transition-all duration-300"
                  animate={{
                    y: focusedField === 'email' || form.email ? -28 : 0,
                    scale: focusedField === 'email' || form.email ? 0.85 : 1,
                    color: focusedField === 'email' ? '#10b981' : '#94a3b8'
                  }}
                  style={{ top: focusedField === 'email' || form.email ? '0px' : '50%', transform: 'translateY(-50%)' }}
                >
                  {!(focusedField === 'email' || form.email) && 'you@example.com'}
                  {(focusedField === 'email' || form.email) && 'EMAIL ADDRESS'}
                </motion.label>
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="relative group">
                <motion.div 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                  animate={{ 
                    color: focusedField === 'password' || form.password ? '#10b981' : '#94a3b8',
                    scale: focusedField === 'password' ? 1.1 : 1
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Lock size={18}/>
                </motion.div>
                
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  aria-label="Password" 
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} 
                  required 
                  value={form.password} 
                  onChange={e => setForm({...form, password: e.target.value})}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-12 py-3 rounded-2xl bg-black/30 border border-white/10 focus:border-emerald-400 focus:bg-black/40 outline-none text-sm transition-all duration-300 placeholder-slate-500 hover:border-white/20" 
                  placeholder="••••••••" 
                />
                
                <motion.button 
                  type="button" 
                  onClick={() => setShowPassword(p => !p)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 z-10 p-1 rounded-lg transition-colors" 
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </motion.button>
                
                <motion.label 
                  className="absolute left-12 text-xs font-medium text-slate-400 pointer-events-none transition-all duration-300"
                  animate={{
                    y: focusedField === 'password' || form.password ? -28 : 0,
                    scale: focusedField === 'password' || form.password ? 0.85 : 1,
                    color: focusedField === 'password' ? '#10b981' : '#94a3b8'
                  }}
                  style={{ top: focusedField === 'password' || form.password ? '0px' : '50%', transform: 'translateY(-50%)' }}
                >
                  {!(focusedField === 'password' || form.password) && '••••••••'}
                  {(focusedField === 'password' || form.password) && 'PASSWORD'}
                </motion.label>
              </div>
            </div>

            {/* (Moved) Admin credentials hint – placed after messages for guaranteed visibility */}

            {/* Confirm Password field for registration */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div 
                  className="space-y-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative group">
                    <motion.div 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                      animate={{ 
                        color: focusedField === 'confirm' || form.confirm ? '#10b981' : '#94a3b8',
                        scale: focusedField === 'confirm' ? 1.1 : 1
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Lock size={18}/>
                    </motion.div>
                    
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      aria-label="Confirm Password" 
                      required 
                      value={form.confirm} 
                      onChange={e => setForm({...form, confirm: e.target.value})}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black/30 border border-white/10 focus:border-emerald-400 focus:bg-black/40 outline-none text-sm transition-all duration-300 placeholder-slate-500 hover:border-white/20" 
                      placeholder="Repeat password" 
                    />
                    
                    <motion.label 
                      className="absolute left-12 text-xs font-medium text-slate-400 pointer-events-none transition-all duration-300"
                      animate={{
                        y: focusedField === 'confirm' || form.confirm ? -28 : 0,
                        scale: focusedField === 'confirm' || form.confirm ? 0.85 : 1,
                        color: focusedField === 'confirm' ? '#10b981' : '#94a3b8'
                      }}
                      style={{ top: focusedField === 'confirm' || form.confirm ? '0px' : '50%', transform: 'translateY(-50%)' }}
                    >
                      {!(focusedField === 'confirm' || form.confirm) && 'Repeat password'}
                      {(focusedField === 'confirm' || form.confirm) && 'CONFIRM PASSWORD'}
                    </motion.label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error and Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  role="alert" 
                  className="flex items-center gap-3 text-sm rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
              
              {success && (
                <motion.div 
                  className="flex items-center gap-3 text-sm rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle size={18} className="flex-shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'login' && IS_DEVELOPMENT && (
              <div className="text-center mt-2">
                <div className="bg-gradient-to-r from-orange-600/20 via-red-500/15 to-orange-500/20 border border-orange-400/40 rounded-xl px-4 py-2.5 shadow-inner">
                  <p className="text-xs text-orange-200 leading-relaxed">
                    <span className="mr-1">�</span>
                    <span className="font-bold text-orange-300 uppercase tracking-wide">DEVELOPMENT ONLY</span>
                    <br />
                    <span className="text-orange-100 font-medium">Admin Test Account:</span>
                    <br className="sm:hidden" />
                    <span className="block mt-1">Email: <span className="text-orange-300 font-semibold tracking-wide bg-orange-900/30 px-1 rounded">{DEV_ADMIN_EMAIL}</span></span>
                    <span>Password: <span className="text-orange-300 font-semibold tracking-wide bg-orange-900/30 px-1 rounded">{DEV_ADMIN_PASSWORD}</span></span>
                    <br />
                    <span className="text-orange-200 text-[10px] italic">⚠️ Never use in production builds</span>
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <motion.button 
              type="submit" 
              disabled={loading} 
              className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 text-black font-bold py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
              whileHover={{ scale: loading ? 1 : 1.02, boxShadow: "0 10px 40px rgba(16, 185, 129, 0.3)" }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 size={18}/>
                  </motion.div>
                )}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </span>
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>

            {/* Forgot Password Link for Login */}
            {mode === 'login' && (
              <motion.p 
                className="text-xs text-center text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Forgot password? <span className="text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors">Reset</span>
              </motion.p>
            )}
          </motion.form>
        </AnimatePresence>

        {/* Mode Switch Text */}
        <motion.div 
          className="mt-6 text-center text-sm text-slate-400 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {mode === 'login' ? (
            <span>
              Don't have an account? 
              <motion.button 
                className="text-emerald-400 hover:text-emerald-300 ml-1 font-medium transition-colors" 
                onClick={() => switchMode('register')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Register
              </motion.button>
            </span>
          ) : (
            <span>
              Already have an account? 
              <motion.button 
                className="text-emerald-400 hover:text-emerald-300 ml-1 font-medium transition-colors" 
                onClick={() => switchMode('login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
            </span>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AuthCard;

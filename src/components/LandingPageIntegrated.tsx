'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Lock, User, Mail, Eye, EyeOff, ArrowRight, ArrowLeft,
  Phone, AlertCircle, BarChart3, LineChart, Activity
} from 'lucide-react';
import { User as UserType } from '@/types';
import AuthService from '@/services/authService';
import TwoFactorVerification from './TwoFactorVerification';
import AdminDebugPanel from './AdminDebugPanel';

interface LandingPageIntegratedProps {
  onLogin: (user: UserType) => void;
}

interface FormErrors {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  general: string;
}

interface StockTicker {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface CandlestickData {
  open: number;
  high: number;
  low: number;
  close: number;
  x: number;
  y: number;
}

const LandingPageIntegrated: React.FC<LandingPageIntegratedProps> = ({ onLogin }) => {
  // Auth State
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [temp2FAToken, setTemp2FAToken] = useState('');
  const [registrationStep, setRegistrationStep] = useState(1); // 1: Email, 2: Password, 3: Additional Info
  
  // Form Data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    general: ''
  });
  
  // Animation state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Stock data
  const [stockTickers] = useState<StockTicker[]>([
    { symbol: 'AAPL', price: 193.58, change: 2.45, changePercent: 1.28 },
    { symbol: 'TSLA', price: 248.71, change: -5.23, changePercent: -2.06 },
    { symbol: 'GOOGL', price: 138.92, change: 1.87, changePercent: 1.36 },
    { symbol: 'MSFT', price: 424.77, change: 3.21, changePercent: 0.76 },
    { symbol: 'AMZN', price: 178.39, change: -1.45, changePercent: -0.81 },
    { symbol: 'NVDA', price: 131.26, change: 4.82, changePercent: 3.81 },
    { symbol: 'META', price: 563.27, change: 7.91, changePercent: 1.42 },
    { symbol: 'NFLX', price: 491.23, change: -2.34, changePercent: -0.47 }
  ]);

  // Candlestick chart animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate candlestick data
    const generateCandlesticks = (): CandlestickData[] => {
      const candlesticks: CandlestickData[] = [];
      let basePrice = 150;
      
      for (let i = 0; i < 50; i++) {
        const variation = (Math.random() - 0.5) * 10;
        const open = basePrice + variation;
        const close = open + (Math.random() - 0.5) * 8;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        
        candlesticks.push({
          open,
          high,
          low,
          close,
          x: (canvas.width / 50) * i + 20,
          y: canvas.height / 2
        });
        
        basePrice = close;
      }
      
      return candlesticks;
    };

    let candlesticks = generateCandlesticks();
    let animationTime = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid background
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw candlesticks
      candlesticks.forEach((candle, index) => {
        const isGreen = candle.close > candle.open;
        const bodyHeight = Math.abs(candle.close - candle.open) * 3;
        const bodyTop = candle.y - (isGreen ? candle.close - candle.open : candle.open - candle.close) * 1.5;
        
        // Animate with wave effect
        const wave = Math.sin(animationTime * 0.02 + index * 0.1) * 5;
        const adjustedY = candle.y + wave;
        
        // Draw wick (high-low line)
        ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(candle.x, adjustedY - (candle.high - Math.max(candle.open, candle.close)) * 3);
        ctx.lineTo(candle.x, adjustedY + (Math.min(candle.open, candle.close) - candle.low) * 3);
        ctx.stroke();
        
        // Draw body
        ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.fillRect(candle.x - 4, bodyTop + wave, 8, bodyHeight);
        
        // Add glow effect
        ctx.shadowColor = isGreen ? '#22c55e' : '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(candle.x - 4, bodyTop + wave, 8, bodyHeight);
        ctx.shadowBlur = 0;
      });
      
      // Draw floating stock symbols
      const symbols = ['$AAPL', '$TSLA', '$GOOGL', '$MSFT', '$NVDA'];
      symbols.forEach((symbol, index) => {
        const x = (canvas.width / symbols.length) * index + 100;
        const y = 100 + Math.sin(animationTime * 0.01 + index) * 20;
        const opacity = 0.3 + Math.sin(animationTime * 0.02 + index) * 0.2;
        
        ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`;
        ctx.font = '24px monospace';
        ctx.fillText(symbol, x, y);
      });

      animationTime++;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Listen for test credentials event from debug panel
  useEffect(() => {
    const handleTestCredentials = () => {
      testDemoCredentials();
    };

    window.addEventListener('testDemoCredentials', handleTestCredentials);
    return () => window.removeEventListener('testDemoCredentials', handleTestCredentials);
  }, []);

  // Real-time validation helpers
  const isEmailValid = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return email.length > 0 && email.length <= 254 && emailRegex.test(email.toLowerCase().trim());
  };

  const isPasswordValid = (password: string, isLoginMode: boolean): boolean => {
    if (isLoginMode) {
      return password.length >= 6;
    } else {
      return password.length >= 8 && 
             /(?=.*[0-9])/.test(password) && 
             /(?=.*[!@#$%^&*])/.test(password);
    }
  };

  const getPasswordStrength = (password: string): { score: number; text: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*[0-9])/.test(password)) score++;
    if (/(?=.*[!@#$%^&*])/.test(password)) score++;

    if (score <= 2) return { score, text: 'Weak', color: 'text-red-500' };
    if (score === 3) return { score, text: 'Fair', color: 'text-yellow-500' };
    if (score === 4) return { score, text: 'Good', color: 'text-blue-500' };
    return { score, text: 'Strong', color: 'text-green-500' };
  };

  // Test demo credentials function
  const testDemoCredentials = async () => {
    console.log('🧪 Testing demo credentials...');
    
    const testCases = [
      { email: 'demo@test.com', password: 'password123', label: 'Demo User (No 2FA)' },
      { email: 'demo2fa@test.com', password: 'password123', label: 'Demo User (With 2FA)' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📧 Testing: ${testCase.label}`);
      console.log(`Email: ${testCase.email}, Password: ${testCase.password}`);
      
      // Test validation
      const emailValid = isEmailValid(testCase.email);
      const passwordValid = isPasswordValid(testCase.password, true); // true for login mode
      
      console.log(`✅ Email validation: ${emailValid ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Password validation: ${passwordValid ? 'PASS' : 'FAIL'}`);
      
      if (emailValid && passwordValid) {
        console.log(`🎯 ${testCase.label} credentials are valid for login`);
        
        // Test actual authentication
        try {
          const result = await AuthService.login(testCase.email, testCase.password);
          console.log(`🔐 Auth result:`, result);
          
          if (result.success) {
            console.log(`✅ Login successful for ${testCase.label}`);
          } else if (result.requires2FA) {
            console.log(`🔐 2FA required for ${testCase.label}`);
          } else {
            console.log(`❌ Login failed: ${result.error}`);
          }
        } catch (error) {
          console.error(`💥 Auth error:`, error);
        }
      } else {
        console.log(`❌ ${testCase.label} credentials failed validation`);
      }
    }
    
    console.log('\n🔧 Demo credentials test completed!');
  };
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      general: ''
    };

    // Email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.toLowerCase().trim())) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.length > 254) {
      newErrors.email = 'Email address is too long';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (isLogin) {
      // For login, just check minimum length
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    } else {
      // For registration, enforce stronger password requirements
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[0-9])/.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 number';
      } else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) {
        newErrors.password = 'Password must contain at least 1 special character';
      }
    }

    // Registration-specific validation
    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }

      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?\d{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Handle form submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({
      email: '', password: '', confirmPassword: '', name: '', phone: '', general: ''
    });

    try {
      if (isLogin) {
        console.log('[Login] Attempting login with:', { email: formData.email, passwordLength: formData.password.length });
        
        // Check for admin credentials first
        const adminEmail = 'admin@example.com';
        const adminPassword = 'N3xT!Adm1n$Tst#2025';
        
        if (formData.email.toLowerCase().trim() === adminEmail && formData.password === adminPassword) {
          console.log('[Login] Admin credentials detected, redirecting to admin dashboard');
          setIsLoading(false);
          
          // Set admin flag in localStorage
          try { 
            localStorage.setItem('isAdmin', 'true'); 
            localStorage.setItem('adminSession', JSON.stringify({
              email: adminEmail,
              loginTime: new Date().toISOString(),
              isAdmin: true
            }));
          } catch {}
          
          // Redirect to admin dashboard
          window.location.href = '/admin';
          return;
        }
        
        const result = await AuthService.login(formData.email.toLowerCase().trim(), formData.password);
        
        console.log('[Login] Login result:', { 
          success: result.success, 
          requires2FA: result.requires2FA,
          hasUser: !!result.user,
          error: result.error 
        });
        
        if (result.success && result.user) {
          console.log('[Login] Login successful, calling onLogin');
          onLogin(result.user);
        } else if (result.requires2FA && result.temp2FAToken) {
          // 2FA is required
          console.log('[Login] 2FA required, showing 2FA form');
          setTemp2FAToken(result.temp2FAToken);
          setShow2FA(true);
          setIsLoading(false);
          return;
        } else {
          // Login failed - provide specific error feedback
          const errorMessage = result.error || 'Login failed';
          console.warn('[Login] Login failed:', errorMessage);
          
          if (errorMessage.includes('email') || errorMessage.includes('password')) {
            setErrors({ ...errors, general: 'Invalid email or password. Please check your credentials.' });
          } else if (errorMessage.includes('2FA') || errorMessage.includes('locked')) {
            setErrors({ ...errors, general: errorMessage });
          } else {
            setErrors({ ...errors, general: 'Login failed. Please try again.' });
          }
          setIsLoading(false);
          return;
        }
      } else {
        const result = await AuthService.register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone
        });
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          throw new Error(result.error || 'Registration failed');
        }
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : 'An unexpected error occurred'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 2FA verification
  const handle2FAVerification = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await AuthService.complete2FALogin(temp2FAToken, code);
      if (result.success && result.user) {
        onLogin(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Invalid 2FA code' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to verify 2FA code. Please try again.' };
    }
  };

  const handle2FABack = () => {
    setShow2FA(false);
    setTemp2FAToken('');
  };

  return (
    <>
      {/* 2FA Verification Modal */}
      {show2FA && (
        <TwoFactorVerification
          onVerify={handle2FAVerification}
          onBack={handle2FABack}
          email={formData.email}
        />
      )}

      {/* Main Landing Page */}
      {!show2FA && (
        <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Stock Background */}
      <div className="absolute inset-0">
        {/* Candlestick Chart Canvas */}
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-20"
        />
        
        {/* Parallax Finance Layers */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10" />
          <div className="grid grid-cols-12 gap-4 h-full p-8">
            {Array.from({ length: 48 }, (_, i) => (
              <motion.div
                key={i}
                className="text-xs font-mono text-emerald-400/30"
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                  y: [-5, 5, -5]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              >
                {(Math.random() * 1000).toFixed(2)}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dynamic Gradient Orbs */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
              background: 'radial-gradient(circle, #22c55e, #3b82f6)',
              left: '10%',
              top: '20%',
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute w-72 h-72 rounded-full blur-3xl opacity-15"
            style={{
              background: 'radial-gradient(circle, #f59e0b, #ef4444)',
              right: '15%',
              bottom: '30%',
            }}
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1.2, 1, 1.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>

      {/* Ticker Strip */}
      <div className="absolute top-0 left-0 w-full bg-slate-900/80 backdrop-blur-sm border-b border-emerald-500/20 py-2 z-10">
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: [0, -2000] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {[...stockTickers, ...stockTickers, ...stockTickers].map((stock, index) => (
            <div key={index} className="flex items-center gap-2 text-sm font-mono">
              <span className="text-white font-bold">{stock.symbol}</span>
              <span className="text-emerald-400">${stock.price.toFixed(2)}</span>
              <span className={`${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Animated Title */}
            <div className="space-y-4">
              <motion.h1 
                className="text-6xl lg:text-8xl font-bold leading-none"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <motion.span
                  className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0%', '100%', '0%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    backgroundSize: '200% 100%'
                  }}
                >
                  Trade
                </motion.span>
                <motion.span
                  className="block text-white"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  Smarter.
                </motion.span>
                <motion.span
                  className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.6 }}
                >
                  Invest Better.
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl lg:text-2xl text-slate-300 max-w-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                Real-time market data, AI-powered insights, and seamless investing 
                all in one powerful platform.
              </motion.p>
            </div>

            {/* Floating Animated Graphs */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1 }}
            >
              {/* Line Chart */}
              <motion.div
                className="absolute -left-10 top-0"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 2, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <LineChart className="w-16 h-16 text-emerald-400 opacity-60" />
              </motion.div>

              {/* Bar Chart */}
              <motion.div
                className="absolute -right-10 top-8"
                animate={{
                  y: [0, 15, 0],
                  rotate: [0, -2, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <BarChart3 className="w-20 h-20 text-cyan-400 opacity-60" />
              </motion.div>

              {/* Activity Chart */}
              <motion.div
                className="absolute left-1/2 -top-5"
                animate={{
                  y: [0, -10, 0],
                  x: [-20, 20, -20]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              >
                <Activity className="w-12 h-12 text-purple-400 opacity-60" />
              </motion.div>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              {[
                { icon: '📊', text: 'Real-time Analytics' },
                { icon: '🤖', text: 'AI Insights' },
                { icon: '🔒', text: 'Bank-level Security' },
                { icon: '📱', text: 'Mobile Trading' }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20"
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)'
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                >
                  <span className="text-lg">{feature.icon}</span>
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Glassmorphism Auth Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative"
          >
            {/* Floating Auth Card */}
            <div className="relative">
              {/* Glowing Border */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/50 via-cyan-500/50 to-purple-500/50 rounded-3xl blur-lg animate-pulse" />
              
              {/* Main Auth Card */}
              <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 w-full max-w-md mx-auto shadow-2xl">
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 rounded-3xl" />
                
                {/* Brand Header */}
                <div className="text-center mb-6 relative z-10">
                  <div className="inline-flex items-center gap-3 mb-3">
                    <TrendingUp className="w-7 h-7 text-emerald-400" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      Stock Advisor Pro
                    </h2>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Start your trading journey today
                  </p>
                </div>

                {/* Auth Toggle with enhanced styling */}
                <motion.div 
                  className="flex bg-black/20 rounded-2xl overflow-hidden border border-white/10 p-1 mb-8 relative z-10"
                  layout
                >
                  <motion.div
                    className="absolute inset-y-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl shadow-lg"
                    initial={false}
                    animate={{
                      x: isLogin ? '0%' : '100%',
                      width: '50%'
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setRegistrationStep(1);
                      setErrors({email: '', password: '', confirmPassword: '', name: '', phone: '', general: ''});
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 relative z-10 ${
                      isLogin ? 'text-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setRegistrationStep(1);
                      setErrors({email: '', password: '', confirmPassword: '', name: '', phone: '', general: ''});
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 relative z-10 ${
                      !isLogin ? 'text-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Register
                  </button>
                </motion.div>

                {/* Auth Form */}
                <div className="relative z-10 max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
                  <form 
                    onSubmit={handleAuthSubmit} 
                    className="space-y-6 px-1"
                  >
                    {/* Login Fields - Only show during login */}
                    {isLogin && (
                      <>
                        {/* Email */}
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                            <Mail className="h-5 w-5" />
                          </div>
                          
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            className={`w-full bg-black/30 border rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-black/40 transition-all duration-300 backdrop-blur-sm hover:border-white/30 ${
                              formData.email && !isEmailValid(formData.email) 
                                ? 'border-red-400/50' 
                                : formData.email && isEmailValid(formData.email)
                                ? 'border-green-400/50'
                                : 'border-white/20'
                            }`}
                            placeholder="you@example.com"
                          />
                          
                          {formData.email && !errors.email && isEmailValid(formData.email) && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                          )}
                          
                          {errors.email && (
                            <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" />
                              {errors.email}
                            </p>
                          )}
                        </div>

                        {/* Password */}
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                            <Lock className="h-5 w-5" />
                          </div>
                          
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            className={`w-full bg-black/30 border rounded-2xl py-4 pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-black/40 transition-all duration-300 backdrop-blur-sm hover:border-white/30 ${
                              formData.password && !isPasswordValid(formData.password, isLogin) 
                                ? 'border-red-400/50' 
                                : formData.password && isPasswordValid(formData.password, isLogin)
                                ? 'border-green-400/50'
                                : 'border-white/20'
                            }`}
                            placeholder="Enter your password"
                          />
                          
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors z-20"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                          
                          {errors.password && (
                            <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
  n                            <AlertCircle className="w-3 h-3" />
                              {errors.password}
                            </p>
                          )}
                        </div>

                        {/* Credential Hints for Login - Admin Only */}
                        <div className="bg-black/20 border border-emerald-500/20 rounded-xl p-4 mt-4">
                          <div className="text-center">
                            <h4 className="text-emerald-400 font-semibold text-sm mb-3">Admin Access</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between items-center bg-black/30 rounded-lg p-2">
                                <span className="text-slate-300">Email:</span>
                                <span className="text-white font-mono">admin@example.com</span>
                              </div>
                              <div className="flex justify-between items-center bg-black/30 rounded-lg p-2">
                                <span className="text-slate-300">Password:</span>
                                <span className="text-white font-mono">N3xT!Adm1n$Tst#2025</span>
                              </div>
                            </div>
                            <p className="text-slate-500 text-xs mt-3">
                              Use these credentials to access the admin dashboard
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Registration Fields - Step by Step */}
                    {!isLogin && (
                      <div className="space-y-6">
                        {/* Step Indicator */}
                        <div className="mb-8">
                          <div className="flex items-center justify-center space-x-2 mb-4">
                            <div className={`w-4 h-4 rounded-full transition-all duration-500 flex items-center justify-center text-xs font-bold ${registrationStep >= 1 ? 'bg-emerald-400 text-black' : 'bg-slate-600 text-white'}`}>
                              {registrationStep > 1 ? '✓' : '1'}
                            </div>
                            <div className={`w-12 h-0.5 transition-all duration-500 ${registrationStep >= 2 ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full transition-all duration-500 flex items-center justify-center text-xs font-bold ${registrationStep >= 2 ? 'bg-emerald-400 text-black' : 'bg-slate-600 text-white'}`}>
                              {registrationStep > 2 ? '✓' : '2'}
                            </div>
                            <div className={`w-12 h-0.5 transition-all duration-500 ${registrationStep >= 3 ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                            <div className={`w-4 h-4 rounded-full transition-all duration-500 flex items-center justify-center text-xs font-bold ${registrationStep >= 3 ? 'bg-emerald-400 text-black' : 'bg-slate-600 text-white'}`}>
                              3
                            </div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-slate-400 px-2">
                            <span className={registrationStep === 1 ? 'text-emerald-400 font-medium' : ''}>Email</span>
                            <span className={registrationStep === 2 ? 'text-emerald-400 font-medium' : ''}>Password</span>
                            <span className={registrationStep === 3 ? 'text-emerald-400 font-medium' : ''}>Profile</span>
                          </div>
                        </div>

                        {/* Step 1: Email */}
                        {registrationStep === 1 && (
                          <div className="space-y-4 transition-all duration-500 ease-in-out">
                            <div className="text-center mb-6">
                              <h3 className="text-xl font-semibold text-white mb-2">Let's get started</h3>
                              <p className="text-slate-400 text-sm">Enter your email address to create your account</p>
                            </div>
                            
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                                <Mail className="h-5 w-5" />
                              </div>
                              
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                className={`w-full bg-black/30 border rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-black/40 transition-all duration-300 backdrop-blur-sm ${
                                  formData.email && !isEmailValid(formData.email) 
                                    ? 'border-red-400/50' 
                                    : formData.email && isEmailValid(formData.email)
                                    ? 'border-green-400/50'
                                    : 'border-white/20'
                                }`}
                                placeholder="you@example.com"
                              />
                              
                              {errors.email && (
                                <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors.email}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (isEmailValid(formData.email)) {
                                  setRegistrationStep(2);
                                  setErrors({...errors, email: ''});
                                } else {
                                  setErrors({...errors, email: 'Please enter a valid email address'});
                                }
                              }}
                              disabled={!formData.email}
                              className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 text-black font-bold py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg transition-all duration-300"
                            >
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                Continue
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Step 2: Password */}
                        {registrationStep === 2 && (
                          <div className="space-y-4 transition-all duration-500 ease-in-out">
                            <div className="text-center mb-6">
                              <h3 className="text-xl font-semibold text-white mb-2">Create a password</h3>
                              <p className="text-slate-400 text-sm">Choose a strong password for your account</p>
                            </div>
                            
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                                <Lock className="h-5 w-5" />
                              </div>
                              
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className={`w-full bg-black/30 border rounded-2xl py-4 pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-black/40 transition-all duration-300 backdrop-blur-sm ${
                                  formData.password && !isPasswordValid(formData.password, false) 
                                    ? 'border-red-400/50' 
                                    : formData.password && isPasswordValid(formData.password, false)
                                    ? 'border-green-400/50'
                                    : 'border-white/20'
                                }`}
                                placeholder="Enter your password"
                              />
                              
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors z-20"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                              
                              {formData.password && (
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center gap-2 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${formData.password.length >= 8 ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                                    <span className={formData.password.length >= 8 ? 'text-green-400' : 'text-slate-400'}>8+ characters</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${/(?=.*[0-9])/.test(formData.password) ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                                    <span className={/(?=.*[0-9])/.test(formData.password) ? 'text-green-400' : 'text-slate-400'}>Number</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${/(?=.*[!@#$%^&*])/.test(formData.password) ? 'bg-green-400' : 'bg-slate-500'}`}></div>
                                    <span className={/(?=.*[!@#$%^&*])/.test(formData.password) ? 'text-green-400' : 'text-slate-400'}>Special character</span>
                                  </div>
                                </div>
                              )}
                              
                              {errors.password && (
                                <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors.password}
                                </p>
                              )}
                            </div>

                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                                <Lock className="h-5 w-5" />
                              </div>
                              
                              <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-black/30 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-black/40 transition-all duration-300 backdrop-blur-sm"
                                placeholder="Confirm your password"
                              />
                              
                              {errors.confirmPassword && (
                                <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors.confirmPassword}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setRegistrationStep(1)}
                                className="flex-1 group relative overflow-hidden rounded-2xl bg-slate-700/50 text-white font-medium py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/60 transition-all duration-300"
                              >
                                <ArrowLeft className="w-4 h-4 inline mr-2" />
                                Back
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPasswordValid(formData.password, false) && formData.password === formData.confirmPassword) {
                                    setRegistrationStep(3);
                                    setErrors({...errors, password: '', confirmPassword: ''});
                                  } else {
                                    if (!isPasswordValid(formData.password, false)) {
                                      setErrors({...errors, password: 'Password must be at least 8 characters with number and special character'});
                                    }
                                    if (formData.password !== formData.confirmPassword) {
                                      setErrors({...errors, confirmPassword: 'Passwords do not match'});
                                    }
                                  }
                                }}
                                disabled={!formData.password || !formData.confirmPassword}
                                className="flex-2 group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 text-black font-bold py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg transition-all duration-300"
                              >
                                Continue
                                <ArrowRight className="w-4 h-4 inline ml-2" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Additional Info */}
                        {registrationStep === 3 && (
                          <div className="space-y-4 transition-all duration-500 ease-in-out">
                            <div className="text-center mb-6">
                              <h3 className="text-xl font-semibold text-white mb-2">Almost done!</h3>
                              <p className="text-slate-400 text-sm">Tell us a bit more about yourself</p>
                            </div>
                            
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                                <User className="h-5 w-5" />
                              </div>
                              
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-black/30 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-black/40 transition-all duration-300 backdrop-blur-sm"
                                placeholder="Your full name"
                              />
                              
                              {errors.name && (
                                <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors.name}
                                </p>
                              )}
                            </div>

                            <div className="relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                                <Phone className="h-5 w-5" />
                              </div>
                              
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                onFocus={() => setFocusedField('phone')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full bg-black/30 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:bg-black/40 transition-all duration-300 backdrop-blur-sm"
                                placeholder="Phone number (optional)"
                              />
                              
                              {errors.phone && (
                                <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                                  <AlertCircle className="w-3 h-3" />
                                  {errors.phone}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setRegistrationStep(2)}
                                className="flex-1 group relative overflow-hidden rounded-2xl bg-slate-700/50 text-white font-medium py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/60 transition-all duration-300"
                              >
                                <ArrowLeft className="w-4 h-4 inline mr-2" />
                                Back
                              </button>
                              <button
                                type="submit"
                                disabled={isLoading || !formData.name}
                                className="flex-2 group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 text-black font-bold py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg transition-all duration-300"
                              >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                  {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      Create Account
                                      <ArrowRight className="w-4 h-4" />
                                    </>
                                  )}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* General Error */}
                    {errors.general && (
                      <div className="flex items-center gap-3 text-sm rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 backdrop-blur-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {errors.general}
                      </div>
                    )}

                    {/* Submit Button - Only for Login */}
                    {isLogin && (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 text-black font-bold py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg transition-all duration-300"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          ) : (
                            <>
                              Sign In
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </span>
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Ticker Strip */}
      <div className="absolute bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-sm border-t border-emerald-500/20 py-2 z-10">
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: [-2000, 0] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {[...stockTickers, ...stockTickers, ...stockTickers].map((stock, index) => (
            <div key={index} className="flex items-center gap-2 text-sm font-mono">
              <span className="text-white font-bold">{stock.symbol}</span>
              <span className="text-emerald-400">${stock.price.toFixed(2)}</span>
              <span className={`${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          ))}
        </motion.div>
      </div>
        </div>
      )}
      
      {/* Admin Debug Panel */}
      <AdminDebugPanel />
    </>
  );
};

export default LandingPageIntegrated;

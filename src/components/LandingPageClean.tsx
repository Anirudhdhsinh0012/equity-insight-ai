'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Lock, User, Mail, Eye, EyeOff, ArrowRight, 
  Phone, AlertCircle, BarChart3, LineChart, Activity
} from 'lucide-react';
import { User as UserType } from '@/types';
import AuthService from '@/services/authService';

interface LandingPageCleanProps {
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

interface StockParticle {
  x: number;
  y: number;
  symbol: string;
  opacity: number;
  speed: number;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  pulse: number;
}

const LandingPageClean: React.FC<LandingPageCleanProps> = ({ onLogin }) => {
  // Auth State
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
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
  const particlesRef = useRef<Particle[]>([]);
  const stockParticlesRef = useRef<StockParticle[]>([]);
  
  // Stock ticker data
  const [stockTickers] = useState<StockTicker[]>([
    { symbol: 'AAPL', price: 193.58, change: 2.45, changePercent: 1.28 },
    { symbol: 'TSLA', price: 248.71, change: -5.23, changePercent: -2.06 },
    { symbol: 'GOOGL', price: 138.92, change: 1.87, changePercent: 1.36 },
    { symbol: 'MSFT', price: 424.77, change: 3.21, changePercent: 0.76 },
    { symbol: 'AMZN', price: 178.39, change: -1.45, changePercent: -0.81 },
    { symbol: 'NVDA', price: 131.26, change: 4.82, changePercent: 3.81 },
    { symbol: 'META', price: 563.27, change: 7.91, changePercent: 1.42 },
    { symbol: 'NFLX', price: 491.23, change: -2.34, changePercent: -0.47 },
    { symbol: 'AMD', price: 162.63, change: -5.95, changePercent: -3.53 },
    { symbol: 'CRM', price: 267.89, change: 8.12, changePercent: 3.13 }
  ]);

  // Comprehensive stock market animation system
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
      
      for (let i = 0; i < 60; i++) {
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
          x: (canvas.width / 60) * i + 50,
          y: canvas.height / 2
        });
        
        basePrice = close;
      }
      
      return candlesticks;
    };

    // Initialize stock particles
    const initStockParticles = (): StockParticle[] => {
      const symbols = ['$AAPL', '$TSLA', '$GOOGL', '$MSFT', '$NVDA', '$META', '$AMZN', '$NFLX'];
      const particles: StockParticle[] = [];
      
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          opacity: Math.random() * 0.5 + 0.2,
          speed: Math.random() * 0.5 + 0.2,
          size: Math.random() * 16 + 12
        });
      }
      
      return particles;
    };

    let candlesticks = generateCandlesticks();
    let stockParticles = initStockParticles();
    let animationTime = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid background
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let x = 0; x < canvas.width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw animated candlesticks
      candlesticks.forEach((candle, index) => {
        const isGreen = candle.close > candle.open;
        const bodyHeight = Math.abs(candle.close - candle.open) * 4;
        const bodyTop = candle.y - (isGreen ? candle.close - candle.open : candle.open - candle.close) * 2;
        
        // Animate with wave effect
        const wave = Math.sin(animationTime * 0.01 + index * 0.1) * 8;
        const adjustedY = candle.y + wave;
        
        // Draw wick (high-low line)
        ctx.strokeStyle = isGreen ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(candle.x, adjustedY - (candle.high - Math.max(candle.open, candle.close)) * 4);
        ctx.lineTo(candle.x, adjustedY + (Math.min(candle.open, candle.close) - candle.low) * 4);
        ctx.stroke();
        
        // Draw body with glow
        ctx.fillStyle = isGreen ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)';
        ctx.shadowColor = isGreen ? '#22c55e' : '#ef4444';
        ctx.shadowBlur = 15;
        ctx.fillRect(candle.x - 6, bodyTop + wave, 12, bodyHeight);
        ctx.shadowBlur = 0;
      });
      
      // Draw floating stock symbols
      stockParticles.forEach((particle) => {
        // Update position
        particle.y -= particle.speed;
        particle.opacity = 0.3 + Math.sin(animationTime * 0.02) * 0.2;
        
        // Reset if off screen
        if (particle.y < -50) {
          particle.y = canvas.height + 50;
          particle.x = Math.random() * canvas.width;
        }
        
        // Draw stock symbol
        ctx.fillStyle = `rgba(34, 197, 94, ${particle.opacity})`;
        ctx.font = `bold ${particle.size}px monospace`;
        ctx.fillText(particle.symbol, particle.x, particle.y);
      });

      // Draw floating numbers (price-like data)
      for (let i = 0; i < 30; i++) {
        const x = (canvas.width / 30) * i + Math.sin(animationTime * 0.005 + i) * 50;
        const y = 150 + Math.sin(animationTime * 0.003 + i * 0.5) * 30;
        const opacity = 0.1 + Math.sin(animationTime * 0.01 + i) * 0.1;
        
        ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`;
        ctx.font = '14px monospace';
        ctx.fillText((Math.random() * 1000 + 100).toFixed(2), x, y);
      }

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

  // Form validation
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least 1 number';
    } else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least 1 special character';
    }

    // Registration-specific validation
    if (!isLogin) {
      // Name validation
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }

      // Phone validation (basic)
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?\d{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number';
      }

      // Confirm password validation
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
        const result = await AuthService.login(formData.email, formData.password);
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          throw new Error(result.error || 'Login failed');
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
return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* 🔹 Ticker Strip - Top */}
      <div className="absolute top-0 left-0 w-full bg-slate-900/80 backdrop-blur-sm border-b border-emerald-500/20 py-2 z-30">
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: [0, -2000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...stockTickers, ...stockTickers, ...stockTickers].map((stock, index) => (
            <div key={index} className="flex items-center gap-2 text-sm font-mono">
              <span className="text-white font-bold">{stock.symbol}</span>
              <span className="text-emerald-400">${stock.price.toFixed(2)}</span>
              <span
                className={`${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {stock.change >= 0 ? "+" : ""}
                {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 🔹 Animated Stock Background */}
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      {/* 🔹 Main Content Layout */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* ✅ Left Hero Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 bg-clip-text text-transparent">
              Master the Market with AI Precision
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
              Get real-time stock insights, AI-powered predictions, and analytics that
              give you the edge in trading. Your financial growth, simplified.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <button className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all">
                Get Started
              </button>
              <button className="px-6 py-3 rounded-xl border border-gray-700 bg-black/40 text-gray-300 hover:border-emerald-400 hover:text-white transition-all">
                Learn More
              </button>
            </div>
          </motion.div>

          {/* ✅ Right Side Auth Card (Login/Register) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative"
          >
            <motion.div
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 rounded-3xl blur-sm opacity-30 animate-pulse" />

              {/* Glassmorphism Auth Card */}
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md">
                {/* Brand */}
                <div className="flex justify-center mb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-xl">
                    SM
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Welcome Back
                </h2>

                {/* Form */}
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/20 focus:border-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/20 focus:border-emerald-400 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-semibold hover:opacity-90 transition-all"
                  >
                    Sign In
                  </button>
                </form>

                <p className="text-sm text-center text-gray-400 mt-4">
                  Don’t have an account?{" "}
                  <a href="#" className="text-emerald-400 hover:underline">
                    Sign Up
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* 🔹 Bottom Ticker Strip */}
      <div className="absolute bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-sm border-t border-emerald-500/20 py-2 z-30">
        <motion.div
          className="flex gap-8 whitespace-nowrap"
          animate={{ x: [-2000, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...stockTickers, ...stockTickers, ...stockTickers].map((stock, index) => (
            <div key={index} className="flex items-center gap-2 text-sm font-mono">
              <span className="text-white font-bold">{stock.symbol}</span>
              <span className="text-emerald-400">${stock.price.toFixed(2)}</span>
              <span
                className={`${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {stock.change >= 0 ? "+" : ""}
                {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};



export default LandingPageClean;

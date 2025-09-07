'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface WebGLParticleSystemProps {
  theme: 'light' | 'dark';
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  type: 'price' | 'volume' | 'trend';
}

const WebGLParticleSystem: React.FC<WebGLParticleSystemProps> = ({ 
  theme = 'light', 
  marketTrend = 'neutral',
  className = ''
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  // Generate particles based on market trend
  const generateParticles = useMemo(() => {
    // Reduce particle count for light theme to make it cleaner
    const count = theme === 'light' ? 15 : 40;
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.5,
        vy: marketTrend === 'bullish' ? -Math.random() * 0.3 : 
            marketTrend === 'bearish' ? Math.random() * 0.3 : 
            (Math.random() - 0.5) * 0.2,
        size: Math.random() * 3 + 1,
        // Much lower opacity for light theme
        opacity: theme === 'light' ? Math.random() * 0.1 + 0.05 : Math.random() * 0.6 + 0.2,
        type: ['price', 'volume', 'trend'][Math.floor(Math.random() * 3)] as 'price' | 'volume' | 'trend'
      });
    }
    return newParticles;
  }, [marketTrend, theme]);

  useEffect(() => {
    setMounted(true);
    setParticles(generateParticles);
  }, [generateParticles]);

  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: (particle.x + particle.vx + 100) % 100,
          y: (particle.y + particle.vy + 100) % 100,
          opacity: Math.max(0.1, Math.min(0.8, particle.opacity + (Math.random() - 0.5) * 0.1))
        }))
      );
    }, 100);

    return () => clearInterval(interval);
  }, [mounted]);

  const getGradientBackground = () => {
    const baseGradients = {
      light: {
        // Much more subtle gradients for light theme
        bullish: 'from-transparent via-emerald-50/5 to-transparent',
        bearish: 'from-transparent via-red-50/5 to-transparent',
        neutral: 'from-transparent via-blue-50/5 to-transparent'
      },
      dark: {
        bullish: 'from-emerald-900/10 via-green-800/5 to-slate-900/20',
        bearish: 'from-red-900/10 via-rose-800/5 to-slate-900/20',
        neutral: 'from-slate-900/20 via-blue-900/5 to-slate-900/20'
      }
    };
    return baseGradients[theme][marketTrend];
  };

  const getParticleColor = (type: string) => {
    const colors = {
      light: {
        // Very subtle colors for light theme
        price: marketTrend === 'bullish' ? 'bg-emerald-200/30' : marketTrend === 'bearish' ? 'bg-red-200/30' : 'bg-blue-200/30',
        volume: 'bg-purple-200/30',
        trend: 'bg-amber-200/30'
      },
      dark: {
        price: marketTrend === 'bullish' ? 'bg-emerald-500' : marketTrend === 'bearish' ? 'bg-red-500' : 'bg-blue-500',
        volume: 'bg-purple-500',
        trend: 'bg-amber-500'
      }
    };
    return colors[theme][type as keyof typeof colors.light];
  };

  const getTickerLineColor = () => {
    switch (marketTrend) {
      case 'bullish': return 'via-emerald-500/40';
      case 'bearish': return 'via-red-500/40';
      default: return 'via-blue-500/40';
    }
  };

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Animated Gradient Background - much more subtle for light theme */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${getGradientBackground()}`}
        animate={theme === 'light' ? {} : {
          background: [
            `linear-gradient(45deg, ${getGradientBackground()})`,
            `linear-gradient(135deg, ${getGradientBackground()})`,
            `linear-gradient(225deg, ${getGradientBackground()})`,
            `linear-gradient(315deg, ${getGradientBackground()})`,
            `linear-gradient(45deg, ${getGradientBackground()})`
          ]
        }}
        transition={{
          duration: theme === 'light' ? 0 : 20,
          repeat: theme === 'light' ? 0 : Infinity,
          ease: 'linear'
        }}
      />

      {/* Grid Pattern - much more subtle for light theme */}
      <motion.div
        className={`absolute inset-0 ${theme === 'light' ? 'opacity-[0.005]' : 'opacity-[0.03] dark:opacity-[0.05]'}`}
        style={{
          backgroundImage: `
            linear-gradient(${theme === 'dark' ? '#ffffff' : '#000000'} 1px, transparent 1px),
            linear-gradient(90deg, ${theme === 'dark' ? '#ffffff' : '#000000'} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
        animate={theme === 'light' ? {} : {
          backgroundPosition: ['0px 0px', '60px 60px']
        }}
        transition={{
          duration: theme === 'light' ? 0 : 30,
          repeat: theme === 'light' ? 0 : Infinity,
          ease: 'linear'
        }}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${getParticleColor(particle.type)}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Moving Ticker Lines - disabled for light theme */}
      {theme === 'dark' && (
        <>
          <motion.div
            className={`absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${getTickerLineColor()} to-transparent`}
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'linear'
            }}
          />

          <motion.div
            className={`absolute top-2/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${getTickerLineColor()} to-transparent`}
            animate={{
              x: ['200%', '-100%']
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </>
      )}

      {/* Market Trend Waves - disabled for light theme */}
      {theme === 'dark' && (
        <motion.div
          className="absolute bottom-0 left-0 w-full h-24 opacity-10"
          animate={{
            background: [
              `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,40 Q300,${marketTrend === 'bullish' ? '10' : marketTrend === 'bearish' ? '70' : '40'} 600,40 T1200,40 V120 H0 Z' fill='%23${marketTrend === 'bullish' ? '10b981' : marketTrend === 'bearish' ? 'ef4444' : '3b82f6'}'/%3E%3C/svg%3E")`,
              `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,${marketTrend === 'bullish' ? '20' : marketTrend === 'bearish' ? '60' : '40'} Q300,${marketTrend === 'bullish' ? '5' : marketTrend === 'bearish' ? '75' : '30'} 600,${marketTrend === 'bullish' ? '15' : marketTrend === 'bearish' ? '65' : '45'} T1200,${marketTrend === 'bullish' ? '10' : marketTrend === 'bearish' ? '70' : '40'} V120 H0 Z' fill='%23${marketTrend === 'bullish' ? '10b981' : marketTrend === 'bearish' ? 'ef4444' : '3b82f6'}'/%3E%3C/svg%3E")`
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}

      {/* Radial Gradient Overlays - much more subtle for light theme */}
      <motion.div
        className={`absolute inset-0 ${theme === 'light' ? 'opacity-[0.02]' : 'opacity-20'}`}
        style={{
          background: `radial-gradient(circle at 20% 30%, ${
            marketTrend === 'bullish' ? '#10b981' : 
            marketTrend === 'bearish' ? '#ef4444' : '#3b82f6'
          }40 0%, transparent 50%)`
        }}
        animate={theme === 'light' ? {} : {
          background: [
            `radial-gradient(circle at 20% 30%, ${marketTrend === 'bullish' ? '#10b981' : marketTrend === 'bearish' ? '#ef4444' : '#3b82f6'}40 0%, transparent 50%)`,
            `radial-gradient(circle at 80% 70%, ${marketTrend === 'bullish' ? '#10b981' : marketTrend === 'bearish' ? '#ef4444' : '#3b82f6'}40 0%, transparent 50%)`,
            `radial-gradient(circle at 50% 20%, ${marketTrend === 'bullish' ? '#10b981' : marketTrend === 'bearish' ? '#ef4444' : '#3b82f6'}40 0%, transparent 50%)`,
            `radial-gradient(circle at 20% 30%, ${marketTrend === 'bullish' ? '#10b981' : marketTrend === 'bearish' ? '#ef4444' : '#3b82f6'}40 0%, transparent 50%)`
          ]
        }}
        transition={{
          duration: theme === 'light' ? 0 : 25,
          repeat: theme === 'light' ? 0 : Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Noise Texture Overlay - much more subtle for light theme */}
      <div 
        className={`absolute inset-0 ${theme === 'light' ? 'opacity-[0.002]' : 'opacity-[0.015]'} mix-blend-overlay`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default WebGLParticleSystem;

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeColors {
  primary: {
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    accent: string;
    accentHover: string;
    card: string;
    cardHover: string;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
    inverse: string;
  };
  status: {
    success: string;
    warning: string;
    danger: string;
    info: string;
    successBg: string;
    warningBg: string;
    dangerBg: string;
    infoBg: string;
  };
  chart: {
    positive: string;
    negative: string;
    neutral: string;
    grid: string;
  };
  animation: {
    transition: string;
    duration: string;
    ease: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
  isTransitioning: boolean;
}

// Enhanced color combinations with better contrast and consistency
const lightThemeColors: ThemeColors = {
  primary: {
    background: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
    surface: 'bg-white/95',
    surfaceHover: 'bg-white',
    border: 'border-slate-200/80',
    accent: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    accentHover: 'bg-gradient-to-r from-blue-700 to-indigo-700',
    card: 'bg-white/90',
    cardHover: 'bg-white',
  },
  text: {
    primary: 'text-slate-900',
    secondary: 'text-slate-600',
    accent: 'text-blue-600',
    muted: 'text-slate-400',
    inverse: 'text-white',
  },
  status: {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
    successBg: 'bg-emerald-50',
    warningBg: 'bg-amber-50',
    dangerBg: 'bg-red-50',
    infoBg: 'bg-blue-50',
  },
  chart: {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6366f1',
    grid: '#e2e8f0',
  },
  animation: {
    transition: 'transition-all',
    duration: 'duration-500',
    ease: 'ease-in-out',
  },
};

const darkThemeColors: ThemeColors = {
  primary: {
    background: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    surface: 'bg-gray-800/95',
    surfaceHover: 'bg-gray-700/95',
    border: 'border-gray-600/40',
    accent: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    accentHover: 'bg-gradient-to-r from-blue-700 to-indigo-700',
    card: 'bg-gray-800/90',
    cardHover: 'bg-gray-700/90',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    accent: 'text-blue-400',
    muted: 'text-gray-500',
    inverse: 'text-gray-900',
  },
  status: {
    success: 'text-emerald-300',
    warning: 'text-amber-300',
    danger: 'text-red-300',
    info: 'text-blue-300',
    successBg: 'bg-emerald-800/30',
    warningBg: 'bg-amber-800/30',
    dangerBg: 'bg-red-800/30',
    infoBg: 'bg-blue-800/30',
  },
  chart: {
    positive: '#22c55e',
    negative: '#ef4444',
    neutral: '#3b82f6',
    grid: '#4b5563',
  },
  animation: {
    transition: 'transition-all',
    duration: 'duration-500',
    ease: 'ease-in-out',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Get saved theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('stockAdvisorTheme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('stockAdvisorTheme', theme);
      // Apply theme class to document with animation (respecting reduced motion)
      const duration = prefersReducedMotion ? 'duration-0' : 'duration-500';
      document.documentElement.className = `${theme} transition-colors ${duration} ease-in-out`;
      
      // Add transition class to body (respecting reduced motion)
      const bodyDuration = prefersReducedMotion ? 'duration-0' : 'duration-500';
      document.body.className = `min-h-screen antialiased transition-all ${bodyDuration} ease-in-out ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-900' 
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white'
      }`;
    }
  }, [theme, mounted, prefersReducedMotion]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    
    // Reset transition state after animation completes (respect reduced motion)
    const duration = prefersReducedMotion ? 0 : 500;
    setTimeout(() => {
      setIsTransitioning(false);
    }, duration);
  };

  // Create animation settings based on reduced motion preference
  const animationSettings = {
    transition: 'transition-all',
    duration: prefersReducedMotion ? 'duration-0' : 'duration-500',
    ease: 'ease-in-out',
  };

  // Update color objects to use dynamic animation settings
  const colors = theme === 'light' ? {
    ...lightThemeColors,
    animation: animationSettings
  } : {
    ...darkThemeColors,
    animation: animationSettings
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, isTransitioning }}>
      <div className={`${colors.animation.transition} ${colors.animation.duration} ${colors.animation.ease}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

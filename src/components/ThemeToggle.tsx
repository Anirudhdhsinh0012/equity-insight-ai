'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Brush, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ 
  className = '', 
  showLabel = false,
  size = 'md' 
}: ThemeToggleProps) {
  const { theme, toggleTheme, colors, isTransitioning } = useTheme();
  
  const sizeClasses = {
    sm: 'p-1.5 w-4 h-4',
    md: 'p-2 w-5 h-5',
    lg: 'p-3 w-6 h-6'
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-sm font-medium ${colors.text.secondary} transition-colors duration-300`}
        >
          {theme === 'dark' ? 'Dark' : 'Light'}
        </motion.span>
      )}
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        disabled={isTransitioning}
        className={`
          relative ${sizeClasses[size]} rounded-xl backdrop-blur-xl 
          ${colors.animation.transition} ${colors.animation.duration} ${colors.animation.ease}
          ${colors.primary.surface} ${colors.primary.border} border 
          hover:${colors.primary.surfaceHover} 
          shadow-lg hover:shadow-xl
          group overflow-hidden
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {/* Background glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 ${colors.animation.transition} ${colors.animation.duration}`}
          style={{
            background: theme === 'dark' 
              ? 'radial-gradient(circle, #fbbf24, #f59e0b)' 
              : 'radial-gradient(circle, #8b5cf6, #7c3aed)'
          }}
        />

        {/* Icon container */}
        <div className={`relative ${iconSize[size]}`}>
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div
                key="palette"
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 180, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Palette className={`${iconSize[size]} text-amber-500 drop-shadow-sm`} />
                {/* Color splash animation */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  <Sparkles className={`${iconSize[size]} text-amber-300 opacity-30`} />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="brush"
                initial={{ scale: 0, rotate: 180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: -180, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Brush className={`${iconSize[size]} text-blue-400 drop-shadow-sm`} />
                {/* Paint drip effect */}
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="absolute w-1 h-1 bg-blue-300 rounded-full top-1 right-1" />
                  <div className="absolute w-0.5 h-0.5 bg-purple-300 rounded-full bottom-1 left-1" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Ripple effect on theme change */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`absolute inset-0 rounded-xl ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-purple-400 to-blue-400' 
                  : 'bg-gradient-to-r from-amber-400 to-orange-400'
              }`}
              style={{ zIndex: -1 }}
            />
          )}
        </AnimatePresence>

        {/* Border glow effect */}
        <motion.div
          className={`absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100 ${colors.animation.transition} ${colors.animation.duration}`}
          style={{
            borderColor: theme === 'dark' ? '#fbbf24' : '#8b5cf6',
            filter: 'blur(1px)'
          }}
        />
      </motion.button>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface StockMarketBackgroundProps {
  theme?: 'light' | 'dark';
  marketTrend?: 'bullish' | 'bearish' | 'neutral';
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
  opacity: number;
  color: string;
}

interface TickerLine {
  y: number;
  segments: Array<{ x: number; value: number; trend: 'up' | 'down' }>;
  speed: number;
}

const StockMarketBackground: React.FC<StockMarketBackgroundProps> = ({
  theme = 'dark',
  marketTrend = 'neutral',
  intensity = 'medium',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [tickerLines, setTickerLines] = useState<TickerLine[]>([]);

  // Color schemes based on theme and market trend
  const getColors = () => {
    const baseColors = {
      light: {
        background: 'rgba(248, 250, 252, 0.95)',
        grid: 'rgba(148, 163, 184, 0.1)',
        particles: ['rgba(59, 130, 246, 0.6)', 'rgba(147, 197, 253, 0.4)'],
        bullish: ['rgba(34, 197, 94, 0.7)', 'rgba(134, 239, 172, 0.5)'],
        bearish: ['rgba(239, 68, 68, 0.7)', 'rgba(252, 165, 165, 0.5)']
      },
      dark: {
        background: 'rgba(15, 23, 42, 0.95)',
        grid: 'rgba(71, 85, 105, 0.15)',
        particles: ['rgba(59, 130, 246, 0.8)', 'rgba(147, 197, 253, 0.6)'],
        bullish: ['rgba(34, 197, 94, 0.8)', 'rgba(134, 239, 172, 0.6)'],
        bearish: ['rgba(239, 68, 68, 0.8)', 'rgba(252, 165, 165, 0.6)']
      }
    };

    const colors = baseColors[theme];
    
    if (marketTrend === 'bullish') {
      return { ...colors, accent: colors.bullish };
    } else if (marketTrend === 'bearish') {
      return { ...colors, accent: colors.bearish };
    }
    
    return { ...colors, accent: colors.particles };
  };

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const particleCount = intensity === 'low' ? 30 : intensity === 'medium' ? 50 : 80;
    
    const newParticles: Particle[] = [];
    const colors = getColors();

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1,
        direction: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors.accent[Math.floor(Math.random() * colors.accent.length)]
      });
    }

    // Initialize ticker lines
    const newTickerLines: TickerLine[] = [];
    for (let i = 0; i < 3; i++) {
      const segments = [];
      for (let j = 0; j < 20; j++) {
        segments.push({
          x: j * 60,
          value: Math.random() * 100,
          trend: (Math.random() > 0.5 ? 'up' : 'down') as 'up' | 'down'
        });
      }
      
      newTickerLines.push({
        y: (rect.height / 4) * (i + 1),
        segments,
        speed: Math.random() * 0.3 + 0.1
      });
    }

    setParticles(newParticles);
    setTickerLines(newTickerLines);
  }, [theme, marketTrend, intensity]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getColors();

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      if (theme === 'dark') {
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
        gradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.9)');
        gradient.addColorStop(1, 'rgba(51, 65, 85, 0.95)');
      } else {
        gradient.addColorStop(0, 'rgba(248, 250, 252, 0.95)');
        gradient.addColorStop(0.5, 'rgba(241, 245, 249, 0.9)');
        gradient.addColorStop(1, 'rgba(226, 232, 240, 0.95)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw grid pattern
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 15]);
      
      // Vertical lines
      for (let x = 0; x < rect.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y < rect.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      // Draw and update ticker lines
      tickerLines.forEach((line, lineIndex) => {
        ctx.strokeStyle = colors.accent[0];
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        line.segments.forEach((segment, segmentIndex) => {
          const nextSegment = line.segments[segmentIndex + 1];
          if (nextSegment) {
            const currentY = line.y + (segment.value - 50) * 0.5;
            const nextY = line.y + (nextSegment.value - 50) * 0.5;
            
            if (segmentIndex === 0) {
              ctx.moveTo(segment.x, currentY);
            }
            ctx.lineTo(nextSegment.x, nextY);
          }
          
          // Update segment position
          segment.x -= line.speed;
          if (segment.x < -60) {
            segment.x = rect.width + 60;
            segment.value = Math.random() * 100;
            segment.trend = (Math.random() > 0.5 ? 'up' : 'down') as 'up' | 'down';
          }
        });
        
        ctx.stroke();
      });

      // Draw and update particles
      particles.forEach((particle, index) => {
        // Update particle position
        particle.x += Math.cos(particle.direction) * particle.speed;
        particle.y += Math.sin(particle.direction) * particle.speed;
        
        // Wrap around screen
        if (particle.x > rect.width) particle.x = 0;
        if (particle.x < 0) particle.x = rect.width;
        if (particle.y > rect.height) particle.y = 0;
        if (particle.y < 0) particle.y = rect.height;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles, tickerLines, theme, marketTrend]);

  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ filter: 'blur(0.5px)' }}
      />
      
      {/* Additional overlay effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 dark:to-white/5" />
      
      {/* Floating elements for extra visual appeal */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-20 h-20 rounded-full ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' 
                : 'bg-gradient-to-br from-blue-300/20 to-purple-300/20'
            } backdrop-blur-3xl`}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default StockMarketBackground;

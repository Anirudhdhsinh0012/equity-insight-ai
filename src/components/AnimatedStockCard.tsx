'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  AlertTriangle,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface StockCardData {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
  peRatio?: number;
  isWatched?: boolean;
  lastUpdate?: Date;
}

interface AnimatedStockCardProps {
  stock: StockCardData;
  onClick?: (stock: StockCardData) => void;
  onWatchToggle?: (ticker: string) => void;
  showChart?: boolean;
  compact?: boolean;
}

const AnimatedStockCard: React.FC<AnimatedStockCardProps> = ({
  stock,
  onClick,
  onWatchToggle,
  showChart = false,
  compact = false
}) => {
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [priceAnimation, setPriceAnimation] = useState(0);

  const isPositive = stock.change >= 0;
  const priceColor = isPositive ? 'text-emerald-500' : 'text-red-500';
  const bgColor = isPositive 
    ? 'from-emerald-500/10 to-emerald-600/5' 
    : 'from-red-500/10 to-red-600/5';
  const borderColor = isPositive 
    ? 'border-emerald-500/20' 
    : 'border-red-500/20';

  // Simulate price updates for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory(prev => {
        const newHistory = [...prev, stock.currentPrice].slice(-20);
        return newHistory;
      });
      
      // Trigger price animation
      setPriceAnimation(prev => prev + 1);
    }, 3000 + Math.random() * 2000); // Random intervals

    return () => clearInterval(interval);
  }, [stock.currentPrice]);

  const formatCurrency = (value: number, compact = false) => {
    if (compact && value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (compact && value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    hover: {
      y: -5,
      scale: 1.02,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 20
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  const priceVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick?.(stock)}
      className={`relative cursor-pointer group ${
        compact ? 'p-4' : 'p-6'
      }`}
    >
      {/* Glassmorphism card background */}
      <div className={`relative bg-gradient-to-br ${bgColor} backdrop-blur-xl rounded-2xl border ${borderColor} shadow-xl overflow-hidden h-full`}>
        
        {/* Animated background gradient */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-50`}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear'
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {stock.ticker}
                </h3>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWatchToggle?.(stock.ticker);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-1 rounded-full transition-colors ${
                    stock.isWatched 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-slate-400 hover:text-yellow-500'
                  }`}
                >
                  <Star className={`w-4 h-4 ${stock.isWatched ? 'fill-current' : ''}`} />
                </motion.button>
              </div>
              {!compact && (
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {stock.name}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>

          {/* Price Section */}
          <div className="mb-4">
            <motion.div
              key={priceAnimation}
              variants={priceVariants}
              initial="initial"
              animate="animate"
              className="flex items-baseline gap-2"
            >
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(stock.currentPrice)}
              </span>
              <div className={`flex items-center gap-1 ${priceColor}`}>
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {formatCurrency(Math.abs(stock.change))}
                </span>
                <span className="text-sm">
                  ({Math.abs(stock.changePercent).toFixed(2)}%)
                </span>
              </div>
            </motion.div>
          </div>

          {/* Mini Chart */}
          {showChart && priceHistory.length > 1 && (
            <div className="mb-4 h-16">
              <svg viewBox="0 0 200 60" className="w-full h-full">
                <motion.polyline
                  points={priceHistory.map((price, index) => {
                    const x = (index / (priceHistory.length - 1)) * 200;
                    const minPrice = Math.min(...priceHistory);
                    const maxPrice = Math.max(...priceHistory);
                    const y = 50 - ((price - minPrice) / (maxPrice - minPrice)) * 40;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                />
              </svg>
            </div>
          )}

          {/* Stats Grid */}
          {!compact && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <Activity className="w-3 h-3" />
                  <span>Volume</span>
                </div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {formatVolume(stock.volume)}
                </div>
              </div>
              
              {stock.marketCap && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <DollarSign className="w-3 h-3" />
                    <span>Market Cap</span>
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {formatCurrency(stock.marketCap, true)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hover Actions */}
          <AnimatePresence>
            {isHovered && !compact && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 right-4 flex gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-blue-500 text-white rounded-lg shadow-lg backdrop-blur-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg backdrop-blur-sm"
                >
                  <TrendingUp className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live indicator */}
          <motion.div
            className="absolute top-4 right-4"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span>LIVE</span>
            </div>
          </motion.div>

          {/* Last update */}
          {stock.lastUpdate && (
            <div className="absolute bottom-2 left-4 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{stock.lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Glow effect on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 bg-gradient-to-br ${bgColor} blur-xl -z-10`}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Grid container for stock cards
interface StockCardGridProps {
  stocks: StockCardData[];
  onStockClick?: (stock: StockCardData) => void;
  onWatchToggle?: (ticker: string) => void;
  showCharts?: boolean;
  compact?: boolean;
  className?: string;
}

export const StockCardGrid: React.FC<StockCardGridProps> = ({
  stocks,
  onStockClick,
  onWatchToggle,
  showCharts = false,
  compact = false,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`grid gap-6 ${
        compact 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      } ${className}`}
    >
      <AnimatePresence>
        {stocks.map((stock, index) => (
          <motion.div
            key={stock.ticker}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: index * 0.1 }
            }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AnimatedStockCard
              stock={stock}
              onClick={onStockClick}
              onWatchToggle={onWatchToggle}
              showChart={showCharts}
              compact={compact}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedStockCard;

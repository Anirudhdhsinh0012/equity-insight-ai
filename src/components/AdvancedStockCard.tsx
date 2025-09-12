'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Eye,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Volume2,
  Zap,
  Target,
  Plus,
  Minus,
  MoreHorizontal,
  AlertTriangle,
  Shield,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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
  sector?: string;
  dividend?: number;
  beta?: number;
}

interface AdvancedStockCardProps {
  stock: StockCardData;
  onStockClick?: (stock: StockCardData) => void;
  onWatchToggle?: (ticker: string) => void;
  onQuickTrade?: (ticker: string, action: 'buy' | 'sell') => void;
  showCharts?: boolean;
  compact?: boolean;
  index?: number;
}

interface StockCardGridProps {
  stocks: StockCardData[];
  onStockClick?: (stock: StockCardData) => void;
  onWatchToggle?: (ticker: string) => void;
  onQuickTrade?: (ticker: string, action: 'buy' | 'sell') => void;
  showCharts?: boolean;
  compact?: boolean;
  className?: string;
}

const MiniChart: React.FC<{ data: number[]; trend: 'up' | 'down' | 'neutral'; compact?: boolean }> = ({ 
  data, 
  trend, 
  compact = false 
}) => {
  const [animatedData, setAnimatedData] = useState(data);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  const pathData = animatedData.map((value, index) => {
    const x = (index / (animatedData.length - 1)) * 100;
    const y = 100 - ((value - Math.min(...animatedData)) / (Math.max(...animatedData) - Math.min(...animatedData))) * 100;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const strokeColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';
  const fillColor = trend === 'up' ? '#10b98120' : trend === 'down' ? '#ef444420' : '#6b728020';

  return (
    <div className={`${compact ? 'w-16 h-8' : 'w-20 h-10'} relative overflow-hidden`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`gradient-${trend}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={`${pathData} L 100 100 L 0 100 Z`}
          fill={`url(#gradient-${trend})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        <motion.path
          d={pathData}
          stroke={strokeColor}
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
};

const AdvancedStockCard: React.FC<AdvancedStockCardProps> = ({
  stock,
  onStockClick,
  onWatchToggle,
  onQuickTrade,
  showCharts = true,
  compact = false,
  index = 0
}) => {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [showActions, setShowActions] = useState(false);

  const isPositive = stock.changePercent >= 0;
  const trendDirection = stock.changePercent > 0 ? 'up' : stock.changePercent < 0 ? 'down' : 'neutral';

  // Generate mock chart data
  const chartData = React.useMemo(() => {
    const basePrice = stock.currentPrice - stock.change;
    return Array.from({ length: 20 }, (_, i) => {
      const progress = i / 19;
      const volatility = Math.sin(progress * Math.PI * 3) * 0.02;
      const trend = stock.changePercent / 100 * progress;
      return basePrice * (1 + trend + volatility);
    });
  }, [stock.currentPrice, stock.change, stock.changePercent]);

  useEffect(() => {
    if (stock.changePercent > 0) {
      setPriceAnimation('up');
    } else if (stock.changePercent < 0) {
      setPriceAnimation('down');
    } else {
      setPriceAnimation('neutral');
    }
  }, [stock.changePercent]);

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  const priceVariants = {
    up: {
      scale: [1, 1.05, 1],
      color: ['#10b981', '#34d399', '#10b981'],
      transition: { duration: 0.6 }
    },
    down: {
      scale: [1, 1.05, 1],
      color: ['#ef4444', '#f87171', '#ef4444'],
      transition: { duration: 0.6 }
    },
    neutral: {
      scale: 1,
      color: '#6b7280'
    }
  };

  return (
    <motion.div
      className={`
        group relative ${colors.primary.surface} backdrop-blur-xl ${colors.primary.border} border 
        rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300
        ${compact ? 'p-4' : 'p-6'}
      `}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onStockClick?.(stock)}
    >
      {/* Background Gradient */}
      <motion.div
        className={`absolute inset-0 opacity-10 ${
          isPositive 
            ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
            : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}
        animate={{
          opacity: isHovered ? 0.15 : 0.1
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <motion.h3 
              className="text-lg font-bold text-slate-900 dark:text-white"
              whileHover={{ scale: 1.05 }}
            >
              {stock.ticker}
            </motion.h3>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onWatchToggle?.(stock.ticker);
              }}
              className={`p-1 rounded-lg transition-colors ${
                stock.isWatched
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-slate-400 hover:text-yellow-500'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {stock.isWatched ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </motion.button>
          </div>
          <p className="text-sm text-slate-800 dark:text-white truncate font-medium">
            {stock.name}
          </p>
          {stock.sector && !compact && (
            <span className="inline-block px-2 py-1 mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              {stock.sector}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-1">
          <motion.button
            className="p-2 rounded-lg bg-gray-700/70 dark:bg-gray-600/70 hover:bg-blue-500/30 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Price Section */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2 mb-2">
          <motion.span
            className="text-2xl font-bold text-slate-900 dark:text-white"
            variants={priceVariants}
            animate={priceAnimation}
          >
            ${stock.currentPrice.toFixed(2)}
          </motion.span>
          <motion.div
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
              isPositive
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}
            animate={{
              scale: [1, 1.05, 1],
              transition: { duration: 0.5 }
            }}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span className="text-sm font-semibold">
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </motion.div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-slate-800 dark:text-white font-medium">
          <span>{isPositive ? '+' : ''}${stock.change.toFixed(2)}</span>
          {stock.volume && (
            <div className="flex items-center space-x-1">
              <Volume2 className="w-3 h-3" />
              <span>{(stock.volume / 1000000).toFixed(1)}M</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      {showCharts && !compact && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">24h Chart</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                trendDirection === 'up' ? 'bg-emerald-500' :
                trendDirection === 'down' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {trendDirection === 'up' ? 'Bullish' : trendDirection === 'down' ? 'Bearish' : 'Neutral'}
              </span>
            </div>
          </div>
          <MiniChart data={chartData} trend={trendDirection} />
        </div>
      )}

      {/* Additional Stats */}
      {!compact && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stock.marketCap && (
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Market Cap</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                ${(stock.marketCap / 1000000000).toFixed(1)}B
              </p>
            </div>
          )}
          {stock.peRatio && (
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">P/E Ratio</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {stock.peRatio.toFixed(1)}
              </p>
            </div>
          )}
          {stock.high52Week && (
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">52W High</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                ${stock.high52Week.toFixed(2)}
              </p>
            </div>
          )}
          {stock.low52Week && (
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">52W Low</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                ${stock.low52Week.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Trade Actions */}
      <AnimatePresence>
        {(isHovered || showActions) && onQuickTrade && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex space-x-2"
          >
            <motion.button
              className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onQuickTrade(stock.ticker, 'buy');
              }}
            >
              <Plus className="w-4 h-4 mx-auto" />
            </motion.button>
            <motion.button
              className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onQuickTrade(stock.ticker, 'sell');
              }}
            >
              <Minus className="w-4 h-4 mx-auto" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Updated */}
      {stock.lastUpdate && (
        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Updated {stock.lastUpdate.toLocaleTimeString()}</span>
            </div>
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </div>
        </div>
      )}

      {/* Hover Effects */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        animate={{
          background: [
            'linear-gradient(45deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))',
            'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))',
            'linear-gradient(225deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))',
            'linear-gradient(315deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))',
            'linear-gradient(45deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))'
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </motion.div>
  );
};

export const StockCardGrid: React.FC<StockCardGridProps> = ({
  stocks,
  onStockClick,
  onWatchToggle,
  onQuickTrade,
  showCharts = false,
  compact = false,
  className = ''
}) => {
  const { colors } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`grid gap-6 ${
        compact 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
      } ${className}`}
    >
      {stocks.map((stock, index) => (
        <AdvancedStockCard
          key={stock.ticker}
          stock={stock}
          onStockClick={onStockClick}
          onWatchToggle={onWatchToggle}
          onQuickTrade={onQuickTrade}
          showCharts={showCharts}
          compact={compact}
          index={index}
        />
      ))}
    </motion.div>
  );
};

export default AdvancedStockCard;

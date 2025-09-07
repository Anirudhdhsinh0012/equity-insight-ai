'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Settings,
  User,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Activity,
  Menu,
  X,
  ChevronDown,
  Star,
  Globe,
  Zap,
  Shield,
  Crown,
  Target,
  Briefcase,
  BarChart3,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  SortDesc,
  Layout,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Bookmark,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Plus
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

interface PortfolioStats {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  buyingPower: number;
  totalStocks: number;
  activePositions: number;
}

interface NotificationItem {
  id: string;
  type: 'price' | 'news' | 'system' | 'trade';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface PremiumDashboardHeaderProps {
  portfolioStats: PortfolioStats;
  notifications: NotificationItem[];
  onSearch?: (query: string) => void;
  onNotificationClick?: (notification: NotificationItem) => void;
  onMenuToggle?: () => void;
  onThemeToggle?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  userName?: string;
  userAvatar?: string;
  isDarkMode?: boolean;
  showMobileMenu?: boolean;
  className?: string;
}

// StatsCard Component
interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  changePercent?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  compact?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changePercent,
  icon,
  trend = 'neutral',
  compact = false
}) => {
  const { colors } = useTheme();
  const isPositive = (change && change >= 0) || (changePercent && changePercent >= 0);
  
  return (
    <motion.div
      className={`
        ${colors.primary.card} backdrop-blur-xl ${colors.primary.border} border
        rounded-xl p-4 shadow-lg hover:shadow-xl ${colors.animation.transition} ${colors.animation.duration}
        ${compact ? 'min-w-[140px]' : 'min-w-[160px]'}
      `}
      whileHover={{ scale: 1.02, y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${
          trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
          trend === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
          'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        }`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 ${
            isPositive ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-medium">
              {isPositive ? '+' : ''}{changePercent ? `${changePercent.toFixed(1)}%` : `$${Math.abs(change).toFixed(0)}`}
            </span>
          </div>
        )}
      </div>
      <div>
        <p className={`text-xs ${colors.text.muted} mb-1`}>{title}</p>
        <p className={`text-lg font-bold ${colors.text.primary}`}>{value}</p>
      </div>
    </motion.div>
  );
};

// NotificationDropdown Component
interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onNotificationClick?: (notification: NotificationItem) => void;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onNotificationClick,
  onClose
}) => {
  const { colors } = useTheme();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'price':
        return <TrendingUp className={iconClass} />;
      case 'news':
        return <Globe className={iconClass} />;
      case 'system':
        return <Settings className={iconClass} />;
      case 'trade':
        return <Activity className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`absolute top-full right-0 mt-2 w-80 ${colors.primary.card} backdrop-blur-xl ${colors.primary.border} border rounded-xl shadow-2xl z-50`}
    >
      {/* Header */}
      <div className={`p-4 ${colors.primary.border} border-b`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${colors.text.primary}`}>
            Notifications
          </h3>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
            <button
              onClick={onClose}
              className={`p-1 hover:${colors.primary.surfaceHover} rounded-lg ${colors.animation.transition}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className={`w-12 h-12 ${colors.text.muted} mx-auto mb-3`} />
            <p className={`${colors.text.secondary}`}>No notifications</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                className={`
                  p-3 rounded-lg cursor-pointer ${colors.animation.transition} ${colors.animation.duration}
                  ${notification.read 
                    ? `${colors.primary.surface}` 
                    : `bg-blue-50/50 dark:bg-blue-900/20 ${colors.primary.border} border`
                  }
                  hover:${colors.primary.surfaceHover}
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onNotificationClick?.(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded ${getPriorityColor(notification.priority)}`}>
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      notification.read 
                        ? `${colors.text.secondary}` 
                        : `${colors.text.primary}`
                    }`}>
                      {notification.title}
                    </p>
                    <p className={`text-xs ${colors.text.muted} mt-1 line-clamp-2`}>
                      {notification.message}
                    </p>
                    <p className={`text-xs ${colors.text.muted} mt-1`}>
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main Component
export const PremiumDashboardHeader: React.FC<PremiumDashboardHeaderProps> = ({
  portfolioStats,
  notifications,
  onSearch,
  onNotificationClick,
  onMenuToggle,
  onThemeToggle,
  onProfileClick,
  onSettingsClick,
  userName = 'John Doe',
  userAvatar,
  isDarkMode = false,
  showMobileMenu = false,
  className = ''
}) => {
  const { theme, colors, isTransitioning } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const isPositiveChange = portfolioStats.dayChangePercent >= 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        w-full ${colors.primary.surface} backdrop-blur-xl ${colors.primary.border} border-b
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Section - Logo & Menu Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className={`lg:hidden p-2 hover:${colors.primary.surfaceHover} rounded-lg ${colors.animation.transition}`}
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Stock Pro
                </h1>
                <p className={`text-xs ${colors.text.muted}`}>Advanced Trading</p>
              </div>
            </motion.div>
          </div>

          {/* Center Section - Portfolio Stats */}
          <div className="hidden xl:flex items-center space-x-4">
            <StatsCard
              title="Portfolio Value"
              value={`$${portfolioStats.totalValue.toLocaleString()}`}
              change={portfolioStats.dayChange}
              changePercent={portfolioStats.dayChangePercent}
              icon={<Wallet className="w-5 h-5" />}
              trend={isPositiveChange ? 'up' : 'down'}
              compact
            />
            <StatsCard
              title="Day Change"
              value={`${isPositiveChange ? '+' : ''}$${Math.abs(portfolioStats.dayChange).toLocaleString()}`}
              changePercent={portfolioStats.dayChangePercent}
              icon={isPositiveChange ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              trend={isPositiveChange ? 'up' : 'down'}
              compact
            />
            <StatsCard
              title="Active Positions"
              value={portfolioStats.activePositions.toString()}
              icon={<BarChart3 className="w-5 h-5" />}
              trend="neutral"
              compact
            />
          </div>

          {/* Right Section - Search, Notifications, Theme, Profile */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div ref={searchRef} className="relative hidden md:block">
              <motion.div
                className={`flex items-center ${colors.primary.surface} rounded-xl px-4 py-2 ${colors.animation.transition} ${
                  isSearchFocused ? `${colors.primary.border} border-2` : `${colors.primary.border} border`
                }`}
                whileFocus={{ scale: 1.02 }}
              >
                <Search className={`w-4 h-4 ${colors.text.muted} mr-2`} />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`bg-transparent ${colors.text.primary} placeholder-${colors.text.muted} outline-none w-48`}
                />
              </motion.div>
            </div>

            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <motion.button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 hover:${colors.primary.surfaceHover} rounded-xl ${colors.animation.transition}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {unreadNotifications}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <NotificationDropdown
                    notifications={notifications}
                    onNotificationClick={onNotificationClick}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle size="md" />

            {/* Profile Menu */}
            <div ref={userMenuRef} className="relative">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center space-x-2 p-2 hover:${colors.primary.surfaceHover} rounded-xl ${colors.animation.transition}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className={`text-sm font-medium ${colors.text.primary}`}>{userName}</p>
                  <p className={`text-xs ${colors.text.muted}`}>Premium</p>
                </div>
                <ChevronDown className={`w-4 h-4 ${colors.text.muted} hidden sm:block`} />
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={`absolute top-full right-0 mt-2 w-48 ${colors.primary.card} backdrop-blur-xl ${colors.primary.border} border rounded-xl shadow-2xl z-50`}
                  >
                    <div className="p-2">
                      <button
                        onClick={onProfileClick}
                        className={`w-full flex items-center space-x-2 p-2 hover:${colors.primary.surfaceHover} rounded-lg ${colors.animation.transition}`}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={onSettingsClick}
                        className={`w-full flex items-center space-x-2 p-2 hover:${colors.primary.surfaceHover} rounded-lg ${colors.animation.transition}`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <hr className={`my-2 ${colors.primary.border}`} />
                      <button
                        onClick={() => {/* Handle logout */}}
                        className={`w-full flex items-center space-x-2 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg ${colors.animation.transition}`}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default PremiumDashboardHeader;

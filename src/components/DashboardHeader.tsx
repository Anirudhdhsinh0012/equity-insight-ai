'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Settings,
  LogOut,
  Moon,
  Sun,
  User,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  ChevronDown,
  Plus
} from 'lucide-react';
import { User as UserType } from '@/types';

interface DashboardHeaderProps {
  user: UserType;
  onLogout: () => void;
  onAddStock: () => void;
  portfolioValue?: number;
  portfolioChange?: number;
  portfolioChangePercent?: number;
  notificationCount?: number;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  onLogout,
  onAddStock,
  portfolioValue = 0,
  portfolioChange = 0,
  portfolioChangePercent = 0,
  notificationCount = 0,
  isDarkMode = false,
  onThemeToggle
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isMarketOpen = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    // Simple market hours check (9:30 AM - 4:00 PM EST, Monday-Friday)
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const profileMenuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: {
        duration: 0.2
      }
    }
  };

  const marketStatusColor = isMarketOpen() ? 'text-emerald-500' : 'text-orange-500';
  const portfolioChangeColor = portfolioChange >= 0 ? 'text-emerald-500' : 'text-red-500';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left section - Welcome & Portfolio Stats */}
          <div className="flex items-center gap-6">
            {/* Welcome message */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:block"
            >
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {getGreeting()}, {user.name}! 👋
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </motion.div>

            {/* Portfolio summary cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-4"
            >
              {/* Total Value */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Portfolio</span>
                </div>
                <div className="font-bold text-lg text-slate-900 dark:text-white">
                  {formatCurrency(portfolioValue)}
                </div>
                <div className={`text-xs flex items-center gap-1 ${portfolioChangeColor}`}>
                  <TrendingUp className="w-3 h-3" />
                  {formatCurrency(Math.abs(portfolioChange))} ({Math.abs(portfolioChangePercent).toFixed(2)}%)
                </div>
              </div>

              {/* Market Status */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">Market</span>
                </div>
                <div className={`font-medium ${marketStatusColor}`}>
                  {isMarketOpen() ? 'Open' : 'Closed'}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {isMarketOpen() ? 'Trading Now' : 'Opens 9:30 AM EST'}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right section - Search & Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative hidden md:block"
            >
              <div className={`relative transition-all duration-200 ${
                isSearchFocused ? 'w-80' : 'w-64'
              }`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stocks, symbols..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </motion.div>

            {/* Add Stock Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddStock}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Stock</span>
            </motion.button>

            {/* Notifications */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl backdrop-blur-sm hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              {notificationCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </motion.div>
              )}
            </motion.button>

            {/* Theme Toggle */}
            {onThemeToggle && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onThemeToggle}
                className="p-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl backdrop-blur-sm hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </motion.button>
            )}

            {/* Profile Menu */}
            <div className="relative">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl backdrop-blur-sm hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`} />
              </motion.button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    variants={profileMenuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full mt-2 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-xl overflow-hidden"
                  >
                    {/* Profile info */}
                    <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                        <User className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Preferences</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                        <BarChart3 className="w-4 h-4" />
                        <span>Trading History</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Click outside to close */}
              {isProfileOpen && (
                <div
                  className="fixed inset-0 z-[-1]"
                  onClick={() => setIsProfileOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;

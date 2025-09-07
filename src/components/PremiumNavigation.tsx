'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PieChart,
  Bookmark,
  TrendingUp,
  Bell,
  Settings,
  HelpCircle,
  User,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  Globe,
  Zap,
  Target,
  LogOut,
  Crown,
  Search,
  Plus,
  Star,
  Shield,
  Briefcase,
  Brain
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  badge?: number;
  premium?: boolean;
  shortcut?: string;
}

interface PremiumNavigationProps {
  user: { name: string; email: string };
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  notificationCount?: number;
  portfolioValue?: number;
  portfolioChange?: number;
}

const PremiumNavigation: React.FC<PremiumNavigationProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  collapsed = false,
  onToggleCollapse,
  notificationCount = 0,
  portfolioValue = 0,
  portfolioChange = 0
}) => {
  const { colors } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState(false);

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Market overview & insights',
      shortcut: '⌘D'
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: Bookmark,
      description: 'Tracked stocks & alerts',
      shortcut: '⌘W'
    },
    {
      id: 'realtime',
      label: 'Live Market',
      icon: TrendingUp,
      description: 'Real-time market data',
      shortcut: '⌘L'
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Zap,
      description: 'AI-powered recommendations',
      premium: true,
      shortcut: '⌘I'
    },
    {
      id: 'reports',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Advanced market analysis',
      premium: true,
      shortcut: '⌘A'
    },
    {
      id: 'recommendations',
      label: 'Trading',
      icon: Target,
      description: 'Execute trades & orders',
      shortcut: '⌘T'
    },
    {
      id: 'ai-stories',
      label: 'AI Stories',
      icon: Brain,
      description: 'Market narratives & insights',
      premium: true,
      shortcut: '⌘S'
    },
    {
      id: 'personality-match',
      label: 'Personality Match',
      icon: User,
      description: 'Personalized stock suggestions',
      premium: true,
      shortcut: '⌘P'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Alerts',
      icon: Globe,
      description: 'WhatsApp integration & alerts',
      shortcut: '⌘H'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Alerts & updates',
      badge: notificationCount,
      shortcut: '⌘N'
    }
  ];

  const bottomItems: NavItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Account & preferences',
      shortcut: '⌘,'
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      description: 'Get assistance',
      shortcut: '⌘?'
    }
  ];

  const sidebarVariants = {
    expanded: { 
      width: '22rem',
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    collapsed: { 
      width: '5rem',
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    }
  };

  const contentVariants = {
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2, delay: 0.1 }
    },
    hide: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    idle: { scale: 1, x: 0 },
    hover: { 
      scale: 1.02, 
      x: 4,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  const badgeVariants = {
    idle: { scale: 1 },
    pulse: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <motion.div
      className={`fixed left-0 top-0 h-screen ${colors.primary.surface} backdrop-blur-2xl border-r ${colors.primary.border} z-40 shadow-2xl ${colors.animation.transition} ${colors.animation.duration}`}
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
    >
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className={`p-6 border-b ${colors.primary.border}`}>
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  variants={contentVariants}
                  initial="hide"
                  animate="show"
                  exit="hide"
                  className="flex items-center space-x-3"
                >
                  <motion.div 
                    className="w-11 h-11 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrendingUp className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      StockPro
                    </h1>
                    <p className={`text-xs ${colors.text.muted} font-medium`}>Premium Trading</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.button
              onClick={onToggleCollapse}
              className={`p-2.5 rounded-xl ${colors.primary.card} hover:${colors.primary.cardHover} ${colors.animation.transition} ${colors.animation.duration} backdrop-blur-sm border ${colors.primary.border}`}
              variants={itemVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
            >
              <motion.div
                animate={{ rotate: collapsed ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronRight className={`w-4 h-4 ${colors.text.secondary}`} />
              </motion.div>
            </motion.button>
          </div>

          {/* Quick Stats */}
          <AnimatePresence>
            {!collapsed && portfolioValue > 0 && (
              <motion.div
                variants={contentVariants}
                initial="hide"
                animate="show"
                exit="hide"
                className={`mt-4 p-3 rounded-xl ${colors.primary.accent} border ${colors.primary.border}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${colors.text.muted} font-medium`}>Portfolio</p>
                    <p className={`text-lg font-bold ${colors.text.primary}`}>
                      ${portfolioValue.toLocaleString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    portfolioChange >= 0 
                      ? `${colors.status.success} ${colors.status.successBg}` 
                      : `${colors.status.danger} ${colors.status.dangerBg}`
                  }`}>
                    {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}%
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full p-3 rounded-xl text-left ${colors.animation.transition} ${colors.animation.duration} relative group ${
                activeTab === item.id
                  ? `${colors.primary.accent} border ${colors.primary.border} shadow-lg`
                  : `hover:${colors.primary.surfaceHover}`
              }`}
              variants={itemVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              style={{ zIndex: navigationItems.length - index }}
            >
              <div className="flex items-center space-x-3">
                {/* Icon Container */}
                <motion.div 
                  className={`relative p-2.5 rounded-lg ${colors.animation.transition} ${colors.animation.duration} ${
                    activeTab === item.id
                      ? `${colors.primary.card} ${colors.text.accent} shadow-md`
                      : `${colors.primary.card} ${colors.text.secondary} group-hover:${colors.primary.cardHover} group-hover:${colors.text.accent}`
                  }`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.premium && (
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown className="w-3 h-3 text-yellow-500" />
                    </motion.div>
                  )}
                </motion.div>
                
                {/* Content */}
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      variants={contentVariants}
                      initial="hide"
                      animate="show"
                      exit="hide"
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${colors.animation.transition} ${colors.animation.duration} ${
                            activeTab === item.id
                              ? colors.text.accent
                              : colors.text.primary
                          }`}>
                            {item.label}
                          </p>
                          <p className={`text-xs ${colors.text.muted} truncate`}>
                            {item.description}
                          </p>
                        </div>
                        
                        {/* Badge & Shortcut */}
                        <div className="flex items-center space-x-2 ml-2">
                          {item.badge && (
                            <motion.div
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center shadow-md"
                              variants={badgeVariants}
                              animate={item.badge > 0 ? "pulse" : "idle"}
                            >
                              {item.badge}
                            </motion.div>
                          )}
                          {item.shortcut && (
                            <span className={`text-xs ${colors.text.muted} font-mono`}>
                              {item.shortcut}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hover Tooltip for Collapsed State */}
              <AnimatePresence>
                {collapsed && hoveredItem === item.id && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute left-full top-0 ml-3 px-4 py-3 ${colors.primary.surface} backdrop-blur-xl ${colors.text.primary} rounded-xl shadow-2xl border ${colors.primary.border} z-50 whitespace-nowrap`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4" />
                      <div>
                        <p className={`font-semibold text-sm ${colors.text.primary}`}>{item.label}</p>
                        <p className={`text-xs ${colors.text.muted}`}>{item.description}</p>
                        {item.shortcut && (
                          <p className={`text-xs ${colors.text.muted} font-mono mt-1`}>{item.shortcut}</p>
                        )}
                      </div>
                    </div>
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-medium">
                        {item.badge}
                      </div>
                    )}
                    {item.premium && (
                      <Crown className="absolute -top-1 -left-1 w-4 h-4 text-yellow-500" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/5 dark:border-gray-600/20 space-y-1">
          {bottomItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/25'
                  : 'hover:bg-white/5 dark:hover:bg-gray-700/40'
              }`}
              variants={itemVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-100/50 dark:bg-gray-700/50 text-slate-600 dark:text-gray-300'
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      variants={contentVariants}
                      initial="hide"
                      animate="show"
                      exit="hide"
                      className="flex-1"
                    >
                      <p className={`font-semibold text-sm ${
                        activeTab === item.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-gray-200'
                      }`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          ))}

          {/* User Profile Section */}
          <motion.div
            className={`p-3 mt-4 rounded-xl ${colors.primary.accent} border ${colors.primary.border} backdrop-blur-sm`}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <User className="w-5 h-5 text-white" />
              </motion.div>
              
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    variants={contentVariants}
                    initial="hide"
                    animate="show"
                    exit="hide"
                    className="flex-1 min-w-0"
                  >
                    <p className={`font-semibold text-sm ${colors.text.primary} truncate`}>
                      {user.name}
                    </p>
                    <p className={`text-xs ${colors.text.muted} truncate`}>
                      {user.email}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.button
                onClick={onLogout}
                className={`p-2 rounded-lg hover:${colors.status.dangerBg} ${colors.text.muted} hover:${colors.status.danger} ${colors.animation.transition} ${colors.animation.duration}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </motion.div>
  );
};

export default PremiumNavigation;

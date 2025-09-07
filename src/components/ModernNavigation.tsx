'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  PieChart,
  Bookmark,
  TrendingUp,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  Activity,
  BarChart3,
  Wallet
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  badge?: number;
}

interface ModernNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: { name: string; email: string };
  notificationCount?: number;
}

const ModernNavigation: React.FC<ModernNavigationProps> = ({
  activeTab,
  onTabChange,
  user,
  notificationCount = 0
}) => {
  const { colors, isTransitioning } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navigationItems: NavItem[] = [
    {
      id: 'realtime',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Real-time market overview'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: PieChart,
      description: 'Your investments & performance'
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: Bookmark,
      description: 'Tracked stocks & alerts'
    },
    {
      id: 'market',
      label: 'Live Market',
      icon: TrendingUp,
      description: 'Market trends & analysis'
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Activity,
      description: 'Smart recommendations'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      description: 'Performance analytics'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Alerts & updates',
      badge: notificationCount
    }
  ];

  const secondaryItems: NavItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Account preferences'
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: HelpCircle,
      description: 'Get assistance'
    }
  ];

  const sidebarVariants = {
    open: {
      width: '280px',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      width: '80px',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    hover: { 
      scale: 1.02,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      transition: { duration: 0.2 }
    }
  };

  const renderNavItem = (item: NavItem, isSecondary = false) => (
    <motion.button
      key={item.id}
      variants={itemVariants}
      whileHover="hover"
      onClick={() => {
        onTabChange(item.id);
        setIsSidebarOpen(false);
      }}
      onHoverStart={() => setHoveredItem(item.id)}
      onHoverEnd={() => setHoveredItem(null)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl relative group ${colors.animation.transition} ${colors.animation.duration} ${
        activeTab === item.id
          ? `${colors.primary.surface} ${colors.text.primary} shadow-lg backdrop-blur-sm ${colors.primary.border} border`
          : `${colors.text.secondary} hover:${colors.text.primary} hover:${colors.primary.surfaceHover}`
      }`}
    >
      {/* Active indicator */}
      {activeTab === item.id && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      <div className="relative">
        <item.icon className="w-5 h-5" />
        {item.badge && item.badge > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {item.badge}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex-1 text-left"
          >
            <div className="font-medium">{item.label}</div>
            <div className={`text-xs ${colors.text.muted} leading-tight`}>{item.description}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSidebarOpen && hoveredItem === item.id && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className={`absolute left-full ml-4 ${colors.primary.card} ${colors.text.primary} px-3 py-2 rounded-lg shadow-xl ${colors.primary.border} border z-50 whitespace-nowrap`}
        >
          <div className="font-medium">{item.label}</div>
          <div className={`text-xs ${colors.text.muted}`}>{item.description}</div>
          <div className={`absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 ${colors.primary.card} rotate-45 ${colors.primary.border} border-l border-b`} />
        </motion.div>
      )}

      {!isSidebarOpen && (
        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${colors.animation.transition}`} />
      )}
    </motion.button>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 ${colors.primary.card} backdrop-blur-md rounded-lg shadow-lg ${colors.primary.border} border ${colors.animation.transition} ${colors.animation.duration}`}
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={isSidebarOpen ? 'open' : 'closed'}
        className={`fixed left-0 top-0 h-full ${colors.primary.surface} backdrop-blur-xl ${colors.primary.border} border-r z-50 flex flex-col shadow-2xl ${colors.animation.transition} ${colors.animation.duration} ${isTransitioning ? 'pointer-events-none' : ''}`}
      >
        {/* Header */}
        <div className={`p-6 ${colors.primary.border} border-b`}>
          <motion.div
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            {isSidebarOpen && (
              <div>
                <div className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Stock Pro
                </div>
                <div className={`text-xs ${colors.text.muted}`}>
                  Advanced Trading
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* User Profile */}
        <div className={`p-4 ${colors.primary.border} border-b`}>
          <motion.div
            animate={{ opacity: isSidebarOpen ? 1 : 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${colors.text.primary}`}>{user.name}</div>
                <div className={`text-xs ${colors.text.muted} truncate`}>
                  {user.email}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="space-y-1"
          >
            {navigationItems.map((item) => renderNavItem(item))}
          </motion.div>

          {/* Divider */}
          <div className={`my-6 border-t ${colors.primary.border}`} />

          {/* Secondary Items */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.3
                }
              }
            }}
            className="space-y-1"
          >
            {secondaryItems.map((item) => renderNavItem(item, true))}
          </motion.div>
        </div>

        {/* Toggle Button */}
        <div className={`p-4 border-t ${colors.primary.border}`}>
          <motion.button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`w-full flex items-center justify-center p-2 rounded-lg ${colors.primary.surface} hover:${colors.primary.surfaceHover} ${colors.animation.transition}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isSidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default ModernNavigation;

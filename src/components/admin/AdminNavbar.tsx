'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User, 
  Menu, 
  Sun, 
  Moon,
  ChevronDown,
  Settings,
  LogOut,
  Shield,
  Mail,
  Calendar
} from 'lucide-react';

interface AdminNavbarProps {
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  notifications: number;
  sidebarOpen: boolean;
  onNavigateToSettings?: () => void;
  onOpenMessages?: () => void;
  onOpenSchedule?: () => void;
  onOpenPreferences?: () => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({
  onToggleSidebar,
  darkMode,
  onToggleTheme,
  notifications,
  sidebarOpen,
  onNavigateToSettings,
  onOpenMessages,
  onOpenSchedule,
  onOpenPreferences
}) => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    // Clear admin session state
    try {
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('user'); // Clear any user session data
      localStorage.removeItem('adminSession'); // Clear admin session data
    } catch (error) {
      console.warn('Error clearing session storage:', error);
    }
    
    // Redirect to main page instead of deleted login page
    router.push('/');
  };

  const handleMenuItemClick = (action: string) => {
    setShowProfile(false); // Close the dropdown
    
    switch (action) {
      case 'settings':
        onNavigateToSettings?.();
        break;
      case 'messages':
        onOpenMessages?.();
        break;
      case 'schedule':
        onOpenSchedule?.();
        break;
      case 'preferences':
        onOpenPreferences?.();
        break;
    }
  };

  const mockNotifications = [
    { id: 1, title: 'New user registration', message: 'John Doe just signed up', time: '2 min ago', type: 'user' },
    { id: 2, title: 'High trading volume', message: 'AAPL showing unusual activity', time: '5 min ago', type: 'alert' },
    { id: 3, title: 'Quiz completed', message: '50 users completed the AI quiz', time: '10 min ago', type: 'quiz' }
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 right-0 left-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700"
      style={{ marginLeft: sidebarOpen ? '256px' : '64px' }}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users, shares, news..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <motion.div
              initial={false}
              animate={{ rotate: darkMode ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </motion.div>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              {notifications > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                >
                  {notifications}
                </motion.span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {mockNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'user' ? 'bg-green-500' :
                            notification.type === 'alert' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-slate-800 dark:text-white">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-800 dark:text-white">Admin User</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Super Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">Admin User</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">admin@stockmarket.com</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    {[
                      { icon: Shield, label: 'Admin Settings', color: 'text-blue-600', action: 'settings' },
                      { icon: Mail, label: 'Messages', color: 'text-green-600', action: 'messages' },
                      { icon: Calendar, label: 'Schedule', color: 'text-purple-600', action: 'schedule' },
                      { icon: Settings, label: 'Preferences', color: 'text-orange-600', action: 'preferences' }
                    ].map((item, index) => (
                      <motion.button
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleMenuItemClick(item.action)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                      </motion.button>
                    ))}
                    
                    <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default AdminNavbar;

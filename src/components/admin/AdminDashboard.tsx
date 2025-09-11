'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Brain, 
  Newspaper, 
  Settings, 
  Search, 
  Bell, 
  User, 
  Menu, 
  X,
  Sun,
  Moon,
  ChevronDown,
  BarChart3,
  Activity,
  DollarSign,
  Shield
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import UsersModule from './UsersModule';
import SharesModule from './SharesModule';
import AIQuizModule from './AIQuizModule';
import NewsModule from './NewsModule';
import SettingsModule from './SettingsModule';
import DashboardOverview from './DashboardOverview';
import EnhancedAdminActivityDashboard from './EnhancedAdminActivityDashboard';
import RealTimeActivityFeed from './RealTimeActivityFeed';
import ActivityAnalytics from './ActivityAnalytics';

export type AdminModules = 'overview' | 'users' | 'shares' | 'quizzes' | 'news' | 'settings' | 'activity' | 'analytics';

interface AdminDashboardProps {
  className?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ className = '' }) => {
  const [activeModule, setActiveModule] = useState<AdminModules>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('admin-theme', !darkMode ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderActiveModule = () => {
    const moduleProps = { className: "w-full h-full" };
    
    switch (activeModule) {
      case 'overview':
        return <DashboardOverview {...moduleProps} />;
      case 'users':
        return <UsersModule {...moduleProps} />;
      case 'shares':
        return <SharesModule {...moduleProps} />;
      case 'quizzes':
        return <AIQuizModule {...moduleProps} />;
      case 'news':
        return <NewsModule {...moduleProps} />;
      case 'activity':
        return <EnhancedAdminActivityDashboard {...moduleProps} />;
      case 'analytics':
        return <ActivityAnalytics {...moduleProps} />;
      case 'settings':
        return <SettingsModule {...moduleProps} />;
      default:
        return <DashboardOverview {...moduleProps} />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500 ${className}`}>
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Top Navbar */}
        <AdminNavbar
          onToggleSidebar={toggleSidebar}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          notifications={notifications}
          sidebarOpen={sidebarOpen}
        />

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 pt-24 min-h-screen"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {renderActiveModule()}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

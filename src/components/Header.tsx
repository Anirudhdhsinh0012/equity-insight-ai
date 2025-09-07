'use client';

import { motion } from 'framer-motion';
import { LogOut, Plus, User as UserIcon, Settings } from 'lucide-react';
import { User } from '@/types';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onAddStock: () => void;
  onNavigateToNotifications?: () => void;
}

export default function Header({ user, onLogout, onAddStock, onNavigateToNotifications }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl sticky top-0 z-40 transition-all duration-500"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <motion.h1 
              whileHover={{ scale: 1.02 }}
              className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300"
            >
              📈 Stock Advisor Pro
            </motion.h1>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Add Stock Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAddStock}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Add Stock</span>
            </motion.button>

            {/* Notifications Settings */}
            {onNavigateToNotifications && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNavigateToNotifications}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Notification Settings"
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            )}

            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <UserIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <span className="hidden sm:inline text-slate-700 dark:text-slate-300 font-medium">{user.name}</span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

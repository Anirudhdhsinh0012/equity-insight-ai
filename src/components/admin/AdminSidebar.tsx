'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Brain, 
  Newspaper, 
  Settings, 
  BarChart3,
  ChevronLeft,
  Shield,
  Activity
} from 'lucide-react';
import { AdminModules } from './AdminDashboard';

interface AdminSidebarProps {
  isOpen: boolean;
  activeModule: AdminModules;
  onModuleChange: (module: AdminModules) => void;
  onToggle: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  activeModule,
  onModuleChange,
  onToggle
}) => {
  const navigationItems = [
    { 
      id: 'overview' as AdminModules, 
      label: 'Overview', 
      icon: BarChart3, 
      color: 'from-blue-500 to-blue-600' 
    },
    { 
      id: 'users' as AdminModules, 
      label: 'Users', 
      icon: Users, 
      color: 'from-green-500 to-green-600' 
    },
    { 
      id: 'shares' as AdminModules, 
      label: 'Shares', 
      icon: TrendingUp, 
      color: 'from-purple-500 to-purple-600' 
    },
    { 
      id: 'quizzes' as AdminModules, 
      label: 'AI Quizzes', 
      icon: Brain, 
      color: 'from-orange-500 to-orange-600' 
    },
    { 
      id: 'news' as AdminModules, 
      label: 'News', 
      icon: Newspaper, 
      color: 'from-red-500 to-red-600' 
    },
    { 
      id: 'settings' as AdminModules, 
      label: 'Settings', 
      icon: Settings, 
      color: 'from-gray-500 to-gray-600' 
    }
  ];

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-800 shadow-xl z-50 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {isOpen && (
            <div>
              <h1 className="font-bold text-lg text-slate-800 dark:text-white">Admin Panel</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Stock Market Pro</p>
            </div>
          )}
        </motion.div>
        
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${!isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onModuleChange(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg transform scale-105' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                isActive 
                  ? 'bg-white bg-opacity-20' 
                  : 'bg-slate-200 dark:bg-slate-600 group-hover:bg-slate-300 dark:group-hover:bg-slate-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className={`font-medium ${isOpen ? 'block' : 'hidden'}`}
              >
                {item.label}
              </motion.span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-2 h-2 bg-white rounded-full"
                  transition={{ duration: 0.2 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className={`p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-lg ${
            isOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">System Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400">All systems operational</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminSidebar;

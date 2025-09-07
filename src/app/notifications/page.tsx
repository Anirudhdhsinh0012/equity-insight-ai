'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationSettingsPanel from '@/components/NotificationSettingsPanel';
import StockAlertManager from '@/components/StockAlertManager';
import WhatsAppTestCenter from '@/components/WhatsAppTestCenter';

const NotificationsPage: React.FC = () => {
  const { theme } = useTheme();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings' | 'whatsapp'>('alerts');

  // Mock available tickers (in real app, this would come from your stock data)
  const availableTickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];

  const handleDemoNotification = async () => {
    await addNotification({
      title: 'Demo Notification',
      message: 'This is a test notification to demonstrate the system',
      type: 'INFO',
      userId: 'current-user',
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      theme === 'dark' 
        ? 'bg-slate-950' 
        : 'bg-slate-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Notifications & Alerts
          </h1>
          <p className={`mt-2 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Manage your notification preferences and price alerts
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className={`flex space-x-1 rounded-lg p-1 ${
            theme === 'dark'
              ? 'bg-slate-900 border border-slate-700'
              : 'bg-white border border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'alerts'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Price Alerts
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-green-600 text-white shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Settings
            </button>
          </div>
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'alerts' && (
                <StockAlertManager availableTickers={availableTickers} />
              )}
              {activeTab === 'whatsapp' && (
                <WhatsAppTestCenter />
              )}
              {activeTab === 'settings' && (
                <NotificationSettingsPanel />
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-lg p-6 ${
                theme === 'dark'
                  ? 'bg-slate-900 border border-slate-700'
                  : 'bg-white border border-slate-200'
              }`}
            >
              <h3 className={`font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <motion.button
                  onClick={handleDemoNotification}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Send Demo Notification
                </motion.button>
              </div>
            </motion.div>

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-lg p-6 ${
                theme === 'dark'
                  ? 'bg-slate-900 border border-slate-700'
                  : 'bg-white border border-slate-200'
              }`}
            >
              <h3 className={`font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                How It Works
              </h3>
              <div className={`space-y-3 text-sm ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <p>Set price alerts to get notified when stocks reach your target prices</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <p>Configure notification preferences to control how you receive alerts</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <p>Browser notifications work even when the tab is not active</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <p>Alerts are automatically stored locally on your device</p>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-lg p-6 ${
                theme === 'dark'
                  ? 'bg-slate-900 border border-slate-700'
                  : 'bg-white border border-slate-200'
              }`}
            >
              <h3 className={`font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Notification Types
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                    Price Alerts
                  </span>
                  <span className="text-blue-500">🚨</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                    Buy Signals
                  </span>
                  <span className="text-green-500">📈</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                    Sell Signals
                  </span>
                  <span className="text-red-500">📉</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                    Price Changes
                  </span>
                  <span className="text-yellow-500">⚠️</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

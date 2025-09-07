'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { format } from 'date-fns';

const NotificationCenter: React.FC = () => {
  const { theme } = useTheme();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return '📈';
      case 'SELL':
        return '📉';
      case 'ALERT':
        return '🚨';
      case 'SUCCESS':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'ERROR':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'BUY':
      case 'SUCCESS':
        return theme === 'dark' ? 'text-green-400' : 'text-green-600';
      case 'SELL':
      case 'WARNING':
        return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
      case 'ALERT':
      case 'ERROR':
        return theme === 'dark' ? 'text-red-400' : 'text-red-600';
      default:
        return theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'hover:bg-slate-800 text-slate-300 hover:text-white'
            : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={`absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-lg shadow-xl z-50 ${
                theme === 'dark'
                  ? 'bg-slate-900 border border-slate-700'
                  : 'bg-white border border-slate-200'
              }`}
            >
              {/* Header */}
              <div className={`p-4 border-b ${
                theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Notifications
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className={`text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-80">
                {notifications.length === 0 ? (
                  <div className={`p-8 text-center ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <svg
                      className="w-12 h-12 mx-auto mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 cursor-pointer transition-colors ${
                          !notification.isRead
                            ? theme === 'dark'
                              ? 'bg-slate-800 hover:bg-slate-700'
                              : 'bg-blue-50 hover:bg-blue-100'
                            : theme === 'dark'
                            ? 'hover:bg-slate-800'
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Icon */}
                          <span className="text-lg mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </span>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium text-sm ${
                                theme === 'dark' ? 'text-white' : 'text-slate-900'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                              )}
                            </div>
                            
                            <p className={`text-sm mt-1 ${
                              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                              {notification.message}
                            </p>

                            {/* Stock info */}
                            {notification.ticker && (
                              <div className={`flex items-center space-x-2 mt-2 text-xs ${
                                getNotificationColor(notification.type)
                              }`}>
                                <span className="font-mono font-bold">
                                  {notification.ticker}
                                </span>
                                {notification.currentPrice && (
                                  <span>${notification.currentPrice.toFixed(2)}</span>
                                )}
                              </div>
                            )}

                            <p className={`text-xs mt-2 ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {format(new Date(notification.timestamp), 'MMM d, HH:mm')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;

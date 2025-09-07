'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationSettings } from '@/types';

const NotificationSettingsPanel: React.FC = () => {
  const { theme } = useTheme();
  const { settings, updateSettings, requestNotificationPermission } = useNotifications();
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
    checkPermission();
  }, [settings]);

  const checkPermission = () => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  };

  const handleEnableBrowserNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted && localSettings) {
      const newSettings = { ...localSettings, enableBrowserNotifications: true };
      setLocalSettings(newSettings);
      await updateSettings(newSettings);
    }
    checkPermission();
  };

  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean | number) => {
    if (!localSettings) return;

    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    await updateSettings(newSettings);
  };

  if (!localSettings) {
    return (
      <div className={`animate-pulse rounded-lg p-6 ${
        theme === 'dark'
          ? 'bg-slate-900 border border-slate-700'
          : 'bg-white border border-slate-200'
      }`}>
        <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4" />
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2" />
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-6 ${
        theme === 'dark'
          ? 'bg-slate-900 border border-slate-700'
          : 'bg-white border border-slate-200'
      }`}
    >
      <h2 className={`text-xl font-bold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-slate-900'
      }`}>
        Notification Settings
      </h2>

      <div className="space-y-6">
        {/* Browser Notifications */}
        <div className="space-y-3">
          <h3 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Browser Notifications
          </h3>
          
          {!hasPermission ? (
            <div className={`p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-amber-900/20 border-amber-700 text-amber-300'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium">Permission Required</p>
                  <p className="text-sm mt-1">Enable browser notifications to receive real-time alerts</p>
                </div>
                <motion.button
                  onClick={handleEnableBrowserNotifications}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Enable
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Desktop Notifications
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Receive notifications even when the browser is minimized
                </p>
              </div>
              <motion.button
                onClick={() => handleSettingChange('enableBrowserNotifications', !localSettings.enableBrowserNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.enableBrowserNotifications
                    ? 'bg-blue-600'
                    : theme === 'dark'
                    ? 'bg-slate-600'
                    : 'bg-slate-300'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  animate={{
                    x: localSettings.enableBrowserNotifications ? 20 : 2
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow"
                />
              </motion.button>
            </div>
          )}
        </div>

        {/* Sound Settings */}
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Sound Notifications
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Play sound when notifications are received
            </p>
          </div>
          <motion.button
            onClick={() => handleSettingChange('soundEnabled', !localSettings.soundEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.soundEnabled
                ? 'bg-blue-600'
                : theme === 'dark'
                ? 'bg-slate-600'
                : 'bg-slate-300'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{
                x: localSettings.soundEnabled ? 20 : 2
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="inline-block h-4 w-4 transform rounded-full bg-white shadow"
            />
          </motion.button>
        </div>

        {/* WhatsApp Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              WhatsApp Notifications
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Receive stock alerts via WhatsApp messages
            </p>
          </div>
          <motion.button
            onClick={() => handleSettingChange('enableWhatsAppNotifications', !localSettings.enableWhatsAppNotifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.enableWhatsAppNotifications
                ? 'bg-green-600'
                : theme === 'dark'
                ? 'bg-slate-600'
                : 'bg-slate-300'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{
                x: localSettings.enableWhatsAppNotifications ? 20 : 2
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="inline-block h-4 w-4 transform rounded-full bg-white shadow"
            />
          </motion.button>
        </div>

        {/* Price Change Threshold */}
        <div className="space-y-3">
          <h3 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Alert Thresholds
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Price Change Alert Threshold: {localSettings.priceChangeThreshold}%
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={localSettings.priceChangeThreshold}
                onChange={(e) => handleSettingChange('priceChangeThreshold', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1%</span>
                <span>20%</span>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Buy Opportunity Threshold: {localSettings.buyThreshold}% below buy price
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={localSettings.buyThreshold}
                onChange={(e) => handleSettingChange('buyThreshold', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5%</span>
                <span>30%</span>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Sell Alert Threshold: {localSettings.sellThreshold}% above buy price
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={localSettings.sellThreshold}
                onChange={(e) => handleSettingChange('sellThreshold', Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10%</span>
                <span>50%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Notification */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <motion.button
            onClick={() => {
              if (hasPermission && localSettings.enableBrowserNotifications) {
                new Notification('Test Notification', {
                  body: 'Your notification settings are working correctly!',
                  icon: '/favicon.ico',
                });
              }
            }}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              hasPermission && localSettings.enableBrowserNotifications
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : theme === 'dark'
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
            disabled={!hasPermission || !localSettings.enableBrowserNotifications}
            whileHover={{ scale: hasPermission && localSettings.enableBrowserNotifications ? 1.02 : 1 }}
            whileTap={{ scale: hasPermission && localSettings.enableBrowserNotifications ? 0.98 : 1 }}
          >
            Send Test Notification
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationSettingsPanel;

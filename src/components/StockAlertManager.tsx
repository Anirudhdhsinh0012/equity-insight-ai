'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { StockAlert } from '@/types';

interface StockAlertManagerProps {
  availableTickers: string[];
}

const StockAlertManager: React.FC<StockAlertManagerProps> = ({ availableTickers }) => {
  const { theme } = useTheme();
  const { stockAlerts, addStockAlert, deleteStockAlert, updateStockAlert } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    ticker: '',
    type: 'ABOVE' as 'ABOVE' | 'BELOW',
    targetPrice: '',
  });

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.ticker || !newAlert.targetPrice) return;

    await addStockAlert({
      userId: 'current-user', // This should come from auth context
      ticker: newAlert.ticker,
      type: newAlert.type,
      targetPrice: parseFloat(newAlert.targetPrice),
      isActive: true,
    });

    setNewAlert({ ticker: '', type: 'ABOVE', targetPrice: '' });
    setIsCreating(false);
  };

  const handleToggleAlert = async (alert: StockAlert) => {
    await updateStockAlert({
      ...alert,
      isActive: !alert.isActive,
    });
  };

  const handleDeleteAlert = async (alertId: string) => {
    await deleteStockAlert(alertId);
  };

  return (
    <div className={`rounded-lg p-6 ${
      theme === 'dark'
        ? 'bg-slate-900 border border-slate-700'
        : 'bg-white border border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Price Alerts
        </h2>
        <motion.button
          onClick={() => setIsCreating(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          + Add Alert
        </motion.button>
      </div>

      {/* Create Alert Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`p-6 rounded-lg max-w-md w-full mx-4 ${
                theme === 'dark'
                  ? 'bg-slate-900 border border-slate-700'
                  : 'bg-white border border-slate-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-lg font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Create Price Alert
              </h3>

              <form onSubmit={handleCreateAlert} className="space-y-4">
                {/* Ticker Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Stock Symbol
                  </label>
                  <select
                    value={newAlert.ticker}
                    onChange={(e) => setNewAlert({ ...newAlert, ticker: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    required
                  >
                    <option value="">Select a stock</option>
                    {[...new Set(availableTickers)].map((ticker, index) => (
                      <option key={`${ticker}-${index}`} value={ticker}>
                        {ticker}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alert Type */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Alert Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="ABOVE"
                        checked={newAlert.type === 'ABOVE'}
                        onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as 'ABOVE' | 'BELOW' })}
                        className="mr-2 text-blue-600"
                      />
                      <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                        Price goes above
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="BELOW"
                        checked={newAlert.type === 'BELOW'}
                        onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as 'ABOVE' | 'BELOW' })}
                        className="mr-2 text-blue-600"
                      />
                      <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                        Price goes below
                      </span>
                    </label>
                  </div>
                </div>

                {/* Target Price */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Target Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAlert.targetPrice}
                    onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Create Alert
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts List */}
      <div className="space-y-3">
        {stockAlerts.length === 0 ? (
          <div className={`text-center py-8 ${
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
            <p>No price alerts set</p>
            <p className="text-sm mt-2">Create your first alert to get notified when stocks reach your target prices</p>
          </div>
        ) : (
          stockAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border transition-colors ${
                alert.isActive
                  ? theme === 'dark'
                    ? 'bg-slate-800 border-slate-600'
                    : 'bg-slate-50 border-slate-200'
                  : theme === 'dark'
                  ? 'bg-slate-800/50 border-slate-700 opacity-60'
                  : 'bg-slate-100/50 border-slate-300 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Status Indicator */}
                  <div className={`w-3 h-3 rounded-full ${
                    alert.isActive
                      ? 'bg-green-500'
                      : alert.triggeredAt
                      ? 'bg-blue-500'
                      : 'bg-slate-400'
                  }`} />

                  {/* Alert Details */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {alert.ticker}
                      </span>
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {alert.type === 'ABOVE' ? '≥' : '≤'} ${alert.targetPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {alert.isActive
                        ? 'Active'
                        : alert.triggeredAt
                        ? 'Triggered'
                        : 'Inactive'
                      }
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleAlert(alert)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      alert.isActive
                        ? theme === 'dark'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                        : theme === 'dark'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {alert.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default StockAlertManager;

/**
 * API Quota Status Banner Component
 * Shows quota usage and displays warnings when limits are reached
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Activity,
  X,
  RefreshCw,
  WifiOff,
  Download,
  FileText
} from 'lucide-react';

interface QuotaStatus {
  quotaUsed: number;
  quotaLimit: number;
  quotaRemaining: number;
  resetTime: string;
  isLimitReached: boolean;
  lastUpdated: string;
}

interface ApiQuotaBannerProps {
  className?: string;
  showAlways?: boolean; // If true, always show the banner, otherwise only show when there are issues
}

export default function ApiQuotaBanner({ className = '', showAlways = false }: ApiQuotaBannerProps) {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Fetch quota status
  const fetchQuotaStatus = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await fetch('/api/finnhub/status');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.quota) {
          // Map API response structure to expected QuotaStatus interface
          setQuotaStatus({
            quotaUsed: data.data.quota.used,
            quotaLimit: data.data.quota.limit,
            quotaRemaining: data.data.quota.remaining,
            resetTime: data.data.quota.resetTime,
            isLimitReached: data.data.quota.isLimitReached,
            lastUpdated: data.data.quota.lastUpdated
          });
        } else {
          console.warn('Invalid API response structure:', data);
          setHasError(true);
        }
      } else {
        console.error('API request failed with status:', response.status);
        setHasError(true);
      }
    } catch (error) {
      console.error('Failed to fetch quota status:', error);
      setHasError(true);
      // Set a fallback state to prevent crashes
      setQuotaStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Export quota usage reports
  const exportReport = async (format: 'csv' | 'pdf', days: number = 30) => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/finnhub/export?format=${format}&days=${days}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 'application/pdf'
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quota-usage-${days}days-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch status on mount and periodically
  useEffect(() => {
    fetchQuotaStatus();
    
    const interval = setInterval(fetchQuotaStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu && !(event.target as Element).closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // Determine visibility
  useEffect(() => {
    if (isDismissed) {
      setIsVisible(false);
      return;
    }

    // Show error state if there's an error and showAlways is true
    if (hasError && showAlways) {
      setIsVisible(true);
      return;
    }

    if (!quotaStatus) {
      setIsVisible(false);
      return;
    }

    if (showAlways) {
      setIsVisible(true);
      return;
    }

    // Show banner if quota is reached or nearly reached
    const usagePercent = (quotaStatus.quotaUsed / quotaStatus.quotaLimit) * 100;
    setIsVisible(quotaStatus.isLimitReached || usagePercent >= 80);
  }, [quotaStatus, isDismissed, showAlways, hasError]);

  if (!isVisible) {
    return null;
  }

  // Show error state if there's an error
  if (hasError) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <WifiOff className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-300">
                  Unable to fetch API status
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Check your connection or try refreshing
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchQuotaStatus}
                disabled={isLoading}
                className="text-gray-600 dark:text-gray-400 hover:opacity-70 transition-opacity"
                title="Retry"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {!showAlways && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className="text-gray-600 dark:text-gray-400 hover:opacity-70 transition-opacity"
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!quotaStatus) {
    return null;
  }

  const usagePercent = (quotaStatus.quotaUsed / quotaStatus.quotaLimit) * 100;
  const resetTime = new Date(quotaStatus.resetTime);
  const timeUntilReset = Math.max(0, resetTime.getTime() - Date.now());
  const minutesUntilReset = Math.floor(timeUntilReset / (1000 * 60));

  // Determine banner style based on quota usage
  const getBannerStyle = () => {
    if (quotaStatus.isLimitReached) {
      return {
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-700',
        textColor: 'text-red-800 dark:text-red-300',
        iconColor: 'text-red-600 dark:text-red-400',
        icon: AlertCircle
      };
    } else if (usagePercent >= 90) {
      return {
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-700',
        textColor: 'text-orange-800 dark:text-orange-300',
        iconColor: 'text-orange-600 dark:text-orange-400',
        icon: AlertTriangle
      };
    } else if (usagePercent >= 80) {
      return {
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-700',
        textColor: 'text-yellow-800 dark:text-yellow-300',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        icon: Clock
      };
    } else {
      return {
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-700',
        textColor: 'text-blue-800 dark:text-blue-300',
        iconColor: 'text-blue-600 dark:text-blue-400',
        icon: Activity
      };
    }
  };

  const style = getBannerStyle();
  const Icon = style.icon;

  const getMessage = () => {
    if (quotaStatus.isLimitReached) {
      return `API quota exceeded (${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit}). Using cached data and demo mode.`;
    } else if (usagePercent >= 90) {
      return `API quota nearly exhausted (${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit}). ${quotaStatus.quotaRemaining} requests remaining.`;
    } else if (usagePercent >= 80) {
      return `API quota running low (${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit}). ${quotaStatus.quotaRemaining} requests remaining.`;
    } else {
      return `API usage: ${quotaStatus.quotaUsed}/${quotaStatus.quotaLimit} requests used.`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${style.bgColor} ${style.borderColor} border rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Icon className={`h-5 w-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${style.textColor}`}>
                {getMessage()}
              </p>
              
              {quotaStatus.isLimitReached && (
                <p className={`text-xs ${style.textColor} mt-1 opacity-80`}>
                  <Clock className="h-3 w-3 inline mr-1" />
                  Quota resets in {minutesUntilReset} minutes
                </p>
              )}

              {!quotaStatus.isLimitReached && timeUntilReset > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={style.textColor}>Usage</span>
                    <span className={style.textColor}>{usagePercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        usagePercent >= 90 ? 'bg-red-500' : 
                        usagePercent >= 80 ? 'bg-orange-500' : 
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!quotaStatus.isLimitReached && (
              <button
                onClick={fetchQuotaStatus}
                disabled={isLoading}
                className={`${style.iconColor} hover:opacity-70 transition-opacity`}
                title="Refresh quota status"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {/* Export Menu */}
            <div className="relative export-menu-container">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className={`${style.iconColor} hover:opacity-70 transition-opacity`}
                title="Export usage reports"
              >
                <Download className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    Export Usage Report
                  </div>
                  
                  <button
                    onClick={() => exportReport('csv', 7)}
                    disabled={isExporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>CSV - Last 7 days</span>
                  </button>
                  
                  <button
                    onClick={() => exportReport('csv', 30)}
                    disabled={isExporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>CSV - Last 30 days</span>
                  </button>
                  
                  <button
                    onClick={() => exportReport('pdf', 7)}
                    disabled={isExporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>PDF - Last 7 days</span>
                  </button>
                  
                  <button
                    onClick={() => exportReport('pdf', 30)}
                    disabled={isExporting}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>PDF - Last 30 days</span>
                  </button>
                </div>
              )}
            </div>
            
            {!showAlways && (
              <button
                onClick={() => setIsDismissed(true)}
                className={`${style.iconColor} hover:opacity-70 transition-opacity`}
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Real-Time Stock Price Display Component
 * Shows live price updates with API status and alert management
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  Bell, 
  BellOff,
  Wifi,
  WifiOff,
  Clock,
  Pause,
  Play,
  Settings
} from 'lucide-react';
import { useFinnhub } from '@/hooks/useFinnhub';
import { RealtimePrice, PriceAlert } from '@/types';

interface RealtimePriceDisplayProps {
  userId: string;
  tickers: string[];
  className?: string;
  showAlerts?: boolean;
  showApiStatus?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  realtimePrices?: Map<string, any>; // Real-time prices from WebSocket
  isConnected?: boolean; // WebSocket connection status
}

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  currentPrice: number;
  onAddAlert: (upperThreshold?: number, lowerThreshold?: number) => Promise<boolean>;
}

const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  ticker,
  currentPrice,
  onAddAlert
}) => {
  const [upperThreshold, setUpperThreshold] = useState<string>('');
  const [lowerThreshold, setLowerThreshold] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const upper = upperThreshold ? parseFloat(upperThreshold) : undefined;
    const lower = lowerThreshold ? parseFloat(lowerThreshold) : undefined;

    const success = await onAddAlert(upper, lower);
    
    if (success) {
      setUpperThreshold('');
      setLowerThreshold('');
      onClose();
    }
    
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">Set Price Alert for {ticker}</h3>
        <p className="text-sm text-gray-600 mb-4">
          Current Price: ${currentPrice ? currentPrice.toFixed(2) : 'N/A'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upper Threshold (Alert when price goes above)
            </label>
            <input
              type="number"
              step="0.01"
              value={upperThreshold}
              onChange={(e) => setUpperThreshold(e.target.value)}
              placeholder={currentPrice ? `e.g., ${(currentPrice * 1.05).toFixed(2)}` : 'e.g., 100.00'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lower Threshold (Alert when price goes below)
            </label>
            <input
              type="number"
              step="0.01"
              value={lowerThreshold}
              onChange={(e) => setLowerThreshold(e.target.value)}
              placeholder={currentPrice ? `e.g., ${(currentPrice * 0.95).toFixed(2)}` : 'e.g., 90.00'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!upperThreshold && !lowerThreshold)}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const RealtimePriceDisplay = React.memo<RealtimePriceDisplayProps>(({
  userId,
  tickers,
  className = '',
  showAlerts = true,
  showApiStatus = true,
  autoRefresh = true,
  refreshInterval = 30000,
  realtimePrices = new Map(),
  isConnected = false
}) => {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(autoRefresh);

  // Remove duplicate tickers to prevent key conflicts - memoized for performance
  const uniqueTickers = useMemo(() => {
    return Array.from(new Set(tickers.filter(ticker => ticker && ticker.trim() !== '')));
  }, [tickers]);

  const {
    prices,
    isLoading,
    error,
    alerts,
    alertsLoading,
    apiStatus,
    serviceHealth,
    isApiLimitReached,
    fetchPrice,
    addAlert,
    removeAlert,
    refreshAlerts,
    refreshStatus,
    startMonitoring,
    stopMonitoring
  } = useFinnhub({
    userId,
    tickers: uniqueTickers,
    enableRealtime: isMonitoring,
    pollInterval: refreshInterval
  });

  // Memoized price calculations for performance optimization
  const priceStats = useMemo(() => {
    const priceArray = Array.from(prices.values());
    const totalGainers = priceArray.filter(p => p.change > 0).length;
    const totalLosers = priceArray.filter(p => p.change < 0).length;
    const avgChange = priceArray.length > 0 
      ? priceArray.reduce((sum, p) => sum + p.changePercent, 0) / priceArray.length 
      : 0;
    
    return { totalGainers, totalLosers, avgChange, totalStocks: priceArray.length };
  }, [prices]);

  // Auto-start monitoring when autoRefresh is enabled and we have tickers
  useEffect(() => {
    if (autoRefresh && uniqueTickers.length > 0 && !isMonitoring) {
      startMonitoring(uniqueTickers).then((success) => {
        if (success) {
          setIsMonitoring(true);
        }
      });
    }
  }, [autoRefresh, uniqueTickers.length, startMonitoring, isMonitoring]);

  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      await stopMonitoring();
      setIsMonitoring(false);
    } else {
      const success = await startMonitoring(uniqueTickers);
      if (success) {
        setIsMonitoring(true);
      }
    }
  };

  const handleAddAlert = async (ticker: string) => {
    setSelectedTicker(ticker);
    setShowAlertModal(true);
  };

  const handleCreateAlert = async (upperThreshold?: number, lowerThreshold?: number) => {
    if (!selectedTicker) return false;
    return await addAlert(selectedTicker, upperThreshold, lowerThreshold);
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatPercentage = (percent: number | null | undefined) => {
    if (percent === null || percent === undefined || isNaN(percent)) {
      return 'N/A';
    }
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number | null | undefined) => {
    if (change === null || change === undefined || isNaN(change)) {
      return 'text-gray-600';
    }
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number | null | undefined) => {
    if (change === null || change === undefined || isNaN(change)) {
      return <Activity className="w-4 h-4" />;
    }
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* API Status Banner */}
      {showApiStatus && isApiLimitReached && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              Live updates temporarily paused: API usage limit reached, will resume after reset
            </span>
          </div>
        </motion.div>
      )}

      {/* API Status Banner */}
      {showApiStatus && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-lg p-4 ${
            (prices.size > 0 && !isApiLimitReached)
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {(prices.size > 0 && !isApiLimitReached) ? (
              <>
                <Wifi className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  � Live Data Active: Real-time prices from Finnhub API
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  ⚠️ Demo Mode: Using simulated data. Check API configuration.
                </span>
              </>
            )}
          </div>
          {isApiLimitReached && (
            <div className="mt-2 text-sm text-yellow-700">
              API quota reached. Showing cached data until quota resets.
            </div>
          )}
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Real-Time Prices</h2>
        
        <div className="flex items-center space-x-4">
          {/* Monitoring Toggle */}
          <button
            onClick={handleToggleMonitoring}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              isMonitoring 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isMonitoring ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Paused</span>
              </>
            )}
          </button>

          {/* API Status */}
          {showApiStatus && apiStatus && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {apiStatus.quotaRemaining}/{apiStatus.quotaLimit} calls remaining
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Price Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {uniqueTickers.map((ticker) => {
            // Prioritize REAL Finnhub data, fallback to simulated data only if API fails
            const finnhubPrice = prices.get(ticker);
            const realtimePrice = realtimePrices.get(ticker);
            
            // Create unified price object - PRIORITIZE REAL DATA
            const price = finnhubPrice ? {
              ...finnhubPrice,
              source: 'finnhub'
            } : realtimePrice ? {
              currentPrice: realtimePrice.price,
              change: realtimePrice.change,
              changePercent: realtimePrice.changePercent,
              volume: realtimePrice.volume,
              high: realtimePrice.price,
              low: realtimePrice.price,
              open: realtimePrice.price,
              previousClose: (realtimePrice.price - realtimePrice.change),
              timestamp: realtimePrice.timestamp,
              source: 'realtime'
            } : null;
            
            const tickerAlerts = alerts.filter(alert => alert.ticker === ticker && alert.isActive);
            
            return (
              <motion.div
                key={ticker}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">{ticker}</h3>
                    {/* Data Source Indicator */}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      price?.source === 'realtime' 
                        ? 'bg-green-100 text-green-700' 
                        : price?.source === 'finnhub'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {price?.source === 'realtime' ? '🔴 LIVE' : 
                       price?.source === 'finnhub' ? '📊 REAL' : '🎭 DEMO'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {tickerAlerts.length > 0 && (
                      <Bell className="w-4 h-4 text-blue-600" />
                    )}
                    {showAlerts && (
                      <button
                        onClick={() => handleAddAlert(ticker)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Add Price Alert"
                      >
                        <BellOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                {price ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {formatPrice(price.currentPrice)}
                      </span>
                      <div className={`flex items-center space-x-1 ${getChangeColor(price.change)}`}>
                        {getChangeIcon(price.change)}
                        <span className="font-medium">
                          {formatPercentage(price.changePercent)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="block">Change</span>
                        <span className={`font-medium ${getChangeColor(price.change)}`}>
                          {(price.change !== null && price.change !== undefined && !isNaN(price.change)) 
                            ? `${price.change >= 0 ? '+' : ''}${formatPrice(price.change)}`
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="block">Volume</span>
                        <span className="font-medium">
                          {price.volume ? price.volume.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="block">High</span>
                        <span className="font-medium">{formatPrice(price.high)}</span>
                      </div>
                      <div>
                        <span className="block">Low</span>
                        <span className="font-medium">{formatPrice(price.low)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Updated: {new Date(price.timestamp).toLocaleTimeString()}
                    </div>

                    {/* Active Alerts */}
                    {tickerAlerts.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {tickerAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded text-xs"
                          >
                            <span>
                              {alert.upperThreshold && `Above ${formatPrice(alert.upperThreshold)}`}
                              {alert.upperThreshold && alert.lowerThreshold && ' or '}
                              {alert.lowerThreshold && `Below ${formatPrice(alert.lowerThreshold)}`}
                            </span>
                            <button
                              onClick={() => removeAlert(alert.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove Alert"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-pulse text-gray-400">Loading...</div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Service Health Status */}
      {showApiStatus && serviceHealth && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Service Status</span>
            <div className={`flex items-center space-x-2 ${
              serviceHealth.status === 'healthy' ? 'text-green-600' :
              serviceHealth.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                serviceHealth.status === 'healthy' ? 'bg-green-600' :
                serviceHealth.status === 'degraded' ? 'bg-yellow-600' : 'bg-red-600'
              }`} />
              <span className="capitalize">{serviceHealth.status}</span>
            </div>
          </div>
          
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <span className="block">WebSocket</span>
              <span className={serviceHealth.websocketConnected ? 'text-green-600' : 'text-red-600'}>
                {serviceHealth.websocketConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div>
              <span className="block">Cache Size</span>
              <span>{serviceHealth.cacheSize} tickers</span>
            </div>
            <div>
              <span className="block">API Calls</span>
              <span>{apiStatus?.quotaUsed || 0}/{apiStatus?.quotaLimit || 0}</span>
            </div>
            <div>
              <span className="block">Reset Time</span>
              <span>
                {apiStatus?.resetTime ? new Date(apiStatus.resetTime).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={showAlertModal}
        onClose={() => {
          setShowAlertModal(false);
          setSelectedTicker(null);
        }}
        ticker={selectedTicker || ''}
        currentPrice={selectedTicker ? prices.get(selectedTicker)?.currentPrice || 0 : 0}
        onAddAlert={handleCreateAlert}
      />
    </div>
  );
});

RealtimePriceDisplay.displayName = 'RealtimePriceDisplay';

export default RealtimePriceDisplay;

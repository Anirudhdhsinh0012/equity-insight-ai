/**
 * React Hook for Finnhub Real-Time Stock Data
 * Provides real-time price updates, alerts management, and API status
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimePrice, PriceAlert, FinnhubApiStatus, FinnhubServiceHealth } from '@/types';

interface UseFinnhubOptions {
  userId: string;
  tickers?: string[];
  enableRealtime?: boolean;
  pollInterval?: number; // milliseconds
}

interface FinnhubHookReturn {
  // Price data
  prices: Map<string, RealtimePrice>;
  isLoading: boolean;
  error: string | null;
  
  // Alerts
  alerts: PriceAlert[];
  alertsLoading: boolean;
  
  // API status
  apiStatus: FinnhubApiStatus | null;
  serviceHealth: FinnhubServiceHealth | null;
  isApiLimitReached: boolean;
  
  // Actions
  fetchPrice: (ticker: string) => Promise<RealtimePrice | null>;
  fetchPrices: (tickers: string[]) => Promise<void>;
  addAlert: (ticker: string, upperThreshold?: number, lowerThreshold?: number) => Promise<boolean>;
  removeAlert: (alertId: string) => Promise<boolean>;
  refreshAlerts: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  startMonitoring: (tickers: string[]) => Promise<boolean>;
  stopMonitoring: () => Promise<boolean>;
}

export function useFinnhub(options: UseFinnhubOptions): FinnhubHookReturn {
  const { userId, tickers = [], enableRealtime = true, pollInterval = 30000 } = options;
  
  // State
  const [prices, setPrices] = useState<Map<string, RealtimePrice>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<FinnhubApiStatus | null>(null);
  const [serviceHealth, setServiceHealth] = useState<FinnhubServiceHealth | null>(null);
  
  // Refs for cleanup
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMonitoringRef = useRef(false);

  // Computed values
  const isApiLimitReached = apiStatus?.isLimitReached || false;

  /**
   * Fetch single stock price
   */
  const fetchPrice = useCallback(async (ticker: string): Promise<RealtimePrice | null> => {
    try {
      const response = await fetch(`/api/finnhub/quote/${ticker}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setPrices(prev => new Map(prev.set(ticker, result.data)));
        setApiStatus(result.apiStatus);
        return result.data;
      } else {
        setError(result.error || 'Failed to fetch price');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
      return null;
    }
  }, []);

  /**
   * Fetch multiple stock prices
   */
  const fetchPrices = useCallback(async (tickerList: string[]): Promise<void> => {
    if (tickerList.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/finnhub/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickers: tickerList,
          userId
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const newPrices = new Map<string, RealtimePrice>();
        Object.entries(result.data).forEach(([ticker, price]) => {
          newPrices.set(ticker, price as RealtimePrice);
        });
        setPrices(newPrices);
        setApiStatus(result.apiStatus);
      } else {
        setError(result.error || 'Failed to fetch prices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Add price alert
   */
  const addAlert = useCallback(async (
    ticker: string, 
    upperThreshold?: number, 
    lowerThreshold?: number
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/finnhub/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ticker,
          upperThreshold,
          lowerThreshold
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await refreshAlerts();
        return true;
      } else {
        setError(result.error || 'Failed to add alert');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add alert');
      return false;
    }
  }, [userId]);

  /**
   * Remove price alert
   */
  const removeAlert = useCallback(async (alertId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/finnhub/alerts?userId=${userId}&alertId=${alertId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        await refreshAlerts();
        return true;
      } else {
        setError(result.error || 'Failed to remove alert');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove alert');
      return false;
    }
  }, [userId]);

  /**
   * Refresh user alerts
   */
  const refreshAlerts = useCallback(async (): Promise<void> => {
    setAlertsLoading(true);
    try {
      const response = await fetch(`/api/finnhub/alerts?userId=${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setAlerts(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setAlertsLoading(false);
    }
  }, [userId]);

  /**
   * Refresh API status and service health
   */
  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/finnhub/status');
      const result = await response.json();
      
      if (result.success) {
        setApiStatus(result.data.quota);
        setServiceHealth(result.data.health);
      } else {
        setError(result.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    }
  }, []);

  /**
   * Start real-time monitoring
   */
  const startMonitoring = useCallback(async (tickerList: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/finnhub/monitoring/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tickers: tickerList
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        isMonitoringRef.current = true;
        return true;
      } else {
        setError(result.error || 'Failed to start monitoring');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start monitoring');
      return false;
    }
  }, [userId]);

  /**
   * Stop real-time monitoring
   */
  const stopMonitoring = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/finnhub/monitoring/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        isMonitoringRef.current = false;
        return true;
      } else {
        setError(result.error || 'Failed to stop monitoring');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop monitoring');
      return false;
    }
  }, [userId]);

  /**
   * Start polling for price updates
   */
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    if (tickers.length > 0 && enableRealtime && !isApiLimitReached) {
      pollIntervalRef.current = setInterval(() => {
        fetchPrices(tickers);
      }, pollInterval);
    }
  }, [tickers, enableRealtime, isApiLimitReached, pollInterval, fetchPrices]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Initial data fetch and setup
  useEffect(() => {
    if (userId) {
      refreshAlerts();
      refreshStatus();
      
      if (tickers.length > 0) {
        fetchPrices(tickers);
        if (enableRealtime) {
          startMonitoring(tickers);
        }
      }
    }
  }, [userId, enableRealtime]); // Don't include tickers to avoid infinite re-renders

  // Handle tickers change
  useEffect(() => {
    if (tickers.length > 0) {
      fetchPrices(tickers);
    }
  }, [tickers.join(','), fetchPrices]);

  // Handle polling
  useEffect(() => {
    if (enableRealtime && !isApiLimitReached) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return stopPolling;
  }, [enableRealtime, isApiLimitReached, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      if (isMonitoringRef.current) {
        stopMonitoring();
      }
    };
  }, [stopPolling, stopMonitoring]);

  return {
    // Price data
    prices,
    isLoading,
    error,
    
    // Alerts
    alerts,
    alertsLoading,
    
    // API status
    apiStatus,
    serviceHealth,
    isApiLimitReached,
    
    // Actions
    fetchPrice,
    fetchPrices,
    addAlert,
    removeAlert,
    refreshAlerts,
    refreshStatus,
    startMonitoring,
    stopMonitoring,
  };
}

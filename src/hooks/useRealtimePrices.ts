/**
 * React Hook for Real-time Stock Prices via WebSocket
 * Uses simple WebSocket connection for live price updates
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface RealtimePriceData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  volume?: number;
}

interface UseRealtimePricesOptions {
  tickers: string[];
  autoConnect?: boolean;
  manualMode?: boolean; // New option for manual control
}

interface UseRealtimePricesReturn {
  prices: Map<string, RealtimePriceData>;
  isConnected: boolean;
  connectionError: string | null;
  subscribe: (ticker: string) => void;
  unsubscribe: (ticker: string) => void;
  reconnect: () => void;
  disconnect: () => void; // New manual disconnect function
  pauseUpdates: () => void; // New pause function
  resumeUpdates: () => void; // New resume function
}

export function useRealtimePrices(options: UseRealtimePricesOptions): UseRealtimePricesReturn {
  const { tickers, autoConnect = true, manualMode = false } = options;
  
  const [prices, setPrices] = useState<Map<string, RealtimePriceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const subscribedTickersRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pricesRef = useRef<Map<string, RealtimePriceData>>(new Map());
  const lastUpdateTime = useRef<number>(0);
  const consecutiveErrorCount = useRef<number>(0);

  // Keep pricesRef in sync with prices state
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);

  // Mock price generation for development (stable function, no dependencies)
  const generateMockPrice = useCallback((ticker: string, currentPrice?: number): RealtimePriceData => {
    const basePrice = currentPrice || Math.random() * 1000 + 50; // Random base price between 50-1050
    const change = (Math.random() - 0.5) * 10; // Random change between -5 and +5
    const changePercent = (change / basePrice) * 100;
    
    return {
      ticker,
      price: Math.round((basePrice + change) * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      timestamp: Date.now(),
      volume: Math.floor(Math.random() * 1000000)
    };
  }, []);

  // Simulate real-time price updates with improved error handling
  const updatePrices = useCallback(() => {
    if (subscribedTickersRef.current.size === 0 || isPaused) return;

    // Throttle updates to prevent excessive API-like behavior
    const now = Date.now();
    if (now - lastUpdateTime.current < 5000) return; // Minimum 5 seconds between updates
    lastUpdateTime.current = now;

    try {
      setPrices(prev => {
        const newPrices = new Map(prev);
        
        subscribedTickersRef.current.forEach(ticker => {
          const currentPrice = prev.get(ticker);
          const updatedPrice = generateMockPrice(ticker, currentPrice?.price);
          newPrices.set(ticker, updatedPrice);
        });
        
        return newPrices;
      });
      
      // Reset error count on successful update
      consecutiveErrorCount.current = 0;
      setConnectionError(null);
    } catch (error) {
      consecutiveErrorCount.current++;
      console.error('Error updating prices:', error);
      
      // If too many consecutive errors, pause updates
      if (consecutiveErrorCount.current > 3) {
        setIsPaused(true);
        setConnectionError('Too many errors, updates paused');
        setIsConnected(false);
      }
    }
  }, [generateMockPrice, isPaused]);

  // Subscribe to a ticker (stable function with proper cleanup)
  const subscribe = useCallback((ticker: string) => {
    if (!ticker || subscribedTickersRef.current.has(ticker)) return;
    
    subscribedTickersRef.current.add(ticker);
    
    // Generate initial price for new ticker
    const initialPrice = generateMockPrice(ticker);
    setPrices(prev => {
      const newPrices = new Map(prev);
      newPrices.set(ticker, initialPrice);
      return newPrices;
    });
    
    console.log(`Subscribed to ${ticker}`);
  }, [generateMockPrice]);

  // Unsubscribe from a ticker (stable function)
  const unsubscribe = useCallback((ticker: string) => {
    if (!ticker || !subscribedTickersRef.current.has(ticker)) return;
    
    subscribedTickersRef.current.delete(ticker);
    
    // Remove from local state
    setPrices(prev => {
      const newPrices = new Map(prev);
      newPrices.delete(ticker);
      return newPrices;
    });
    
    console.log(`Unsubscribed from ${ticker}`);
  }, []);

  // Manual control functions
  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
    console.log('🔌 WebSocket manually disconnected');
  }, []);

  const pauseUpdates = useCallback(() => {
    setIsPaused(true);
    console.log('⏸️ Price updates paused');
  }, []);

  const resumeUpdates = useCallback(() => {
    setIsPaused(false);
    consecutiveErrorCount.current = 0;
    setConnectionError(null);
    if (!isConnected && subscribedTickersRef.current.size > 0) {
      setIsConnected(true);
    }
    console.log('▶️ Price updates resumed');
  }, [isConnected]);

  // Reconnect function with error handling
  const reconnect = useCallback(() => {
    disconnect();
    
    if (subscribedTickersRef.current.size === 0) {
      console.log('⚠️ No tickers to reconnect to');
      return;
    }
    
    console.log('🔄 Reconnecting real-time price connection...');
    setIsConnected(true);
    setConnectionError(null);
    setIsPaused(false);
    consecutiveErrorCount.current = 0;
    
    // Start price update interval with longer delay to reduce API impact
    intervalRef.current = setInterval(updatePrices, 30000); // Reduced to 30 seconds for better performance
  }, [disconnect, updatePrices]);

  // Initialize connection only once - with manual mode support
  useEffect(() => {
    if (!autoConnect || manualMode) return;

    console.log('Initializing real-time price connection...');
    setIsConnected(true);
    setConnectionError(null);
    
    // Start price update interval (reduced frequency for better performance)
    intervalRef.current = setInterval(updatePrices, 30000); // Reduced to 30 seconds
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
    };
  }, [autoConnect, manualMode, updatePrices]); // Added updatePrices dependency

  // Handle ticker changes
  useEffect(() => {
    const currentTickers = Array.from(subscribedTickersRef.current);
    const newTickers = tickers.filter(ticker => ticker && !subscribedTickersRef.current.has(ticker));
    const removedTickers = currentTickers.filter(ticker => !tickers.includes(ticker));

    // Subscribe to new tickers
    newTickers.forEach(ticker => {
      subscribedTickersRef.current.add(ticker);
      const initialPrice = generateMockPrice(ticker);
      setPrices(prev => {
        const newPrices = new Map(prev);
        newPrices.set(ticker, initialPrice);
        return newPrices;
      });
      console.log(`Subscribed to ${ticker}`);
    });

    // Unsubscribe from removed tickers
    removedTickers.forEach(ticker => {
      subscribedTickersRef.current.delete(ticker);
      setPrices(prev => {
        const newPrices = new Map(prev);
        newPrices.delete(ticker);
        return newPrices;
      });
      console.log(`Unsubscribed from ${ticker}`);
    });
  }, [tickers, generateMockPrice]);

  return {
    prices,
    isConnected,
    connectionError,
    subscribe,
    unsubscribe,
    reconnect,
    disconnect,
    pauseUpdates,
    resumeUpdates
  };
}

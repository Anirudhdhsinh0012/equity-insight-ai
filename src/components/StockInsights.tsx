'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Stock } from '@/types';
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface StockInsightsProps {
  stocks: Stock[];
  onClose?: () => void;
}

interface RealTimeStockData {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  timestamp: string;
  dataQuality: string;
  source: string;
}

interface StockAnalysis {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  targetPrice: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  technicalIndicators: {
    rsi?: number;
    trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
    volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

const StockInsights = React.memo<StockInsightsProps>(({ stocks, onClose }) => {
  const [realTimeData, setRealTimeData] = useState<Map<string, RealTimeStockData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Cache for API responses to reduce load
  const cacheRef = useRef(new Map<string, { data: RealTimeStockData; timestamp: number }>());
  const CACHE_DURATION = 60000; // 1 minute cache
  
  // Memoize stock tickers to prevent unnecessary API calls
  const stockTickers = useMemo(() => {
    return stocks.map(stock => stock.ticker).filter(Boolean);
  }, [stocks]);

  // Helper function to format date safely
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  // Optimized fetch function with caching and memoization
  const fetchRealTimeData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (stockTickers.length === 0) {
        setIsLoading(false);
        return;
      }

      const now = Date.now();
      const realTimeMap = new Map<string, RealTimeStockData>();
      
      // Check cache first to reduce API calls
      const uncachedTickers = stockTickers.filter(ticker => {
        const cached = cacheRef.current.get(ticker);
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          realTimeMap.set(ticker, cached.data);
          return false;
        }
        return true;
      });

      // Only fetch uncached data
      if (uncachedTickers.length > 0) {
        const response = await fetch('/api/finnhub/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tickers: uncachedTickers,
            userId: 'insights-user' // For monitoring purposes
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          Object.entries(result.data).forEach(([ticker, data]: [string, any]) => {
            if (data && typeof data === 'object') {
              const stockData: RealTimeStockData = {
                ticker,
                currentPrice: data.currentPrice || 0,
                change: data.change || 0,
                changePercent: data.changePercent || 0,
                highPrice: data.highPrice || data.currentPrice || 0,
                lowPrice: data.lowPrice || data.currentPrice || 0,
                openPrice: data.openPrice || data.currentPrice || 0,
                previousClose: data.previousClose || data.currentPrice || 0,
                timestamp: data.timestamp || new Date().toISOString(),
                dataQuality: data.dataQuality || 'REAL',
                source: data.source || 'FINNHUB_API'
              };
              
              realTimeMap.set(ticker, stockData);
              // Cache the result for performance
              cacheRef.current.set(ticker, { data: stockData, timestamp: now });
            }
          });
        }
      }
      
      setRealTimeData(realTimeMap);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch real-time data');
    } finally {
      setIsLoading(false);
    }
  }, [stockTickers]);

  // Fetch data on component mount and set up periodic updates - optimized frequency
  useEffect(() => {
    fetchRealTimeData();

    // Update every 60 seconds instead of 30 for better performance
    const interval = setInterval(fetchRealTimeData, 60000);
    
    return () => {
      clearInterval(interval);
      // Clear cache on unmount to prevent memory leaks
      cacheRef.current.clear();
    };
  }, [fetchRealTimeData]);

  // Generate AI analysis based on real market data
  const getAIAnalysis = (stock: Stock, realTimeData: RealTimeStockData): StockAnalysis => {
    const currentPrice = realTimeData.currentPrice;
    const change = realTimeData.change;
    const changePercent = realTimeData.changePercent;
    const returnFromPurchase = ((currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
    
    // Calculate technical indicators
    const volatility = Math.abs(changePercent) > 3 ? 'HIGH' : Math.abs(changePercent) > 1 ? 'MEDIUM' : 'LOW';
    const trend = changePercent > 1 ? 'BULLISH' : changePercent < -1 ? 'BEARISH' : 'SIDEWAYS';
    
    // Determine sentiment and action based on real data
    let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    let reasoning = '';
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';

    if (returnFromPurchase > 15) {
      sentiment = 'POSITIVE';
      action = 'HOLD';
      confidence = 85;
      reasoning = `Strong performance with ${returnFromPurchase.toFixed(1)}% gain. Consider taking partial profits while maintaining core position.`;
      riskLevel = volatility === 'HIGH' ? 'MEDIUM' : 'LOW';
    } else if (returnFromPurchase > 5) {
      sentiment = 'POSITIVE';
      action = changePercent > 0 ? 'HOLD' : 'BUY';
      confidence = 78;
      reasoning = `Solid performance with ${returnFromPurchase.toFixed(1)}% gain. ${changePercent > 0 ? 'Hold current position.' : 'Consider accumulating more shares.'}`;
      riskLevel = 'LOW';
    } else if (returnFromPurchase > -5) {
      sentiment = changePercent > 0 ? 'POSITIVE' : 'NEUTRAL';
      action = 'HOLD';
      confidence = 65;
      reasoning = `Stable position near break-even. Monitor for clear directional signals before making changes.`;
      riskLevel = volatility === 'HIGH' ? 'MEDIUM' : 'LOW';
    } else if (returnFromPurchase > -15) {
      sentiment = 'NEGATIVE';
      action = trend === 'BULLISH' ? 'HOLD' : 'SELL';
      confidence = 72;
      reasoning = `Position down ${Math.abs(returnFromPurchase).toFixed(1)}%. ${trend === 'BULLISH' ? 'Recent upturn suggests patience may be rewarded.' : 'Consider reducing position to limit losses.'}`;
      riskLevel = 'MEDIUM';
    } else {
      sentiment = 'NEGATIVE';
      action = 'SELL';
      confidence = 80;
      reasoning = `Significant loss of ${Math.abs(returnFromPurchase).toFixed(1)}%. Consider cutting losses and reallocating capital.`;
      riskLevel = 'HIGH';
    }

    // Adjust confidence based on data quality
    if (realTimeData.dataQuality !== 'VERIFIED_REAL') {
      confidence = Math.max(confidence - 15, 30);
    }

    const targetPrice = action === 'BUY' ? currentPrice * 1.15 : 
                       action === 'HOLD' ? currentPrice * 1.1 : 
                       currentPrice * 0.95;

    return {
      sentiment,
      action,
      confidence,
      reasoning,
      targetPrice,
      riskLevel,
      technicalIndicators: {
        trend,
        volatility
      }
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">
          Stock Insights & Analysis
        </h2>
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <div className="text-sm text-slate-500 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={fetchRealTimeData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Data Quality Banner */}
      {realTimeData.size > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 dark:text-green-300 font-medium">
              Real-time data from Finnhub API
            </span>
            <span className="text-green-600 dark:text-green-400 text-sm">
              ({realTimeData.size} stocks monitored)
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-800 dark:text-red-300 font-medium">
              Error loading real-time data: {error}
            </span>
          </div>
          <button
            onClick={fetchRealTimeData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && realTimeData.size === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading real-time stock data...</p>
          </div>
        </div>
      )}

      {/* Stock Analysis Cards */}
      {stocks.map((stock, index) => {
        const stockData = realTimeData.get(stock.ticker);
        
        // Skip stocks without real-time data
        if (!stockData) {
          return (
            <motion.div
              key={stock.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                  No real-time data available for {stock.ticker}
                </span>
              </div>
            </motion.div>
          );
        }

        const analysis = getAIAnalysis(stock, stockData);
        const currentValue = stockData.currentPrice * stock.quantity;
        const totalReturn = currentValue - (stock.buyPrice * stock.quantity);
        const returnPercent = ((stockData.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;

        return (
          <motion.div
            key={stock.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/50 shadow-lg shadow-slate-900/5 dark:shadow-black/20 transition-all duration-300"
          >
            {/* Stock Header with Real-time Data */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-300">
                  {stock.ticker}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 transition-colors duration-300">
                  {stock.quantity} shares • Purchased {formatDate(stock.buyDate)}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                    {stockData.source}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(stockData.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">
                  ${stockData.currentPrice.toFixed(2)}
                </div>
                <div className={`flex items-center ${returnPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} transition-colors duration-300`}>
                  {returnPercent >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Daily: {stockData.change >= 0 ? '+' : ''}${stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            {/* Real-time AI Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
                  AI Analysis (Real-time)
                </h4>
                <div className="bg-slate-50/80 dark:bg-black/30 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`text-2xl ${
                        analysis.action === 'BUY' ? 'text-emerald-600 dark:text-green-400' : 
                        analysis.action === 'HOLD' ? 'text-amber-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                      } transition-colors duration-300`}>
                        {analysis.action === 'BUY' ? '✅' : analysis.action === 'HOLD' ? '⚠️' : '❌'}
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${
                          analysis.action === 'BUY' ? 'text-emerald-600 dark:text-green-400' : 
                          analysis.action === 'HOLD' ? 'text-amber-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                        } transition-colors duration-300`}>
                          {analysis.action}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">
                          {analysis.confidence}% confidence
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">Target Price</div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white transition-colors duration-300">
                        ${analysis.targetPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300 text-sm transition-colors duration-300 mb-3">
                    {analysis.reasoning}
                  </p>
                  
                  {/* Technical Indicators */}
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-gray-400">Trend:</span>
                        <span className={`font-medium ${
                          analysis.technicalIndicators.trend === 'BULLISH' ? 'text-green-600 dark:text-green-400' :
                          analysis.technicalIndicators.trend === 'BEARISH' ? 'text-red-600 dark:text-red-400' :
                          'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {analysis.technicalIndicators.trend}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-gray-400">Volatility:</span>
                        <span className={`font-medium ${
                          analysis.technicalIndicators.volatility === 'LOW' ? 'text-green-600 dark:text-green-400' :
                          analysis.technicalIndicators.volatility === 'MEDIUM' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {analysis.technicalIndicators.volatility}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-3">
                    <AlertTriangle className="h-4 w-4 text-slate-500 dark:text-gray-400 mr-2 transition-colors duration-300" />
                    <span className="text-sm text-slate-600 dark:text-gray-400 transition-colors duration-300">
                      Risk Level: <span className={`font-semibold ${
                        analysis.riskLevel === 'LOW' ? 'text-emerald-600 dark:text-green-400' :
                        analysis.riskLevel === 'MEDIUM' ? 'text-amber-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                      } transition-colors duration-300`}>{analysis.riskLevel}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
                  Real-time Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400 transition-colors duration-300">Current Price:</span>
                    <span className="text-slate-900 dark:text-white font-medium transition-colors duration-300">
                      ${stockData.currentPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400 transition-colors duration-300">Day Range:</span>
                    <span className="text-slate-900 dark:text-white font-medium transition-colors duration-300">
                      ${stockData.lowPrice.toFixed(2)} - ${stockData.highPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400 transition-colors duration-300">Open:</span>
                    <span className="text-slate-900 dark:text-white font-medium transition-colors duration-300">
                      ${stockData.openPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400 transition-colors duration-300">Previous Close:</span>
                    <span className="text-slate-900 dark:text-white font-medium transition-colors duration-300">
                      ${stockData.previousClose.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-gray-400 transition-colors duration-300">Investment:</span>
                      <span className="text-slate-900 dark:text-white font-medium transition-colors duration-300">
                        ${(stock.buyPrice * stock.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-gray-400 transition-colors duration-300">Current Value:</span>
                      <span className="text-slate-900 dark:text-white font-medium transition-colors duration-300">
                        ${currentValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-gray-400 transition-colors duration-300">P&L:</span>
                      <span className={`font-medium transition-colors duration-300 ${
                        totalReturn >= 0 ? 'text-emerald-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Performance Summary */}
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 transition-colors duration-300">
                Performance Summary
              </h4>
              <div className="bg-slate-50/80 dark:bg-black/30 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-500 dark:text-gray-400">Total Return</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-500 dark:text-gray-400">Daily Change</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analysis.confidence}%
                    </div>
                    <div className="text-sm text-slate-500 dark:text-gray-400">AI Confidence</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      analysis.riskLevel === 'LOW' ? 'text-green-600 dark:text-green-400' :
                      analysis.riskLevel === 'MEDIUM' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {analysis.riskLevel}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-gray-400">Risk Level</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
});

StockInsights.displayName = 'StockInsights';

export default StockInsights;

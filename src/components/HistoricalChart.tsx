/**
 * Historical Stock Price Chart Component
 * Displays interactive candlestick/line charts with multiple timeframes
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3, 
  LineChart,
  Activity,
  RefreshCw,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
import StockAutocomplete from './StockAutocomplete';
import { FinnhubSearchResult } from '@/services/stockSearchService';
import { useNotifications } from '@/contexts/NotificationContext';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
}

interface HistoricalChartProps {
  className?: string;
  userId?: string; // Add userId prop for notifications
}

type TimeRange = '1D' | '1W' | '1M' | '6M' | '1Y' | '5Y';
type ChartType = 'line' | 'candlestick';

interface ErrorState {
  message: string;
  type: 'network' | 'quota' | 'no-data' | 'api-error' | 'authentication' | 'unknown';
  canRetry: boolean;
  details?: string; // Additional context for the error
}

export default function HistoricalChart({ className = '', userId }: HistoricalChartProps) {
  const { addNotification } = useNotifications();
  const [selectedStock, setSelectedStock] = useState<FinnhubSearchResult | null>({
    symbol: 'AAPL',
    description: 'Apple Inc',
    displaySymbol: 'AAPL',
    type: 'Common Stock'
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  const timeRanges: { key: TimeRange; label: string; days: number }[] = [
    { key: '1D', label: '1 Day', days: 1 },
    { key: '1W', label: '1 Week', days: 7 },
    { key: '1M', label: '1 Month', days: 30 },
    { key: '6M', label: '6 Months', days: 180 },
    { key: '1Y', label: '1 Year', days: 365 },
    { key: '5Y', label: '5 Years', days: 1825 },
  ];

  // Fetch historical data
  useEffect(() => {
    if (!selectedStock) {
      setCandleData([]);
      return;
    }

    fetchHistoricalData();
  }, [selectedStock, timeRange]);

  const fetchHistoricalData = async () => {
    if (!selectedStock) return;

    setIsLoading(true);
    setError(null);

    try {
      const days = timeRanges.find(r => r.key === timeRange)?.days || 30;
      const toTimestamp = Math.floor(Date.now() / 1000);
      const fromTimestamp = toTimestamp - (days * 24 * 60 * 60);

      // Determine resolution based on time range
      let resolution = 'D'; // Daily
      if (days <= 1) resolution = '1';    // 1 minute
      else if (days <= 7) resolution = '5';    // 5 minutes
      else if (days <= 30) resolution = '15';   // 15 minutes
      else if (days <= 180) resolution = 'D';   // Daily
      else resolution = 'W'; // Weekly

      const response = await fetch(`/api/finnhub/candle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          resolution,
          from: fromTimestamp,
          to: toTimestamp,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const errorState: ErrorState = {
            message: 'API quota exceeded. Please try again later.',
            type: 'quota',
            canRetry: true
          };
          setError(errorState);
          
          // Send notification for quota exceeded
          if (userId) {
            await addNotification({
              userId,
              title: 'API Quota Exceeded',
              message: `Historical data request for ${selectedStock.symbol} failed due to API limits. Please wait before retrying.`,
              type: 'WARNING'
            });
          }
          return;
        }
        
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          const errorState: ErrorState = {
            message: errorData.message || 'Historical data access is restricted. Your API plan may not include candle data access.',
            type: 'quota',
            canRetry: false,
            details: errorData.suggestion || 'Consider upgrading your Finnhub subscription for historical chart data.'
          };
          setError(errorState);
          
          // Send notification for forbidden access
          if (userId) {
            await addNotification({
              userId,
              title: 'Historical Data Access Restricted',
              message: `${errorData.message || `Access to historical candle data for ${selectedStock.symbol} is not available with your current API plan.`} ${errorData.suggestion || 'Consider upgrading your Finnhub subscription for historical chart data.'}`,
              type: 'WARNING'
            });
          }
          return;
        }
        
        if (response.status === 401) {
          const errorState: ErrorState = {
            message: 'API authentication failed. Please check your API configuration.',
            type: 'authentication',
            canRetry: false
          };
          setError(errorState);
          
          if (userId) {
            await addNotification({
              userId,
              title: 'API Authentication Failed',
              message: 'Unable to fetch historical data due to authentication issues.',
              type: 'ERROR'
            });
          }
          return;
        }
        
        if (response.status >= 500) {
          const errorState: ErrorState = {
            message: 'Server error occurred. Please try again later.',
            type: 'api-error',
            canRetry: true
          };
          setError(errorState);
          return;
        }
        
        const errorState: ErrorState = {
          message: `Failed to fetch historical data (${response.status})`,
          type: 'api-error',
          canRetry: true
        };
        setError(errorState);
        return;
      }

      const data = await response.json();

      if (data.s === 'no_data') {
        const errorState: ErrorState = {
          message: `No historical data available for ${selectedStock.symbol} in the selected time range.`,
          type: 'no-data',
          canRetry: false
        };
        setError(errorState);
        
        if (userId) {
          await addNotification({
            userId,
            title: 'No Data Available',
            message: `Historical data for ${selectedStock.symbol} is not available for the selected time period.`,
            type: 'INFO'
          });
        }
        return;
      }

      if (data.s === 'error') {
        const errorState: ErrorState = {
          message: 'Error occurred while fetching data from the API.',
          type: 'api-error',
          canRetry: true
        };
        setError(errorState);
        return;
      }

      // Validate data structure
      if (!data.t || !Array.isArray(data.t) || data.t.length === 0) {
        const errorState: ErrorState = {
          message: 'Invalid data format received from API.',
          type: 'api-error',
          canRetry: true
        };
        setError(errorState);
        return;
      }

      // Transform data
      const candles: CandleData[] = data.t.map((timestamp: number, index: number) => ({
        timestamp,
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close: data.c[index],
        volume: data.v[index],
        date: new Date(timestamp * 1000).toLocaleDateString(),
      }));

      setCandleData(candles);
      setRetryCount(0); // Reset retry count on success
      setLastFetchTime(Date.now());

      // Send success notification on first successful load
      if (retryCount > 0 && userId) {
        await addNotification({
          userId,
          title: 'Data Loaded Successfully',
          message: `Historical data for ${selectedStock.symbol} has been loaded.`,
          type: 'SUCCESS'
        });
      }

    } catch (err) {
      console.error('Error fetching historical data:', err);
      
      // Categorize the error
      let errorState: ErrorState;
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        // Network error
        errorState = {
          message: 'Network connection failed. Please check your internet connection.',
          type: 'network',
          canRetry: true
        };
        
        if (userId) {
          await addNotification({
            userId,
            title: 'Connection Error',
            message: 'Unable to fetch historical data due to network issues.',
            type: 'ERROR'
          });
        }
      } else if (err instanceof Error) {
        // Other known errors
        errorState = {
          message: err.message,
          type: 'unknown',
          canRetry: true
        };
      } else {
        // Unknown errors
        errorState = {
          message: 'An unexpected error occurred while fetching data.',
          type: 'unknown',
          canRetry: true
        };
      }
      
      setError(errorState);
      setCandleData([]);
    } finally {
      setIsLoading(false);
    }
  };  const handleStockSelect = (stock: FinnhubSearchResult) => {
    setSelectedStock(stock);
    setError(null);
    setRetryCount(0);
    setLastFetchTime(null);
  };

  const handleRetry = async () => {
    if (error && error.canRetry && retryCount < 3) {
      setRetryCount(prev => prev + 1);
      await fetchHistoricalData();
    }
  };

  const getErrorIcon = (errorType: ErrorState['type']) => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="w-8 h-8 mx-auto text-red-400 mb-4" />;
      case 'quota':
        return <AlertCircle className="w-8 h-8 mx-auto text-yellow-400 mb-4" />;
      case 'no-data':
        return <Activity className="w-8 h-8 mx-auto text-blue-400 mb-4" />;
      case 'authentication':
        return <AlertCircle className="w-8 h-8 mx-auto text-orange-400 mb-4" />;
      default:
        return <AlertCircle className="w-8 h-8 mx-auto text-red-400 mb-4" />;
    }
  };

  const getErrorColor = (errorType: ErrorState['type']) => {
    switch (errorType) {
      case 'network':
        return 'text-red-600';
      case 'quota':
        return 'text-yellow-600';
      case 'no-data':
        return 'text-blue-600';
      case 'authentication':
        return 'text-orange-600';
      default:
        return 'text-red-600';
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toLocaleString();
  };

  const calculateStats = () => {
    if (candleData.length === 0) return null;

    const latest = candleData[candleData.length - 1];
    const earliest = candleData[0];
    const change = latest.close - earliest.close;
    const changePercent = (change / earliest.close) * 100;
    const high = Math.max(...candleData.map(c => c.high));
    const low = Math.min(...candleData.map(c => c.low));

    return {
      latest,
      change,
      changePercent,
      high,
      low,
    };
  };

  const stats = calculateStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Historical Stock Prices</h2>
        
        {/* Stock Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Stock
          </label>
          <StockAutocomplete
            onSelect={handleStockSelect}
            placeholder="Search for stocks to view historical data..."
            className="max-w-md"
          />
        </div>

        {/* Selected Stock Info */}
        {selectedStock && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-blue-900 text-lg">{selectedStock.symbol}</h3>
                <p className="text-blue-700 text-sm">{selectedStock.description}</p>
              </div>
              {stats && (
                <div className="text-right">
                  <div className="font-bold text-lg">{formatPrice(stats.latest.close)}</div>
                  <div className={`text-sm ${getChangeColor(stats.change)}`}>
                    {stats.change >= 0 ? '+' : ''}{formatPrice(stats.change)} 
                    ({stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%)
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Controls */}
        {selectedStock && (
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Time Range Selector */}
            <div className="flex flex-wrap gap-2">
              {timeRanges.map((range) => (
                <button
                  key={range.key}
                  onClick={() => setTimeRange(range.key)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range.key
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Chart Type Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'line'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Line Chart"
              >
                <LineChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'candlestick'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Candlestick Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={fetchHistoricalData}
                disabled={isLoading}
                className="p-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chart Area */}
      {selectedStock && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Loading historical data...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              {getErrorIcon(error.type)}
              <p className={`${getErrorColor(error.type)} mb-2 font-medium`}>
                {error.type === 'network' ? 'Connection Error' :
                 error.type === 'quota' ? 'Access Restricted' :
                 error.type === 'no-data' ? 'No Data Available' :
                 error.type === 'authentication' ? 'Authentication Error' :
                 'Error Loading Data'}
              </p>
              <p className="text-gray-600 text-sm mb-4">{error.message}</p>
              
              {error.type === 'quota' && !error.canRetry && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Why is this happening?</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Your current Finnhub plan may not include historical data access</li>
                    <li>• Historical candle data requires a paid subscription</li>
                    <li>• Real-time stock quotes are still available</li>
                  </ul>
                  {error.details && (
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <p className="text-xs text-yellow-600">
                        <strong>Solution:</strong> {error.details}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {error.canRetry && retryCount < 3 && (
                <div className="space-y-2">
                  <button
                    onClick={handleRetry}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-md text-white transition-colors ${
                      error.type === 'quota' 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Retrying...</span>
                      </div>
                    ) : (
                      `Try Again ${retryCount > 0 ? `(${retryCount}/3)` : ''}`
                    )}
                  </button>
                  
                  {error.type === 'quota' && error.canRetry && (
                    <p className="text-xs text-gray-500">
                      API quota resets periodically. Consider waiting before retrying.
                    </p>
                  )}
                  
                  {error.type === 'network' && (
                    <p className="text-xs text-gray-500">
                      Please check your internet connection and try again.
                    </p>
                  )}
                </div>
              )}
              
              {retryCount >= 3 && error.canRetry && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600 mb-2">
                    Maximum retry attempts reached.
                  </p>
                  <button
                    onClick={() => {
                      setRetryCount(0);
                      setError(null);
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    Reset and Try Different Stock
                  </button>
                </div>
              )}
              
              {!error.canRetry && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    {error.type === 'no-data' 
                      ? 'Try selecting a different time range or stock symbol.'
                      : 'This error cannot be automatically resolved. Please contact support if the issue persists.'
                    }
                  </p>
                </div>
              )}
              
              {lastFetchTime && (
                <p className="text-xs text-gray-400 mt-2">
                  Last successful fetch: {new Date(lastFetchTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : candleData.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-8 h-8 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No data available</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Stats Row */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Current</div>
                    <div className="font-semibold">{formatPrice(stats.latest.close)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">High</div>
                    <div className="font-semibold text-green-600">{formatPrice(stats.high)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Low</div>
                    <div className="font-semibold text-red-600">{formatPrice(stats.low)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Volume</div>
                    <div className="font-semibold">{formatVolume(stats.latest.volume)}</div>
                  </div>
                </div>
              )}

              {/* Simple Chart Representation */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  {chartType === 'line' ? 'Price Line Chart' : 'Candlestick Chart'}
                </h3>
                
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Interactive Chart</p>
                  <p className="text-sm text-gray-500">
                    Chart visualization with {candleData.length} data points
                  </p>
                  <div className="mt-4 text-xs text-gray-400">
                    Note: Full chart implementation requires a charting library like Chart.js or D3.js
                  </div>
                </div>

                {/* Data Table */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Recent Data Points</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Open</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">High</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Low</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Close</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {candleData.slice(-10).reverse().map((candle, index) => (
                          <tr key={candle.timestamp} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{candle.date}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatPrice(candle.open)}</td>
                            <td className="px-4 py-2 text-sm text-green-600">{formatPrice(candle.high)}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{formatPrice(candle.low)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">{formatPrice(candle.close)}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{formatVolume(candle.volume)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

interface PriceData {
  timestamp: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalData {
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  upperBand?: number;
  lowerBand?: number;
}

interface ChartDataPoint extends PriceData, TechnicalData {}

interface PriceChartProps {
  ticker: string;
  data?: ChartDataPoint[];
  loading?: boolean;
  height?: number;
  chartType?: 'line' | 'candlestick';
  timeframe?: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
  showTechnicals?: boolean;
  showVolume?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
}

const PriceChart: React.FC<PriceChartProps> = ({
  ticker,
  data = [],
  loading = false,
  height = 400,
  chartType = 'line',
  timeframe = '1M',
  showTechnicals = true,
  showVolume = false,
  onTimeframeChange,
}) => {
  const [localData, setLocalData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(loading);
  const [error, setError] = useState<string | null>(null);

  // Fetch price data with analytics
  const fetchPriceData = useCallback(async (selectedTimeframe: string = timeframe) => {
    if (!ticker || ticker.trim() === '') {
      console.warn('PriceChart: Invalid ticker provided:', ticker);
      setError('Invalid ticker symbol');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/analytics/prices/${ticker}?format=chart&timeframe=${selectedTimeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.chartData) {
        setLocalData(result.data.chartData);
      } else {
        throw new Error(result.message || 'Invalid data format');
      }
    } catch (err) {
      console.error('Error fetching price data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLocalData([]);
    } finally {
      setIsLoading(false);
    }
  }, [ticker, timeframe]);

  // Load data on component mount or when ticker/timeframe changes
  useEffect(() => {
    if (data && data.length > 0) {
      setLocalData(data);
      setIsLoading(false);
    } else if (ticker && ticker.trim() !== '') {
      fetchPriceData();
    }
  }, [fetchPriceData]);

  // Handle external data prop changes
  useEffect(() => {
    if (data && data.length > 0) {
      setLocalData(data);
      setIsLoading(false);
    }
  }, [data]);

  // Handle timeframe selection
  const handleTimeframeChange = (newTimeframe: string) => {
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    } else {
      fetchPriceData(newTimeframe);
    }
  };

  // Custom tooltip for price data
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Open: </span>
              <span className="font-medium">${data.open?.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">High: </span>
              <span className="font-medium text-green-600">${data.high?.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Low: </span>
              <span className="font-medium text-red-600">${data.low?.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Close: </span>
              <span className="font-medium">${data.close?.toFixed(2)}</span>
            </p>
            {data.volume && (
              <p className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Volume: </span>
                <span className="font-medium">{(data.volume / 1000000).toFixed(2)}M</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {ticker} Price Chart
          </h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading price data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {ticker} Price Chart
          </h3>
          <button
            onClick={() => fetchPriceData()}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-500 dark:text-red-400 text-center">
            <p className="mb-2">Failed to load price data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!localData || localData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {ticker} Price Chart
          </h3>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">No price data available</div>
        </div>
      </div>
    );
  }

  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      {/* Header with timeframe selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {ticker} Price Chart
        </h3>
        <div className="flex space-x-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                tf === timeframe
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Price Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={localData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#666"
              tick={{ fontSize: 12 }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Price Line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Price"
            />
            
            {/* Technical Indicators */}
            {showTechnicals && (
              <>
                {localData.some(d => d.sma20) && (
                  <Line
                    type="monotone"
                    dataKey="sma20"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="SMA 20"
                  />
                )}
                {localData.some(d => d.sma50) && (
                  <Line
                    type="monotone"
                    dataKey="sma50"
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="SMA 50"
                  />
                )}
                {localData.some(d => d.sma200) && (
                  <Line
                    type="monotone"
                    dataKey="sma200"
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    name="SMA 200"
                  />
                )}
                {localData.some(d => d.upperBand && d.lowerBand) && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="upperBand"
                      stroke="#8b5cf6"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      name="BB Upper"
                    />
                    <Line
                      type="monotone"
                      dataKey="lowerBand"
                      stroke="#8b5cf6"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                      name="BB Lower"
                    />
                  </>
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showTechnicals}
              onChange={(e) => {
                // This would need to be passed as prop or managed by parent
                console.log('Show technicals:', e.target.checked);
              }}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Technical Indicators</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showVolume}
              onChange={(e) => {
                // This would need to be passed as prop or managed by parent
                console.log('Show volume:', e.target.checked);
              }}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Volume</span>
          </label>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {localData.length} data points
        </div>
      </div>
    </div>
  );
};

export default PriceChart;

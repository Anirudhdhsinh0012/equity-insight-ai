'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface PerformanceData {
  returns: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  volatility: {
    annualized: number;
    daily: number;
    weekly: number;
  };
  risk: {
    sharpeRatio?: number;
    beta?: number;
    var95?: number;
    maxDrawdown?: number;
  };
  technicalSignals: {
    trend: 'bullish' | 'bearish' | 'neutral';
    momentum: 'strong' | 'weak' | 'neutral';
    support: number;
    resistance: number;
    signals: string[];
  };
  priceStats: {
    currentPrice: number;
    dayHigh: number;
    dayLow: number;
    weekHigh52: number;
    weekLow52: number;
    marketCap?: number;
    peRatio?: number;
  };
}

interface PerformanceMetricsProps {
  ticker: string;
  data?: PerformanceData;
  loading?: boolean;
  showDetailed?: boolean;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  ticker,
  data,
  loading = false,
  showDetailed = true,
}) => {
  const [localData, setLocalData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [activeMetric, setActiveMetric] = useState<'returns' | 'risk' | 'technicals'>('returns');
  const [error, setError] = useState<string | null>(null);

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    if (!ticker || ticker.trim() === '') {
      console.warn('PerformanceMetrics: Invalid ticker provided:', ticker);
      setError('Invalid ticker symbol');
      setLocalData(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/analytics/prices/${ticker}?format=detailed`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform API data to component format
        const performanceData: PerformanceData = {
          returns: {
            daily: result.data.analytics?.returns?.daily || 0,
            weekly: result.data.analytics?.returns?.weekly || 0,
            monthly: result.data.analytics?.returns?.monthly || 0,
            quarterly: result.data.analytics?.returns?.quarterly || 0,
            yearly: result.data.analytics?.returns?.yearly || 0,
          },
          volatility: {
            annualized: result.data.analytics?.volatility?.annualized || 0,
            daily: result.data.analytics?.volatility?.daily || 0,
            weekly: result.data.analytics?.volatility?.weekly || 0,
          },
          risk: {
            sharpeRatio: result.data.analytics?.risk?.sharpeRatio,
            beta: result.data.analytics?.risk?.beta,
            var95: result.data.analytics?.risk?.var95,
            maxDrawdown: result.data.analytics?.risk?.maxDrawdown,
          },
          technicalSignals: {
            trend: result.data.technical?.trend || 'neutral',
            momentum: result.data.technical?.momentum || 'neutral',
            support: result.data.technical?.support || 0,
            resistance: result.data.technical?.resistance || 0,
            signals: result.data.technical?.signals || [],
          },
          priceStats: {
            currentPrice: result.data.currentPrice || 0,
            dayHigh: result.data.dayHigh || 0,
            dayLow: result.data.dayLow || 0,
            weekHigh52: result.data.weekHigh52 || 0,
            weekLow52: result.data.weekLow52 || 0,
            marketCap: result.data.marketCap,
            peRatio: result.data.peRatio,
          },
        };
        
        setLocalData(performanceData);
      } else {
        throw new Error(result.message || 'Invalid data format');
      }
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLocalData(null);
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  // Load data on component mount
  useEffect(() => {
    if (data) {
      setLocalData(data);
      setIsLoading(false);
    } else {
      fetchPerformanceData();
    }
  }, [data, fetchPerformanceData]);

  // Format percentage with color
  const formatPercentage = (value: number, showSign: boolean = true) => {
    const formatted = `${showSign && value > 0 ? '+' : ''}${value.toFixed(2)}%`;
    const colorClass = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
    return { formatted, colorClass };
  };

  // Format large numbers
  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Returns chart data
  const getReturnsData = () => {
    if (!localData) return [];
    
    return [
      { period: '1D', value: localData.returns.daily, label: 'Daily' },
      { period: '1W', value: localData.returns.weekly, label: 'Weekly' },
      { period: '1M', value: localData.returns.monthly, label: 'Monthly' },
      { period: '3M', value: localData.returns.quarterly, label: 'Quarterly' },
      { period: '1Y', value: localData.returns.yearly, label: 'Yearly' },
    ];
  };

  // Risk distribution data
  const getRiskData = () => {
    if (!localData) return [];
    
    return [
      { name: 'Low Risk', value: 30, color: '#10b981' },
      { name: 'Medium Risk', value: 45, color: '#f59e0b' },
      { name: 'High Risk', value: 25, color: '#ef4444' },
    ];
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Metrics
          </h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading performance data...</div>
        </div>
      </div>
    );
  }

  if (error || !localData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Metrics
          </h3>
          <button
            onClick={fetchPerformanceData}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-500 dark:text-red-400 text-center">
            <p className="mb-2">Failed to load performance data</p>
            {error && <p className="text-sm">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      {/* Header with metric selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Metrics - {ticker}
        </h3>
        <div className="flex space-x-2">
          {(['returns', 'risk', 'technicals'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={`px-3 py-1 text-sm rounded transition-colors capitalize ${
                metric === activeMetric
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Current Price</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            ${localData.priceStats.currentPrice.toFixed(2)}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Daily Return</div>
          <div className={`text-lg font-semibold ${formatPercentage(localData.returns.daily).colorClass}`}>
            {formatPercentage(localData.returns.daily).formatted}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Volatility</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {localData.volatility.annualized.toFixed(2)}%
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Trend</div>
          <div className={`text-lg font-semibold capitalize ${
            localData.technicalSignals.trend === 'bullish' ? 'text-green-600' :
            localData.technicalSignals.trend === 'bearish' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {localData.technicalSignals.trend}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-64 mb-6">
        {activeMetric === 'returns' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getReturnsData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="period" stroke="#666" tick={{ fontSize: 12 }} />
              <YAxis stroke="#666" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => [`${value.toFixed(2)}%`, 'Return']}
                labelFormatter={(label) => `${label} Return`}
              />
              <Bar 
                dataKey="value" 
                fill="#2563eb"
                name="Return %"
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeMetric === 'risk' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getRiskData()}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {getRiskData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value}%`, 'Risk Level']} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {activeMetric === 'technicals' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Support Level</div>
                <div className="text-lg font-semibold text-green-600">
                  ${localData.technicalSignals.support.toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Resistance Level</div>
                <div className="text-lg font-semibold text-red-600">
                  ${localData.technicalSignals.resistance.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Technical Signals</div>
              <div className="flex flex-wrap gap-2">
                {localData.technicalSignals.signals.map((signal, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Momentum</div>
              <div className={`text-lg font-semibold capitalize ${
                localData.technicalSignals.momentum === 'strong' ? 'text-green-600' :
                localData.technicalSignals.momentum === 'weak' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {localData.technicalSignals.momentum}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Metrics */}
      {showDetailed && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
            Detailed Analytics
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">52W High: </span>
              <span className="font-medium">${localData.priceStats.weekHigh52.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">52W Low: </span>
              <span className="font-medium">${localData.priceStats.weekLow52.toFixed(2)}</span>
            </div>
            {localData.priceStats.marketCap && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Market Cap: </span>
                <span className="font-medium">{formatLargeNumber(localData.priceStats.marketCap)}</span>
              </div>
            )}
            {localData.priceStats.peRatio && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">P/E Ratio: </span>
                <span className="font-medium">{localData.priceStats.peRatio.toFixed(2)}</span>
              </div>
            )}
            {localData.risk.sharpeRatio && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Sharpe Ratio: </span>
                <span className="font-medium">{localData.risk.sharpeRatio.toFixed(2)}</span>
              </div>
            )}
            {localData.risk.maxDrawdown && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Max Drawdown: </span>
                <span className="font-medium text-red-600">{localData.risk.maxDrawdown.toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;

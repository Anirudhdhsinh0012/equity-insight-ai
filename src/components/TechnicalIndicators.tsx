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
  BarChart,
  Bar,
} from 'recharts';

interface TechnicalData {
  date: string;
  rsi?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  stochK?: number;
  stochD?: number;
  atr?: number;
  volume?: number;
}

interface TechnicalIndicatorsProps {
  ticker: string;
  data?: TechnicalData[];
  loading?: boolean;
  height?: number;
  indicators?: string[];
  timeframe?: string;
}

const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({
  ticker,
  data = [],
  loading = false,
  height = 300,
  indicators = ['RSI', 'MACD'],
  timeframe = '1M',
}) => {
  const [localData, setLocalData] = useState<TechnicalData[]>([]);
  const [isLoading, setIsLoading] = useState(loading);
  const [selectedIndicator, setSelectedIndicator] = useState(indicators[0] || 'RSI');

  // Fetch technical data
  const fetchTechnicalData = useCallback(async () => {
    if (!ticker || ticker.trim() === '') {
      console.warn('TechnicalIndicators: Invalid ticker provided:', ticker);
      setLocalData([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/analytics/prices/${ticker}?format=technicals&timeframe=${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch technical data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.technicals) {
        // Convert technicals data to chart format
        const chartData = result.data.technicals.map((item: any, index: number) => ({
          date: item.date || `Day ${index + 1}`,
          rsi: item.rsi,
          macd: item.macd,
          signal: item.signal,
          histogram: item.histogram,
          stochK: item.stochK,
          stochD: item.stochD,
          atr: item.atr,
          volume: item.volume,
        }));
        setLocalData(chartData);
      }
    } catch (err) {
      console.error('Error fetching technical data:', err);
      setLocalData([]);
    } finally {
      setIsLoading(false);
    }
  }, [ticker, timeframe]);

  // Load data on component mount
  useEffect(() => {
    if (data && data.length > 0) {
      setLocalData(data);
      setIsLoading(false);
    } else if (ticker && ticker.trim() !== '') {
      fetchTechnicalData();
    }
  }, [fetchTechnicalData]);

  // Handle external data prop changes
  useEffect(() => {
    if (data && data.length > 0) {
      setLocalData(data);
      setIsLoading(false);
    }
  }, [data]);

  // Custom tooltip for technical indicators
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          <div className="mt-2 space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">{entry.name}: </span>
                <span className="font-medium" style={{ color: entry.color }}>
                  {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // RSI Chart Component
  const RSIChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={localData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
        <YAxis 
          stroke="#666" 
          tick={{ fontSize: 12 }} 
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* RSI Overbought/Oversold Lines */}
        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" label="Overbought" />
        <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 5" label="Oversold" />
        <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="2 2" />
        
        <Line
          type="monotone"
          dataKey="rsi"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          name="RSI"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // MACD Chart Component
  const MACDChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={localData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
        <YAxis stroke="#666" tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Zero Line */}
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
        
        <Line
          type="monotone"
          dataKey="macd"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          name="MACD"
        />
        <Line
          type="monotone"
          dataKey="signal"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          name="Signal"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Stochastic Chart Component
  const StochasticChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={localData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
        <YAxis 
          stroke="#666" 
          tick={{ fontSize: 12 }} 
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Stochastic Overbought/Oversold Lines */}
        <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" label="Overbought" />
        <ReferenceLine y={20} stroke="#10b981" strokeDasharray="5 5" label="Oversold" />
        
        <Line
          type="monotone"
          dataKey="stochK"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
          name="Stoch %K"
        />
        <Line
          type="monotone"
          dataKey="stochD"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="Stoch %D"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Volume Chart Component
  const VolumeChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={localData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 12 }} />
        <YAxis stroke="#666" tick={{ fontSize: 12 }} />
        <Tooltip 
          content={<CustomTooltip />}
          formatter={(value: any) => [(value / 1000000).toFixed(2) + 'M', 'Volume']}
        />
        
        <Bar dataKey="volume" fill="#6b7280" name="Volume" />
      </BarChart>
    </ResponsiveContainer>
  );

  // Get indicator interpretation
  const getIndicatorInterpretation = (indicator: string) => {
    if (!localData.length) return null;
    
    const latestData = localData[localData.length - 1];
    
    switch (indicator) {
      case 'RSI':
        const rsi = latestData.rsi;
        if (!rsi) return null;
        return {
          value: rsi.toFixed(2),
          signal: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
          color: rsi > 70 ? 'text-red-600' : rsi < 30 ? 'text-green-600' : 'text-gray-600',
        };
      
      case 'MACD':
        const macd = latestData.macd;
        const signal = latestData.signal;
        if (!macd || !signal) return null;
        const crossover = macd > signal ? 'Bullish' : 'Bearish';
        return {
          value: `${macd.toFixed(3)} / ${signal.toFixed(3)}`,
          signal: crossover,
          color: crossover === 'Bullish' ? 'text-green-600' : 'text-red-600',
        };
      
      default:
        return null;
    }
  };

  const renderChart = () => {
    switch (selectedIndicator) {
      case 'RSI':
        return <RSIChart />;
      case 'MACD':
        return <MACDChart />;
      case 'Stochastic':
        return <StochasticChart />;
      case 'Volume':
        return <VolumeChart />;
      default:
        return <RSIChart />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Technical Indicators
          </h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="h-72 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading technical data...</div>
        </div>
      </div>
    );
  }

  const availableIndicators = ['RSI', 'MACD', 'Stochastic', 'Volume'];
  const interpretation = getIndicatorInterpretation(selectedIndicator);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      {/* Header with indicator selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Technical Indicators
        </h3>
        <div className="flex space-x-2">
          {availableIndicators.map((indicator) => (
            <button
              key={indicator}
              onClick={() => setSelectedIndicator(indicator)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                indicator === selectedIndicator
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {indicator}
            </button>
          ))}
        </div>
      </div>

      {/* Indicator interpretation */}
      {interpretation && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current {selectedIndicator}:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {interpretation.value}
            </span>
          </div>
          <div className="mt-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Signal: </span>
            <span className={`text-sm font-medium ${interpretation.color}`}>
              {interpretation.signal}
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        {localData.length > 0 ? (
          renderChart()
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400">
              No technical data available for {ticker}
            </div>
          </div>
        )}
      </div>

      {/* Indicator descriptions */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {selectedIndicator === 'RSI' && (
          <p>RSI (Relative Strength Index): Measures momentum. Values above 70 suggest overbought conditions, below 30 suggest oversold.</p>
        )}
        {selectedIndicator === 'MACD' && (
          <p>MACD (Moving Average Convergence Divergence): Shows relationship between two moving averages. Bullish when MACD crosses above signal line.</p>
        )}
        {selectedIndicator === 'Stochastic' && (
          <p>Stochastic Oscillator: Compares closing price to price range. Values above 80 suggest overbought, below 20 suggest oversold.</p>
        )}
        {selectedIndicator === 'Volume' && (
          <p>Trading Volume: Number of shares traded. High volume often confirms price movements.</p>
        )}
      </div>
    </div>
  );
};

export default TechnicalIndicators;

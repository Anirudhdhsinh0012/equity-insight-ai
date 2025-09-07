'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Portfolio } from '@/types';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface ReportsProps {
  portfolio: Portfolio;
}

export default function Reports({ portfolio }: ReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate performance data
  const generatePerformanceData = () => {
    const periods = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    const days = periods[selectedPeriod];
    
    const data = [];
    for (let i = 0; i < days; i += Math.floor(days / 12)) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const baseValue = portfolio.totalInvestment;
      const volatility = 0.02;
      const trend = portfolio.totalReturnPercent / 100 / days;
      const value = baseValue * (1 + trend * i + (Math.random() - 0.5) * volatility);
      
      data.push({
        date: date.toLocaleDateString(),
        value: parseFloat(value.toFixed(2)),
        investment: baseValue,
      });
    }
    
    return data;
  };

  // Generate sector allocation data
  const generateSectorData = () => {
    const sectors = [
      { name: 'Technology', value: 45, color: '#FFFFFF' },
      { name: 'Healthcare', value: 25, color: '#D1D5DB' },
      { name: 'Finance', value: 20, color: '#9CA3AF' },
      { name: 'Energy', value: 10, color: '#6B7280' },
    ];
    
    return sectors;
  };

  const performanceData = generatePerformanceData();
  const sectorData = generateSectorData();

  const metrics = [
    {
      label: 'Total Return',
      value: `${portfolio.totalReturn >= 0 ? '+' : ''}$${portfolio.totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: portfolio.totalReturnPercent,
      icon: portfolio.totalReturn >= 0 ? TrendingUp : TrendingDown,
      color: portfolio.totalReturn >= 0 ? 'text-emerald-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Portfolio Value',
      value: `$${portfolio.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: portfolio.totalReturnPercent,
      icon: DollarSign,
      color: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Best Performer',
      value: portfolio.stocks.length > 0 ? portfolio.stocks[0]?.ticker || 'N/A' : 'N/A',
      change: 15.2,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-green-400',
    },
    {
      label: 'Worst Performer',
      value: portfolio.stocks.length > 0 ? portfolio.stocks[portfolio.stocks.length - 1]?.ticker || 'N/A' : 'N/A',
      change: -5.8,
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Portfolio Reports</h2>
          <p className="text-slate-600 dark:text-gray-400 transition-colors duration-300">Comprehensive analysis and insights</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:bg-white text-white dark:text-black rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:bg-gray-200 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </motion.button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-white/20 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`h-5 w-5 ${metric.color} transition-colors duration-300`} />
              <span className={`text-sm ${metric.color} flex items-center transition-colors duration-300`}>
                {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-sm text-slate-500 dark:text-gray-400 mb-1 transition-colors duration-300">{metric.label}</h3>
            <p className={`text-xl font-bold ${metric.color} transition-colors duration-300`}>{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-white/20 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-300"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors duration-300">Portfolio Performance</h3>
          <div className="flex space-x-2">
            {(['1M', '3M', '6M', '1Y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                  selectedPeriod === period
                    ? 'bg-blue-600 dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-slate-200/50 dark:bg-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/70 dark:hover:bg-white/20'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(203, 213, 225)" className="dark:stroke-gray-600 opacity-30" />
              <XAxis dataKey="date" stroke="rgb(71, 85, 105)" className="dark:stroke-gray-400" fontSize={12} />
              <YAxis stroke="rgb(71, 85, 105)" className="dark:stroke-gray-400" fontSize={12} />
              <Bar dataKey="value" fill="rgb(59, 130, 246)" className="dark:fill-white" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sector Allocation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Sector Allocation</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {sectorData.map((sector) => (
              <div key={sector.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sector.color }}
                  />
                  <span className="text-gray-300 text-sm">{sector.name}</span>
                </div>
                <span className="text-white text-sm font-medium">{sector.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Holdings Summary</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          
          <motion.div
            animate={{ height: isExpanded ? 'auto' : '200px' }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {portfolio.stocks.map((stock) => {
                const currentValue = (stock.currentPrice || 0) * stock.quantity;
                const totalReturn = currentValue - (stock.buyPrice * stock.quantity);
                const returnPercent = ((stock.currentPrice || 0) - stock.buyPrice) / stock.buyPrice * 100;

                return (
                  <div key={stock.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-b-0">
                    <div>
                      <div className="font-medium text-white">{stock.ticker}</div>
                      <div className="text-sm text-gray-400">{stock.quantity} shares</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">${currentValue.toFixed(2)}</div>
                      <div className={`text-sm ${returnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-400 bg-opacity-10 rounded-lg border border-green-400 border-opacity-20">
            <div className="text-green-400">✅</div>
            <div>
              <div className="text-white font-medium">AAPL +12% - Hold Recommendation</div>
              <div className="text-gray-400 text-sm">Strong performance continues</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-red-400 bg-opacity-10 rounded-lg border border-red-400 border-opacity-20">
            <div className="text-red-400">❌</div>
            <div>
              <div className="text-white font-medium">TSLA -8% - Consider Selling</div>
              <div className="text-gray-400 text-sm">Momentum weakening</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-yellow-400 bg-opacity-10 rounded-lg border border-yellow-400 border-opacity-20">
            <div className="text-yellow-400">⚠️</div>
            <div>
              <div className="text-white font-medium">NVDA trending strong - Good time to Buy More</div>
              <div className="text-gray-400 text-sm">AI sector momentum</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { User } from '@/types';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { MockNotificationProvider } from '@/contexts/MockNotificationContext';

// Import new UI components
import StockMarketBackground from './StockMarketBackground';
import ModernNavigation from './ModernNavigation';
import DashboardHeader from './DashboardHeader';
import { StockCardGrid } from './AnimatedStockCard';
import ThemeToggle from './ThemeToggle';

const WorkingDemoEnhanced: React.FC = () => {
  const [activeTab, setActiveTab] = useState('portfolio');

  // Demo user data
  const demoUser: User = {
    id: 'demo-user',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    createdAt: new Date()
  };

  // Demo portfolio data
  const demoPortfolio = {
    currentValue: 45250.75,
    totalInvestment: 42000.00,
    totalReturn: 3250.75,
    totalReturnPercent: 7.74
  };

  // Demo stock data with more realistic data
  const demoStocks = [
    {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      currentPrice: 175.50,
      change: 5.25,
      changePercent: 3.08,
      volume: 45832100,
      marketCap: 2800000000000,
      high52Week: 198.23,
      low52Week: 124.17,
      peRatio: 28.5,
      isWatched: true,
      lastUpdate: new Date()
    },
    {
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      currentPrice: 2845.30,
      change: -15.70,
      changePercent: -0.55,
      volume: 1248900,
      marketCap: 1900000000000,
      high52Week: 3030.93,
      low52Week: 2193.62,
      peRatio: 25.8,
      isWatched: true,
      lastUpdate: new Date()
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corp.',
      currentPrice: 395.80,
      change: 12.45,
      changePercent: 3.25,
      volume: 23847200,
      marketCap: 2950000000000,
      high52Week: 468.35,
      low52Week: 309.45,
      peRatio: 32.1,
      isWatched: true,
      lastUpdate: new Date()
    },
    {
      ticker: 'TSLA',
      name: 'Tesla Inc.',
      currentPrice: 245.60,
      change: -8.30,
      changePercent: -3.27,
      volume: 78392100,
      marketCap: 780000000000,
      high52Week: 299.29,
      low52Week: 152.37,
      peRatio: 65.4,
      isWatched: true,
      lastUpdate: new Date()
    },
    {
      ticker: 'AMZN',
      name: 'Amazon.com Inc.',
      currentPrice: 142.75,
      change: 2.15,
      changePercent: 1.53,
      volume: 42156800,
      marketCap: 1480000000000,
      high52Week: 170.89,
      low52Week: 118.35,
      peRatio: 45.2,
      isWatched: true,
      lastUpdate: new Date()
    },
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corp.',
      currentPrice: 485.20,
      change: 18.95,
      changePercent: 4.07,
      volume: 35892400,
      marketCap: 1200000000000,
      high52Week: 502.66,
      low52Week: 180.96,
      peRatio: 71.8,
      isWatched: true,
      lastUpdate: new Date()
    }
  ];

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'portfolio':
        return (
          <div className="space-y-8">
            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Value</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      ${demoPortfolio.currentValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                      +${(demoPortfolio.currentValue - demoPortfolio.totalInvestment).toLocaleString()} today
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-500" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Return</p>
                    <p className={`text-2xl font-bold ${demoPortfolio.totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${demoPortfolio.totalReturn.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                      Since inception
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Return %</p>
                    <p className={`text-2xl font-bold ${demoPortfolio.totalReturnPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      +{demoPortfolio.totalReturnPercent.toFixed(2)}%
                    </p>
                    <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                      Portfolio performance
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Holdings</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {demoStocks.length}
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                      Diversified positions
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-amber-500" />
                </div>
              </motion.div>
            </div>

            {/* Stock Cards Grid */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xl font-semibold mb-6 text-slate-800 dark:text-slate-200 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Your Holdings
                </h3>
                <StockCardGrid 
                  stocks={demoStocks}
                  onStockClick={(stock) => console.log('Stock clicked:', stock)}
                  showCharts={true}
                  compact={false}
                />
              </motion.div>
            </div>
          </div>
        );
      
      case 'watchlist':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Market Watchlist
            </h3>
            <StockCardGrid 
              stocks={demoStocks.slice(0, 3)}
              onStockClick={(stock) => console.log('Stock clicked:', stock)}
              showCharts={true}
              compact={true}
            />
          </div>
        );
      
      default:
        return (
          <div className="text-center py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-8 max-w-md mx-auto"
            >
              <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Coming Soon</h3>
              <p className="text-slate-600 dark:text-slate-400">This feature is under development.</p>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <ThemeProvider>
      <MockNotificationProvider userId={demoUser.id}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-all duration-500 relative overflow-hidden">
          {/* Enhanced Stock Market Background */}
          <StockMarketBackground />
          
          {/* Theme Toggle - Top Right */}
          <div className="absolute top-6 right-6 z-50">
            <ThemeToggle />
          </div>
          
          {/* Modern Navigation Sidebar */}
          <ModernNavigation
            user={demoUser}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            notificationCount={5}
          />

          {/* Main Content Area with Modern Layout */}
          <div className="ml-80 min-h-screen">
            {/* Enhanced Dashboard Header */}
            <DashboardHeader
              user={demoUser}
              onLogout={handleLogout}
              onAddStock={() => console.log('Add stock clicked')}
              portfolioValue={demoPortfolio.currentValue}
              portfolioChange={demoPortfolio.totalReturn}
              portfolioChangePercent={demoPortfolio.totalReturnPercent}
              notificationCount={5}
            />

            {/* Content Container */}
            <div className="p-8 pt-4">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {renderContent()}
              </motion.div>
            </div>
          </div>
        </div>
      </MockNotificationProvider>
    </ThemeProvider>
  );
};

export default WorkingDemoEnhanced;

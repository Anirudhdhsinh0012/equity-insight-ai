'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  BarChart3, 
  PieChart,
  Target,
  Star,
  Zap,
  Globe,
  RefreshCw,
  Filter,
  SortDesc,
  Layout,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Clock,
  Bookmark
} from 'lucide-react';

// Import our new components
import WebGLParticleSystem from './WebGLParticleSystem';
import PremiumNavigation from './PremiumNavigation';
import { PremiumDashboardHeader } from './PremiumDashboardHeader';
import { StockCardGrid } from './AdvancedStockCard';

interface StockData {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
  peRatio?: number;
  isWatched?: boolean;
  lastUpdate?: Date;
  sector?: string;
  dividend?: number;
  beta?: number;
}

interface PortfolioStats {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  buyingPower: number;
  totalStocks: number;
  activePositions: number;
}

interface NotificationItem {
  id: string;
  type: 'price' | 'news' | 'system' | 'trade';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface ModernStockDashboardProps {
  initialStocks?: StockData[];
  initialPortfolio?: PortfolioStats;
  initialNotifications?: NotificationItem[];
  userName?: string;
  userAvatar?: string;
  className?: string;
}

// Mock data generator functions
const generateMockStocks = (): StockData[] => {
  const companies = [
    { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 2800000000000 },
    { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', marketCap: 2600000000000 },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', marketCap: 1700000000000 },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', marketCap: 1500000000000 },
    { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive', marketCap: 800000000000 },
    { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', marketCap: 1800000000000 },
    { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', marketCap: 900000000000 },
    { ticker: 'BRK.A', name: 'Berkshire Hathaway', sector: 'Financial', marketCap: 700000000000 },
    { ticker: 'V', name: 'Visa Inc.', sector: 'Financial', marketCap: 500000000000 },
    { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 450000000000 },
    { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', marketCap: 400000000000 },
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial', marketCap: 480000000000 }
  ];

  return companies.map((company, index) => {
    const basePrice = 50 + Math.random() * 400;
    const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
    const change = basePrice * (changePercent / 100);
    
    return {
      ...company,
      currentPrice: basePrice,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      high52Week: basePrice * (1 + Math.random() * 0.5),
      low52Week: basePrice * (1 - Math.random() * 0.3),
      peRatio: 15 + Math.random() * 25,
      isWatched: Math.random() > 0.7,
      lastUpdate: new Date(),
      dividend: Math.random() > 0.5 ? Math.random() * 5 : undefined,
      beta: 0.5 + Math.random() * 1.5
    };
  });
};

const generateMockPortfolio = (): PortfolioStats => {
  const totalValue = 125000 + Math.random() * 100000;
  const dayChangePercent = (Math.random() - 0.5) * 6; // -3% to +3%
  const dayChange = totalValue * (dayChangePercent / 100);
  
  return {
    totalValue,
    dayChange,
    dayChangePercent,
    totalGainLoss: totalValue * 0.15, // 15% total gain
    totalGainLossPercent: 15,
    buyingPower: 25000 + Math.random() * 20000,
    totalStocks: 8 + Math.floor(Math.random() * 5),
    activePositions: 6 + Math.floor(Math.random() * 8)
  };
};

const generateMockNotifications = (): NotificationItem[] => {
  const notifications = [
    {
      id: '1',
      type: 'price' as const,
      title: 'AAPL Price Alert',
      message: 'Apple stock reached your target price of $180.00',
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false,
      priority: 'high' as const
    },
    {
      id: '2',
      type: 'news' as const,
      title: 'Market Update',
      message: 'Fed announces interest rate decision',
      timestamp: new Date(Date.now() - 15 * 60000),
      read: false,
      priority: 'medium' as const
    },
    {
      id: '3',
      type: 'trade' as const,
      title: 'Order Executed',
      message: 'Your limit order for TSLA has been filled',
      timestamp: new Date(Date.now() - 30 * 60000),
      read: true,
      priority: 'low' as const
    },
    {
      id: '4',
      type: 'system' as const,
      title: 'Portfolio Rebalancing',
      message: 'Your portfolio allocation has shifted beyond target ranges',
      timestamp: new Date(Date.now() - 60 * 60000),
      read: false,
      priority: 'medium' as const
    }
  ];
  
  return notifications;
};

const MarketSummaryCard: React.FC<{
  title: string;
  value: string;
  change: number;
  changePercent: number;
  icon: React.ReactNode;
}> = ({ title, value, change, changePercent, icon }) => {
  const isPositive = changePercent >= 0;
  
  return (
    <motion.div
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
      whileHover={{ scale: 1.02, y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${
          isPositive 
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {icon}
        </div>
        <div className={`text-right ${
          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}>
          <p className="text-sm font-semibold">
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </p>
          <p className="text-xs">
            {isPositive ? '+' : ''}${Math.abs(change).toFixed(2)}
          </p>
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </motion.div>
  );
};

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}> = ({ title, description, icon, onClick, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full p-6 bg-gradient-to-br ${colorClasses[color]} 
        text-white rounded-xl shadow-lg hover:shadow-xl 
        transition-all duration-300 text-left group
      `}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
          {icon}
        </div>
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Plus className="w-5 h-5" />
        </motion.div>
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-white/80">{description}</p>
    </motion.button>
  );
};

export const ModernStockDashboard: React.FC<ModernStockDashboardProps> = ({
  initialStocks,
  initialPortfolio,
  initialNotifications,
  userName = 'Alex Thompson',
  userAvatar,
  className = ''
}) => {
  // State management
  const [stocks, setStocks] = useState<StockData[]>(initialStocks || []);
  const [portfolio, setPortfolio] = useState<PortfolioStats>(initialPortfolio || generateMockPortfolio());
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications || []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize data
  useEffect(() => {
    if (!initialStocks) {
      setStocks(generateMockStocks());
    }
    if (!initialNotifications) {
      setNotifications(generateMockNotifications());
    }
  }, [initialStocks, initialNotifications]);

  // Filter stocks based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStocks(stocks);
    } else {
      const filtered = stocks.filter(stock =>
        stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.sector?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStocks(filtered);
    }
  }, [searchQuery, stocks]);

  // Event handlers
  const handleStockClick = (stock: StockData) => {
    console.log('Stock clicked:', stock.ticker);
    // Add your stock detail logic here
  };

  const handleWatchToggle = (ticker: string) => {
    setStocks(prev => prev.map(stock =>
      stock.ticker === ticker
        ? { ...stock, isWatched: !stock.isWatched }
        : stock
    ));
  };

  const handleQuickTrade = (ticker: string, action: 'buy' | 'sell') => {
    console.log(`Quick ${action} for ${ticker}`);
    // Add your trading logic here
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    setNotifications(prev => prev.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    ));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update stock prices with random changes
    setStocks(prev => prev.map(stock => {
      const priceChange = (Math.random() - 0.5) * stock.currentPrice * 0.02; // ±2% change
      const newPrice = Math.max(0.01, stock.currentPrice + priceChange);
      const changePercent = (priceChange / stock.currentPrice) * 100;
      
      return {
        ...stock,
        currentPrice: newPrice,
        change: priceChange,
        changePercent,
        lastUpdate: new Date()
      };
    }));
    
    setRefreshing(false);
  };

  // Market summary data
  const marketIndices = [
    { title: 'S&P 500', value: '4,321.45', change: 12.34, changePercent: 0.29 },
    { title: 'NASDAQ', value: '13,542.12', change: -23.45, changePercent: -0.17 },
    { title: 'DOW JONES', value: '34,567.89', change: 45.67, changePercent: 0.13 }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} ${className}`}>
      {/* Animated Background */}
      <WebGLParticleSystem
        marketTrend={portfolio.dayChangePercent >= 0 ? 'bullish' : 'bearish'}
        theme={isDarkMode ? 'dark' : 'light'}
      />

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar Navigation */}
        <div className="hidden lg:block">
          <PremiumNavigation
            user={{ name: userName, email: 'user@example.com' }}
            activeTab="dashboard"
            onTabChange={(tab) => console.log('Tab changed:', tab)}
            onLogout={() => console.log('Logout')}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            portfolioValue={portfolio.totalValue}
            portfolioChange={portfolio.dayChangePercent}
          />
        </div>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          {/* Header */}
          <PremiumDashboardHeader
            portfolioStats={portfolio}
            notifications={notifications}
            onSearch={setSearchQuery}
            onNotificationClick={handleNotificationClick}
            onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
            onThemeToggle={() => setIsDarkMode(!isDarkMode)}
            userName={userName}
            userAvatar={userAvatar}
            isDarkMode={isDarkMode}
            showMobileMenu={showMobileMenu}
          />

          {/* Dashboard Content */}
          <main className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Market Summary Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    Market Overview
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Real-time market indices and trends
                  </p>
                </div>
                <motion.button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {marketIndices.map((index, i) => (
                  <MarketSummaryCard
                    key={index.title}
                    title={index.title}
                    value={index.value}
                    change={index.change}
                    changePercent={index.changePercent}
                    icon={<BarChart3 className="w-6 h-6" />}
                  />
                ))}
              </div>
            </motion.section>

            {/* Quick Actions Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickActionCard
                  title="Buy Stocks"
                  description="Execute new trades"
                  icon={<TrendingUp className="w-6 h-6" />}
                  onClick={() => console.log('Buy stocks')}
                  color="green"
                />
                <QuickActionCard
                  title="Portfolio Analysis"
                  description="View detailed insights"
                  icon={<PieChart className="w-6 h-6" />}
                  onClick={() => console.log('Portfolio analysis')}
                  color="blue"
                />
                <QuickActionCard
                  title="Set Alerts"
                  description="Price & news alerts"
                  icon={<Target className="w-6 h-6" />}
                  onClick={() => console.log('Set alerts')}
                  color="purple"
                />
                <QuickActionCard
                  title="Research"
                  description="Market research tools"
                  icon={<Globe className="w-6 h-6" />}
                  onClick={() => console.log('Research')}
                  color="orange"
                />
              </div>
            </motion.section>

            {/* Stocks Grid Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    Your Watchlist
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {searchQuery 
                      ? `${filteredStocks.length} stocks found for "${searchQuery}"`
                      : `${stocks.length} stocks in your watchlist`
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Filter className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <SortDesc className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Layout className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <StockCardGrid
                stocks={filteredStocks}
                onStockClick={handleStockClick}
                onWatchToggle={handleWatchToggle}
                onQuickTrade={handleQuickTrade}
                showCharts={true}
                compact={false}
              />
            </motion.section>
          </main>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="w-64 h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <PremiumNavigation
                user={{ name: userName, email: 'user@example.com' }}
                activeTab="dashboard"
                onTabChange={(tab) => console.log('Tab changed:', tab)}
                onLogout={() => console.log('Logout')}
                collapsed={false}
                portfolioValue={portfolio.totalValue}
                portfolioChange={portfolio.dayChangePercent}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernStockDashboard;

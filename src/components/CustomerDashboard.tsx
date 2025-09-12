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
  Bookmark,
  Brain,
  MessageSquare,
  Settings,
  Bell,
  FileText,
  Lightbulb
} from 'lucide-react';

// Import our modern UI components
import WebGLParticleSystem from './WebGLParticleSystem';
import PremiumNavigation from './PremiumNavigation';
import { PremiumDashboardHeader } from './PremiumDashboardHeader';
import { StockCardGrid } from './AdvancedStockCard';

// Import all existing functional components
import StockSearchModal from './StockSearchModal';
import StockInsights from './StockInsights';
import Recommendations from './Recommendations';
import Reports from './Reports';
import NotificationSettingsPanel from './NotificationSettingsPanel';
import StockAlertManager from './StockAlertManager';
import WhatsAppHistory from './WhatsAppHistory';
import RealtimePriceDisplay from './RealtimePriceDisplay';
import CustomerLearningHub from './CustomerLearningHub';
import CustomerNews from './CustomerNews';
import CustomerQuiz from './CustomerQuiz';
import activityLogger from '@/services/activityLoggingService';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import HistoricalChart from './HistoricalChart';
import AIInvestmentStories from './AIInvestmentStories';
import PersonalityMatch from './PersonalityMatch';
import ApiQuotaBanner from './ApiQuotaBanner';
import SettingsPanel from './SettingsPanel';
import HelpSupport from './HelpSupport';
import ThemeToggle from './ThemeToggle';
import AIChatbot from './AIChatbot';

// Import hooks and contexts
import { useNotifications } from '@/contexts/NotificationContext';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';
import { useTheme } from '@/contexts/ThemeContext';

// Import types
import { User, Stock, Portfolio, StockData } from '@/types';

interface StockDataForCards {
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

interface CustomerDashboardProps {
  user: User;
  onLogout: () => void;
  className?: string;
}

type ActiveSection = 'dashboard' | 'insights' | 'historical' | 'recommendations' | 'reports' | 'notifications' | 'whatsapp' | 'ai-stories' | 'personality-match' | 'alerts' | 'watchlist' | 'realtime' | 'settings' | 'help' | 'learning' | 'news' | 'quiz';

// Generate mock notifications
const generateMockNotifications = (): NotificationItem[] => {
  return [
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
    }
  ];
};

// Convert Stock array to StockDataForCards format
const convertStocksToCardData = (stocks: Stock[], realtimePrices: Map<string, any>): StockDataForCards[] => {
  return stocks.map(stock => {
    const priceData = realtimePrices.get(stock.ticker);
    const currentPrice = typeof priceData === 'object' ? priceData.price : (priceData || stock.buyPrice);
    const change = currentPrice - stock.buyPrice;
    const changePercent = stock.buyPrice ? (change / stock.buyPrice * 100) : 0;
    
    return {
      ticker: stock.ticker,
      name: stock.ticker, // Using ticker as name for now
      currentPrice,
      change,
      changePercent,
      volume: typeof priceData === 'object' ? (priceData.volume || 0) : 0,
      isWatched: true,
      lastUpdate: new Date(),
      marketCap: typeof priceData === 'object' ? priceData.marketCap : undefined,
      high52Week: typeof priceData === 'object' ? priceData.high52Week : stock.buyPrice * 1.2,
      low52Week: typeof priceData === 'object' ? priceData.low52Week : stock.buyPrice * 0.8,
      peRatio: typeof priceData === 'object' ? priceData.peRatio : 15 + Math.random() * 10,
      sector: 'Technology', // Default sector
      dividend: Math.random() > 0.5 ? Math.random() * 3 : undefined,
      beta: 0.8 + Math.random() * 0.8
    };
  });
};

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  user,
  onLogout,
  className = ''
}) => {
  // Theme context
  const { theme, colors, toggleTheme, isTransitioning } = useTheme();
  
  // Existing Dashboard state
  const { checkPriceAlerts, checkStockRecommendations } = useNotifications();
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>({
    stocks: [],
    totalInvestment: 0,
    currentValue: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Modern UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Keep isDarkMode in sync with theme context
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>(generateMockNotifications());
  const [refreshing, setRefreshing] = useState(false);

  // Real-time prices hook
  const stockTickers = Array.from(new Set(stocks.map(stock => stock.ticker).filter(ticker => ticker && ticker.trim() !== '')));
  const { 
    prices: realtimePrices, 
    isConnected: pricesConnected, 
    connectionError: pricesError 
  } = useRealtimePrices({ 
    tickers: stockTickers,
    autoConnect: stockTickers.length > 0 
  });

  // Load user data on mount
  useEffect(() => {
    loadUserStocks();
  }, [user.id]);

  // Set up activity logging for real user tracking
  useEffect(() => {
    // Set current user for activity logging
    activityLogger.setCurrentUser({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: '',
      registrationDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'active',
      portfolioValue: 0,
      totalTrades: 0,
      watchlistItems: 0,
      quizzesCompleted: 0,
      subscriptionTier: 'free',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Log navigation to dashboard
    activityLogger.logNavigation(
      'login',
      'dashboard',
      'direct'
    );
  }, [user]);

  // Initialize session tracking
  useSessionTracking({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: '',
      registrationDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'active',
      portfolioValue: 0,
      totalTrades: 0,
      watchlistItems: 0,
      quizzesCompleted: 0,
      subscriptionTier: 'free',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  // Custom navigation handler with activity logging
  const handleSectionChange = async (newSection: ActiveSection) => {
    // Log navigation activity
    await activityLogger.logNavigation(
      activeSection,
      newSection,
      'click'
    );
    
    setActiveSection(newSection);
  };

  // Enhanced stock operations with activity logging
  const handleStockSearch = async (query: string, results: any[]) => {
    // Note: logSearch method needs to be implemented in ActivityLoggingService
    console.log('Stock search:', query, 'Results:', results.length);
  };

  const handleStockAdd = async (stock: Stock) => {
    // Log as click engagement for now since logUserEngagement expects specific types
    await activityLogger.logUserEngagement(
      'click',
      stock.ticker,
      'portfolio',
      0,
      {
        action: 'stock_add',
        ticker: stock.ticker,
        price: stock.buyPrice,
        quantity: stock.quantity
      }
    );
  };

  const handleStockRemove = async (stock: Stock) => {
    // Log as click engagement for now
    await activityLogger.logUserEngagement(
      'click',
      stock.ticker,
      'portfolio',
      0,
      {
        action: 'stock_remove',
        ticker: stock.ticker,
        holdingDuration: Date.now() - new Date(stock.buyDate).getTime()
      }
    );
  };

  // Calculate portfolio when stocks or prices change
  useEffect(() => {
    calculatePortfolio();
  }, [stocks, realtimePrices]);

  // Auto-update portfolio every 5 minutes
  useEffect(() => {
    if (stocks.length === 0) return;

    const interval = setInterval(() => {
      calculatePortfolio();
    }, 300000);

    return () => clearInterval(interval);
  }, [stocks, checkPriceAlerts]);

  const loadUserStocks = () => {
    if (typeof window === 'undefined') return; // SSR guard
    const userStocks = JSON.parse(localStorage.getItem(`stocks_${user.id}`) || '[]');
    setStocks(userStocks);
  };

  const calculatePortfolio = async () => {
    if (stocks.length === 0) {
      setPortfolio({
        stocks: [],
        totalInvestment: 0,
        currentValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
      });
      return;
    }

    let totalInvestment = 0;
    let currentValue = 0;

    const stocksWithCurrentPrice = stocks.map((stock) => {
      const investment = stock.buyPrice * stock.quantity;
      totalInvestment += investment;

      // Use real-time price if available, otherwise use buy price as fallback
      const realtimePrice = realtimePrices.get(stock.ticker);
      const currentPrice = realtimePrice?.price || stock.buyPrice;
      const stockCurrentValue = currentPrice * stock.quantity;
      currentValue += stockCurrentValue;

      return { ...stock, currentPrice };
    });

    // Create StockData array for notifications
    const stockDataArray: StockData[] = stocksWithCurrentPrice.map(stock => {
      const realtimePrice = realtimePrices.get(stock.ticker);
      const currentPrice = realtimePrice?.price || stock.buyPrice;
      const changePercent = realtimePrice?.changePercent || 0;
      
      return {
        symbol: stock.ticker,
        currentPrice,
        change: stock.currentPrice ? stock.currentPrice - stock.buyPrice : 0,
        changePercent,
        high52Week: stock.buyPrice * 1.5,
        low52Week: stock.buyPrice * 0.5,
        marketCap: 0,
        volume: 0,
        peRatio: 0,
        dividendYield: 0,
        beta: 1,
      };
    });

    // Check for price alerts
    await checkPriceAlerts(stockDataArray);

    // Check for WhatsApp recommendations
    await checkStockRecommendations(stocksWithCurrentPrice, user.phoneNumber);

    const totalReturn = currentValue - totalInvestment;
    const totalReturnPercent = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

    setPortfolio({
      stocks: stocksWithCurrentPrice,
      totalInvestment,
      currentValue,
      totalReturn,
      totalReturnPercent,
    });
  };

  const handleAddStock = async (ticker: string, name: string) => {
    const stock: Stock = {
      id: Date.now().toString(),
      userId: user.id,
      ticker: ticker,
      buyDate: new Date(),
      buyPrice: 0, // Will be updated with real-time price
      quantity: 1
    };

    const updatedStocks = [...stocks, stock];
    setStocks(updatedStocks);
    localStorage.setItem(`stocks_${user.id}`, JSON.stringify(updatedStocks));
    setIsAddModalOpen(false); // Close the modal after adding

    // Log activity
    await handleStockAdd(stock);
  };

  const handleRemoveStock = async (stockId: string) => {
    const stockToRemove = stocks.find(s => s.id === stockId);
    const updatedStocks = stocks.filter(stock => stock.id !== stockId);
    setStocks(updatedStocks);
    localStorage.setItem(`stocks_${user.id}`, JSON.stringify(updatedStocks));

    // Log activity
    if (stockToRemove) {
      await handleStockRemove(stockToRemove);
    }
  };

  const handleStockClick = async (stockData: StockDataForCards) => {
    const stock = stocks.find(s => s.ticker === stockData.ticker);
    if (stock) {
      setSelectedStock(stock);
      
      // Log stock view activity as click engagement
      await activityLogger.logUserEngagement(
        'click',
        stock.ticker,
        'stock_detail',
        0,
        {
          action: 'stock_view',
          ticker: stock.ticker,
          currentPrice: stockData.currentPrice,
          changePercent: stockData.changePercent
        }
      );
    }
  };

  const handleWatchToggle = (ticker: string) => {
    // This could be extended to manage a separate watchlist
    console.log('Toggle watch for:', ticker);
  };

  const handleQuickTrade = (ticker: string, action: 'buy' | 'sell') => {
    console.log(`Quick ${action} for ${ticker}`);
    // Could open a trading modal or redirect to trading interface
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    setNotifications(prev => prev.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    ));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await calculatePortfolio();
    setRefreshing(false);
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  // Convert portfolio data to PortfolioStats format for header
  const portfolioStats: PortfolioStats = {
    totalValue: portfolio.currentValue,
    dayChange: portfolio.totalReturn,
    dayChangePercent: portfolio.totalReturnPercent,
    totalGainLoss: portfolio.totalReturn,
    totalGainLossPercent: portfolio.totalReturnPercent,
    buyingPower: 25000, // Mock data
    totalStocks: stocks.length,
    activePositions: stocks.length,
  };

  // Convert stocks to card data format
  const stockCardData = convertStocksToCardData(stocks, realtimePrices);

  // Filter stocks based on search
  const filteredStocks = searchQuery.trim() === '' 
    ? stockCardData 
    : stockCardData.filter(stock =>
        stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.sector?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Market summary data
  const marketIndices = [
    { title: 'S&P 500', value: '4,321.45', change: 12.34, changePercent: 0.29 },
    { title: 'NASDAQ', value: '13,542.12', change: -23.45, changePercent: -0.17 },
    { title: 'DOW JONES', value: '34,567.89', change: 45.67, changePercent: 0.13 }
  ];

  // Render content based on active section
  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Market Summary Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${colors.text.primary}`}>
                    Market Overview
                  </h2>
                  <p className={`${colors.text.secondary}`}>
                    Real-time market indices and trends
                  </p>
                </div>
                <motion.button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center space-x-2 px-4 py-2 ${colors.primary.accent} hover:${colors.primary.accentHover} text-white rounded-lg transition-colors disabled:opacity-50`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {marketIndices.map((index, i) => (
                  <motion.div
                    key={index.title}
                    className={`${colors.primary.card} backdrop-blur-xl ${colors.primary.border} border rounded-xl p-6 shadow-lg hover:shadow-xl ${colors.animation.transition} ${colors.animation.duration}`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${
                        index.changePercent >= 0 
                          ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-300'
                          : 'bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-300'
                      }`}>
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <div className={`text-right ${
                        index.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        <p className="text-sm font-semibold">
                          {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                        </p>
                        <p className="text-xs">
                          {index.changePercent >= 0 ? '+' : ''}${Math.abs(index.change).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className={`text-sm ${colors.text.muted} mb-1`}>{index.title}</p>
                      <p className={`text-2xl font-bold ${colors.text.primary}`}>{index.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>
        );

      case 'realtime':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Live Market Data</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`flex items-center space-x-2 px-4 py-2 ${colors.primary.accent} hover:${colors.primary.accentHover} text-white rounded-lg transition-colors`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stock</span>
                </button>
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
            {stocks.length > 0 ? (
              <RealtimePriceDisplay
                userId={user.id}
                tickers={stocks.map(stock => stock.ticker)}
                showAlerts={true}
                showApiStatus={true}
                autoRefresh={true}
                realtimePrices={realtimePrices}
                isConnected={pricesConnected}
              />
            ) : (
              <div className={`${colors.primary.card} backdrop-blur-xl ${colors.primary.border} border rounded-xl p-8 text-center`}>
                <div className="flex flex-col items-center space-y-4">
                  <div className={`w-16 h-16 ${colors.primary.surface} rounded-full flex items-center justify-center`}>
                    <Plus className={`w-8 h-8 ${colors.text.muted}`} />
                  </div>
                  <h3 className={`text-xl font-semibold ${colors.text.primary}`}>No Stocks in Your Watchlist</h3>
                  <p className={`${colors.text.muted} max-w-md`}>
                    Start building your personalized watchlist by adding stocks you want to track.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className={`px-6 py-3 ${colors.primary.accent} hover:${colors.primary.accentHover} text-white rounded-lg transition-colors font-medium`}
                  >
                    Add Your First Stock
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'watchlist':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold ${colors.text.primary}`}>My Watchlist</h2>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className={`flex items-center space-x-2 px-4 py-2 ${colors.primary.accent} hover:${colors.primary.accentHover} text-white rounded-lg transition-colors`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Stock</span>
              </button>
            </div>
            {stockCardData.length > 0 ? (
              <StockCardGrid
                stocks={stockCardData.map(stock => ({ ...stock, isWatched: true }))}
                onStockClick={handleStockClick}
                onWatchToggle={handleWatchToggle}
                showCharts={true}
                compact={false}
              />
            ) : (
              <div className={`${colors.primary.card} backdrop-blur-xl ${colors.primary.border} border rounded-xl p-8 text-center`}>
                <div className="flex flex-col items-center space-y-4">
                  <div className={`w-16 h-16 ${colors.primary.surface} rounded-full flex items-center justify-center`}>
                    <Plus className={`w-8 h-8 ${colors.text.muted}`} />
                  </div>
                  <h3 className={`text-xl font-semibold ${colors.text.primary}`}>Your Watchlist is Empty</h3>
                  <p className={`${colors.text.muted} max-w-md`}>
                    Add stocks to your personal watchlist to track their performance and get insights.
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className={`px-6 py-3 ${colors.primary.accent} hover:${colors.primary.accentHover} text-white rounded-lg transition-colors font-medium`}
                  >
                    Add Your First Stock
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'insights':
        return (
          <StockInsights 
            stocks={stocks} 
            onClose={() => handleSectionChange('dashboard')} 
          />
        );

      case 'historical':
        return (
          <HistoricalChart 
            userId={user.id}
            className={`${colors.primary.card} backdrop-blur-xl ${colors.primary.border} border rounded-xl p-6`}
          />
        );

      case 'recommendations':
        return (
          <Recommendations />
        );

      case 'reports':
        return (
          <Reports 
            portfolio={portfolio}
          />
        );

      case 'ai-stories':
        return (
          <AIInvestmentStories 
            userId={user.id}
          />
        );

      case 'personality-match':
        return (
          <PersonalityMatch 
            userId={user.id}
          />
        );

      case 'whatsapp':
        return (
          <WhatsAppHistory 
            userId={user.id}
          />
        );

      case 'notifications':
        return (
          <NotificationSettingsPanel />
        );

      case 'alerts':
        return (
          <StockAlertManager 
            availableTickers={stocks.map(s => s.ticker)}
          />
        );

      case 'settings':
        return <SettingsPanel />;

      case 'help':
        return <HelpSupport />;

      case 'learning':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Learning Hub</h2>
              <div className="text-sm text-gray-500">
                Track your learning progress
              </div>
            </div>
            <CustomerLearningHub />
          </div>
        );

      case 'news':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Market News</h2>
              <div className="text-sm text-gray-500">
                Stay updated with latest market trends
              </div>
            </div>
            <CustomerNews />
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${colors.text.primary}`}>Investment Quiz</h2>
              <div className="text-sm text-gray-500">
                Test your investment knowledge
              </div>
            </div>
            <CustomerQuiz />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>
              Feature Coming Soon
            </h2>
            <p className={`${colors.text.secondary}`}>
              This feature is under development.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen ${colors.primary.background} ${colors.animation.transition} ${colors.animation.duration} ${isTransitioning ? 'pointer-events-none' : ''} ${className}`}>
      {/* Animated Background */}
      <WebGLParticleSystem
        marketTrend={portfolio.totalReturnPercent >= 0 ? 'bullish' : 'bearish'}
        theme={isDarkMode ? 'dark' : 'light'}
      />

      <div className="relative z-10 min-h-screen">
        {/* Fixed Sidebar Navigation */}
        <div className="hidden lg:block">
          <PremiumNavigation
            user={{ name: user.name, email: user.email }}
            activeTab={activeSection}
            onTabChange={(tab) => handleSectionChange(tab as ActiveSection)}
            onLogout={onLogout}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            portfolioValue={portfolio.currentValue}
            portfolioChange={portfolio.totalReturnPercent}
          />
        </div>

        {/* Main Content with fixed header */}
        <div className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-28' : 'lg:ml-[21rem]'
        } min-w-0`}>
          {/* Fixed Header */}
          <div className="fixed top-0 right-0 z-30" style={{
            left: sidebarCollapsed ? '5rem' : '22rem'
          }}>
            <PremiumDashboardHeader
              portfolioStats={portfolioStats}
              notifications={notifications}
              onSearch={setSearchQuery}
              onNotificationClick={handleNotificationClick}
              onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
              onThemeToggle={handleThemeToggle}
              onLogout={onLogout}
              userName={user.name}
              isDarkMode={isDarkMode}
              showMobileMenu={showMobileMenu}
            />
          </div>

          {/* Scrollable Main Content with top padding for fixed header */}
          <div className="pt-20"> {/* This padding accounts for the fixed header height */}
            <main className="p-4 sm:p-6 lg:p-8 bg-transparent">
              {/* API Quota Banner */}
              <ApiQuotaBanner />
              
              {/* Main Content */}
              {renderMainContent()}
            </main>
          </div> {/* End of scrollable content */}
        </div> {/* End of main content */}

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
                  user={{ name: user.name, email: user.email }}
                  activeTab={activeSection}
                  onTabChange={(tab) => {
                    handleSectionChange(tab as ActiveSection);
                    setShowMobileMenu(false);
                  }}
                  onLogout={onLogout}
                  collapsed={false}
                  portfolioValue={portfolio.currentValue}
                  portfolioChange={portfolio.totalReturnPercent}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <StockSearchModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddStock={handleAddStock}
          currentWatchlist={stocks.map(stock => stock.ticker)}
        />

        {selectedStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedStock(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`${colors.primary.card} rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto ${colors.animation.transition} ${colors.animation.duration}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-2xl font-bold ${colors.text.primary}`}>
                  {selectedStock.ticker} Details
                </h3>
                <button
                  onClick={() => setSelectedStock(null)}
                  className={`p-2 hover:${colors.primary.surfaceHover} rounded-lg ${colors.animation.transition}`}
                >
                  ✕
                </button>
              </div>
              <StockInsights stocks={[selectedStock]} onClose={() => setSelectedStock(null)} />
            </motion.div>
          </motion.div>
        )}

        {/* AI Chatbot */}
        <AIChatbot
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
        />

        {/* Floating Chatbot Button */}
        {!isChatbotOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatbotOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center group"
            title="AI Assistant"
          >
            <MessageSquare className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-8 right-0 bg-slate-900/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              AI Assistant
            </div>
          </motion.button>
        )}
      </div> {/* End of relative container */}
    </div>
  );
};

export default CustomerDashboard;

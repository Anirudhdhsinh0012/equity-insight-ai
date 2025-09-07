'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { User, Stock, Portfolio, StockData } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';

// Import enhanced UI components
import StockMarketBackground from './StockMarketBackground';
import ModernNavigation from './ModernNavigation';
import DashboardHeader from './DashboardHeader';
import { StockCardGrid } from './AnimatedStockCard';

// Import existing components
import Header from './Header';
import AddStockModal from './AddStockModal';
import StockInsights from './StockInsights';
import Recommendations from './Recommendations';
import Reports from './Reports';
import NotificationSettingsPanel from './NotificationSettingsPanel';
import StockAlertManager from './StockAlertManager';
import WhatsAppHistory from './WhatsAppHistory';
import RealtimePriceDisplay from './RealtimePriceDisplay';
import HistoricalChart from './HistoricalChart';
import AIInvestmentStories from './AIInvestmentStories';
import PersonalityMatch from './PersonalityMatch';
import ThemeToggle from './ThemeToggle';
import ApiQuotaBanner from './ApiQuotaBanner';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type ActiveTab = 'realtime' | 'portfolio' | 'watchlist' | 'market' | 'insights' | 'historical' | 'recommendations' | 'reports' | 'notifications' | 'whatsapp' | 'ai-stories' | 'personality-match';

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const { checkPriceAlerts, checkStockRecommendations } = useNotifications();
  const [activeTab, setActiveTab] = useState<ActiveTab>('portfolio');
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

  // Get real-time prices for all user stocks (ensure unique tickers)
  const stockTickers = Array.from(new Set(stocks.map(stock => stock.ticker).filter(ticker => ticker && ticker.trim() !== '')));
  const { 
    prices: realtimePrices, 
    isConnected: pricesConnected, 
    connectionError: pricesError 
  } = useRealtimePrices({ 
    tickers: stockTickers,
    autoConnect: stockTickers.length > 0 
  });

  useEffect(() => {
    loadUserStocks();
  }, [user.id]);

  useEffect(() => {
    calculatePortfolio();
  }, [stocks]);

  // Set up automatic price monitoring with reduced frequency
  useEffect(() => {
    if (stocks.length === 0) return;

    const interval = setInterval(() => {
      calculatePortfolio();
    }, 300000); // Update every 5 minutes instead of 30 seconds to reduce API calls

    return () => clearInterval(interval);
  }, [stocks, checkPriceAlerts]);

  const loadUserStocks = () => {
    const userStocks = JSON.parse(localStorage.getItem(`stocks_${user.id}`) || '[]');
    
    // If no stocks exist, add some default stocks for testing live data
    if (userStocks.length === 0) {
      const defaultStocks = [
        {
          id: 'default_1',
          userId: user.id,
          ticker: 'AAPL',
          buyDate: new Date(),
          buyPrice: 230,
          quantity: 10,
        },
        {
          id: 'default_2',
          userId: user.id,
          ticker: 'GOOGL',
          buyDate: new Date(),
          buyPrice: 180,
          quantity: 5,
        },
        {
          id: 'default_3',
          userId: user.id,
          ticker: 'MSFT',
          buyDate: new Date(),
          buyPrice: 420,
          quantity: 8,
        },
        {
          id: 'default_4',
          userId: user.id,
          ticker: 'TSLA',
          buyDate: new Date(),
          buyPrice: 390,
          quantity: 3,
        },
      ];
      setStocks(defaultStocks);
      localStorage.setItem(`stocks_${user.id}`, JSON.stringify(defaultStocks));
    } else {
      setStocks(userStocks);
    }
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

    // Create StockData array for notifications using real-time prices
    const stockDataArray: StockData[] = stocksWithCurrentPrice.map(stock => {
      const realtimePrice = realtimePrices.get(stock.ticker);
      const currentPrice = realtimePrice?.price || stock.buyPrice;
      const changePercent = realtimePrice?.changePercent || 0;
      
      return {
        symbol: stock.ticker,
        currentPrice,
        change: stock.currentPrice ? stock.currentPrice - stock.buyPrice : 0,
        changePercent,
        high52Week: stock.buyPrice * 1.5, // Mock data
        low52Week: stock.buyPrice * 0.5, // Mock data
        marketCap: 0, // Mock data
        volume: 0, // Mock data
        peRatio: 0, // Mock data
        dividendYield: 0, // Mock data
        beta: 1, // Mock data
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

  const handleAddStock = (ticker: string) => {
    const stock: Stock = {
      id: Date.now().toString(),
      userId: user.id,
      ticker: ticker,
      buyDate: new Date(), // Use current date as default
      buyPrice: 0, // Will be updated with real-time price
      quantity: 1, // Default quantity
    };

    const updatedStocks = [...stocks, stock];
    setStocks(updatedStocks);
    localStorage.setItem(`stocks_${user.id}`, JSON.stringify(updatedStocks));
    setIsAddModalOpen(false);
  };

  const handleDeleteStock = (stockId: string) => {
    const updatedStocks = stocks.filter(stock => stock.id !== stockId);
    setStocks(updatedStocks);
    localStorage.setItem(`stocks_${user.id}`, JSON.stringify(updatedStocks));
  };

  const handleEditStock = (updatedStock: Stock) => {
    const updatedStocks = stocks.map(stock => 
      stock.id === updatedStock.id ? updatedStock : stock
    );
    setStocks(updatedStocks);
    localStorage.setItem(`stocks_${user.id}`, JSON.stringify(updatedStocks));
  };

  const renderTabContent = () => {
    // Get unique tickers from stocks to prevent duplicate key errors
    const uniqueTickers = Array.from(new Set(stocks.map(stock => stock.ticker).filter(ticker => ticker && ticker.trim() !== '')));
    
    switch (activeTab) {
      case 'realtime':
        return (
          <div className="space-y-6">
            {/* Stock Cards Grid */}
            {stocks.length > 0 && (
              <StockCardGrid 
                stocks={stocks.map(stock => {
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
                    lastUpdate: new Date()
                  };
                })}
                onStockClick={(stockData) => {
                  const stock = stocks.find(s => s.ticker === stockData.ticker);
                  if (stock) setSelectedStock(stock);
                }}
                showCharts={true}
                compact={false}
              />
            )}
            
            {/* Fallback to original component */}
            <RealtimePriceDisplay
              userId={user.id}
              tickers={uniqueTickers}
              showAlerts={true}
              showApiStatus={true}
              autoRefresh={true}
              refreshInterval={30000}
              realtimePrices={realtimePrices}
              isConnected={pricesConnected}
              className="max-w-7xl mx-auto"
            />
          </div>
        );
      case 'portfolio':
        return (
          <div className="space-y-6">
            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Value</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      ${portfolio.currentValue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-500" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Return</p>
                    <p className={`text-2xl font-bold ${portfolio.totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${portfolio.totalReturn.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Return %</p>
                    <p className={`text-2xl font-bold ${portfolio.totalReturnPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {portfolio.totalReturnPercent.toFixed(2)}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Holdings</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {stocks.length}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-amber-500" />
                </div>
              </motion.div>
            </div>

            {/* Stock Cards Grid for Portfolio */}
            {stocks.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Your Holdings</h3>
                <StockCardGrid 
                  stocks={stocks.map(stock => {
                    const priceData = realtimePrices.get(stock.ticker);
                    const currentPrice = typeof priceData === 'object' ? priceData.price : (priceData || stock.buyPrice);
                    const change = currentPrice - stock.buyPrice;
                    const changePercent = stock.buyPrice ? (change / stock.buyPrice * 100) : 0;
                    
                    return {
                      ticker: stock.ticker,
                      name: stock.ticker,
                      currentPrice,
                      change,
                      changePercent,
                      volume: typeof priceData === 'object' ? (priceData.volume || 0) : 0,
                      isWatched: true,
                      lastUpdate: new Date()
                    };
                  })}
                  onStockClick={(stockData) => {
                    const stock = stocks.find(s => s.ticker === stockData.ticker);
                    if (stock) setSelectedStock(stock);
                  }}
                  showCharts={true}
                  compact={false}
                />
              </div>
            )}

            {stocks.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-8 max-w-md mx-auto">
                  <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">No Stocks in Portfolio</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">Add your first stock to start tracking your portfolio performance.</p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                  >
                    Add Stock
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        );
      case 'watchlist':
      case 'market':
        return (
          <div className="text-center py-16">
            <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-8 max-w-md mx-auto">
              <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Coming Soon</h3>
              <p className="text-slate-600 dark:text-slate-400">This feature is under development.</p>
            </div>
          </div>
        );
      case 'historical':
        return (
          <HistoricalChart
            className="max-w-7xl mx-auto"
            userId={user.id}
          />
        );
      case 'insights':
        return <StockInsights stocks={portfolio.stocks} />;
      case 'recommendations':
        return <Recommendations />;
      case 'reports':
        return <Reports portfolio={portfolio} />;
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StockAlertManager 
                availableTickers={stocks.map(s => s.ticker)} 
              />
              <NotificationSettingsPanel />
            </div>
          </div>
        );
      case 'whatsapp':
        return <WhatsAppHistory userId={user.id} />;
      case 'ai-stories':
        return <AIInvestmentStories userId={user.id} className="max-w-7xl mx-auto" />;
      case 'personality-match':
        return (
          <PersonalityMatch
            userId={user.id}
            className="max-w-7xl mx-auto"
            onStartDemo={() => setActiveTab('realtime')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-all duration-500 relative overflow-hidden">
      {/* Enhanced Stock Market Background */}
      <StockMarketBackground />
      
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Modern Navigation Sidebar */}
      <ModernNavigation
        user={{ name: user.name, email: user.email }}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as ActiveTab)}
        notificationCount={0}
      />

  {/* Main Content Area with Modern Layout */}
  {/* Responsive: on small screens full width with top padding to avoid overlap; on large screens leave space for sidebar */}
  <div className="min-h-screen pt-20 lg:pt-0 lg:ml-80 transition-all duration-300">
        {/* Enhanced Dashboard Header */}
        <DashboardHeader
          user={user}
          onLogout={onLogout}
          onAddStock={() => setIsAddModalOpen(true)}
          portfolioValue={portfolio.currentValue}
          portfolioChange={portfolio.totalReturn}
          portfolioChangePercent={portfolio.totalReturnPercent}
          notificationCount={0}
        />

  {/* Content Container (responsive padding) */}
  <div className="p-4 sm:p-6 lg:p-8 pt-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddStock}
      />

      {selectedStock && (
        <StockInsights 
          stocks={[selectedStock]} 
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}

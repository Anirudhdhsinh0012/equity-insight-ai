// 'use client';

// import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { User, Stock, Portfolio, StockData } from '@/types';
// import { useNotifications } from '@/contexts/NotificationContext';
// import { useRealtimePrices } from '@/hooks/useRealtimePrices';

// // Import modern components
// import StockMarketBackground from './StockMarketBackground';
// import ModernNavigation from './ModernNavigation';
// import DashboardHeader from './DashboardHeader';
// import { StockCardGrid } from './AnimatedStockCard';

// // Import existing components (unchanged)
// import AddStockModal from './AddStockModal';
// import StockInsights from './StockInsights';
// import Recommendations from './Recommendations';
// import Reports from './Reports';
// import NotificationSettingsPanel from './NotificationSettingsPanel';
// import StockAlertManager from './StockAlertManager';
// import WhatsAppHistory from './WhatsAppHistory';
// import RealtimePriceDisplay from './RealtimePriceDisplay';
// import HistoricalChart from './HistoricalChart';
// import AIInvestmentStories from './AIInvestmentStories';
// import PersonalityMatch from './PersonalityMatch';
// import ApiQuotaBanner from './ApiQuotaBanner';

// interface DashboardProps {
//   user: User;
//   onLogout: () => void;
// }

// type ActiveTab = 'realtime' | 'portfolio' | 'watchlist' | 'market' | 'insights' | 'reports' | 'notifications' | 'settings' | 'help' | 'historical' | 'recommendations' | 'whatsapp' | 'ai-stories' | 'personality-match';

// export default function EnhancedDashboard({ user, onLogout }: DashboardProps) {
//   const { checkPriceAlerts, checkStockRecommendations } = useNotifications();
//   const [activeTab, setActiveTab] = useState<ActiveTab>('realtime');
//   const [stocks, setStocks] = useState<Stock[]>([]);
//   const [portfolio, setPortfolio] = useState<Portfolio>({
//     stocks: [],
//     totalInvestment: 0,
//     currentValue: 0,
//     totalReturn: 0,
//     totalReturnPercent: 0,
//   });
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
//   const [watchlist, setWatchlist] = useState<string[]>([]);
//   const [isDarkMode, setIsDarkMode] = useState(false);
//   const [marketTrend, setMarketTrend] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');

//   // Get real-time prices for all user stocks
//   const stockTickers = Array.from(new Set(stocks.map(stock => stock.ticker).filter(ticker => ticker && ticker.trim() !== '')));
//   const { 
//     prices: realtimePrices, 
//     isConnected: pricesConnected, 
//     connectionError: pricesError 
//   } = useRealtimePrices({ 
//     tickers: stockTickers,
//     autoConnect: stockTickers.length > 0 
//   });

//   // Load initial data
//   useEffect(() => {
//     loadUserStocks();
//     loadWatchlist();
//     loadThemePreference();
//   }, [user.id]);

//   useEffect(() => {
//     calculatePortfolio();
//   }, [stocks, realtimePrices]);

//   // Auto-update portfolio every 5 minutes
//   useEffect(() => {
//     if (stocks.length === 0) return;

//     const interval = setInterval(() => {
//       calculatePortfolio();
//     }, 300000);

//     return () => clearInterval(interval);
//   }, [stocks, checkPriceAlerts]);

//   // Determine market trend based on portfolio performance
//   useEffect(() => {
//     if (portfolio.totalReturnPercent > 2) {
//       setMarketTrend('bullish');
//     } else if (portfolio.totalReturnPercent < -2) {
//       setMarketTrend('bearish');
//     } else {
//       setMarketTrend('neutral');
//     }
//   }, [portfolio.totalReturnPercent]);

//   const loadUserStocks = () => {
//     const userStocks = JSON.parse(localStorage.getItem(`stocks_${user.id}`) || '[]');
    
//     // Add default stocks if none exist
//     if (userStocks.length === 0) {
//       const defaultStocks = [
//         {
//           id: 'default_1',
//           userId: user.id,
//           ticker: 'AAPL',
//           buyDate: new Date(),
//           buyPrice: 230,
//           quantity: 10,
//         },
//         {
//           id: 'default_2',
//           userId: user.id,
//           ticker: 'GOOGL',
//           buyDate: new Date(),
//           buyPrice: 180,
//           quantity: 5,
//         },
//         {
//           id: 'default_3',
//           userId: user.id,
//           ticker: 'MSFT',
//           buyDate: new Date(),
//           buyPrice: 420,
//           quantity: 3,
//         }
//       ];
      
//       setStocks(defaultStocks);
//       localStorage.setItem(`stocks_${user.id}`, JSON.stringify(defaultStocks));
//     } else {
//       setStocks(userStocks);
//     }
//   };

//   const loadWatchlist = () => {
//     const userWatchlist = JSON.parse(localStorage.getItem(`watchlist_${user.id}`) || '[]');
//     setWatchlist(userWatchlist);
//   };

//   const loadThemePreference = () => {
//     const savedTheme = localStorage.getItem('theme');
//     setIsDarkMode(savedTheme === 'dark');
//   };

//   const calculatePortfolio = () => {
//     let totalInvestment = 0;
//     let currentValue = 0;

//     const portfolioStocks = stocks.map(stock => {
//       const investment = stock.buyPrice * stock.quantity;
//       const realtimeData = realtimePrices.get(stock.ticker);
//       const currentPrice = realtimeData?.price || stock.buyPrice;
//       const currentVal = currentPrice * stock.quantity;
      
//       totalInvestment += investment;
//       currentValue += currentVal;

//       return {
//         ...stock,
//         currentPrice,
//       };
//     });

//     const totalReturn = currentValue - totalInvestment;
//     const totalReturnPercent = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

//     setPortfolio({
//       stocks: portfolioStocks,
//       totalInvestment,
//       currentValue,
//       totalReturn,
//       totalReturnPercent,
//     });
//   };

//   const handleAddStock = (stock: Stock) => {
//     const newStocks = [...stocks, { ...stock, id: Date.now().toString() }];
//     setStocks(newStocks);
//     localStorage.setItem(`stocks_${user.id}`, JSON.stringify(newStocks));
//     setIsAddModalOpen(false);
//   };

//   const handleDeleteStock = (stockId: string) => {
//     const newStocks = stocks.filter(stock => stock.id !== stockId);
//     setStocks(newStocks);
//     localStorage.setItem(`stocks_${user.id}`, JSON.stringify(newStocks));
//   };

//   const handleWatchToggle = (ticker: string) => {
//     const newWatchlist = watchlist.includes(ticker)
//       ? watchlist.filter(t => t !== ticker)
//       : [...watchlist, ticker];
    
//     setWatchlist(newWatchlist);
//     localStorage.setItem(`watchlist_${user.id}`, JSON.stringify(newWatchlist));
//   };

//   const handleThemeToggle = () => {
//     const newTheme = !isDarkMode;
//     setIsDarkMode(newTheme);
//     localStorage.setItem('theme', newTheme ? 'dark' : 'light');
//     document.documentElement.classList.toggle('dark', newTheme);
//   };

//   // Convert stocks to stock card data format
//   const getStockCardData = () => {
//     return stocks.map(stock => {
//       const realtimeData = realtimePrices.get(stock.ticker);
//       return {
//         ticker: stock.ticker,
//         name: `${stock.ticker} Corp`, // You can enhance this with real company names
//         currentPrice: realtimeData?.price || stock.buyPrice,
//         change: realtimeData?.change || 0,
//         changePercent: realtimeData?.changePercent || 0,
//         volume: realtimeData?.volume || 1000000,
//         marketCap: realtimeData?.marketCap,
//         isWatched: watchlist.includes(stock.ticker),
//         lastUpdate: new Date()
//       };
//     });
//   };

//   const contentVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { 
//       opacity: 1, 
//       y: 0,
//       transition: {
//         duration: 0.3,
//         ease: 'easeOut'
//       }
//     },
//     exit: { 
//       opacity: 0, 
//       y: -20,
//       transition: {
//         duration: 0.2
//       }
//     }
//   };

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'realtime':
//         return (
//           <motion.div
//             key="realtime"
//             variants={contentVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             className="space-y-6"
//           >
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               {/* Portfolio Overview */}
//               <div className="lg:col-span-2">
//                 <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl">
//                   <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Your Portfolio</h2>
//                   <StockCardGrid
//                     stocks={getStockCardData()}
//                     onStockClick={(stock) => setSelectedStock(stocks.find(s => s.ticker === stock.ticker) || null)}
//                     onWatchToggle={handleWatchToggle}
//                     showCharts={true}
//                     compact={false}
//                   />
//                 </div>
//               </div>

//               {/* Quick Stats */}
//               <div className="space-y-4">
//                 <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6">
//                   <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Portfolio Performance</h3>
//                   <div className="space-y-3">
//                     <div>
//                       <div className="text-sm text-slate-600 dark:text-slate-400">Total Value</div>
//                       <div className="text-2xl font-bold text-slate-900 dark:text-white">
//                         ${portfolio.currentValue.toFixed(2)}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-slate-600 dark:text-slate-400">Total Return</div>
//                       <div className={`text-xl font-semibold ${
//                         portfolio.totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500'
//                       }`}>
//                         ${portfolio.totalReturn.toFixed(2)} ({portfolio.totalReturnPercent.toFixed(2)}%)
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
//                   <RealtimePriceDisplay 
//                     stocks={portfolio.stocks}
//                     realtimePrices={realtimePrices}
//                     isConnected={pricesConnected}
//                   />
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         );

//       case 'portfolio':
//         return (
//           <motion.div
//             key="portfolio"
//             variants={contentVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//           >
//             <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl">
//               <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Portfolio Management</h2>
//               <StockCardGrid
//                 stocks={getStockCardData()}
//                 onStockClick={(stock) => setSelectedStock(stocks.find(s => s.ticker === stock.ticker) || null)}
//                 onWatchToggle={handleWatchToggle}
//                 showCharts={true}
//                 compact={false}
//               />
//             </div>
//           </motion.div>
//         );

//       case 'market':
//       case 'insights':
//         return (
//           <motion.div
//             key={activeTab}
//             variants={contentVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//           >
//             <StockInsights 
//               userStocks={stocks}
//               portfolio={portfolio}
//               realtimePrices={realtimePrices}
//             />
//           </motion.div>
//         );

//       case 'reports':
//         return (
//           <motion.div
//             key="reports"
//             variants={contentVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//           >
//             <Reports 
//               portfolio={portfolio}
//               realtimePrices={realtimePrices}
//               userId={user.id}
//             />
//           </motion.div>
//         );

//       case 'notifications':
//         return (
//           <motion.div
//             key="notifications"
//             variants={contentVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//           >
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <NotificationSettingsPanel />
//               <StockAlertManager 
//                 userStocks={stocks}
//                 realtimePrices={realtimePrices}
//               />
//             </div>
//           </motion.div>
//         );

//       default:
//         return (
//           <motion.div
//             key="default"
//             variants={contentVariants}
//             initial="hidden"
//             animate="visible"
//             exit="exit"
//             className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-12 text-center shadow-xl"
//           >
//             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
//               {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section
//             </h2>
//             <p className="text-slate-600 dark:text-slate-400">
//               This section is coming soon with enhanced features!
//             </p>
//           </motion.div>
//         );
//     }
//   };

//   return (
//     <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
//       {/* Animated Background */}
//       <StockMarketBackground
//         theme={isDarkMode ? 'dark' : 'light'}
//         marketTrend={marketTrend}
//         intensity="medium"
//       />

//       <div className="relative z-10 flex">
//         {/* Navigation Sidebar */}
//         <ModernNavigation
//           activeTab={activeTab}
//           onTabChange={setActiveTab}
//           user={user}
//           notificationCount={3} // You can make this dynamic
//         />

//         {/* Main Content */}
//         <div className="flex-1 ml-20 lg:ml-80 transition-all duration-300">
//           {/* Header */}
//           <DashboardHeader
//             user={user}
//             onLogout={onLogout}
//             onAddStock={() => setIsAddModalOpen(true)}
//             portfolioValue={portfolio.currentValue}
//             portfolioChange={portfolio.totalReturn}
//             portfolioChangePercent={portfolio.totalReturnPercent}
//             notificationCount={3}
//             isDarkMode={isDarkMode}
//             onThemeToggle={handleThemeToggle}
//           />

//           {/* Main Content Area */}
//           <main className="p-6 pb-20">
//             {/* API Quota Banner */}
//             <ApiQuotaBanner />

//             {/* Tab Content */}
//             <AnimatePresence mode="wait">
//               {renderTabContent()}
//             </AnimatePresence>
//           </main>
//         </div>
//       </div>

//       {/* Modals */}
//       <AddStockModal
//         isOpen={isAddModalOpen}
//         onClose={() => setIsAddModalOpen(false)}
//         onAddStock={handleAddStock}
//       />

//       {selectedStock && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.9 }}
//             className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
//           >
//             <HistoricalChart 
//               ticker={selectedStock.ticker}
//               onClose={() => setSelectedStock(null)}
//             />
//           </motion.div>
//         </div>
//       )}
//     </div>
//   );
// }

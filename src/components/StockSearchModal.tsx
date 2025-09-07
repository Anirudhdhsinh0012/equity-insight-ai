'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Star,
  Building,
  Globe,
  DollarSign,
  BarChart3,
  Loader2
} from 'lucide-react';

interface StockSearchResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  sector: string;
  description?: string;
}

interface StockSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStock: (ticker: string, name: string) => void;
  currentWatchlist: string[]; // Tickers already in user's watchlist
}

export default function StockSearchModal({ 
  isOpen, 
  onClose, 
  onAddStock, 
  currentWatchlist 
}: StockSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock stock database - In production, this would come from an API
  const mockStockDatabase: StockSearchResult[] = [
    // Technology
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.20, change: 2.15, changePercent: 1.17, volume: 51234567, marketCap: '$2.85T', sector: 'Technology', description: 'Multinational technology company' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -1.25, changePercent: -0.33, volume: 31456789, marketCap: '$2.81T', sector: 'Technology', description: 'Software and cloud services' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: 0.87, changePercent: 0.61, volume: 42567890, marketCap: '$1.78T', sector: 'Technology', description: 'Search and advertising technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.75, change: 3.42, changePercent: 2.24, volume: 38901234, marketCap: '$1.61T', sector: 'Technology', description: 'E-commerce and cloud computing' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -5.67, changePercent: -2.23, volume: 67890123, marketCap: '$789.2B', sector: 'Technology', description: 'Electric vehicles and energy' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.90, change: 12.34, changePercent: 1.43, volume: 34567812, marketCap: '$2.16T', sector: 'Technology', description: 'Graphics processing and AI chips' },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 485.25, change: 7.82, changePercent: 1.64, volume: 28945671, marketCap: '$1.23T', sector: 'Technology', description: 'Social media and virtual reality' },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 445.30, change: -2.15, changePercent: -0.48, volume: 15678934, marketCap: '$198.7B', sector: 'Technology', description: 'Streaming entertainment' },
    
    // Finance
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 168.45, change: 1.23, changePercent: 0.74, volume: 12345678, marketCap: '$495.2B', sector: 'Finance', description: 'Investment banking and financial services' },
    { symbol: 'BAC', name: 'Bank of America Corp.', price: 32.87, change: 0.45, changePercent: 1.39, volume: 45678901, marketCap: '$268.5B', sector: 'Finance', description: 'Consumer and commercial banking' },
    { symbol: 'WFC', name: 'Wells Fargo & Company', price: 45.23, change: -0.67, changePercent: -1.46, volume: 23456789, marketCap: '$171.3B', sector: 'Finance', description: 'Banking and financial services' },
    { symbol: 'GS', name: 'Goldman Sachs Group Inc.', price: 382.15, change: 4.56, changePercent: 1.21, volume: 1876543, marketCap: '$131.2B', sector: 'Finance', description: 'Investment banking and securities' },
    
    // Healthcare
    { symbol: 'JNJ', name: 'Johnson & Johnson', price: 162.34, change: 0.89, changePercent: 0.55, volume: 8765432, marketCap: '$428.9B', sector: 'Healthcare', description: 'Pharmaceutical and medical devices' },
    { symbol: 'PFE', name: 'Pfizer Inc.', price: 35.67, change: -0.23, changePercent: -0.64, volume: 34567890, marketCap: '$200.1B', sector: 'Healthcare', description: 'Biopharmaceutical company' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', price: 523.89, change: 6.78, changePercent: 1.31, volume: 3456789, marketCap: '$496.8B', sector: 'Healthcare', description: 'Health insurance and services' },
    
    // Energy
    { symbol: 'XOM', name: 'Exxon Mobil Corporation', price: 109.45, change: 2.34, changePercent: 2.18, volume: 18765432, marketCap: '$456.7B', sector: 'Energy', description: 'Oil and gas exploration' },
    { symbol: 'CVX', name: 'Chevron Corporation', price: 156.78, change: 1.89, changePercent: 1.22, volume: 12876543, marketCap: '$301.2B', sector: 'Energy', description: 'Integrated oil and gas' },
    
    // Consumer
    { symbol: 'WMT', name: 'Walmart Inc.', price: 163.25, change: 0.78, changePercent: 0.48, volume: 9876543, marketCap: '$442.1B', sector: 'Consumer', description: 'Retail corporation' },
    { symbol: 'HD', name: 'The Home Depot Inc.', price: 348.90, change: -1.45, changePercent: -0.41, volume: 4567890, marketCap: '$361.2B', sector: 'Consumer', description: 'Home improvement retail' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', price: 155.67, change: 0.34, changePercent: 0.22, volume: 6789012, marketCap: '$371.8B', sector: 'Consumer', description: 'Consumer goods' },
    
    // Industrial
    { symbol: 'BA', name: 'The Boeing Company', price: 198.45, change: -3.67, changePercent: -1.82, volume: 7890123, marketCap: '$118.5B', sector: 'Industrial', description: 'Aerospace and defense' },
    { symbol: 'CAT', name: 'Caterpillar Inc.', price: 284.56, change: 2.89, changePercent: 1.03, volume: 3210987, marketCap: '$152.7B', sector: 'Industrial', description: 'Heavy machinery and equipment' },
    
    // Communication
    { symbol: 'VZ', name: 'Verizon Communications Inc.', price: 40.23, change: 0.12, changePercent: 0.30, volume: 23456781, marketCap: '$169.2B', sector: 'Communication', description: 'Telecommunications services' },
    { symbol: 'T', name: 'AT&T Inc.', price: 18.56, change: -0.08, changePercent: -0.43, volume: 45678912, marketCap: '$133.5B', sector: 'Communication', description: 'Telecommunications and media' }
  ];

  const categories = [
    { id: 'all', name: 'All Stocks', count: mockStockDatabase.length },
    { id: 'Technology', name: 'Technology', count: mockStockDatabase.filter(s => s.sector === 'Technology').length },
    { id: 'Finance', name: 'Finance', count: mockStockDatabase.filter(s => s.sector === 'Finance').length },
    { id: 'Healthcare', name: 'Healthcare', count: mockStockDatabase.filter(s => s.sector === 'Healthcare').length },
    { id: 'Energy', name: 'Energy', count: mockStockDatabase.filter(s => s.sector === 'Energy').length },
    { id: 'Consumer', name: 'Consumer', count: mockStockDatabase.filter(s => s.sector === 'Consumer').length },
    { id: 'Industrial', name: 'Industrial', count: mockStockDatabase.filter(s => s.sector === 'Industrial').length },
    { id: 'Communication', name: 'Communication', count: mockStockDatabase.filter(s => s.sector === 'Communication').length }
  ];

  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show popular stocks by default
      const filtered = selectedCategory === 'all' 
        ? mockStockDatabase.slice(0, 12)
        : mockStockDatabase.filter(stock => stock.sector === selectedCategory).slice(0, 12);
      setSearchResults(filtered);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      const filtered = mockStockDatabase.filter(stock => {
        const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            stock.sector.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === 'all' || stock.sector === selectedCategory;
        
        return matchesSearch && matchesCategory;
      });
      
      setSearchResults(filtered);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleAddToWatchlist = (stock: StockSearchResult) => {
    onAddStock(stock.symbol, stock.name);
  };

  const isInWatchlist = (symbol: string) => {
    return currentWatchlist.includes(symbol);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600/20 rounded-lg">
                <Search className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Stocks to Watchlist</h2>
                <p className="text-gray-400 text-sm">Search and add stocks to your personal watchlist</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search stocks by symbol, name, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                autoFocus
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No stocks found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((stock) => (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{stock.symbol}</h3>
                            <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                              {stock.sector}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-white">
                              ${stock.price.toFixed(2)}
                            </span>
                            <div className={`flex items-center gap-1 ${
                              stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {stock.change >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">
                                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <h4 className="text-gray-300 font-medium mb-1">{stock.name}</h4>
                        {stock.description && (
                          <p className="text-gray-400 text-sm mb-2">{stock.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            <span>Market Cap: {stock.marketCap}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" />
                            <span>Volume: {stock.volume.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {isInWatchlist(stock.symbol) ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-gray-300 text-sm">In Watchlist</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToWatchlist(stock)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4 text-white" />
                            <span className="text-white text-sm font-medium">Add to Watchlist</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {searchResults.length} stocks available • {currentWatchlist.length} in your watchlist
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

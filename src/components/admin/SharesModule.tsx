'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Star,
  Search,
  Filter,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Edit,
  Trash2,
  Plus,
  Save,
  X
} from 'lucide-react';
import realTimeDataService, { DatabaseStock } from '@/services/realTimeDataService';

interface SharesModuleProps {
  className?: string;
}

const SharesModule: React.FC<SharesModuleProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'watchersCount' | 'currentPrice' | 'changePercent24h' | 'totalHoldingValue'>('watchersCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedStock, setSelectedStock] = useState<DatabaseStock | null>(null);
  const [showStockDetails, setShowStockDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStock, setEditingStock] = useState<Partial<DatabaseStock>>({});
  const [stocks, setStocks] = useState<DatabaseStock[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time stock updates
  useEffect(() => {
    const unsubscribe = realTimeDataService.stocks.subscribe((updatedStocks) => {
      setStocks(updatedStocks);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // CRUD Functions
  const handleCreateStock = async () => {
    try {
      if (editingStock.symbol && editingStock.name) {
        await realTimeDataService.stocks.createStock({
          symbol: editingStock.symbol,
          name: editingStock.name,
          sector: editingStock.sector || 'Technology',
          currentPrice: editingStock.currentPrice || 0,
          change24h: editingStock.change24h || 0,
          changePercent24h: editingStock.changePercent24h || 0,
          marketCap: editingStock.marketCap || '0',
          volume24h: editingStock.volume24h || 0,
          watchersCount: editingStock.watchersCount || 0,
          holdersCount: editingStock.holdersCount || 0,
          avgHoldingValue: editingStock.avgHoldingValue || 0,
          totalHoldingValue: editingStock.totalHoldingValue || 0,
          sentiment: editingStock.sentiment || 'neutral',
          riskLevel: editingStock.riskLevel || 'medium'
        });
        setShowCreateModal(false);
        setEditingStock({});
      }
    } catch (error) {
      console.error('Error creating stock:', error);
    }
  };

  const handleUpdateStock = async () => {
    try {
      if (selectedStock && editingStock) {
        await realTimeDataService.stocks.updateStock(selectedStock.id, editingStock);
        setShowEditModal(false);
        setEditingStock({});
        setSelectedStock(null);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    try {
      if (confirm('Are you sure you want to delete this stock?')) {
        await realTimeDataService.stocks.deleteStock(stockId);
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  const openEditModal = (stock: DatabaseStock) => {
    setSelectedStock(stock);
    setEditingStock({ ...stock });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setEditingStock({
      symbol: '',
      name: '',
      sector: 'Technology',
      currentPrice: 0,
      sentiment: 'neutral',
      riskLevel: 'medium'
    });
    setShowCreateModal(true);
  };

  const sectors = Array.from(new Set(stocks.map((share: DatabaseStock) => share.sector)));

  // Filtered and sorted shares
  const filteredShares = useMemo(() => {
    let filtered = stocks.filter((share: DatabaseStock) => {
      const matchesSearch = share.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           share.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = filterSector === 'all' || share.sector === filterSector;
      const matchesSentiment = filterSentiment === 'all' || share.sentiment === filterSentiment;
      
      return matchesSearch && matchesSector && matchesSentiment;
    });

    filtered.sort((a: DatabaseStock, b: DatabaseStock) => {
      let aValue: any = a[sortBy as keyof DatabaseStock];
      let bValue: any = b[sortBy as keyof DatabaseStock];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [stocks, searchTerm, filterSector, filterSentiment, sortBy, sortOrder]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getSentimentBadge = (sentiment: string) => {
    const colors = {
      bullish: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      bearish: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[sentiment as keyof typeof colors]}`}>
        {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
      </span>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[riskLevel as keyof typeof colors]}`}>
        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
      </span>
    );
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  // Calculate summary stats
  const totalWatchers = stocks.reduce((sum: number, share: DatabaseStock) => sum + share.watchersCount, 0);
  const totalHolders = stocks.reduce((sum: number, share: DatabaseStock) => sum + share.holdersCount, 0);
  const totalValue = stocks.reduce((sum: number, share: DatabaseStock) => sum + share.totalHoldingValue, 0);
  const avgChange = stocks.length > 0 ? stocks.reduce((sum: number, share: DatabaseStock) => sum + share.changePercent24h, 0) / stocks.length : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading stock data...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Shares Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Monitor stock performance, user holdings, and market sentiment
          </p>
        </div>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={openCreateModal}
          className="mt-4 lg:mt-0 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Stock
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Watchers', value: totalWatchers, icon: Eye, color: 'from-blue-500 to-blue-600' },
          { label: 'Total Holders', value: totalHolders, icon: Users, color: 'from-green-500 to-green-600' },
          { label: 'Total Holdings Value', value: formatCurrency(totalValue), icon: DollarSign, color: 'from-purple-500 to-purple-600' },
          { label: 'Avg 24h Change', value: `${avgChange > 0 ? '+' : ''}${avgChange.toFixed(2)}%`, icon: TrendingUp, color: avgChange >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sectors</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
            
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sentiment</option>
              <option value="bullish">Bullish</option>
              <option value="bearish">Bearish</option>
              <option value="neutral">Neutral</option>
            </select>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="watchersCount-desc">Most Watched</option>
              <option value="watchersCount-asc">Least Watched</option>
              <option value="currentPrice-desc">Highest Price</option>
              <option value="currentPrice-asc">Lowest Price</option>
              <option value="changePercent24h-desc">Biggest Gainers</option>
              <option value="changePercent24h-asc">Biggest Losers</option>
              <option value="totalHoldingValue-desc">Highest Holdings</option>
              <option value="symbol-asc">Symbol A-Z</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Shares Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {filteredShares.map((share, index) => (
          <motion.div
            key={share.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{share.symbol}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{share.symbol}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{share.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  {formatCurrency(share.currentPrice)}
                </p>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  share.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {getChangeIcon(share.changePercent24h)}
                  {share.changePercent24h >= 0 ? '+' : ''}{share.changePercent24h.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                {share.sector}
              </span>
              {getSentimentBadge(share.sentiment)}
              {getRiskBadge(share.riskLevel)}
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-600 dark:text-slate-400">Watchers</span>
                </div>
                <span className="font-medium text-slate-800 dark:text-white">
                  {share.watchersCount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-slate-600 dark:text-slate-400">Holders</span>
                </div>
                <span className="font-medium text-slate-800 dark:text-white">
                  {share.holdersCount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-500" />
                  <span className="text-slate-600 dark:text-slate-400">Avg Holding</span>
                </div>
                <span className="font-medium text-slate-800 dark:text-white">
                  {formatCurrency(share.avgHoldingValue)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  <span className="text-slate-600 dark:text-slate-400">Total Holdings</span>
                </div>
                <span className="font-medium text-slate-800 dark:text-white">
                  {formatCurrency(share.totalHoldingValue)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  <span className="text-slate-600 dark:text-slate-400">24h Volume</span>
                </div>
                <span className="font-medium text-slate-800 dark:text-white">
                  {formatNumber(share.volume24h)}
                </span>
              </div>
            </div>

            {/* Market Cap */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Market Cap</span>
                <span className="font-bold text-slate-800 dark:text-white">${share.marketCap}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <button
                onClick={() => openEditModal(share)}
                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteStock(share.id)}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Top Performers Today</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Biggest Gainer */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Biggest Gainer</h3>
            {(() => {
              if (stocks.length === 0) return <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"><p className="text-slate-500">No data</p></div>;
              const biggestGainer = stocks.reduce((max: DatabaseStock, share: DatabaseStock) => 
                share.changePercent24h > max.changePercent24h ? share : max
              );
              return (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-bold text-lg text-slate-800 dark:text-white">{biggestGainer.symbol}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{biggestGainer.name}</p>
                  <p className="text-2xl font-bold text-green-600">+{biggestGainer.changePercent24h.toFixed(2)}%</p>
                </div>
              );
            })()}
          </div>

          {/* Most Watched */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Most Watched</h3>
            {(() => {
              if (stocks.length === 0) return <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"><p className="text-slate-500">No data</p></div>;
              const mostWatched = stocks.reduce((max: DatabaseStock, share: DatabaseStock) => 
                share.watchersCount > max.watchersCount ? share : max
              );
              return (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="font-bold text-lg text-slate-800 dark:text-white">{mostWatched.symbol}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{mostWatched.name}</p>
                  <p className="text-2xl font-bold text-blue-600">{mostWatched.watchersCount.toLocaleString()}</p>
                </div>
              );
            })()}
          </div>

          {/* Highest Value */}
          <div className="text-center">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Highest Holdings</h3>
            {(() => {
              if (stocks.length === 0) return <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"><p className="text-slate-500">No data</p></div>;
              const highestValue = stocks.reduce((max: DatabaseStock, share: DatabaseStock) => 
                share.totalHoldingValue > max.totalHoldingValue ? share : max
              );
              return (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="font-bold text-lg text-slate-800 dark:text-white">{highestValue.symbol}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{highestValue.name}</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(highestValue.totalHoldingValue)}</p>
                </div>
              );
            })()}
          </div>
        </div>
      </motion.div>

      {/* Create Stock Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New Stock</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Stock Symbol
                </label>
                <input
                  type="text"
                  value={editingStock.symbol || ''}
                  onChange={(e) => setEditingStock({ ...editingStock, symbol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., AAPL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editingStock.name || ''}
                  onChange={(e) => setEditingStock({ ...editingStock, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., Apple Inc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sector
                </label>
                <select
                  value={editingStock.sector || 'Technology'}
                  onChange={(e) => setEditingStock({ ...editingStock, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Financial">Financial</option>
                  <option value="Consumer">Consumer</option>
                  <option value="Energy">Energy</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Current Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingStock.currentPrice || 0}
                  onChange={(e) => setEditingStock({ ...editingStock, currentPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateStock}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Stock
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Stock</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Stock Symbol
                </label>
                <input
                  type="text"
                  value={editingStock.symbol || ''}
                  onChange={(e) => setEditingStock({ ...editingStock, symbol: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., AAPL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editingStock.name || ''}
                  onChange={(e) => setEditingStock({ ...editingStock, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., Apple Inc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sector
                </label>
                <select
                  value={editingStock.sector || 'Technology'}
                  onChange={(e) => setEditingStock({ ...editingStock, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Financial">Financial</option>
                  <option value="Consumer">Consumer</option>
                  <option value="Energy">Energy</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Current Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingStock.currentPrice || 0}
                  onChange={(e) => setEditingStock({ ...editingStock, currentPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateStock}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Update Stock
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SharesModule;

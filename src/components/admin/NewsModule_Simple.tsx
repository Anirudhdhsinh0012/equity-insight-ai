'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NewsModuleProps {
  className?: string;
}

const NewsModule: React.FC<NewsModuleProps> = ({ className = '' }) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock news data
  const mockNews = [
    {
      id: '1',
      title: 'Tech Stocks Rally Continues',
      summary: 'Technology stocks continue their upward trend as earnings season approaches',
      category: 'technology',
      sentiment: 'positive',
      isPinned: false,
      isBreaking: false,
      views: 1250,
      publishedAt: new Date(),
      tags: ['tech', 'stocks', 'earnings'],
      relatedSymbols: ['AAPL', 'GOOGL', 'MSFT']
    },
    {
      id: '2',
      title: 'Market Analysis: Q4 Outlook',
      summary: 'Analysts predict strong Q4 performance across multiple sectors',
      category: 'market',
      sentiment: 'positive',
      isPinned: true,
      isBreaking: true,
      views: 890,
      publishedAt: new Date(),
      tags: ['market', 'analysis', 'Q4'],
      relatedSymbols: ['SPY', 'QQQ']
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setNews(mockNews);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredNews = news.filter((article: any) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || article.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'market', label: 'Market News' },
    { value: 'technology', label: 'Technology' },
    { value: 'economy', label: 'Economy' },
    { value: 'crypto', label: 'Cryptocurrency' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading news data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">News Activity Monitor</h2>
          <p className="text-gray-600 mt-1">Track user engagement with financial news articles</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Articles', value: news.length, icon: '📰', color: 'from-blue-500 to-blue-600' },
          { label: 'Pinned Articles', value: news.filter(a => a.isPinned).length, icon: '📌', color: 'from-yellow-500 to-yellow-600' },
          { label: 'Breaking News', value: news.filter(a => a.isBreaking).length, icon: '⚠️', color: 'from-red-500 to-red-600' },
          { label: 'Total Views', value: news.reduce((sum, a) => sum + a.views, 0).toLocaleString(), icon: '👁️', color: 'from-green-500 to-green-600' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${stat.color} rounded-xl p-6 text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-slate-200"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search news by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* News Articles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredNews.map((article: any, index: number) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900">{article.title}</h3>
                    {article.isPinned && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        📌 Pinned
                      </span>
                    )}
                    {article.isBreaking && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium animate-pulse">
                        🚨 Breaking
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 mb-4 leading-relaxed">{article.summary}</p>

                <div className="flex items-center gap-6 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <span>👁️</span>
                    <span>{article.views} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🔗</span>
                    <span>Share</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{article.publishedAt.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag: string, tagIndex: number) => (
                      <span 
                        key={tagIndex}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-slate-500">Related:</span>
                    {article.relatedSymbols.map((symbol: string, symbolIndex: number) => (
                      <span 
                        key={symbolIndex}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono font-bold"
                      >
                        ${symbol}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredNews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No articles found</h3>
          <p className="text-slate-600">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default NewsModule;

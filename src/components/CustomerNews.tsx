'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  Search,
  Filter,
  Clock,
  ExternalLink,
  TrendingUp,
  BookmarkPlus,
  Share2,
  RefreshCw,
  Eye,
  Calendar,
  Globe,
  Zap,
  Star
} from 'lucide-react';
import customerNewsService, { CustomerNewsArticle } from '@/services/customerNewsService';
import { activityLogger } from '@/services/activityLoggingService';
import { DatabaseUser } from '@/services/realTimeDataService';
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface CustomerNewsProps {
  currentUser?: DatabaseUser | null;
  className?: string;
}

const CustomerNews: React.FC<CustomerNewsProps> = ({ currentUser, className = '' }) => {
  const [articles, setArticles] = useState<CustomerNewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<CustomerNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<CustomerNewsArticle | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBreakingOnly, setShowBreakingOnly] = useState(false);

  // Initialize session tracking
  const {
    sessionStartTime,
    lastActivityTime,
    startSession,
    endSession,
    updateLastActivity,
    trackEngagementActivity
  } = useSessionTracking({
    user: currentUser || null,
    autoStartSession: false, // Let parent component handle session
    trackPageViews: false,   // This is a component, not a page
    trackEngagement: true,
    sessionTimeoutMinutes: 30
  });

  const categories = [
    { value: 'all', label: 'All News', icon: Globe },
    { value: 'stocks', label: 'Stocks', icon: TrendingUp },
    { value: 'crypto', label: 'Crypto', icon: Zap },
    { value: 'market', label: 'Market', icon: Newspaper },
    { value: 'economy', label: 'Economy', icon: Calendar },
    { value: 'technology', label: 'Technology', icon: Star },
    { value: 'earnings', label: 'Earnings', icon: BookmarkPlus }
  ];

  // Set current user for activity logging
  useEffect(() => {
    if (currentUser) {
      activityLogger.setCurrentUser(currentUser);
    }
  }, [currentUser]);

  // Subscribe to news updates
  useEffect(() => {
    const unsubscribe = customerNewsService.subscribe((newArticles) => {
      setArticles(newArticles);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Filter articles based on search and category
  useEffect(() => {
    let filtered = articles;

    if (showBreakingOnly) {
      filtered = filtered.filter(article => article.isBreaking);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedCategory, showBreakingOnly]);

  const handleArticleClick = async (article: CustomerNewsArticle) => {
    setSelectedArticle(article);
    
    // Log news view activity
    if (currentUser) {
      await activityLogger.logNewsView(
        article.id,
        article.title,
        article.source,
        article.category
      );

      // Track article click engagement
      await activityLogger.logUserEngagement('click', 'news-article', 'news', 0, {
        articleId: article.id,
        articleTitle: article.title,
        source: article.source,
        category: article.category,
        isBreaking: article.isBreaking,
        sentiment: article.sentiment,
        publishedAt: article.publishedAt
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const startTime = performance.now();
    
    try {
      await customerNewsService.forceRefresh();
      
      // Track performance metric
      if (currentUser) {
        await activityLogger.logSystemEvent('performance', 'news-refresh-time', { duration: performance.now() - startTime });
        await activityLogger.logUserEngagement('click', 'news-refresh-button', 'news', 0);
      }
    } catch (error) {
      console.error('Failed to refresh news:', error);
      
      // Track error
      if (currentUser) {
        await activityLogger.logSystemEvent('error', 'news-refresh', { error: (error as Error).message }, 'error');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced search function with activity tracking
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (currentUser && term.trim()) {
      await activityLogger.logSearchActivity(term, 'news', filteredArticles.length);
      await activityLogger.logUserEngagement('click', 'news-search', 'news', 0, {
        searchTerm: term,
        resultCount: filteredArticles.length
      });
    }
  };

  // Enhanced category filter with activity tracking
  const handleCategoryFilter = async (category: string) => {
    setSelectedCategory(category);
    
    if (currentUser) {
      await activityLogger.logSearchActivity(`category:${category}`, 'news', filteredArticles.length);
      await activityLogger.logUserEngagement('click', 'news-category-filter', 'news', 0, {
        selectedCategory: category,
        resultCount: filteredArticles.length
      });
    }
  };

  // Enhanced breaking news filter with activity tracking
  const handleBreakingNewsToggle = async () => {
    const newValue = !showBreakingOnly;
    setShowBreakingOnly(newValue);
    
    if (currentUser) {
      await activityLogger.logUserEngagement('click', 'breaking-news-toggle', 'news', 0, {
        showBreakingOnly: newValue,
        breakingNewsCount: articles.filter(a => a.isBreaking).length
      });
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const breakingNews = articles.filter(article => article.isBreaking).slice(0, 3);
  const trendingTopics = customerNewsService.getTrendingTopics();

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading latest financial news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Financial News
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Stay updated with the latest market developments and financial insights
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <button
            onClick={() => handleBreakingNewsToggle()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showBreakingOnly 
                ? 'bg-red-500 text-white' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Zap className="w-4 h-4" />
            Breaking News
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-800 dark:text-red-300">Breaking News</h3>
          </div>
          <div className="space-y-2">
            {breakingNews.map(article => (
              <button
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="block text-left text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
              >
                {article.title}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryFilter(category.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trending Topics */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Trending Topics</h3>
            <div className="space-y-2">
              {trendingTopics.slice(0, 8).map((topic, index) => (
                <div key={topic.topic} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{topic.topic}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {topic.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleArticleClick(article)}
                >
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(article.sentiment)}`}>
                        {article.sentiment}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(article.publishedAt)}
                      </div>
                    </div>
                    
                    {article.isBreaking && (
                      <div className="flex items-center gap-1 mb-2">
                        <Zap className="w-3 h-3 text-red-500" />
                        <span className="text-xs font-medium text-red-500">BREAKING</span>
                      </div>
                    )}

                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 line-clamp-3">
                      {article.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{article.source}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{article.readTime} min read</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {article.relatedStocks?.slice(0, 2).map(stock => (
                          <span key={stock} className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                            {stock}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredArticles.length === 0 && !loading && (
            <div className="text-center py-12">
              <Newspaper className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">No articles found</h3>
              <p className="text-slate-500">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(selectedArticle.sentiment)}`}>
                      {selectedArticle.sentiment}
                    </span>
                    <span className="text-sm text-slate-500">{selectedArticle.source}</span>
                  </div>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>

                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                  {selectedArticle.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                  <span>By {selectedArticle.author}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(selectedArticle.publishedAt)}</span>
                  <span>•</span>
                  <span>{selectedArticle.readTime} min read</span>
                </div>

                {selectedArticle.imageUrl && (
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}

                <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
                    {selectedArticle.summary}
                  </p>
                  <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {selectedArticle.content}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map(tag => (
                      <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedArticle.relatedStocks?.map(stock => (
                      <span key={stock} className="text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded">
                        {stock}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Read Full Article
                  </a>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <BookmarkPlus className="w-4 h-4" />
                    Save
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerNews;

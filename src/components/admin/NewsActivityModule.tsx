'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  User,
  RefreshCw,
  BarChart3,
  Globe,
  Zap,
  DollarSign,
  Users,
  Timer,
  Newspaper,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import activityLogger, { NewsViewActivity } from '@/services/activityLoggingService';
import realTimeDataService, { DatabaseUser } from '@/services/realTimeDataService';

interface NewsActivityModuleProps {
  className?: string;
}

const NewsActivityModule: React.FC<NewsActivityModuleProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('week');
  const [selectedActivity, setSelectedActivity] = useState<NewsViewActivity | null>(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newsActivities, setNewsActivities] = useState<NewsViewActivity[]>([]);
  const [users, setUsers] = useState<DatabaseUser[]>([]);

  // Load initial data
  useEffect(() => {
    loadNewsActivities();
    loadUsers();
  }, []);

  // Subscribe to activity updates
  useEffect(() => {
    const unsubscribe = activityLogger.subscribe((data) => {
      if (data.newsActivities) {
        setNewsActivities(data.newsActivities);
      }
    });

    return unsubscribe;
  }, []);

  const loadNewsActivities = () => {
    const dateFilters = getDateFilters();
    const activities = activityLogger.getNewsViewActivities(dateFilters);
    setNewsActivities(activities);
  };

  const loadUsers = async () => {
    const allUsers = await realTimeDataService.users.getUsers();
    setUsers(allUsers);
  };

  const getDateFilters = () => {
    const now = new Date();
    const filters: any = {};
    
    switch (selectedDateRange) {
      case 'today':
        filters.dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        filters.dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filters.dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        filters.dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return filters;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNewsActivities();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const openActivityDetails = (activity: NewsViewActivity) => {
    setSelectedActivity(activity);
    setShowActivityDetails(true);
  };

  const categories = [
    { value: 'all', label: 'All Categories', icon: Globe, color: 'text-slate-600' },
    { value: 'stocks', label: 'Stocks', icon: TrendingUp, color: 'text-green-600' },
    { value: 'crypto', label: 'Crypto', icon: Zap, color: 'text-orange-600' },
    { value: 'market', label: 'Market', icon: BarChart3, color: 'text-blue-600' },
    { value: 'economy', label: 'Economy', icon: DollarSign, color: 'text-purple-600' }
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  // Filter activities based on search and filters
  const filteredActivities = useMemo(() => {
    return newsActivities.filter((activity: NewsViewActivity) => {
      const matchesSearch = !searchTerm || 
        activity.newsTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.newsSource.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'all' || activity.newsCategory === filterCategory;
      const matchesUser = filterUser === 'all' || activity.userId === filterUser;

      return matchesSearch && matchesCategory && matchesUser;
    });
  }, [newsActivities, searchTerm, filterCategory, filterUser]);

  // Calculate statistics
  const totalActivities = filteredActivities.length;
  const uniqueUsers = new Set(filteredActivities.map(a => a.userId)).size;
  const totalReadingTime = filteredActivities.reduce((sum, a) => sum + a.timeSpent, 0);
  const averageReadingTime = totalActivities > 0 ? totalReadingTime / totalActivities : 0;

  // Top articles by views
  const articleViews = filteredActivities.reduce((acc, activity) => {
    const key = activity.newsId;
    if (!acc[key]) {
      acc[key] = {
        title: activity.newsTitle,
        source: activity.newsSource,
        category: activity.newsCategory,
        views: 0,
        totalTime: 0
      };
    }
    acc[key].views++;
    acc[key].totalTime += activity.timeSpent;
    return acc;
  }, {} as Record<string, any>);

  const topArticles = Object.values(articleViews)
    .sort((a: any, b: any) => b.views - a.views)
    .slice(0, 5);

  // User engagement stats
  const userEngagement = filteredActivities.reduce((acc, activity) => {
    const userId = activity.userId;
    if (!acc[userId]) {
      acc[userId] = {
        userName: activity.userName,
        userEmail: activity.userEmail,
        views: 0,
        totalTime: 0,
        categories: new Set()
      };
    }
    acc[userId].views++;
    acc[userId].totalTime += activity.timeSpent;
    acc[userId].categories.add(activity.newsCategory);
    return acc;
  }, {} as Record<string, any>);

  const topUsers = Object.values(userEngagement)
    .sort((a: any, b: any) => b.views - a.views)
    .slice(0, 5);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : Newspaper;
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'text-slate-600';
  };

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
            News Activity Logs
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track user engagement with financial news content
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {totalActivities}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Views</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {uniqueUsers}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Active Users</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {formatTime(Math.round(averageReadingTime))}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Avg Reading Time</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Eye className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {formatTime(totalReadingTime)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Reading Time</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and Activity List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date Range */}
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {/* User Filter */}
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity List */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Recent News Views ({filteredActivities.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No news activities found</p>
                </div>
              ) : (
                filteredActivities.map((activity, index) => {
                  const CategoryIcon = getCategoryIcon(activity.newsCategory);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      onClick={() => openActivityDetails(activity)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700`}>
                          <CategoryIcon className={`w-4 h-4 ${getCategoryColor(activity.newsCategory)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-slate-800 dark:text-white truncate">
                              {activity.newsTitle}
                            </h4>
                            <span className="text-xs text-slate-500">
                              {formatTimeAgo(activity.viewedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {activity.userName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(activity.timeSpent)}
                            </span>
                            <span className="capitalize">{activity.newsSource}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          {/* Top Articles */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Most Viewed Articles
            </h3>
            <div className="space-y-3">
              {topArticles.map((article: any, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {article.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{article.views} views</span>
                      <span>{formatTime(article.totalTime)} total</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Most Active Users
            </h3>
            <div className="space-y-3">
              {topUsers.map((user: any, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-medium text-white">
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-white">
                      {user.userName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {user.views} articles • {formatTime(user.totalTime)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}
      <AnimatePresence>
        {showActivityDetails && selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowActivityDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Activity Details
                  </h3>
                  <button
                    onClick={() => setShowActivityDetails(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Article</label>
                    <div className="text-slate-800 dark:text-white font-medium">
                      {selectedActivity.newsTitle}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">User</label>
                      <div className="text-slate-800 dark:text-white">
                        {selectedActivity.userName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {selectedActivity.userEmail}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Category</label>
                      <div className="text-slate-800 dark:text-white capitalize">
                        {selectedActivity.newsCategory}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Source</label>
                      <div className="text-slate-800 dark:text-white">
                        {selectedActivity.newsSource}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Reading Time</label>
                      <div className="text-slate-800 dark:text-white">
                        {formatTime(selectedActivity.timeSpent)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Viewed At</label>
                    <div className="text-slate-800 dark:text-white">
                      {selectedActivity.viewedAt.toLocaleString()}
                    </div>
                  </div>

                  {selectedActivity.deviceInfo && (
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Device Info</label>
                      <div className="text-slate-800 dark:text-white text-sm">
                        {selectedActivity.deviceInfo.browser} on {selectedActivity.deviceInfo.os}
                        {selectedActivity.deviceInfo.isMobile && ' (Mobile)'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsActivityModule;

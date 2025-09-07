'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ActivityStats {
  totalUsers: number;
  totalNewsViews: number;
  totalQuizAttempts: number;
  averageQuizScore: number;
  averageReadingTime: number;
  topPerformers: Array<{
    userId: string;
    score: number;
    activities: number;
  }>;
  dailyActivity: Array<{
    date: string;
    newsViews: number;
    quizAttempts: number;
  }>;
  categoryEngagement: Array<{
    category: string;
    views: number;
    percentage: number;
  }>;
}

interface FilterState {
  dateRange: string;
  activityType: string;
  userId: string;
}

const AdminActivityDashboard: React.FC = () => {
  const [stats, setStats] = useState<ActivityStats>({
    totalUsers: 0,
    totalNewsViews: 0,
    totalQuizAttempts: 0,
    averageQuizScore: 0,
    averageReadingTime: 0,
    topPerformers: [],
    dailyActivity: [],
    categoryEngagement: []
  });
  
  const [newsActivities, setNewsActivities] = useState<any[]>([]);
  const [quizActivities, setQuizActivities] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '7d',
    activityType: 'all',
    userId: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Simple activity logging service mock
  const mockActivityService = {
    getNewsViewActivities: async (userId?: string) => [
      {
        id: '1',
        userId: userId || 'user_123',
        title: 'Tech Stocks Rally Continues',
        category: 'Technology',
        timestamp: new Date().toISOString(),
        readingTime: 45,
        source: 'NewsAPI'
      }
    ],
    getQuizAttemptActivities: async (userId?: string) => [
      {
        id: '1',
        userId: userId || 'user_123',
        quizTitle: 'Stock Market Fundamentals',
        score: 85,
        timestamp: new Date().toISOString(),
        difficulty: 'intermediate'
      }
    ]
  };

  useEffect(() => {
    loadActivityData();
    
    // Set up real-time updates
    const interval = setInterval(loadActivityData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [filters]);

  const loadActivityData = async () => {
    try {
      setIsLoading(true);
      
      // Load activities with filters
      const newsData = await mockActivityService.getNewsViewActivities(filters.userId);
      const quizData = await mockActivityService.getQuizAttemptActivities(filters.userId);
      
      // Apply date range filter
      const filteredNews = applyDateFilter(newsData, filters.dateRange);
      const filteredQuiz = applyDateFilter(quizData, filters.dateRange);
      
      setNewsActivities(filteredNews);
      setQuizActivities(filteredQuiz);
      
      // Calculate comprehensive stats
      const calculatedStats = calculateStats(filteredNews, filteredQuiz);
      setStats(calculatedStats);
      
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyDateFilter = (activities: any[], range: string) => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (range) {
      case '1d':
        cutoff.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoff.setDate(now.getDate() - 90);
        break;
      default:
        return activities;
    }
    
    return activities.filter(activity => new Date(activity.timestamp) >= cutoff);
  };

  const calculateStats = (newsData: any[], quizData: any[]): ActivityStats => {
    // Get unique users
    const allUsers = new Set([
      ...newsData.map(n => n.userId),
      ...quizData.map(q => q.userId)
    ]);
    
    // Calculate averages
    const totalReadingTime = newsData.reduce((sum, n) => sum + (n.readingTime || 0), 0);
    const averageReadingTime = newsData.length > 0 ? totalReadingTime / newsData.length : 0;
    
    const totalQuizScore = quizData.reduce((sum, q) => sum + (q.score || 0), 0);
    const averageQuizScore = quizData.length > 0 ? totalQuizScore / quizData.length : 0;
    
    // Calculate top performers
    const userPerformance = new Map();
    [...newsData, ...quizData].forEach(activity => {
      const userId = activity.userId;
      if (!userPerformance.has(userId)) {
        userPerformance.set(userId, { score: 0, activities: 0 });
      }
      const user = userPerformance.get(userId);
      user.activities += 1;
      if (activity.score) user.score += activity.score;
    });
    
    const topPerformers = Array.from(userPerformance.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    // Calculate daily activity
    const dailyMap = new Map();
    const processDaily = (activities: any[], type: 'newsViews' | 'quizAttempts') => {
      activities.forEach(activity => {
        const date = new Date(activity.timestamp).toISOString().split('T')[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { date, newsViews: 0, quizAttempts: 0 });
        }
        dailyMap.get(date)[type] += 1;
      });
    };
    
    processDaily(newsData, 'newsViews');
    processDaily(quizData, 'quizAttempts');
    
    const dailyActivity = Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate category engagement
    const categoryMap = new Map();
    newsData.forEach(news => {
      const category = news.category || 'General';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    const totalViews = newsData.length;
    const categoryEngagement = Array.from(categoryMap.entries())
      .map(([category, views]) => ({
        category,
        views,
        percentage: totalViews > 0 ? (views / totalViews) * 100 : 0
      }))
      .sort((a, b) => b.views - a.views);
    
    return {
      totalUsers: allUsers.size,
      totalNewsViews: newsData.length,
      totalQuizAttempts: quizData.length,
      averageQuizScore: Math.round(averageQuizScore * 100) / 100,
      averageReadingTime: Math.round(averageReadingTime),
      topPerformers,
      dailyActivity,
      categoryEngagement
    };
  };

  const exportData = () => {
    const data = {
      stats,
      newsActivities,
      quizActivities,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    color: string;
  }> = ({ title, value, icon, change, color }) => (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color === 'blue' ? 'bg-blue-50' : color === 'green' ? 'bg-green-50' : color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'}`}>
          <div className={`${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ActivityList: React.FC<{ activities: any[]; type: 'news' | 'quiz' }> = ({ activities, type }) => (
    <div className="space-y-3">
      {activities.slice(0, 10).map((activity, index) => (
        <motion.div
          key={index}
          className="bg-white rounded-lg p-4 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${type === 'news' ? 'bg-blue-50' : 'bg-green-50'}`}>
                {type === 'news' ? (
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                ) : (
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  User {activity.userId}
                </p>
                <p className="text-sm text-gray-600">
                  {type === 'news' ? activity.title : activity.quizTitle}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {type === 'news' ? `${activity.readingTime || 0}s` : `${activity.score || 0}%`}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-8 h-8 bg-blue-600 rounded animate-spin"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Activity Dashboard</h1>
                <p className="text-sm text-gray-600">Monitor user engagement and activities</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadActivityData}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ↻
              </button>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ⬇
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <div className="w-5 h-5 bg-gray-400 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
              <select
                value={filters.activityType}
                onChange={(e) => setFilters(prev => ({ ...prev, activityType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Activities</option>
                <option value="news">News Views</option>
                <option value="quiz">Quiz Attempts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="Filter by user ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<div className="w-6 h-6 bg-blue-600 rounded"></div>}
            color="blue"
          />
          <StatCard
            title="News Views"
            value={stats.totalNewsViews}
            icon={<div className="w-6 h-6 bg-green-600 rounded"></div>}
            color="green"
          />
          <StatCard
            title="Quiz Attempts"
            value={stats.totalQuizAttempts}
            icon={<div className="w-6 h-6 bg-purple-600 rounded"></div>}
            color="purple"
          />
          <StatCard
            title="Avg Quiz Score"
            value={`${stats.averageQuizScore}%`}
            icon={<div className="w-6 h-6 bg-orange-600 rounded"></div>}
            color="orange"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'news', label: 'News Activities', icon: '👁' },
                { id: 'quiz', label: 'Quiz Activities', icon: '📖' },
                { id: 'analytics', label: 'Analytics', icon: '📈' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
                  <div className="space-y-3">
                    {stats.topPerformers.map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">User {user.userId}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{user.score} points</p>
                          <p className="text-sm text-gray-600">{user.activities} activities</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Engagement */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Engagement</h3>
                  <div className="space-y-3">
                    {stats.categoryEngagement.map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{category.category}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {Math.round(category.percentage)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'news' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent News Activities</h3>
                <ActivityList activities={newsActivities} type="news" />
              </div>
            )}

            {activeTab === 'quiz' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Quiz Activities</h3>
                <ActivityList activities={quizActivities} type="quiz" />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Daily Activity</h4>
                    <div className="space-y-2">
                      {stats.dailyActivity.slice(-7).map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                          <div className="flex space-x-4">
                            <span className="text-blue-600">{day.newsViews} news</span>
                            <span className="text-green-600">{day.quizAttempts} quiz</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Key Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Reading Time</span>
                        <span className="font-medium">{stats.averageReadingTime}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Quiz Score</span>
                        <span className="font-medium">{stats.averageQuizScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Activities</span>
                        <span className="font-medium">{stats.totalNewsViews + stats.totalQuizAttempts}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityDashboard;

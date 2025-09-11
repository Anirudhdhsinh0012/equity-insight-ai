// Enhanced Admin Activity Dashboard - Comprehensive Activity Monitoring
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  Search,
  Navigation,
  LogIn,
  LogOut,
  AlertTriangle,
  Mouse,
  Eye,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  TrendingUp,
  Zap,
  Brain,
  Newspaper,
  Globe
} from 'lucide-react';

import { activityLogger } from '@/services/activityLoggingService';
import type {
  NewsViewActivity,
  QuizAttemptActivity,
  SearchActivity,
  NavigationActivity,
  LoginActivity,
  LogoutActivity,
  SystemEventActivity,
  UserEngagementActivity
} from '@/services/activityLoggingService';

interface EnhancedAdminActivityDashboardProps {
  className?: string;
}

type ActivityType = 'all' | 'news' | 'quiz' | 'search' | 'navigation' | 'login' | 'logout' | 'system' | 'engagement';
type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'all';

const EnhancedAdminActivityDashboard: React.FC<EnhancedAdminActivityDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<ActivityType>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  // Activity data states
  const [newsActivities, setNewsActivities] = useState<NewsViewActivity[]>([]);
  const [quizActivities, setQuizActivities] = useState<QuizAttemptActivity[]>([]);
  const [searchActivities, setSearchActivities] = useState<SearchActivity[]>([]);
  const [navigationActivities, setNavigationActivities] = useState<NavigationActivity[]>([]);
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [logoutActivities, setLogoutActivities] = useState<LogoutActivity[]>([]);
  const [systemEventActivities, setSystemEventActivities] = useState<SystemEventActivity[]>([]);
  const [userEngagementActivities, setUserEngagementActivities] = useState<UserEngagementActivity[]>([]);

  // Load all activity data
  useEffect(() => {
    const loadActivityData = () => {
      const dateFilters = getDateFilters();
      
      setNewsActivities(activityLogger.getNewsViewActivities(dateFilters));
      setQuizActivities(activityLogger.getQuizAttemptActivities(dateFilters));
      setSearchActivities(activityLogger.getSearchActivities(dateFilters));
      setNavigationActivities(activityLogger.getNavigationActivities(dateFilters));
      setLoginActivities(activityLogger.getLoginActivities(dateFilters));
      setLogoutActivities(activityLogger.getLogoutActivities(dateFilters));
      setSystemEventActivities(activityLogger.getSystemEventActivities(dateFilters));
      setUserEngagementActivities(activityLogger.getUserEngagementActivities(dateFilters));
      
      setIsLoading(false);
    };

    loadActivityData();

    // Subscribe to real-time updates
    const unsubscribe = activityLogger.subscribe((data) => {
      if (data) {
        loadActivityData(); // Reload all data when updates occur
      }
    });

    return unsubscribe;
  }, [timeRange]);

  // Helper function to get date filters
  const getDateFilters = () => {
    const now = new Date();
    const filters: { dateFrom?: Date; dateTo?: Date } = {};

    switch (timeRange) {
      case 'today':
        filters.dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filters.dateFrom = weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filters.dateFrom = monthAgo;
        break;
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        filters.dateFrom = quarterAgo;
        break;
      default:
        // No date filter for 'all'
        break;
    }

    return filters;
  };

  // Get filtered activities based on current filters
  const filteredActivities = useMemo(() => {
    let allActivities: any[] = [];

    switch (activeTab) {
      case 'news':
        allActivities = newsActivities.map(a => ({ ...a, type: 'news' }));
        break;
      case 'quiz':
        allActivities = quizActivities.map(a => ({ ...a, type: 'quiz' }));
        break;
      case 'search':
        allActivities = searchActivities.map(a => ({ ...a, type: 'search' }));
        break;
      case 'navigation':
        allActivities = navigationActivities.map(a => ({ ...a, type: 'navigation' }));
        break;
      case 'login':
        allActivities = loginActivities.map(a => ({ ...a, type: 'login' }));
        break;
      case 'logout':
        allActivities = logoutActivities.map(a => ({ ...a, type: 'logout' }));
        break;
      case 'system':
        allActivities = systemEventActivities.map(a => ({ ...a, type: 'system' }));
        break;
      case 'engagement':
        allActivities = userEngagementActivities.map(a => ({ ...a, type: 'engagement' }));
        break;
      default:
        // Combine all activities
        allActivities = [
          ...newsActivities.map(a => ({ ...a, type: 'news', timestamp: a.viewedAt })),
          ...quizActivities.map(a => ({ ...a, type: 'quiz', timestamp: a.startedAt })),
          ...searchActivities.map(a => ({ ...a, type: 'search' })),
          ...navigationActivities.map(a => ({ ...a, type: 'navigation' })),
          ...loginActivities.map(a => ({ ...a, type: 'login', timestamp: a.loginTime })),
          ...logoutActivities.map(a => ({ ...a, type: 'logout', timestamp: a.logoutTime })),
          ...systemEventActivities.map(a => ({ ...a, type: 'system' })),
          ...userEngagementActivities.map(a => ({ ...a, type: 'engagement' }))
        ];
        break;
    }

    // Apply user filter
    if (selectedUserId !== 'all') {
      allActivities = allActivities.filter(a => a.userId === selectedUserId);
    }

    // Apply search filter
    if (searchTerm) {
      allActivities = allActivities.filter(a => 
        a.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.type === 'news' && a.newsTitle?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.type === 'quiz' && a.quizTitle?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.type === 'search' && a.searchQuery?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort by timestamp
    return allActivities.sort((a, b) => 
      new Date(b.timestamp || b.viewedAt || b.startedAt || b.loginTime || b.logoutTime).getTime() - 
      new Date(a.timestamp || a.viewedAt || a.startedAt || a.loginTime || a.logoutTime).getTime()
    ).slice(0, 100); // Limit to 100 most recent activities
  }, [
    activeTab, 
    timeRange, 
    searchTerm, 
    selectedUserId,
    newsActivities,
    quizActivities,
    searchActivities,
    navigationActivities,
    loginActivities,
    logoutActivities,
    systemEventActivities,
    userEngagementActivities
  ]);

  // Calculate comprehensive statistics
  const statistics = useMemo(() => {
    const totalUsers = new Set([
      ...newsActivities.map(a => a.userId),
      ...quizActivities.map(a => a.userId),
      ...searchActivities.map(a => a.userId),
      ...navigationActivities.map(a => a.userId),
      ...loginActivities.map(a => a.userId),
      ...userEngagementActivities.map(a => a.userId)
    ]).size;

    const totalActivities = newsActivities.length + quizActivities.length + 
                           searchActivities.length + navigationActivities.length +
                           loginActivities.length + logoutActivities.length +
                           systemEventActivities.length + userEngagementActivities.length;

    const avgSessionDuration = logoutActivities.reduce((sum, a) => sum + a.sessionDuration, 0) / 
                              Math.max(logoutActivities.length, 1);

    const topSearchTerms = searchActivities
      .reduce((acc, search) => {
        acc[search.searchQuery] = (acc[search.searchQuery] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalUsers,
      totalActivities,
      totalNewsViews: newsActivities.length,
      totalQuizAttempts: quizActivities.length,
      totalSearches: searchActivities.length,
      totalLogins: loginActivities.length,
      totalSystemEvents: systemEventActivities.length,
      totalEngagements: userEngagementActivities.length,
      avgSessionDuration: Math.round(avgSessionDuration / 60), // Convert to minutes
      topSearchTerms: Object.entries(topSearchTerms)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([term, count]) => ({ term, count }))
    };
  }, [
    newsActivities,
    quizActivities,
    searchActivities,
    navigationActivities,
    loginActivities,
    logoutActivities,
    systemEventActivities,
    userEngagementActivities
  ]);

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    const userSet = new Set<string>();
    const userMap = new Map<string, { id: string; name: string; email: string }>();

    [...newsActivities, ...quizActivities, ...searchActivities, ...navigationActivities, 
     ...loginActivities, ...logoutActivities, ...userEngagementActivities].forEach(activity => {
      if (activity.userId) {
        userSet.add(activity.userId);
        userMap.set(activity.userId, {
          id: activity.userId,
          name: activity.userName || 'Unknown',
          email: activity.userEmail || 'Unknown'
        });
      }
    });

    return Array.from(userSet).map(id => userMap.get(id)!);
  }, [newsActivities, quizActivities, searchActivities, navigationActivities, 
      loginActivities, logoutActivities, userEngagementActivities]);

  const tabs = [
    { id: 'all', label: 'All Activities', icon: Activity },
    { id: 'news', label: 'News Views', icon: Newspaper },
    { id: 'quiz', label: 'Quiz Attempts', icon: Brain },
    { id: 'search', label: 'Searches', icon: Search },
    { id: 'navigation', label: 'Navigation', icon: Navigation },
    { id: 'login', label: 'Logins', icon: LogIn },
    { id: 'logout', label: 'Logouts', icon: LogOut },
    { id: 'system', label: 'System Events', icon: AlertTriangle },
    { id: 'engagement', label: 'User Engagement', icon: Mouse }
  ];

  const timeRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'all', label: 'All Time' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'news': return Newspaper;
      case 'quiz': return Brain;
      case 'search': return Search;
      case 'navigation': return Navigation;
      case 'login': return LogIn;
      case 'logout': return LogOut;
      case 'system': return AlertTriangle;
      case 'engagement': return Mouse;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-600';
      case 'quiz': return 'bg-purple-100 text-purple-600';
      case 'search': return 'bg-green-100 text-green-600';
      case 'navigation': return 'bg-yellow-100 text-yellow-600';
      case 'login': return 'bg-emerald-100 text-emerald-600';
      case 'logout': return 'bg-red-100 text-red-600';
      case 'system': return 'bg-orange-100 text-orange-600';
      case 'engagement': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportData = () => {
    const data = {
      statistics,
      activities: filteredActivities,
      exportedAt: new Date().toISOString(),
      filters: {
        activeTab,
        timeRange,
        searchTerm,
        selectedUserId
      }
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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading activity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-50 dark:bg-slate-900 min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Enhanced Activity Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Comprehensive monitoring of all user activities and system events
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {statistics.totalUsers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Activities</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {statistics.totalActivities}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Session (min)</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {statistics.avgSessionDuration}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Searches</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {statistics.totalSearches}
                </p>
              </div>
              <Search className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                User Filter
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Search Activities
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user, content, or action..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Results
              </label>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-900 dark:text-white">
                {filteredActivities.length} activities found
              </div>
            </div>
          </div>
        </div>

        {/* Activity Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActivityType)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity List */}
          <div className="p-6">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
                  No activities found
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Try adjusting your filters or time range to see more activities.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredActivities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <motion.div
                      key={`${activity.type}-${activity.id || index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {activity.userName || 'Unknown User'}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatTimestamp(activity.timestamp || activity.viewedAt || activity.startedAt || activity.loginTime || activity.logoutTime)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          {activity.type === 'news' && `Viewed: ${activity.newsTitle}`}
                          {activity.type === 'quiz' && `Started quiz: ${activity.quizTitle}`}
                          {activity.type === 'search' && `Searched: "${activity.searchQuery}" in ${activity.searchCategory}`}
                          {activity.type === 'navigation' && `Navigated from ${activity.fromPage} to ${activity.toPage}`}
                          {activity.type === 'login' && `Logged in via ${activity.loginMethod}`}
                          {activity.type === 'logout' && `Logged out (session: ${Math.round(activity.sessionDuration / 60)}m)`}
                          {activity.type === 'system' && `${activity.eventType}: ${activity.eventDescription}`}
                          {activity.type === 'engagement' && `${activity.engagementType} on ${activity.targetElement}`}
                        </p>
                        {activity.userEmail && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {activity.userEmail}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Search Terms */}
        {statistics.topSearchTerms.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Top Search Terms
            </h3>
            <div className="space-y-3">
              {statistics.topSearchTerms.map((item, index) => (
                <div key={item.term} className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300">
                    {index + 1}. {item.term}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.count} searches
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAdminActivityDashboard;

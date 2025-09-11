// Activity Analytics Components - User engagement and content analysis
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Clock,
  Brain,
  Newspaper,
  Search,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download,
  Eye,
  MousePointer,
  Award,
  Target,
  Zap,
  Timer
} from 'lucide-react';

import { activityLogger } from '@/services/activityLoggingService';

interface AnalyticsMetrics {
  totalUsers: number;
  totalActivities: number;
  averageSessionDuration: number;
  popularContent: ContentMetric[];
  userEngagement: EngagementMetric[];
  activityTrends: TrendMetric[];
  searchTerms: SearchTermMetric[];
  completionRates: CompletionMetric[];
}

interface ContentMetric {
  id: string;
  title: string;
  type: 'news' | 'quiz';
  views: number;
  engagement: number;
  avgTimeSpent: number;
}

interface EngagementMetric {
  userId: string;
  userName: string;
  totalActivities: number;
  sessionCount: number;
  avgSessionDuration: number;
  lastActive: Date;
  engagementScore: number;
}

interface TrendMetric {
  date: string;
  newsViews: number;
  quizAttempts: number;
  searches: number;
  logins: number;
}

interface SearchTermMetric {
  term: string;
  count: number;
  category: string;
  resultsFound: number;
}

interface CompletionMetric {
  quizId: string;
  quizTitle: string;
  attempts: number;
  completions: number;
  averageScore: number;
  completionRate: number;
}

interface ActivityAnalyticsProps {
  className?: string;
  dateRange?: 'day' | 'week' | 'month' | 'quarter';
}

const ActivityAnalytics: React.FC<ActivityAnalyticsProps> = ({
  className = '',
  dateRange = 'week'
}) => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState(dateRange);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'users' | 'trends'>('overview');

  // Calculate date range
  const getDateRange = (range: string) => {
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return { startDate, endDate: now };
  };

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      const { startDate, endDate } = getDateRange(selectedDateRange);
      
      try {
        // Get all activities in date range
        const newsActivities = activityLogger.getNewsViewActivities({ dateFrom: startDate, dateTo: endDate });
        const quizActivities = activityLogger.getQuizAttemptActivities({ dateFrom: startDate, dateTo: endDate });
        const searchActivities = activityLogger.getSearchActivities({ dateFrom: startDate, dateTo: endDate });
        const loginActivities = activityLogger.getLoginActivities({ dateFrom: startDate, dateTo: endDate });
        const engagementActivities = activityLogger.getUserEngagementActivities({ dateFrom: startDate, dateTo: endDate });

        // Calculate metrics
        const uniqueUsers = new Set([
          ...newsActivities.map(a => a.userId),
          ...quizActivities.map(a => a.userId),
          ...searchActivities.map(a => a.userId),
          ...loginActivities.map(a => a.userId)
        ]);

        const totalActivities = newsActivities.length + quizActivities.length + 
                               searchActivities.length + loginActivities.length;

        // Calculate popular content
        const newsMetrics = new Map<string, ContentMetric>();
        newsActivities.forEach(activity => {
          const key = activity.newsId;
          if (!newsMetrics.has(key)) {
            newsMetrics.set(key, {
              id: key,
              title: activity.newsTitle,
              type: 'news',
              views: 0,
              engagement: 0,
              avgTimeSpent: 0
            });
          }
          const metric = newsMetrics.get(key)!;
          metric.views++;
          metric.engagement += activity.timeSpent || 0;
        });

        const quizMetrics = new Map<string, ContentMetric>();
        quizActivities.forEach(activity => {
          const key = activity.quizId;
          if (!quizMetrics.has(key)) {
            quizMetrics.set(key, {
              id: key,
              title: activity.quizTitle,
              type: 'quiz',
              views: 0,
              engagement: 0,
              avgTimeSpent: 0
            });
          }
          const metric = quizMetrics.get(key)!;
          metric.views++;
          metric.engagement += activity.timeSpent || 0;
        });

        // Calculate average time spent
        newsMetrics.forEach(metric => {
          metric.avgTimeSpent = metric.views > 0 ? metric.engagement / metric.views : 0;
        });
        quizMetrics.forEach(metric => {
          metric.avgTimeSpent = metric.views > 0 ? metric.engagement / metric.views : 0;
        });

        const popularContent = [
          ...Array.from(newsMetrics.values()),
          ...Array.from(quizMetrics.values())
        ].sort((a, b) => b.views - a.views).slice(0, 10);

        // Calculate user engagement
        const userMetrics = new Map<string, EngagementMetric>();
        const allActivities = [
          ...newsActivities.map(a => ({ ...a, type: 'news' })),
          ...quizActivities.map(a => ({ ...a, type: 'quiz' })),
          ...searchActivities.map(a => ({ ...a, type: 'search' })),
          ...loginActivities.map(a => ({ ...a, type: 'login', timestamp: a.loginTime }))
        ];

        allActivities.forEach((activity: any) => {
          const userId = activity.userId;
          if (!userMetrics.has(userId)) {
            userMetrics.set(userId, {
              userId,
              userName: activity.userName,
              totalActivities: 0,
              sessionCount: 0,
              avgSessionDuration: 0,
              lastActive: new Date(
                activity.viewedAt || 
                activity.startedAt || 
                activity.timestamp || 
                activity.loginTime || 
                Date.now()
              ),
              engagementScore: 0
            });
          }
          const metric = userMetrics.get(userId)!;
          metric.totalActivities++;
          const activityDate = new Date(
            activity.viewedAt || 
            activity.startedAt || 
            activity.timestamp || 
            activity.loginTime || 
            Date.now()
          );
          if (activityDate > metric.lastActive) {
            metric.lastActive = activityDate;
          }
        });

        // Calculate engagement scores
        userMetrics.forEach(metric => {
          metric.engagementScore = metric.totalActivities * 10;
          if (metric.lastActive > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            metric.engagementScore *= 1.5; // Boost for recent activity
          }
        });

        const userEngagement = Array.from(userMetrics.values())
          .sort((a, b) => b.engagementScore - a.engagementScore)
          .slice(0, 10);

        // Calculate trends (daily breakdown)
        const trendMap = new Map<string, TrendMetric>();
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateKey = date.toISOString().split('T')[0];
          trendMap.set(dateKey, {
            date: dateKey,
            newsViews: 0,
            quizAttempts: 0,
            searches: 0,
            logins: 0
          });
        }

        newsActivities.forEach(activity => {
          const dateKey = activity.viewedAt.toISOString().split('T')[0];
          const trend = trendMap.get(dateKey);
          if (trend) trend.newsViews++;
        });

        quizActivities.forEach(activity => {
          const dateKey = activity.startedAt.toISOString().split('T')[0];
          const trend = trendMap.get(dateKey);
          if (trend) trend.quizAttempts++;
        });

        searchActivities.forEach(activity => {
          const dateKey = activity.timestamp.toISOString().split('T')[0];
          const trend = trendMap.get(dateKey);
          if (trend) trend.searches++;
        });

        loginActivities.forEach(activity => {
          const dateKey = activity.loginTime.toISOString().split('T')[0];
          const trend = trendMap.get(dateKey);
          if (trend) trend.logins++;
        });

        const activityTrends = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // Calculate search terms
        const searchTermMap = new Map<string, SearchTermMetric>();
        searchActivities.forEach(activity => {
          const term = activity.searchQuery.toLowerCase();
          if (!searchTermMap.has(term)) {
            searchTermMap.set(term, {
              term,
              count: 0,
              category: activity.searchCategory,
              resultsFound: activity.resultsCount || 0
            });
          }
          const metric = searchTermMap.get(term)!;
          metric.count++;
          metric.resultsFound += activity.resultsCount || 0;
        });

        const searchTerms = Array.from(searchTermMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Calculate completion rates
        const completionMap = new Map<string, CompletionMetric>();
        quizActivities.forEach(activity => {
          const quizId = activity.quizId;
          if (!completionMap.has(quizId)) {
            completionMap.set(quizId, {
              quizId,
              quizTitle: activity.quizTitle,
              attempts: 0,
              completions: 0,
              averageScore: 0,
              completionRate: 0
            });
          }
          const metric = completionMap.get(quizId)!;
          metric.attempts++;
          if (activity.isCompleted) {
            metric.completions++;
            metric.averageScore += activity.score || 0;
          }
        });

        completionMap.forEach(metric => {
          metric.completionRate = metric.attempts > 0 ? (metric.completions / metric.attempts) * 100 : 0;
          metric.averageScore = metric.completions > 0 ? metric.averageScore / metric.completions : 0;
        });

        const completionRates = Array.from(completionMap.values())
          .sort((a, b) => b.completionRate - a.completionRate);

        // Calculate average session duration
        const sessionDurations = engagementActivities
          .filter((activity: any) => activity.duration && activity.duration > 0)
          .map((activity: any) => activity.duration);
        
        const averageSessionDuration = sessionDurations.length > 0 
          ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
          : 0;

        setMetrics({
          totalUsers: uniqueUsers.size,
          totalActivities,
          averageSessionDuration,
          popularContent,
          userEngagement,
          activityTrends,
          searchTerms,
          completionRates
        });

      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedDateRange]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${Math.floor(seconds)}s`;
  };

  const exportAnalytics = () => {
    if (!metrics) return;
    
    const data = {
      ...metrics,
      exportedAt: new Date().toISOString(),
      dateRange: selectedDateRange,
      generatedBy: 'Activity Analytics System'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-analytics-${selectedDateRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 ${className}`}>
        <div className="text-center text-slate-500 dark:text-slate-400">
          Failed to load analytics data
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Activity Analytics
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>

          <button
            onClick={exportAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'content', label: 'Content', icon: Newspaper },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'trends', label: 'Trends', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">USERS</span>
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {metrics.totalUsers}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Active users
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">ACTIVITIES</span>
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {metrics.totalActivities}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Total interactions
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">AVG SESSION</span>
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatDuration(metrics.averageSessionDuration)}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Session duration
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span className="text-xs text-orange-600 font-medium">ENGAGEMENT</span>
                </div>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {metrics.totalActivities > 0 ? Math.round((metrics.totalActivities / metrics.totalUsers) * 10) / 10 : 0}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  Activities per user
                </div>
              </motion.div>
            </div>

            {/* Popular Search Terms */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Popular Search Terms
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {metrics.searchTerms.slice(0, 10).map((term, index) => (
                  <div
                    key={term.term}
                    className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center"
                  >
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      "{term.term}"
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {term.count} searches
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Popular Content */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Most Popular Content
              </h3>
              <div className="space-y-3">
                {metrics.popularContent.map((content, index) => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white truncate max-w-md">
                          {content.title}
                        </div>
                        <div className="text-sm text-slate-500 capitalize">
                          {content.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {content.views}
                        </div>
                        <div className="text-slate-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {formatDuration(content.avgTimeSpent)}
                        </div>
                        <div className="text-slate-500">Avg Time</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quiz Completion Rates */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Quiz Performance
              </h3>
              <div className="space-y-3">
                {metrics.completionRates.slice(0, 5).map((quiz) => (
                  <div
                    key={quiz.quizId}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white truncate max-w-md">
                        {quiz.quizTitle}
                      </div>
                      <div className="text-sm text-slate-500">
                        {quiz.attempts} attempts • {quiz.completions} completions
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {Math.round(quiz.completionRate)}%
                        </div>
                        <div className="text-slate-500">Completion</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {Math.round(quiz.averageScore)}%
                        </div>
                        <div className="text-slate-500">Avg Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Top Engaged Users */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Most Engaged Users
              </h3>
              <div className="space-y-3">
                {metrics.userEngagement.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {user.userName}
                        </div>
                        <div className="text-sm text-slate-500">
                          Last active: {user.lastActive.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {user.totalActivities}
                        </div>
                        <div className="text-slate-500">Activities</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {Math.round(user.engagementScore)}
                        </div>
                        <div className="text-slate-500">Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Activity Trends Chart */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Activity Trends
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4">
                  {metrics.activityTrends.slice(-7).map((trend, index) => (
                    <div key={trend.date} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 relative">
                          <div
                            className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full"
                            style={{ width: `${Math.min((trend.newsViews / Math.max(...metrics.activityTrends.map(t => t.newsViews))) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-8">
                          {trend.newsViews}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 relative">
                          <div
                            className="absolute top-0 left-0 h-2 bg-purple-500 rounded-full"
                            style={{ width: `${Math.min((trend.quizAttempts / Math.max(...metrics.activityTrends.map(t => t.quizAttempts))) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-8">
                          {trend.quizAttempts}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 relative">
                          <div
                            className="absolute top-0 left-0 h-2 bg-green-500 rounded-full"
                            style={{ width: `${Math.min((trend.searches / Math.max(...metrics.activityTrends.map(t => t.searches))) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 w-8">
                          {trend.searches}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">News Views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Quiz Attempts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Searches</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityAnalytics;

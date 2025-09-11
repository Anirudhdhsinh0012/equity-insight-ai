'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  Brain,
  TrendingUp,
  Clock,
  Star,
  Trophy,
  Zap,
  BookOpen,
  Target,
  Play,
  Eye,
  Calendar,
  Filter,
  RefreshCw,
  Settings,
  User,
  BarChart3,
  Award,
  Activity
} from 'lucide-react';

// Import customer components
import CustomerNews from './CustomerNews';
import CustomerQuiz from './CustomerQuiz';

// Import services
import { DatabaseUser } from '@/services/realTimeDataService';
import { activityLogger } from '@/services/activityLoggingService';
import customerNewsService from '@/services/customerNewsService';
import customerQuizService from '@/services/customerQuizService';

// Import the session tracking hook
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface CustomerLearningHubProps {
  currentUser?: DatabaseUser | null;
  className?: string;
}

type TabType = 'overview' | 'news' | 'quizzes' | 'activity';

const CustomerLearningHub: React.FC<CustomerLearningHubProps> = ({ currentUser, className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [newsCount, setNewsCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session tracking
  const {
    sessionStartTime,
    lastActivityTime,
    startSession,
    endSession,
    updateLastActivity,
    trackEngagementActivity
  } = useSessionTracking({
    user: currentUser ?? null,
    autoStartSession: true,
    trackPageViews: true,
    trackEngagement: true,
    sessionTimeoutMinutes: 30
  });

  // Set current user for activity logging
  useEffect(() => {
    if (currentUser) {
      activityLogger.setCurrentUser(currentUser);
    }
  }, [currentUser]);

  // Subscribe to data updates
  useEffect(() => {
    const newsUnsubscribe = customerNewsService.subscribe((articles) => {
      setNewsCount(articles.length);
    });

    const quizUnsubscribe = customerQuizService.subscribe((quizzes) => {
      setQuizCount(quizzes.length);
    });

    setIsLoading(false);

    return () => {
      newsUnsubscribe();
      quizUnsubscribe();
    };
  }, []);

  // Load user activity
  useEffect(() => {
    if (currentUser) {
      const newsActivities = activityLogger.getNewsViewActivities({ userId: currentUser.id });
      const quizActivities = activityLogger.getQuizAttemptActivities({ userId: currentUser.id });
      
      // Combine and sort activities
      const allActivities = [
        ...newsActivities.map(a => ({
          ...a,
          activityType: 'news_view',
          timestamp: a.viewedAt,
          title: a.newsTitle,
          category: a.newsCategory
        })),
        ...quizActivities.map(a => ({
          ...a,
          activityType: 'quiz_attempt',
          timestamp: a.startedAt,
          title: a.quizTitle,
          category: a.quizCategory,
          difficulty: a.quizDifficulty,
          score: a.score
        }))
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
      
      setUserActivity(allActivities);
    }
  }, [currentUser]);

  // Enhanced tab switching with activity tracking
  const handleTabSwitch = async (tabId: TabType) => {
    const previousTab = activeTab;
    setActiveTab(tabId);
    
    // Track navigation activity using activityLogger directly
    await activityLogger.logNavigation(previousTab, tabId, 'click');
    
    // Track user engagement using activityLogger directly
    await activityLogger.logUserEngagement(
      'click',
      `tab-${tabId}`,
      'learning-hub',
      0,
      {
        previousTab,
        newTab: tabId,
        timestamp: new Date().toISOString()
      }
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'news', label: 'Financial News', icon: Newspaper },
    { id: 'quizzes', label: 'Knowledge Quizzes', icon: Brain },
    { id: 'activity', label: 'My Activity', icon: Activity }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                  Financial Learning Hub
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {getGreeting()}, {currentUser?.name || 'Trader'}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {currentUser?.name || 'Guest'}
                </span>
              </div>
              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      Welcome to Your Financial Journey
                    </h2>
                    <p className="text-blue-100 text-lg">
                      Stay informed with the latest market news and test your knowledge with our interactive quizzes
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-16 h-16" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Newspaper className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">
                        {newsCount}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Latest Articles</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">
                        {quizCount}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Available Quizzes</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">
                        {userActivity.filter(a => a.activityType === 'quiz_attempt').length}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Quizzes Completed</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <Eye className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-white">
                        {userActivity.filter(a => a.activityType === 'news_view').length}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Articles Read</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Newspaper className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Latest Financial News
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Stay updated with the latest market developments, earnings reports, and financial insights.
                  </p>
                  <button
                    onClick={() => handleTabSwitch('news')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Read News
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Knowledge Quizzes
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Test your financial knowledge and improve your trading skills with interactive quizzes.
                  </p>
                  <button
                    onClick={() => handleTabSwitch('quizzes')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Take Quiz
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              {userActivity.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Activity</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {userActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            activity.activityType === 'news_view' 
                              ? 'bg-blue-100 dark:bg-blue-900/20' 
                              : 'bg-purple-100 dark:bg-purple-900/20'
                          }`}>
                            {activity.activityType === 'news_view' ? (
                              <Newspaper className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-800 dark:text-white">
                              {activity.activityType === 'news_view' 
                                ? `Read: ${activity.title || 'News Article'}`
                                : `Quiz: ${activity.title || 'Knowledge Quiz'}`
                              }
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </div>
                          </div>
                          {activity.score && (
                            <div className="text-sm font-medium text-green-600">
                              {activity.score}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CustomerNews currentUser={currentUser} />
            </motion.div>
          )}

          {activeTab === 'quizzes' && (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CustomerQuiz currentUser={currentUser} />
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  My Activity
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Track your learning progress and engagement with financial content
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="p-6">
                  {userActivity.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">No activity yet</h3>
                      <p className="text-slate-500">Start reading news and taking quizzes to see your activity here.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {userActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className={`p-3 rounded-lg ${
                            activity.activityType === 'news_view' 
                              ? 'bg-blue-100 dark:bg-blue-900/20' 
                              : 'bg-purple-100 dark:bg-purple-900/20'
                          }`}>
                            {activity.activityType === 'news_view' ? (
                              <Newspaper className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-slate-800 dark:text-white">
                                {activity.title || (activity.activityType === 'news_view' ? 'News Article' : 'Knowledge Quiz')}
                              </h4>
                              <span className="text-sm text-slate-500">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                              <span className="capitalize">{activity.category}</span>
                              {activity.difficulty && (
                                <span className={`px-2 py-1 rounded text-xs ${
                                  activity.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                  activity.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {activity.difficulty}
                                </span>
                              )}
                              {activity.score && (
                                <span className="font-medium text-green-600">
                                  Score: {activity.score}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomerLearningHub;

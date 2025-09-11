// Real-time Activity Feed - Live monitoring of user activities
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  Bell,
  BellOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Filter,
  Clock,
  Maximize2,
  Minimize2,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Brain,
  Newspaper,
  Search,
  Navigation,
  LogIn,
  LogOut,
  Mouse
} from 'lucide-react';

import { activityLogger } from '@/services/activityLoggingService';

interface RealTimeActivityFeedProps {
  className?: string;
  maxItems?: number;
  enableSound?: boolean;
  enableNotifications?: boolean;
}

interface ActivityEvent {
  id: string;
  type: string;
  userId: string;
  userName: string;
  userEmail: string;
  description: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: any;
}

const RealTimeActivityFeed: React.FC<RealTimeActivityFeedProps> = ({
  className = '',
  maxItems = 50,
  enableSound = true,
  enableNotifications = true
}) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isListening, setIsListening] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [notificationsEnabled, setNotificationsEnabled] = useState(enableNotifications);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const activityCountRef = useRef(0);
  const lastNotificationRef = useRef<number>(0);

  // Load initial activities
  useEffect(() => {
    const loadInitialActivities = () => {
      const recentActivities: ActivityEvent[] = [];
      
      // Get recent news activities
      const newsActivities = activityLogger.getNewsViewActivities({ 
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }).slice(0, 10);
      
      newsActivities.forEach((activity: any) => {
        recentActivities.push({
          id: activity.id,
          type: 'news',
          userId: activity.userId,
          userName: activity.userName,
          userEmail: activity.userEmail,
          description: `Viewed news article: ${activity.newsTitle}`,
          timestamp: activity.viewedAt,
          priority: 'low',
          data: activity
        });
      });

      // Get recent quiz activities
      const quizActivities = activityLogger.getQuizAttemptActivities({ 
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }).slice(0, 10);
      
      quizActivities.forEach((activity: any) => {
        recentActivities.push({
          id: activity.id,
          type: 'quiz',
          userId: activity.userId,
          userName: activity.userName,
          userEmail: activity.userEmail,
          description: `Started quiz: ${activity.quizTitle}`,
          timestamp: activity.startedAt,
          priority: activity.isCompleted ? 'medium' : 'low',
          data: activity
        });
      });

      // Get recent search activities
      const searchActivities = activityLogger.getSearchActivities({ 
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }).slice(0, 10);
      
      searchActivities.forEach((activity: any) => {
        recentActivities.push({
          id: activity.id,
          type: 'search',
          userId: activity.userId,
          userName: activity.userName,
          userEmail: activity.userEmail,
          description: `Searched for: "${activity.searchQuery}" in ${activity.searchCategory}`,
          timestamp: activity.timestamp,
          priority: 'low',
          data: activity
        });
      });

      // Get recent login activities
      const loginActivities = activityLogger.getLoginActivities({ 
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }).slice(0, 5);
      
      loginActivities.forEach((activity: any) => {
        recentActivities.push({
          id: activity.id,
          type: 'login',
          userId: activity.userId,
          userName: activity.userName,
          userEmail: activity.userEmail,
          description: `User logged in via ${activity.loginMethod}`,
          timestamp: activity.loginTime,
          priority: activity.success ? 'medium' : 'high',
          data: activity
        });
      });

      // Get system events
      const systemEvents = activityLogger.getSystemEventActivities({ 
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }).slice(0, 5);
      
      systemEvents.forEach((activity: any) => {
        const priority = activity.severity === 'error' ? 'critical' : 
                        activity.severity === 'warning' ? 'high' : 'low';
        
        recentActivities.push({
          id: activity.id,
          type: 'system',
          userId: activity.userId || 'system',
          userName: 'System',
          userEmail: 'system@example.com',
          description: `${activity.eventType}: ${activity.eventDescription}`,
          timestamp: activity.timestamp,
          priority,
          data: activity
        });
      });

      // Sort by timestamp and limit
      const sortedActivities = recentActivities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, maxItems);

      setActivities(sortedActivities);
      activityCountRef.current = sortedActivities.length;
    };

    loadInitialActivities();
  }, [maxItems]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isListening) return;

    setConnectionStatus('connecting');
    
    const unsubscribe = activityLogger.subscribe((data) => {
      if (!data) return;
      
      setConnectionStatus('connected');
      
      const newActivities: ActivityEvent[] = [];
      
      // Process new news activities
      if (data.newsActivities) {
        const latestNews = data.newsActivities.slice(0, 5);
        latestNews.forEach((activity: any) => {
          if (!activities.find(a => a.id === activity.id)) {
            newActivities.push({
              id: activity.id,
              type: 'news',
              userId: activity.userId,
              userName: activity.userName,
              userEmail: activity.userEmail,
              description: `Viewed news article: ${activity.newsTitle}`,
              timestamp: activity.viewedAt,
              priority: 'low',
              data: activity
            });
          }
        });
      }

      // Process new quiz activities
      if (data.quizActivities) {
        const latestQuizzes = data.quizActivities.slice(0, 5);
        latestQuizzes.forEach((activity: any) => {
          if (!activities.find(a => a.id === activity.id)) {
            newActivities.push({
              id: activity.id,
              type: 'quiz',
              userId: activity.userId,
              userName: activity.userName,
              userEmail: activity.userEmail,
              description: activity.isCompleted 
                ? `Completed quiz: ${activity.quizTitle} (Score: ${activity.score}%)`
                : `Started quiz: ${activity.quizTitle}`,
              timestamp: activity.startedAt,
              priority: activity.isCompleted ? 'medium' : 'low',
              data: activity
            });
          }
        });
      }

      // Process new search activities
      if (data.searchActivities) {
        const latestSearches = data.searchActivities.slice(0, 5);
        latestSearches.forEach((activity: any) => {
          if (!activities.find(a => a.id === activity.id)) {
            newActivities.push({
              id: activity.id,
              type: 'search',
              userId: activity.userId,
              userName: activity.userName,
              userEmail: activity.userEmail,
              description: `Searched for: "${activity.searchQuery}" in ${activity.searchCategory}`,
              timestamp: activity.timestamp,
              priority: 'low',
              data: activity
            });
          }
        });
      }

      // Process new login activities
      if (data.loginActivities) {
        const latestLogins = data.loginActivities.slice(0, 3);
        latestLogins.forEach((activity: any) => {
          if (!activities.find(a => a.id === activity.id)) {
            newActivities.push({
              id: activity.id,
              type: 'login',
              userId: activity.userId,
              userName: activity.userName,
              userEmail: activity.userEmail,
              description: activity.success 
                ? `User logged in via ${activity.loginMethod}`
                : `Failed login attempt via ${activity.loginMethod}`,
              timestamp: activity.loginTime,
              priority: activity.success ? 'medium' : 'high',
              data: activity
            });
          }
        });
      }

      // Process system events
      if (data.systemEventActivities) {
        const latestSystemEvents = data.systemEventActivities.slice(0, 3);
        latestSystemEvents.forEach((activity: any) => {
          if (!activities.find(a => a.id === activity.id)) {
            const priority = activity.severity === 'error' ? 'critical' : 
                            activity.severity === 'warning' ? 'high' : 'low';
            
            newActivities.push({
              id: activity.id,
              type: 'system',
              userId: activity.userId || 'system',
              userName: 'System',
              userEmail: 'system@example.com',
              description: `${activity.eventType}: ${activity.eventDescription}`,
              timestamp: activity.timestamp,
              priority,
              data: activity
            });
          }
        });
      }

      if (newActivities.length > 0) {
        setActivities(prev => {
          const combined = [...newActivities, ...prev];
          const unique = combined.filter((activity, index, self) => 
            index === self.findIndex(a => a.id === activity.id)
          );
          return unique
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, maxItems);
        });

        // Play sound notification
        if (soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {
            // Ignore autoplay errors
          });
        }

        // Show browser notification
        if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          const now = Date.now();
          if (now - lastNotificationRef.current > 5000) { // Throttle notifications to every 5 seconds
            const highPriorityActivity = newActivities.find(a => a.priority === 'critical' || a.priority === 'high');
            if (highPriorityActivity) {
              new Notification('New Activity Alert', {
                body: highPriorityActivity.description,
                icon: '/favicon.ico'
              });
              lastNotificationRef.current = now;
            }
          }
        }

        activityCountRef.current += newActivities.length;
      }
    });

    return () => {
      unsubscribe();
      setConnectionStatus('disconnected');
    };
  }, [isListening, soundEnabled, notificationsEnabled, maxItems, activities]);

  // Request notification permission
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (filterPriority !== 'all' && activity.priority !== filterPriority) return false;
    if (filterType !== 'all' && activity.type !== filterType) return false;
    return true;
  });

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

  const getActivityColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'bg-red-100 text-red-600 border-red-200';
    if (priority === 'high') return 'bg-orange-100 text-orange-600 border-orange-200';
    
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'quiz': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'search': return 'bg-green-100 text-green-600 border-green-200';
      case 'navigation': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'login': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'logout': return 'bg-red-100 text-red-600 border-red-200';
      case 'system': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'engagement': return 'bg-pink-100 text-pink-600 border-pink-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const exportFeed = () => {
    const data = {
      activities: filteredActivities,
      exportedAt: new Date().toISOString(),
      totalActivities: activities.length,
      filters: { filterPriority, filterType }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-feed-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const containerClasses = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900'
    : `bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LLdSEFKH3L89iNOAcZY73u558NCw5Vpd/sxmooAAA=" type="audio/wav" />
      </audio>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Real-time Activity Feed
          </h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
            {filteredActivities.length} activities
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsListening(!isListening)}
            className={`p-2 rounded-lg transition-colors ${
              isListening ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}
            title={isListening ? 'Pause feed' : 'Resume feed'}
          >
            {isListening ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
            }`}
            title={soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              notificationsEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
            }`}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          <button
            onClick={exportFeed}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title="Export feed"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm"
        >
          <option value="all">All Types</option>
          <option value="news">News</option>
          <option value="quiz">Quiz</option>
          <option value="search">Search</option>
          <option value="login">Login</option>
          <option value="system">System</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '400px' }}>
        <AnimatePresence initial={false}>
          {filteredActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                {isListening ? 'Waiting for new activities...' : 'Feed is paused'}
              </p>
            </motion.div>
          ) : (
            filteredActivities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.type, activity.priority)} hover:shadow-md transition-all`}
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium truncate">
                        {activity.userName}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(activity.priority)}`}>
                          {activity.priority}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">
                      {activity.description}
                    </p>
                    
                    <p className="text-xs text-slate-500">
                      {activity.userEmail}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Total activities tracked: {activityCountRef.current}
        </div>
      </div>
    </div>
  );
};

export default RealTimeActivityFeed;

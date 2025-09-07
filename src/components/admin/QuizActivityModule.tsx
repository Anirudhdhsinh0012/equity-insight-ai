'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  User,
  RefreshCw,
  BarChart3,
  Users,
  Timer,
  Award,
  Target,
  CheckCircle,
  XCircle,
  Trophy,
  Star
} from 'lucide-react';
import activityLogger, { QuizAttemptActivity } from '@/services/activityLoggingService';
import realTimeDataService, { DatabaseUser } from '@/services/realTimeDataService';

interface QuizActivityModuleProps {
  className?: string;
}

const QuizActivityModule: React.FC<QuizActivityModuleProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('week');
  const [selectedActivity, setSelectedActivity] = useState<QuizAttemptActivity | null>(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quizActivities, setQuizActivities] = useState<QuizAttemptActivity[]>([]);
  const [users, setUsers] = useState<DatabaseUser[]>([]);

  // Load initial data
  useEffect(() => {
    loadQuizActivities();
    loadUsers();
  }, []);

  // Subscribe to activity updates
  useEffect(() => {
    const unsubscribe = activityLogger.subscribe((data) => {
      if (data.quizActivities) {
        setQuizActivities(data.quizActivities);
      }
    });

    return unsubscribe;
  }, []);

  const loadQuizActivities = () => {
    const dateFilters = getDateFilters();
    const activities = activityLogger.getQuizAttemptActivities(dateFilters);
    setQuizActivities(activities);
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
    loadQuizActivities();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const openActivityDetails = (activity: QuizAttemptActivity) => {
    setSelectedActivity(activity);
    setShowActivityDetails(true);
  };

  const categories = [
    { value: 'all', label: 'All Categories', color: 'text-slate-600' },
    { value: 'stocks', label: 'Stocks', color: 'text-green-600' },
    { value: 'crypto', label: 'Crypto', color: 'text-orange-600' },
    { value: 'trading', label: 'Trading', color: 'text-blue-600' },
    { value: 'economics', label: 'Economics', color: 'text-purple-600' },
    { value: 'investment', label: 'Investment', color: 'text-indigo-600' },
    { value: 'analysis', label: 'Analysis', color: 'text-teal-600' }
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const statuses = [
    { value: 'all', label: 'All Attempts' },
    { value: 'completed', label: 'Completed' },
    { value: 'abandoned', label: 'Abandoned' },
    { value: 'in-progress', label: 'In Progress' }
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  // Filter activities based on search and filters
  const filteredActivities = useMemo(() => {
    return quizActivities.filter((activity: QuizAttemptActivity) => {
      const matchesSearch = !searchTerm || 
        activity.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.userName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'all' || activity.quizCategory === filterCategory;
      const matchesUser = filterUser === 'all' || activity.userId === filterUser;
      const matchesDifficulty = filterDifficulty === 'all' || activity.quizDifficulty === filterDifficulty;
      
      let matchesStatus = true;
      if (filterStatus === 'completed') matchesStatus = activity.isCompleted;
      else if (filterStatus === 'abandoned') matchesStatus = !!activity.abandonedAt;
      else if (filterStatus === 'in-progress') matchesStatus = !activity.isCompleted && !activity.abandonedAt;

      return matchesSearch && matchesCategory && matchesUser && matchesDifficulty && matchesStatus;
    });
  }, [quizActivities, searchTerm, filterCategory, filterUser, filterDifficulty, filterStatus]);

  // Calculate statistics
  const totalAttempts = filteredActivities.length;
  const completedAttempts = filteredActivities.filter(a => a.isCompleted).length;
  const uniqueUsers = new Set(filteredActivities.map(a => a.userId)).size;
  const averageScore = completedAttempts > 0 
    ? filteredActivities.filter(a => a.isCompleted).reduce((sum, a) => sum + a.score, 0) / completedAttempts 
    : 0;
  const totalQuizTime = filteredActivities.reduce((sum, a) => sum + a.timeSpent, 0);
  const averageTime = totalAttempts > 0 ? totalQuizTime / totalAttempts : 0;

  // Top quizzes by attempts
  const quizAttempts = filteredActivities.reduce((acc, activity) => {
    const key = activity.quizId;
    if (!acc[key]) {
      acc[key] = {
        title: activity.quizTitle,
        category: activity.quizCategory,
        difficulty: activity.quizDifficulty,
        attempts: 0,
        completed: 0,
        totalScore: 0,
        totalTime: 0
      };
    }
    acc[key].attempts++;
    if (activity.isCompleted) {
      acc[key].completed++;
      acc[key].totalScore += activity.score;
    }
    acc[key].totalTime += activity.timeSpent;
    return acc;
  }, {} as Record<string, any>);

  const topQuizzes = Object.values(quizAttempts)
    .sort((a: any, b: any) => b.attempts - a.attempts)
    .slice(0, 5);

  // User performance stats
  const userPerformance = filteredActivities.reduce((acc, activity) => {
    const userId = activity.userId;
    if (!acc[userId]) {
      acc[userId] = {
        userName: activity.userName,
        userEmail: activity.userEmail,
        attempts: 0,
        completed: 0,
        totalScore: 0,
        totalTime: 0,
        categories: new Set()
      };
    }
    acc[userId].attempts++;
    acc[userId].categories.add(activity.quizCategory);
    acc[userId].totalTime += activity.timeSpent;
    if (activity.isCompleted) {
      acc[userId].completed++;
      acc[userId].totalScore += activity.score;
    }
    return acc;
  }, {} as Record<string, any>);

  const topPerformers = Object.values(userPerformance)
    .filter((user: any) => user.completed > 0)
    .sort((a: any, b: any) => (b.totalScore / b.completed) - (a.totalScore / a.completed))
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (activity: QuizAttemptActivity) => {
    if (activity.isCompleted) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (activity.abandonedAt) return <XCircle className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-yellow-600" />;
  };

  const getStatusText = (activity: QuizAttemptActivity) => {
    if (activity.isCompleted) return 'Completed';
    if (activity.abandonedAt) return 'Abandoned';
    return 'In Progress';
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
            Quiz Activity Logs
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track user engagement with knowledge quizzes and performance analytics
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {totalAttempts}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Attempts</div>
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
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {completedAttempts}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Completed</div>
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
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {Math.round(averageScore)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Avg Score</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Timer className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {formatTime(Math.round(averageTime))}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Avg Time</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and Activity List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

              {/* Difficulty Filter */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
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
                Recent Quiz Attempts ({filteredActivities.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center">
                  <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No quiz activities found</p>
                </div>
              ) : (
                filteredActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => openActivityDetails(activity)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                        {getStatusIcon(activity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-slate-800 dark:text-white truncate">
                            {activity.quizTitle}
                          </h4>
                          <span className="text-xs text-slate-500">
                            {formatTimeAgo(activity.startedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {activity.userName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(activity.timeSpent)}
                          </span>
                          <span className="capitalize">{activity.quizCategory}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(activity.quizDifficulty)}`}>
                            {activity.quizDifficulty}
                          </span>
                          <span className="text-xs text-slate-500">
                            {getStatusText(activity)}
                          </span>
                          {activity.isCompleted && (
                            <span className={`text-xs font-medium ${getScoreColor(activity.score)}`}>
                              {activity.score}% ({activity.correctAnswers}/{activity.totalQuestions})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          {/* Top Quizzes */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Most Popular Quizzes
            </h3>
            <div className="space-y-3">
              {topQuizzes.map((quiz: any, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {quiz.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{quiz.attempts} attempts</span>
                      <span>{quiz.completed} completed</span>
                      {quiz.completed > 0 && (
                        <span className={getScoreColor(quiz.totalScore / quiz.completed)}>
                          {Math.round(quiz.totalScore / quiz.completed)}% avg
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Top Performers
            </h3>
            <div className="space-y-3">
              {topPerformers.map((user: any, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-xs font-medium text-white">
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-white">
                      {user.userName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {Math.round(user.totalScore / user.completed)}% avg • {user.completed} completed
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-600">
                      {Math.round(user.totalScore / user.completed)}%
                    </span>
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
              className="bg-white dark:bg-slate-800 rounded-lg max-w-3xl w-full max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Quiz Attempt Details
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
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Quiz</label>
                    <div className="text-slate-800 dark:text-white font-medium">
                      {selectedActivity.quizTitle}
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
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedActivity)}
                        <span className="text-slate-800 dark:text-white">
                          {getStatusText(selectedActivity)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Category</label>
                      <div className="text-slate-800 dark:text-white capitalize">
                        {selectedActivity.quizCategory}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Difficulty</label>
                      <div className="text-slate-800 dark:text-white capitalize">
                        {selectedActivity.quizDifficulty}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Time Spent</label>
                      <div className="text-slate-800 dark:text-white">
                        {formatTime(selectedActivity.timeSpent)}
                      </div>
                    </div>
                  </div>

                  {selectedActivity.isCompleted && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Score</label>
                        <div className={`text-xl font-bold ${getScoreColor(selectedActivity.score)}`}>
                          {selectedActivity.score}%
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Correct Answers</label>
                        <div className="text-slate-800 dark:text-white">
                          {selectedActivity.correctAnswers} / {selectedActivity.totalQuestions}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed At</label>
                        <div className="text-slate-800 dark:text-white text-sm">
                          {selectedActivity.completedAt?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Started At</label>
                    <div className="text-slate-800 dark:text-white">
                      {selectedActivity.startedAt.toLocaleString()}
                    </div>
                  </div>

                  {selectedActivity.answers.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                        Answer Summary
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {selectedActivity.answers.map((answer, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {answer.isCorrect ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-slate-700 dark:text-slate-300">
                              Question {index + 1}
                            </span>
                          </div>
                        ))}
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

export default QuizActivityModule;

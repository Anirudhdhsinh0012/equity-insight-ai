'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Brain, 
  Newspaper, 
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown,
  Eye,
  UserPlus,
  MessageSquare,
  Bell
} from 'lucide-react';

interface DashboardOverviewProps {
  className?: string;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ className = '' }) => {
  const stats = [
    {
      title: 'Total Users',
      value: '12,847',
      change: '+12.5%',
      changeType: 'increase',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      description: 'Active registered users'
    },
    {
      title: 'Daily Active Users',
      value: '8,234',
      change: '+8.2%',
      changeType: 'increase',
      icon: Activity,
      color: 'from-green-500 to-green-600',
      description: 'Users active in last 24h'
    },
    {
      title: 'Total Shares Tracked',
      value: '1,247',
      change: '+5.3%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      description: 'Stocks in watchlists'
    },
    {
      title: 'Quiz Completions',
      value: '3,891',
      change: '+18.7%',
      changeType: 'increase',
      icon: Brain,
      color: 'from-orange-500 to-orange-600',
      description: 'AI quizzes completed'
    },
    {
      title: 'News Articles',
      value: '856',
      change: '+2.1%',
      changeType: 'increase',
      icon: Newspaper,
      color: 'from-red-500 to-red-600',
      description: 'Articles published today'
    },
    {
      title: 'Revenue',
      value: '$47,892',
      change: '-2.4%',
      changeType: 'decrease',
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      description: 'Monthly recurring revenue'
    }
  ];

  const recentActivity = [
    { id: 1, user: 'John Doe', action: 'completed AI quiz', time: '2 min ago', type: 'quiz' },
    { id: 2, user: 'Sarah Johnson', action: 'added AAPL to watchlist', time: '5 min ago', type: 'share' },
    { id: 3, user: 'Mike Chen', action: 'registered new account', time: '8 min ago', type: 'user' },
    { id: 4, user: 'Emma Wilson', action: 'read financial news', time: '12 min ago', type: 'news' },
    { id: 5, user: 'David Brown', action: 'updated portfolio', time: '15 min ago', type: 'share' }
  ];

  const topStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', watchers: 2847, change: '+2.4%', changeType: 'increase' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', watchers: 2156, change: '+1.8%', changeType: 'increase' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', watchers: 1923, change: '+0.9%', changeType: 'increase' },
    { symbol: 'TSLA', name: 'Tesla Inc.', watchers: 1847, change: '-1.2%', changeType: 'decrease' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', watchers: 1634, change: '+3.1%', changeType: 'increase' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Monitor your platform's performance and user activity
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 lg:mt-0">
          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Data
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.changeType === 'increase' ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">
                {stat.title}
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-xs">
                {stat.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Recent Activity</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'user' ? 'bg-green-100 dark:bg-green-900' :
                  activity.type === 'share' ? 'bg-purple-100 dark:bg-purple-900' :
                  activity.type === 'quiz' ? 'bg-orange-100 dark:bg-orange-900' :
                  'bg-red-100 dark:bg-red-900'
                }`}>
                  {activity.type === 'user' ? <UserPlus className="w-5 h-5 text-green-600" /> :
                   activity.type === 'share' ? <TrendingUp className="w-5 h-5 text-purple-600" /> :
                   activity.type === 'quiz' ? <Brain className="w-5 h-5 text-orange-600" /> :
                   <Newspaper className="w-5 h-5 text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">
                    <span className="text-blue-600 dark:text-blue-400">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Watched Stocks */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Top Watched Stocks</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {topStocks.map((stock, index) => (
              <motion.div
                key={stock.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{stock.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{stock.symbol}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {stock.watchers.toLocaleString()}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stock.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.changeType === 'increase' ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {stock.change}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white"
      >
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Manage Users', description: 'Add, edit, or remove users' },
            { icon: Brain, label: 'Create Quiz', description: 'Generate new AI quiz content' },
            { icon: Bell, label: 'Send Notification', description: 'Broadcast to all users' }
          ].map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 hover:bg-opacity-30 transition-all duration-200 text-left"
            >
              <action.icon className="w-6 h-6 mb-2" />
              <h3 className="font-semibold mb-1">{action.label}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;

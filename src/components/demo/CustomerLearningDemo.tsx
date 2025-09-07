'use client';

import React, { useState } from 'react';

// Simple demo setup without external dependencies
const CustomerLearningDemo: React.FC = () => {
  const [demoMode, setDemoMode] = useState<'overview' | 'customer' | 'admin'>('overview');
  const [activityCount, setActivityCount] = useState(0);

  const simulateActivity = () => {
    setActivityCount(prev => prev + 1);
  };

  const OverviewSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Stock Market Learning Platform Demo
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Experience auto-generated financial news and quizzes with comprehensive admin monitoring
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setDemoMode('customer')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Customer Experience
          </button>
          <button
            onClick={() => setDemoMode('admin')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Admin Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Auto-Generated Content</h3>
          </div>
          <p className="text-gray-600">
            Financial news from multiple APIs and dynamically generated quizzes with different difficulty levels.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Real-time Monitoring</h3>
          </div>
          <p className="text-gray-600">
            Comprehensive activity tracking showing which users read which articles and their quiz performance.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <div className="w-6 h-6 bg-purple-600 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
          </div>
          <p className="text-gray-600">
            Detailed analytics with user engagement metrics, performance trends, and activity insights.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Demo Activity Tracker</h3>
            <p className="text-blue-100">Real-time activity logging demonstration</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{activityCount}</div>
            <div className="text-blue-100">Activities Logged</div>
          </div>
        </div>
        <button
          onClick={simulateActivity}
          className="mt-4 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
        >
          Simulate User Activity
        </button>
      </div>
    </div>
  );

  const CustomerSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Learning Hub</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial News</h3>
            <div className="space-y-3">
              {[
                { title: "Tech Stocks Rally Continues", category: "Technology", time: "2 hours ago" },
                { title: "Federal Reserve Meeting Results", category: "Economy", time: "4 hours ago" },
                { title: "Cryptocurrency Market Update", category: "Crypto", time: "6 hours ago" }
              ].map((news, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium text-gray-900">{news.title}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">{news.category}</span>
                    <span>{news.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Interactive Quizzes</h3>
            <div className="space-y-3">
              {[
                { title: "Stock Market Fundamentals", difficulty: "Beginner", questions: 10 },
                { title: "Options Trading Basics", difficulty: "Intermediate", questions: 15 },
                { title: "Technical Analysis", difficulty: "Advanced", questions: 20 }
              ].map((quiz, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded ${
                      quiz.difficulty === 'Beginner' ? 'bg-green-50 text-green-600' :
                      quiz.difficulty === 'Intermediate' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {quiz.difficulty}
                    </span>
                    <span>{quiz.questions} questions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AdminSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Activity Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">127</div>
            <div className="text-sm text-blue-600">Total Users</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">1,248</div>
            <div className="text-sm text-green-600">News Views</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">342</div>
            <div className="text-sm text-purple-600">Quiz Attempts</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">78%</div>
            <div className="text-sm text-orange-600">Avg Quiz Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent News Activities</h3>
            <div className="space-y-3">
              {[
                { user: "User_12345", article: "Tech Stocks Rally Continues", time: "2 min ago", readTime: "45s" },
                { user: "User_67890", article: "Federal Reserve Meeting Results", time: "5 min ago", readTime: "2m 15s" },
                { user: "User_54321", article: "Cryptocurrency Market Update", time: "8 min ago", readTime: "1m 30s" }
              ].map((activity, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{activity.user}</div>
                      <div className="text-sm text-gray-600">{activity.article}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-900">{activity.readTime}</div>
                      <div className="text-gray-500">{activity.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Quiz Activities</h3>
            <div className="space-y-3">
              {[
                { user: "User_98765", quiz: "Stock Market Fundamentals", score: "85%", time: "3 min ago" },
                { user: "User_13579", quiz: "Options Trading Basics", score: "72%", time: "7 min ago" },
                { user: "User_24680", quiz: "Technical Analysis", score: "91%", time: "12 min ago" }
              ].map((activity, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{activity.user}</div>
                      <div className="text-sm text-gray-600">{activity.quiz}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-900">{activity.score}</div>
                      <div className="text-gray-500">{activity.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {demoMode === 'overview' && <OverviewSection />}
        {demoMode === 'customer' && <CustomerSection />}
        {demoMode === 'admin' && <AdminSection />}

        {/* Navigation */}
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDemoMode('overview')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                demoMode === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setDemoMode('customer')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                demoMode === 'customer' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setDemoMode('admin')}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                demoMode === 'admin' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLearningDemo;

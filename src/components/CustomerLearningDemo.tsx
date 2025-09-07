'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Mock services and components
const mockActivityLoggingService = {
  logActivity: (activity: any) => console.log('Activity logged:', activity),
  getRecentActivities: () => Promise.resolve([]),
  logUserInteraction: (type: string, data: any) => console.log('User interaction:', type, data)
};

const mockRealTimeSyncService = {
  subscribe: (channel: string, callback: (event: any) => void) => {
    return () => {}; // Return unsubscribe function
  },
  emit: (event: string, data: any) => console.log('Event emitted:', event, data)
};

// Mock components
const CustomerLearningHub = ({ className }: { className?: string }) => (
  <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-4">📚 Customer Learning Hub</h3>
    <p className="text-gray-600">Interactive learning platform for financial education</p>
  </div>
);

const AdminActivityDashboard = ({ className }: { className?: string }) => (
  <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
    <h3 className="text-lg font-semibold mb-4">🛡️ Admin Activity Dashboard</h3>
    <p className="text-gray-600">Real-time monitoring and analytics dashboard</p>
  </div>
);

interface DemoStep {
  id: string;
  title: string;
  description: string;
  component: 'customer' | 'admin' | 'overview';
  status: 'pending' | 'active' | 'completed';
  duration?: number;
}

const CustomerLearningDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoMode, setDemoMode] = useState<'guided' | 'free' | 'admin'>('guided');
  const [demoUser] = useState(`demo_user_${Date.now()}`);
  const [activityCount, setActivityCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demoSteps: DemoStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Stock Market Learning Platform',
      description: 'Experience auto-generated financial news and quizzes with comprehensive admin monitoring',
      component: 'overview',
      status: 'active'
    },
    {
      id: 'customer_news',
      title: 'Customer News Experience',
      description: 'Browse auto-fetched financial news from multiple sources with real-time updates',
      component: 'customer',
      status: 'pending',
      duration: 30
    },
    {
      id: 'customer_quiz',
      title: 'Interactive Quizzes',
      description: 'Take dynamically generated quizzes with different difficulty levels',
      component: 'customer',
      status: 'pending',
      duration: 45
    },
    {
      id: 'admin_monitoring',
      title: 'Admin Activity Monitoring',
      description: 'View real-time user activity logs and comprehensive analytics',
      component: 'admin',
      status: 'pending',
      duration: 20
    },
    {
      id: 'real_time_sync',
      title: 'Real-time Data Sync',
      description: 'See how customer activities immediately appear in admin dashboard',
      component: 'admin',
      status: 'pending',
      duration: 15
    }
  ];

  const [steps, setSteps] = useState(demoSteps);

  useEffect(() => {
    // Initialize demo user session
    mockActivityLoggingService.logActivity({
      userId: demoUser,
      action: 'login',
      data: {
        device: 'Demo Device',
        browser: 'Demo Browser',
        location: 'Demo Location'
      }
    });

    // Subscribe to real-time events for activity counting
    const unsubscribe = mockRealTimeSyncService.subscribe('ALL', (event: any) => {
      if (event.userId === demoUser) {
        setActivityCount(prev => prev + 1);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [demoUser]);

  const startGuidedDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setDemoMode('guided');
    
    // Auto-progress through steps
    const progressTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          // Mark current step as completed
          setSteps(prevSteps => prevSteps.map((step, index) => ({
            ...step,
            status: index === prev ? 'completed' : index === prev + 1 ? 'active' : step.status
          })));
          return prev + 1;
        } else {
          setIsPlaying(false);
          clearInterval(progressTimer);
          return prev;
        }
      });
    }, 5000); // Progress every 5 seconds

    return () => clearInterval(progressTimer);
  };

  const simulateUserActivity = async () => {
    // Simulate news reading activity
    await mockActivityLoggingService.logActivity({
      userId: demoUser,
      action: 'news_view',
      data: {
      id: 'demo_news_1',
      title: 'Market Analysis: Tech Stocks Surge',
      category: 'Technology',
      source: 'Demo News',
      readingTime: 45,
      url: '#'}
    });

    // Simulate quiz attempt
    setTimeout(async () => {
      await mockActivityLoggingService.logActivity({
        userId: demoUser,
        action: 'quiz_attempt',
        data: {
        id: 'demo_quiz_1',
        title: 'Financial Fundamentals Quiz',
        difficulty: 'intermediate',
        score: 85,
        correctAnswers: 17,
        totalQuestions: 20,
        completionTime: 180
        }
      });
    }, 2000);

    // Simulate search activity
    setTimeout(async () => {
      await mockActivityLoggingService.logActivity({
        userId: demoUser,
        action: 'search_activity',
        data: {
          query: 'stock market trends',
          resultsCount: 15,
          searchType: 'news'
        }
      });
    }, 4000);
  };

  const StepCard: React.FC<{ step: DemoStep; index: number; isActive: boolean }> = ({ step, index, isActive }) => (
    <motion.div
      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
        isActive 
          ? 'border-blue-500 bg-blue-50' 
          : step.status === 'completed'
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{step.title}</h3>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          step.status === 'completed' 
            ? 'bg-green-500 text-white'
            : isActive
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-500'
        }`}>
          {step.status === 'completed' ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-xs font-bold">{index + 1}</span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{step.description}</p>
      {step.duration && (
        <div className="flex items-center text-xs text-gray-500">
          <span className="text-blue-600">🔄</span>
          {step.duration}s duration
        </div>
      )}
    </motion.div>
  );

  const DemoOverview = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <motion.h1 
          className="text-4xl font-bold text-gray-900 mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Stock Market Learning Platform Demo
        </motion.h1>
        <motion.p 
          className="text-xl text-gray-600 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Experience auto-generated content with real-time admin monitoring
        </motion.p>
        <motion.div 
          className="flex justify-center space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={startGuidedDemo}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-white text-lg">▶️</span>
            <span>Start Guided Demo</span>
          </button>
          <button
            onClick={() => setDemoMode('free')}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-white text-lg">👤</span>
            <span>Free Exploration</span>
          </button>
          <button
            onClick={() => setDemoMode('admin')}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-white text-lg">🖥️</span>
            <span>Admin View</span>
          </button>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Auto-Generated Content</h3>
          </div>
          <p className="text-gray-600">
            Financial news from multiple APIs and dynamically generated quizzes with different difficulty levels.
          </p>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <span className="text-2xl">👁️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Real-time Monitoring</h3>
          </div>
          <p className="text-gray-600">
            Comprehensive activity tracking showing which users read which articles and their quiz performance.
          </p>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
          </div>
          <p className="text-gray-600">
            Detailed analytics with user engagement metrics, performance trends, and activity insights.
          </p>
        </motion.div>
      </div>

      {/* Demo Progress */}
      {demoMode === 'guided' && (
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Guided Demo Progress</h3>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <StepCard 
                key={step.id} 
                step={step} 
                index={index} 
                isActive={index === currentStep}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Activity Counter */}
      <motion.div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-xl text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Demo Activity Tracker</h3>
            <p className="text-blue-100">Real-time activity logging for user: {demoUser}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{activityCount}</div>
            <div className="text-blue-100">Activities Logged</div>
          </div>
        </div>
        <button
          onClick={simulateUserActivity}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
        >
          <span className="text-green-600">📈</span>
          <span>Simulate User Activity</span>
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {demoMode === 'guided' && currentStep === 0 && <DemoOverview />}
      
      {(demoMode === 'free' || (demoMode === 'guided' && [1, 2].includes(currentStep))) && (
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Customer Learning Experience</h2>
              {demoMode === 'guided' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="text-blue-600">🔄</span>
                  <span>Step {currentStep + 1} of {steps.length}</span>
                </div>
              )}
            </div>
            <CustomerLearningHub />
          </div>
        </div>
      )}

      {(demoMode === 'admin' || (demoMode === 'guided' && [3, 4].includes(currentStep))) && (
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Admin Activity Monitoring</h2>
            {demoMode === 'guided' && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="text-blue-600">🔄</span>
                <span>Step {currentStep + 1} of {steps.length}</span>
              </div>
            )}
          </div>
          <AdminActivityDashboard />
        </div>
      )}

      {/* Demo Controls */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDemoMode('guided')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              demoMode === 'guided' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Guided
          </button>
          <button
            onClick={() => setDemoMode('free')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              demoMode === 'free' 
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
        <div className="mt-2 text-xs text-gray-500">
          Demo User: {demoUser.slice(-8)}
        </div>
      </div>
    </div>
  );
};

export default CustomerLearningDemo;

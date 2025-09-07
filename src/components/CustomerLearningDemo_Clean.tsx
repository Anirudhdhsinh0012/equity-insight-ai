'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Mock services
const mockActivityLoggingService = {
  logActivity: (activity: any) => console.log('Activity logged:', activity)
};

const mockRealTimeSyncService = {
  subscribe: (channel: string, callback: (event: any) => void) => {
    return () => {};
  }
};
    
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
      description: 'Browse AI-generated financial news articles with real-time content updates',
      component: 'customer',
      status: 'pending'
    },
    {
      id: 'customer_quiz',
      title: 'Interactive Quiz System',
      description: 'Take adaptive quizzes that adjust difficulty based on market knowledge',
      component: 'customer',
      status: 'pending'
    },
    {
      id: 'admin_monitoring',
      title: 'Admin Activity Dashboard',
      description: 'Monitor user engagement and content performance in real-time',
      component: 'admin',
      status: 'pending'
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
    }, 3000);
  };

  const simulateUserActivity = () => {
    // Simulate news view
    setTimeout(async () => {
      await mockActivityLoggingService.logActivity({
        userId: demoUser,
        action: 'news_view',
        data: {
          id: 'demo_news_1',
          title: 'Market Analysis: Tech Stocks Surge',
          category: 'Technology',
          source: 'Demo News',
          readingTime: 45,
          url: '#'
        }
      });
    }, 1000);

    // Simulate quiz attempt
    setTimeout(async () => {
      await mockActivityLoggingService.logActivity({
        userId: demoUser,
        action: 'quiz_attempt',
        data: {
          id: 'demo_quiz_1',
          title: 'Market Fundamentals Quiz',
          difficulty: 'intermediate',
          score: 85,
          correctAnswers: 8,
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: isActive ? 1.05 : 1 }}
      className={`p-6 rounded-xl border-2 transition-all duration-300 ${
        isActive 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : step.status === 'completed'
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step.status === 'completed' ? 'bg-green-500 text-white' :
            isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step.status === 'completed' ? <span className="text-green-600">✓</span> : index + 1}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            step.component === 'customer' ? 'bg-blue-100 text-blue-700' :
            step.component === 'admin' ? 'bg-purple-100 text-purple-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {step.component}
          </span>
        </div>
        <span className="text-blue-600">🔄</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{step.title}</h3>
      <p className="text-gray-600 text-sm">{step.description}</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Stock Market Learning Platform Demo
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Experience AI-powered financial education with real-time admin monitoring
          </p>
          
          {/* Demo Mode Selection */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={startGuidedDemo}
            >
              <span className="text-white text-lg">▶️</span>
              Start Guided Demo
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={() => setDemoMode('free')}
            >
              <span className="text-white text-lg">👤</span>
              Customer View
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              onClick={() => setDemoMode('admin')}
            >
              <span className="text-white text-lg">🖥️</span>
              Admin Dashboard
            </button>
          </div>
        </motion.div>

        {/* Demo Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Learning Hub Demo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📚</span>
              <h2 className="text-xl font-bold text-gray-800">Learning Hub</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">Latest Market News</h3>
                <p className="text-sm text-blue-600">AI-generated articles about current market trends</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">Interactive Quizzes</h3>
                <p className="text-sm text-green-600">Adaptive assessments that adjust to your knowledge level</p>
              </div>
            </div>
          </motion.div>

          {/* Activity Monitor Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">👁️</span>
              <h2 className="text-xl font-bold text-gray-800">Activity Monitor</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800">Real-time Tracking</h3>
                <p className="text-sm text-purple-600">Monitor user engagement and learning progress</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-orange-800">Analytics Dashboard</h3>
                <p className="text-sm text-orange-600">Comprehensive insights into content performance</p>
              </div>
            </div>
          </motion.div>

          {/* AI Content Demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📊</span>
              <h2 className="text-xl font-bold text-gray-800">AI Content Generation</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-800">Smart News Creation</h3>
                <p className="text-sm text-yellow-600">Automatically generate relevant financial content</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-800">Dynamic Quizzes</h3>
                <p className="text-sm text-red-600">Create assessments based on current market conditions</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Guided Demo Steps */}
        {demoMode === 'guided' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-8 shadow-lg mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Demo Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center"
        >
          <h3 className="text-xl font-semibold mb-2">Real-time Activity Tracking</h3>
          <p className="text-blue-100">Real-time activity logging for user: {demoUser}</p>
          <div className="mt-4">
            <span className="text-green-600">📈</span>
            <div className="text-3xl font-bold">{activityCount}</div>
            <div className="text-blue-100">Activities Logged</div>
          </div>
          <button
            className="mt-4 px-6 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors flex items-center gap-2 mx-auto"
            onClick={simulateUserActivity}
          >
            <span className="text-blue-600">🔄</span>
            Simulate User Activity
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerLearningDemo;

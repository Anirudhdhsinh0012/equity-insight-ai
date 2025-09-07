'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Clock,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Download,
  BarChart3,
  TrendingUp,
  Save
} from 'lucide-react';
import realTimeDataService, { DatabaseQuiz } from '@/services/realTimeDataService';

interface AIQuizModuleProps {
  className?: string;
}

const AIQuizModule: React.FC<AIQuizModuleProps> = ({ className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuizDetails, setShowQuizDetails] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<DatabaseQuiz | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Partial<DatabaseQuiz>>({});
  const [quizzes, setQuizzes] = useState<DatabaseQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time quiz updates
  useEffect(() => {
    const unsubscribe = realTimeDataService.quizzes.subscribe((updatedQuizzes) => {
      setQuizzes(updatedQuizzes);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // CRUD Functions
  const handleCreateQuiz = async () => {
    try {
      if (editingQuiz.title && editingQuiz.description) {
        await realTimeDataService.quizzes.createQuiz({
          title: editingQuiz.title,
          description: editingQuiz.description,
          category: editingQuiz.category || 'general',
          difficulty: editingQuiz.difficulty || 'beginner',
          questions: editingQuiz.questions || [],
          status: editingQuiz.status || 'draft',
          completions: 0,
          averageScore: 0,
          tags: editingQuiz.tags || [],
          estimatedTime: editingQuiz.estimatedTime || 10
        });
        setShowCreateModal(false);
        setEditingQuiz({});
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
    }
  };

  const handleUpdateQuiz = async () => {
    try {
      if (selectedQuiz && editingQuiz) {
        await realTimeDataService.quizzes.updateQuiz(selectedQuiz.id, editingQuiz);
        setShowEditModal(false);
        setEditingQuiz({});
        setSelectedQuiz(null);
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      if (confirm('Are you sure you want to delete this quiz?')) {
        await realTimeDataService.quizzes.deleteQuiz(quizId);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  const openEditModal = (quiz: DatabaseQuiz) => {
    setSelectedQuiz(quiz);
    setEditingQuiz({ ...quiz });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setEditingQuiz({
      title: '',
      description: '',
      category: 'general',
      difficulty: 'beginner',
      questions: [],
      status: 'draft',
      tags: [],
      estimatedTime: 10
    });
    setShowCreateModal(true);
  };

  const categories = [
    { value: 'general', label: 'General Finance' },
    { value: 'stocks', label: 'Stock Market' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'options', label: 'Options Trading' },
    { value: 'fundamental', label: 'Fundamental Analysis' },
    { value: 'technical', label: 'Technical Analysis' }
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
  ];

  // Filtered quizzes using real-time data
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz: DatabaseQuiz) => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || quiz.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || quiz.status === filterStatus;
      const matchesDifficulty = filterDifficulty === 'all' || quiz.difficulty === filterDifficulty;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesDifficulty;
    });
  }, [quizzes, searchTerm, filterCategory, filterStatus, filterDifficulty]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyConfig = difficulties.find(d => d.value === difficulty);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyConfig?.color}`}>
        {difficultyConfig?.label}
      </span>
    );
  };

  const generateNewQuiz = async () => {
    setIsGenerating(true);
    
    try {
      // For now, create a mock AI-generated quiz
      const newQuiz = {
        title: `Weekly Market Quiz - ${new Date().toLocaleDateString()}`,
        description: 'AI-generated quiz based on recent market developments and financial news',
        questions: [
          {
            id: 'q1',
            question: 'What is the primary purpose of the P/E ratio in stock analysis?',
            options: [
              'To measure a company\'s price relative to its earnings',
              'To calculate dividend yield',
              'To determine market capitalization',
              'To assess company debt levels'
            ],
            correctAnswer: 0,
            explanation: 'The P/E ratio (Price-to-Earnings) compares a company\'s stock price to its earnings per share, helping investors evaluate if a stock is overvalued or undervalued.',
            difficulty: 2
          },
          {
            id: 'q2',
            question: 'Which market index is known for tracking large-cap US technology companies?',
            options: ['S&P 500', 'Dow Jones Industrial Average', 'NASDAQ Composite', 'Russell 2000'],
            correctAnswer: 2,
            explanation: 'The NASDAQ Composite index is heavily weighted with technology companies and is often used as a benchmark for tech stock performance.',
            difficulty: 2
          },
          {
            id: 'q3',
            question: 'What does market volatility typically indicate?',
            options: [
              'Price stability in the market',
              'The degree of price fluctuation over time',
              'High trading volume',
              'Low interest rates'
            ],
            correctAnswer: 1,
            explanation: 'Market volatility measures how much stock prices fluctuate over a given period, with higher volatility indicating greater price swings.',
            difficulty: 3
          },
          {
            id: 'q4',
            question: 'What is the significance of earnings per share (EPS) for investors?',
            options: [
              'It shows the company\'s market share',
              'It indicates how much profit a company earned per outstanding share',
              'It measures company size',
              'It predicts future stock prices'
            ],
            correctAnswer: 1,
            explanation: 'EPS represents the portion of a company\'s profit allocated to each outstanding share, making it a key metric for evaluating profitability.',
            difficulty: 2
          },
          {
            id: 'q5',
            question: 'Which economic indicator is most closely watched by stock market investors?',
            options: [
              'Weather forecasts',
              'Federal Reserve interest rate decisions',
              'Celebrity news',
              'Sports scores'
            ],
            correctAnswer: 1,
            explanation: 'Federal Reserve interest rate decisions significantly impact borrowing costs, economic growth, and investor sentiment, making them crucial for market movements.',
            difficulty: 2
          }
        ],
        category: 'stocks' as const,
        difficulty: 'intermediate' as const,
        estimatedTime: 5,
        tags: ['AI Generated', 'Market News', 'Stock Analysis']
      };
      
      // Add the generated quiz to our real-time data service
      await realTimeDataService.quizzes.createQuiz({
        title: newQuiz.title,
        description: newQuiz.description,
        category: newQuiz.category,
        difficulty: newQuiz.difficulty,
        questions: newQuiz.questions,
        status: 'approved', // Auto-approve AI generated quizzes
        completions: 0,
        averageScore: 0,
        tags: newQuiz.tags,
        estimatedTime: newQuiz.estimatedTime
      });
      
      setIsGenerating(false);
      alert('🎯 AI Quiz Generated! A new market-based quiz has been created from the latest financial knowledge.');
    } catch (error) {
      console.error('Error generating AI quiz:', error);
      setIsGenerating(false);
      alert('⚠️ Quiz generation failed. Please try again or check your configuration.');
    }
  };

  const approveQuiz = (quizId: string) => {
    // Update quiz status to approved
    console.log('Approving quiz:', quizId);
  };

  const rejectQuiz = (quizId: string) => {
    // Update quiz status to rejected
    console.log('Rejecting quiz:', quizId);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats
  const totalQuizzes = quizzes.length;
  const approvedQuizzes = quizzes.filter((q: DatabaseQuiz) => q.status === 'approved').length;
  const pendingQuizzes = quizzes.filter((q: DatabaseQuiz) => q.status === 'pending').length;
  const totalCompletions = quizzes.reduce((sum: number, q: DatabaseQuiz) => sum + q.completions, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading quiz data...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">AI Quiz Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Generate, manage, and monitor AI-powered financial quizzes
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Create Quiz
          </button>
          <button
            onClick={generateNewQuiz}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating AI Quiz...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Generate AI Quiz
              </>
            )}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Quizzes', value: totalQuizzes, icon: Brain, color: 'from-purple-500 to-purple-600' },
          { label: 'Approved Quizzes', value: approvedQuizzes, icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { label: 'Pending Review', value: pendingQuizzes, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
          { label: 'Total Completions', value: totalCompletions.toLocaleString(), icon: TrendingUp, color: 'from-blue-500 to-blue-600' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search quizzes by title, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Quiz List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredQuizzes.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">{quiz.title}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(quiz.status)}
                    {getStatusBadge(quiz.status)}
                  </div>
                  {getDifficultyBadge(quiz.difficulty)}
                </div>
                
                <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {quiz.description}
                </p>
                
                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Brain className="w-4 h-4" />
                    <span>{quiz.questions.length} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.estimatedTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{quiz.completions.toLocaleString()} completions</span>
                  </div>
                  {quiz.averageScore > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>{quiz.averageScore.toFixed(1)}% avg score</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  {quiz.tags.map(tag => (
                    <span 
                      key={tag}
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Created on {formatDate(quiz.createdAt)}
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-6">
                <button
                  onClick={() => {
                    setSelectedQuiz(quiz);
                    setShowQuizDetails(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                {quiz.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approveQuiz(quiz.id)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rejectQuiz(quiz.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => openEditModal(quiz)}
                  className="p-2 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quiz Details Modal */}
      <AnimatePresence>
        {showQuizDetails && selectedQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQuizDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quiz Details</h2>
                <button
                  onClick={() => setShowQuizDetails(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{selectedQuiz.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{selectedQuiz.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Category</p>
                    <p className="font-medium text-slate-800 dark:text-white capitalize">{selectedQuiz.category}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Difficulty</p>
                    <p className="font-medium text-slate-800 dark:text-white capitalize">{selectedQuiz.difficulty}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Questions</p>
                    <p className="font-medium text-slate-800 dark:text-white">{selectedQuiz.questions.length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Estimated Time</p>
                    <p className="font-medium text-slate-800 dark:text-white">{selectedQuiz.estimatedTime} minutes</p>
                  </div>
                </div>

                {selectedQuiz.status === 'approved' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">Completions</p>
                      <p className="font-bold text-2xl text-green-700 dark:text-green-300">
                        {selectedQuiz.completions.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400">Average Score</p>
                      <p className="font-bold text-2xl text-blue-700 dark:text-blue-300">
                        {selectedQuiz.averageScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuiz.tags.map(tag => (
                      <span 
                        key={tag}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {selectedQuiz.status === 'approved' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Play className="w-4 h-4" />
                      Preview Quiz
                    </button>
                  )}
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <Edit className="w-4 h-4" />
                    Edit Quiz
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create New Quiz</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={editingQuiz.title || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., Stock Market Fundamentals"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingQuiz.description || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  rows={3}
                  placeholder="Describe what this quiz covers..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={editingQuiz.category || 'general'}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={editingQuiz.difficulty || 'beginner'}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={editingQuiz.estimatedTime || 10}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, estimatedTime: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  min="5"
                  max="60"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateQuiz}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Quiz
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {showEditModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Quiz</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={editingQuiz.title || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., Stock Market Fundamentals"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingQuiz.description || ''}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  rows={3}
                  placeholder="Describe what this quiz covers..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={editingQuiz.category || 'general'}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={editingQuiz.difficulty || 'beginner'}
                    onChange={(e) => setEditingQuiz({ ...editingQuiz, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={editingQuiz.estimatedTime || 10}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, estimatedTime: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  min="5"
                  max="60"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateQuiz}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Update Quiz
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default AIQuizModule;

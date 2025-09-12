'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Play,
  Clock,
  Target,
  Trophy,
  Star,
  BookOpen,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  RotateCcw,
  Share2,
  Eye,
  Users,
  Zap,
  Calendar,
  BarChart3,
  Lightbulb,
  Timer,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import customerQuizService from '@/services/customerQuizService';
import type { CustomerQuiz, QuizAttempt } from '@/services/customerQuizService';
import { activityLogger } from '@/services/activityLoggingService';
import { DatabaseUser } from '@/services/realTimeDataService';
import { useSessionTracking } from '@/hooks/useSessionTracking';
  2
interface CustomerQuizProps {
  currentUser?: DatabaseUser | null;
  className?: string;
}

interface QuizSession {
  quiz: CustomerQuiz;
  currentQuestionIndex: number;
  selectedAnswers: (string | null)[];
  startTime: Date;
  timeRemaining: number;
  isCompleted: boolean;
  score?: number;
}

const CustomerQuiz: React.FC<CustomerQuizProps> = ({ currentUser, className = '' }) => {
  const [quizzes, setQuizzes] = useState<CustomerQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [currentSession, setCurrentSession] = useState<QuizSession | null>(null);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [completedQuiz, setCompletedQuiz] = useState<QuizAttempt | null>(null);

  // Initialize session tracking
  const {
    sessionStartTime,
    lastActivityTime,
    startSession,
    endSession,
    updateLastActivity,
    trackEngagementActivity
  } = useSessionTracking({
    user: currentUser || null,
    autoStartSession: false, // Let parent component handle session
    trackPageViews: false,   // This is a component, not a page
    trackEngagement: true,
    sessionTimeoutMinutes: 30
  });

  const categories = [
    { value: 'all', label: 'All Categories', icon: BookOpen },
    { value: 'stocks', label: 'Stock Market', icon: TrendingUp },
    { value: 'trading', label: 'Trading', icon: BarChart3 },
    { value: 'crypto', label: 'Cryptocurrency', icon: Zap },
    { value: 'economics', label: 'Economics', icon: Calendar },
    { value: 'investment', label: 'Investment', icon: Target },
    { value: 'analysis', label: 'Technical Analysis', icon: Brain }
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels', color: 'bg-slate-100 text-slate-700' },
    { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-700' },
    { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-700' }
  ];

  // Set current user for activity logging
  useEffect(() => {
    if (currentUser) {
      activityLogger.setCurrentUser(currentUser);
    }
  }, [currentUser]);

  // Subscribe to quiz updates
  useEffect(() => {
    const unsubscribe = customerQuizService.subscribe((newQuizzes) => {
      setQuizzes(newQuizzes);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load user attempts
  useEffect(() => {
    if (currentUser && typeof window !== 'undefined') {
      // Since the service doesn't have getUserAttempts, we'll track locally
      const storedAttempts = localStorage.getItem('userQuizAttempts');
      if (storedAttempts) {
        const allAttempts = JSON.parse(storedAttempts);
        const userSpecificAttempts = allAttempts.filter((attempt: QuizAttempt) => attempt.userId === currentUser.id);
        setUserAttempts(userSpecificAttempts);
      }
    }
  }, [currentUser]);

  // Timer for active quiz session
  useEffect(() => {
    if (!currentSession || currentSession.isCompleted) return;

    const timer = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev || prev.timeRemaining <= 0) return prev;
        
        const newTimeRemaining = prev.timeRemaining - 1;
        if (newTimeRemaining <= 0) {
          // Auto-submit quiz when time runs out
          handleQuizComplete(prev);
        }
        
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSession]);

  const filteredQuizzes = quizzes.filter(quiz => {
    if (selectedCategory !== 'all' && quiz.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && quiz.difficulty !== selectedDifficulty) return false;
    return true;
  });

  // Enhanced filter functions with activity tracking
  const handleCategoryFilter = async (category: string) => {
    setSelectedCategory(category);
    
    if (currentUser) {
      await activityLogger.logSearchActivity(
        `category:${category}`,
        'quiz',
        filteredQuizzes.filter(quiz => category === 'all' || quiz.category === category).length
      );
      
      await activityLogger.logUserEngagement('click', 'quiz-category-filter', 'quiz', 0, {
        selectedCategory: category,
        previousCategory: selectedCategory,
        resultCount: filteredQuizzes.length
      });
    }
  };

  const handleDifficultyFilter = async (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    
    if (currentUser) {
      await activityLogger.logSearchActivity(
        `difficulty:${difficulty}`,
        'quiz',
        filteredQuizzes.filter(quiz => difficulty === 'all' || quiz.difficulty === difficulty).length
      );
      
      await activityLogger.logUserEngagement('click', 'quiz-difficulty-filter', 'quiz', 0, {
        selectedDifficulty: difficulty,
        previousDifficulty: selectedDifficulty,
        resultCount: filteredQuizzes.length
      });
    }
  };

  const startQuiz = async (quiz: CustomerQuiz) => {
    const session: QuizSession = {
      quiz,
      currentQuestionIndex: 0,
      selectedAnswers: new Array(quiz.questions.length).fill(null),
      startTime: new Date(),
      timeRemaining: quiz.estimatedTime * 60, // Convert minutes to seconds
      isCompleted: false
    };

    setCurrentSession(session);

    // Log quiz start activity
    if (currentUser) {
      await activityLogger.logQuizAttempt(
        quiz.id,
        quiz.title,
        quiz.category,
        quiz.difficulty
      );

      // Track quiz start engagement
      await activityLogger.logUserEngagement('click', 'start-quiz-button', 'quiz', 0, {
        quizId: quiz.id,
        quizTitle: quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        estimatedTime: quiz.estimatedTime,
        totalQuestions: quiz.questions.length
      });

      // Track performance metric for quiz loading
      await activityLogger.logSystemEvent('performance', 'quiz-start-time', { duration: Date.now() - performance.now() });
    }
  };

  const selectAnswer = async (answerIndex: string) => {
    if (!currentSession || currentSession.isCompleted) return;

    const newAnswers = [...currentSession.selectedAnswers];
    const previousAnswer = newAnswers[currentSession.currentQuestionIndex];
    newAnswers[currentSession.currentQuestionIndex] = answerIndex;
    
    setCurrentSession(prev => prev ? { ...prev, selectedAnswers: newAnswers } : null);

    // Track answer selection engagement
    if (currentUser) {
      await activityLogger.logUserEngagement('click', 'quiz-answer-selection', 'quiz', 0, {
        questionIndex: currentSession.currentQuestionIndex,
        selectedAnswer: answerIndex,
        previousAnswer: previousAnswer,
        isAnswerChange: previousAnswer !== null,
        quizId: currentSession.quiz.id,
        timeSpentOnQuestion: Date.now() - currentSession.startTime.getTime()
      });
    }
  };

  const nextQuestion = () => {
    if (!currentSession) return;
    
    if (currentSession.currentQuestionIndex < currentSession.quiz.questions.length - 1) {
      setCurrentSession(prev => prev ? { 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex + 1 
      } : null);
    }
  };

  const previousQuestion = () => {
    if (!currentSession) return;
    
    if (currentSession.currentQuestionIndex > 0) {
      setCurrentSession(prev => prev ? { 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex - 1 
      } : null);
    }
  };

  const handleQuizComplete = async (session: QuizSession) => {
    if (!currentUser) return;

    // Calculate score
    const correctAnswers = session.selectedAnswers.filter((answer, index) => {
      if (answer === null) return false;
      const correctIndex = session.quiz.questions[index].correctAnswer;
      return answer === String.fromCharCode(65 + correctIndex);
    }).length;

    const score = Math.round((correctAnswers / session.quiz.questions.length) * 100);
    const timeTaken = Math.floor((Date.now() - session.startTime.getTime()) / 1000);

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      quizId: session.quiz.id,
      userId: currentUser.id,
      startedAt: session.startTime,
      completedAt: new Date(),
      currentQuestionIndex: session.quiz.questions.length,
      answers: session.selectedAnswers.map((answer, index) => {
        const correctIndex = session.quiz.questions[index].correctAnswer;
        const isCorrect = answer === String.fromCharCode(65 + correctIndex);
        return {
          questionId: session.quiz.questions[index].id,
          selectedAnswer: answer ? answer.charCodeAt(0) - 65 : -1,
          isCorrect,
          timeSpent: 30, // approximate
          points: isCorrect ? session.quiz.questions[index].points : 0
        };
      }),
      totalScore: score,
      maxPossibleScore: 100,
      percentageScore: score,
      isCompleted: true,
      isPassed: score >= session.quiz.passScore,
      timeSpent: timeTaken
    };

    setCompletedQuiz(attempt);
    setCurrentSession(prev => prev ? { ...prev, isCompleted: true, score } : null);
    setShowResults(true);

    // Store attempt locally
    if (typeof window !== 'undefined') {
      const storedAttempts = JSON.parse(localStorage.getItem('userQuizAttempts') || '[]');
      storedAttempts.push(attempt);
      localStorage.setItem('userQuizAttempts', JSON.stringify(storedAttempts));
    }

    // Update user attempts
    setUserAttempts(prev => [...prev, attempt]);

    // Log quiz completion activity
    await activityLogger.logQuizAttempt(
      session.quiz.id,
      session.quiz.title,
      session.quiz.category,
      session.quiz.difficulty
    );
  };

  const resetQuiz = () => {
    setCurrentSession(null);
    setShowResults(false);
    setCompletedQuiz(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading financial quizzes...</p>
        </div>
      </div>
    );
  }

  // Quiz Taking Interface
  if (currentSession && !showResults) {
    const currentQuestion = currentSession.quiz.questions[currentSession.currentQuestionIndex];
    const progress = ((currentSession.currentQuestionIndex + 1) / currentSession.quiz.questions.length) * 100;
    const isLastQuestion = currentSession.currentQuestionIndex === currentSession.quiz.questions.length - 1;
    const hasSelectedAnswer = currentSession.selectedAnswers[currentSession.currentQuestionIndex] !== null;

    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Quiz Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">{currentSession.quiz.title}</h1>
              <button
                onClick={resetQuiz}
                className="text-white hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span>Question {currentSession.currentQuestionIndex + 1} of {currentSession.quiz.questions.length}</span>
                <span className={`px-2 py-1 rounded ${getDifficultyColor(currentSession.quiz.difficulty)}`}>
                  {currentSession.quiz.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span className={currentSession.timeRemaining < 300 ? 'text-red-300' : ''}>
                  {formatTime(currentSession.timeRemaining)}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-4">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Content */}
          <div className="p-6">
            <motion.div
              key={currentSession.currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.explanation && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {currentQuestion.explanation}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const optionKey = String.fromCharCode(65 + index); // A, B, C, D
                  const isSelected = currentSession.selectedAnswers[currentSession.currentQuestionIndex] === optionKey;
                  
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectAnswer(optionKey)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {optionKey}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">{option}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={previousQuestion}
              disabled={currentSession.currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {currentSession.quiz.questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === currentSession.currentQuestionIndex
                      ? 'bg-blue-500 text-white'
                      : currentSession.selectedAnswers[index] !== null
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>

            {isLastQuestion ? (
              <button
                onClick={() => handleQuizComplete(currentSession)}
                disabled={!hasSelectedAnswer}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!hasSelectedAnswer}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Results Interface
  if (showResults && completedQuiz) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-lg opacity-90">
              You scored {completedQuiz.percentageScore}% on "{currentSession?.quiz.title}"
            </p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(completedQuiz.percentageScore)}`}>
                  {completedQuiz.percentageScore}%
                </div>
                <div className="text-slate-600 dark:text-slate-400">Final Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {completedQuiz.answers.filter(a => a.isCorrect).length}/{completedQuiz.answers.length}
                </div>
                <div className="text-slate-600 dark:text-slate-400">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {formatTime(completedQuiz.timeSpent)}
                </div>
                <div className="text-slate-600 dark:text-slate-400">Time Taken</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={resetQuiz}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Take Another Quiz
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <Share2 className="w-4 h-4" />
                Share Results
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Quiz Selection Interface
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Financial Knowledge Quizzes
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Test your financial knowledge and improve your trading skills
        </p>
      </motion.div>

      {/* User Stats */}
      {userAttempts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white">
                  {userAttempts.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Quizzes Taken</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white">
                  {Math.round(userAttempts.reduce((sum, attempt) => sum + attempt.percentageScore, 0) / userAttempts.length)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Average Score</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white">
                  {Math.max(...userAttempts.map(attempt => attempt.percentageScore))}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Best Score</div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white">
                  {formatTime(Math.round(userAttempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0) / userAttempts.length))}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Avg Time</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Categories */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryFilter(category.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Levels */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Difficulty</h3>
            <div className="space-y-2">
              {difficulties.map(difficulty => (
                <button
                  key={difficulty.value}
                  onClick={() => handleDifficultyFilter(difficulty.value)}
                  className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedDifficulty === difficulty.value
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {difficulty.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quiz Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                        {quiz.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        {quiz.estimatedTime}min
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                      {quiz.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-2">
                      {quiz.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {quiz.questions.length} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {userAttempts.filter(a => a.quizId === quiz.id).length} attempts
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {userAttempts.filter(a => a.quizId === quiz.id).length > 0 
                            ? Math.round(userAttempts.filter(a => a.quizId === quiz.id).reduce((sum, a) => sum + a.percentageScore, 0) / userAttempts.filter(a => a.quizId === quiz.id).length)
                            : quiz.passScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {quiz.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => startQuiz(quiz)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Start Quiz
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredQuizzes.length === 0 && !loading && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">No quizzes found</h3>
              <p className="text-slate-500">Try adjusting your filters to see more quizzes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerQuiz;

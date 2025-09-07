// Database type definitions for the Stock Market Learning Platform

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    emailUpdates: boolean;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  stats?: {
    totalNewsRead: number;
    totalQuizzesTaken: number;
    averageQuizScore: number;
    streakDays: number;
    lastActivityAt?: Date;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: 'NEWS_VIEW' | 'QUIZ_ATTEMPT' | 'USER_LOGIN' | 'SEARCH' | 'BOOKMARK';
  timestamp: Date;
  data: Record<string, any>;
  deviceInfo?: {
    browser: string;
    device: string;
    os: string;
    ip?: string;
  };
  duration?: number; // in seconds
  location?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage?: string;
  source: {
    id?: string;
    name: string;
  };
  author?: string;
  publishedAt: Date;
  category: string;
  tags?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  isBreaking?: boolean;
  readingTime?: number; // estimated reading time in minutes
  viewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  tags?: string[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  answers: number[]; // array of selected option indices
  score: number; // percentage score
  correctAnswers: number;
  totalQuestions: number;
  completionTime: number; // in seconds
  startedAt: Date;
  completedAt: Date;
  timestamp: Date;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  passed: boolean;
}

export interface NewsViewActivity extends ActivityLog {
  type: 'NEWS_VIEW';
  data: {
    newsId: string;
    title: string;
    category: string;
    source: string;
    readingTime: number; // actual time spent reading in seconds
    scrollPercentage: number;
    wasBookmarked: boolean;
    sharedTo?: string[];
  };
}

export interface QuizAttemptActivity extends ActivityLog {
  type: 'QUIZ_ATTEMPT';
  data: {
    quizId: string;
    quizTitle: string;
    difficulty: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    completionTime: number;
    questionsSkipped: number;
    hintsUsed: number;
  };
}

export interface UserLoginActivity extends ActivityLog {
  type: 'USER_LOGIN';
  data: {
    loginMethod: 'email' | 'google' | 'facebook' | 'guest';
    sessionDuration?: number;
    pagesVisited?: string[];
    actionsPerformed?: string[];
  };
}

export interface SearchActivity extends ActivityLog {
  type: 'SEARCH';
  data: {
    query: string;
    resultsCount: number;
    resultClicked?: string;
    searchType: 'news' | 'quiz' | 'general';
    filters?: Record<string, any>;
  };
}

export interface BookmarkActivity extends ActivityLog {
  type: 'BOOKMARK';
  data: {
    itemId: string;
    itemType: 'news' | 'quiz';
    itemTitle: string;
    action: 'add' | 'remove';
  };
}

// Analytics aggregation types
export interface UserAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: {
    totalActivities: number;
    newsArticlesRead: number;
    quizzesTaken: number;
    averageSessionDuration: number;
    mostActiveHour: number;
    favoriteCategory: string;
    improvementRate: number; // quiz score improvement over time
    engagementScore: number; // calculated engagement metric
  };
}

export interface SystemAnalytics {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalActivities: number;
    popularContent: Array<{
      id: string;
      title: string;
      type: 'news' | 'quiz';
      viewCount: number;
    }>;
    averageEngagement: number;
    topCategories: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
    deviceBreakdown: Array<{
      device: string;
      count: number;
      percentage: number;
    }>;
  };
}

// Database query filters
export interface ActivityFilter {
  userId?: string;
  type?: ActivityLog['type'];
  startDate?: Date;
  endDate?: Date;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface NewsFilter {
  category?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
  isBreaking?: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
  limit?: number;
  offset?: number;
}

export interface QuizFilter {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

// API response types
export interface DatabaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Backup and migration types
export interface DatabaseBackup {
  version: string;
  timestamp: Date;
  collections: {
    users: UserProfile[];
    activities: ActivityLog[];
    news: NewsArticle[];
    quizzes: Quiz[];
    quizAttempts: QuizAttempt[];
  };
  metadata: {
    totalRecords: number;
    compressedSize?: number;
    checksum?: string;
  };
}

export interface MigrationStatus {
  isRunning: boolean;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  errors: string[];
  startedAt?: Date;
  estimatedCompletion?: Date;
}

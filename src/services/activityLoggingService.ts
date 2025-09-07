// Activity Logging Service - Real-time tracking of user interactions
import { DatabaseUser } from '@/services/realTimeDataService';

export interface NewsViewActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  newsId: string;
  newsTitle: string;
  newsSource: string;
  newsCategory: string;
  viewedAt: Date;
  timeSpent: number; // seconds
  userAgent: string;
  ipAddress?: string;
  referrer?: string;
  deviceInfo: {
    isMobile: boolean;
    browser: string;
    os: string;
  };
}

export interface QuizAttemptActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  quizId: string;
  quizTitle: string;
  quizCategory: string;
  quizDifficulty: string;
  startedAt: Date;
  completedAt?: Date;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // seconds
  answers: Array<{
    questionId: string;
    question: string;
    selectedAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  abandonedAt?: Date;
  isCompleted: boolean;
  deviceInfo: {
    isMobile: boolean;
    browser: string;
    os: string;
  };
}

export interface UserSessionActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  sessionStart: Date;
  sessionEnd?: Date;
  duration: number; // seconds
  pagesVisited: string[];
  actionsPerformed: Array<{
    action: string;
    timestamp: Date;
    details: any;
  }>;
  deviceInfo: {
    isMobile: boolean;
    browser: string;
    os: string;
  };
}

export interface ActivitySummary {
  userId: string;
  userName: string;
  userEmail: string;
  totalNewsViewed: number;
  totalQuizzesAttempted: number;
  totalQuizzesCompleted: number;
  averageQuizScore: number;
  totalTimeSpent: number; // seconds
  lastActivity: Date;
  favoriteCategories: string[];
  activityTrend: 'increasing' | 'decreasing' | 'stable';
}

class ActivityLoggingService {
  private newsViewActivities: NewsViewActivity[] = [];
  private quizAttemptActivities: QuizAttemptActivity[] = [];
  private userSessionActivities: UserSessionActivity[] = [];
  private subscribers: Array<(data: any) => void> = [];
  private currentUser: DatabaseUser | null = null;

  constructor() {
    this.loadActivitiesFromStorage();
    this.detectUserDevice();
  }

  // Set current user for logging
  setCurrentUser(user: DatabaseUser | null) {
    this.currentUser = user;
  }

  // Subscribe to activity updates
  subscribe(callback: (data: any) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      callback({
        newsActivities: this.newsViewActivities,
        quizActivities: this.quizAttemptActivities,
        sessionActivities: this.userSessionActivities
      });
    });
  }

  // Log news view activity
  async logNewsView(newsId: string, newsTitle: string, newsSource: string, newsCategory: string): Promise<void> {
    if (!this.currentUser) {
      console.warn('No current user set for activity logging');
      return;
    }

    const activity: NewsViewActivity = {
      id: `news_view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userEmail: this.currentUser.email,
      newsId,
      newsTitle,
      newsSource,
      newsCategory,
      viewedAt: new Date(),
      timeSpent: 0, // Will be updated when user leaves
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      deviceInfo: this.getDeviceInfo()
    };

    this.newsViewActivities.unshift(activity);
    this.saveActivitiesToStorage();
    this.notifySubscribers();

    // Start tracking time spent
    this.startTrackingNewsView(activity.id);
  }

  // Log quiz attempt
  async logQuizAttempt(quizId: string, quizTitle: string, quizCategory: string, quizDifficulty: string): Promise<string> {
    if (!this.currentUser) {
      console.warn('No current user set for activity logging');
      return '';
    }

    const activity: QuizAttemptActivity = {
      id: `quiz_attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userEmail: this.currentUser.email,
      quizId,
      quizTitle,
      quizCategory,
      quizDifficulty,
      startedAt: new Date(),
      score: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      timeSpent: 0,
      answers: [],
      isCompleted: false,
      deviceInfo: this.getDeviceInfo()
    };

    this.quizAttemptActivities.unshift(activity);
    this.saveActivitiesToStorage();
    this.notifySubscribers();

    return activity.id;
  }

  // Update quiz attempt with answer
  async logQuizAnswer(
    attemptId: string,
    questionId: string,
    question: string,
    selectedAnswer: number,
    correctAnswer: number,
    timeSpent: number
  ): Promise<void> {
    const activity = this.quizAttemptActivities.find(a => a.id === attemptId);
    if (!activity) return;

    const isCorrect = selectedAnswer === correctAnswer;
    
    activity.answers.push({
      questionId,
      question,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      timeSpent
    });

    if (isCorrect) {
      activity.correctAnswers++;
    }

    activity.totalQuestions = activity.answers.length;
    activity.timeSpent += timeSpent;
    activity.score = Math.round((activity.correctAnswers / activity.totalQuestions) * 100);

    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Complete quiz attempt
  async completeQuizAttempt(attemptId: string): Promise<void> {
    const activity = this.quizAttemptActivities.find(a => a.id === attemptId);
    if (!activity) return;

    activity.completedAt = new Date();
    activity.isCompleted = true;
    activity.timeSpent = Math.floor((activity.completedAt.getTime() - activity.startedAt.getTime()) / 1000);

    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Abandon quiz attempt
  async abandonQuizAttempt(attemptId: string): Promise<void> {
    const activity = this.quizAttemptActivities.find(a => a.id === attemptId);
    if (!activity) return;

    activity.abandonedAt = new Date();
    activity.timeSpent = Math.floor((activity.abandonedAt.getTime() - activity.startedAt.getTime()) / 1000);

    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Get activities for admin dashboard
  getNewsViewActivities(filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    category?: string;
  }): NewsViewActivity[] {
    let activities = [...this.newsViewActivities];

    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }
    if (filters?.dateFrom) {
      activities = activities.filter(a => a.viewedAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      activities = activities.filter(a => a.viewedAt <= filters.dateTo!);
    }
    if (filters?.category) {
      activities = activities.filter(a => a.newsCategory === filters.category);
    }

    return activities.sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime());
  }

  getQuizAttemptActivities(filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    category?: string;
    completed?: boolean;
  }): QuizAttemptActivity[] {
    let activities = [...this.quizAttemptActivities];

    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }
    if (filters?.dateFrom) {
      activities = activities.filter(a => a.startedAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      activities = activities.filter(a => a.startedAt <= filters.dateTo!);
    }
    if (filters?.category) {
      activities = activities.filter(a => a.quizCategory === filters.category);
    }
    if (filters?.completed !== undefined) {
      activities = activities.filter(a => a.isCompleted === filters.completed);
    }

    return activities.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  // Get user activity summary
  getUserActivitySummary(userId: string): ActivitySummary | null {
    const newsActivities = this.getNewsViewActivities({ userId });
    const quizActivities = this.getQuizAttemptActivities({ userId });
    
    if (newsActivities.length === 0 && quizActivities.length === 0) {
      return null;
    }

    const user = newsActivities[0] || quizActivities[0];
    const completedQuizzes = quizActivities.filter(q => q.isCompleted);
    const totalTimeSpent = 
      newsActivities.reduce((sum, a) => sum + a.timeSpent, 0) +
      quizActivities.reduce((sum, a) => sum + a.timeSpent, 0);

    const averageQuizScore = completedQuizzes.length > 0
      ? completedQuizzes.reduce((sum, q) => sum + q.score, 0) / completedQuizzes.length
      : 0;

    // Calculate favorite categories
    const categoryCount = new Map<string, number>();
    newsActivities.forEach(a => {
      categoryCount.set(a.newsCategory, (categoryCount.get(a.newsCategory) || 0) + 1);
    });
    quizActivities.forEach(a => {
      categoryCount.set(a.quizCategory, (categoryCount.get(a.quizCategory) || 0) + 1);
    });

    const favoriteCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const lastActivity = Math.max(
      ...newsActivities.map(a => a.viewedAt.getTime()),
      ...quizActivities.map(a => a.startedAt.getTime())
    );

    return {
      userId,
      userName: user.userName,
      userEmail: user.userEmail,
      totalNewsViewed: newsActivities.length,
      totalQuizzesAttempted: quizActivities.length,
      totalQuizzesCompleted: completedQuizzes.length,
      averageQuizScore,
      totalTimeSpent,
      lastActivity: new Date(lastActivity),
      favoriteCategories,
      activityTrend: this.calculateActivityTrend(userId)
    };
  }

  // Get all users activity summaries
  getAllUserActivitySummaries(): ActivitySummary[] {
    const userIds = new Set([
      ...this.newsViewActivities.map(a => a.userId),
      ...this.quizAttemptActivities.map(a => a.userId)
    ]);

    return Array.from(userIds)
      .map(userId => this.getUserActivitySummary(userId))
      .filter(summary => summary !== null) as ActivitySummary[];
  }

  // Private helper methods
  private startTrackingNewsView(activityId: string) {
    const startTime = Date.now();
    
    const updateTimeSpent = () => {
      const activity = this.newsViewActivities.find(a => a.id === activityId);
      if (activity) {
        activity.timeSpent = Math.floor((Date.now() - startTime) / 1000);
        this.saveActivitiesToStorage();
      }
    };

    // Update time spent every 5 seconds
    const interval = setInterval(updateTimeSpent, 5000);

    // Clean up on page unload
    const cleanup = () => {
      clearInterval(interval);
      updateTimeSpent();
    };

    window.addEventListener('beforeunload', cleanup);
    
    // Clean up after 30 minutes max
    setTimeout(() => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    }, 30 * 60 * 1000);
  }

  private getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { isMobile, browser, os };
  }

  private calculateActivityTrend(userId: string): 'increasing' | 'decreasing' | 'stable' {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentActivity = [
      ...this.getNewsViewActivities({ userId, dateFrom: lastWeek }),
      ...this.getQuizAttemptActivities({ userId, dateFrom: lastWeek })
    ].length;

    const previousActivity = [
      ...this.getNewsViewActivities({ userId, dateFrom: twoWeeksAgo, dateTo: lastWeek }),
      ...this.getQuizAttemptActivities({ userId, dateFrom: twoWeeksAgo, dateTo: lastWeek })
    ].length;

    if (recentActivity > previousActivity * 1.2) return 'increasing';
    if (recentActivity < previousActivity * 0.8) return 'decreasing';
    return 'stable';
  }

  private detectUserDevice() {
    // Set up device detection and tracking
    this.getDeviceInfo();
  }

  private saveActivitiesToStorage() {
    try {
      localStorage.setItem('newsViewActivities', JSON.stringify(this.newsViewActivities.slice(0, 1000))); // Keep last 1000
      localStorage.setItem('quizAttemptActivities', JSON.stringify(this.quizAttemptActivities.slice(0, 1000)));
      localStorage.setItem('userSessionActivities', JSON.stringify(this.userSessionActivities.slice(0, 500)));
    } catch (error) {
      console.warn('Failed to save activities to localStorage:', error);
    }
  }

  private loadActivitiesFromStorage() {
    try {
      const newsActivities = localStorage.getItem('newsViewActivities');
      const quizActivities = localStorage.getItem('quizAttemptActivities');
      const sessionActivities = localStorage.getItem('userSessionActivities');

      if (newsActivities) {
        this.newsViewActivities = JSON.parse(newsActivities).map((a: any) => ({
          ...a,
          viewedAt: new Date(a.viewedAt)
        }));
      }

      if (quizActivities) {
        this.quizAttemptActivities = JSON.parse(quizActivities).map((a: any) => ({
          ...a,
          startedAt: new Date(a.startedAt),
          completedAt: a.completedAt ? new Date(a.completedAt) : undefined,
          abandonedAt: a.abandonedAt ? new Date(a.abandonedAt) : undefined
        }));
      }

      if (sessionActivities) {
        this.userSessionActivities = JSON.parse(sessionActivities).map((a: any) => ({
          ...a,
          sessionStart: new Date(a.sessionStart),
          sessionEnd: a.sessionEnd ? new Date(a.sessionEnd) : undefined
        }));
      }
    } catch (error) {
      console.warn('Failed to load activities from localStorage:', error);
    }
  }

  // Clear all activities (for testing)
  clearAllActivities() {
    this.newsViewActivities = [];
    this.quizAttemptActivities = [];
    this.userSessionActivities = [];
    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }
}

export const activityLogger = new ActivityLoggingService();
export default activityLogger;

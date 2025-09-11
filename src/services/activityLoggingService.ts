// Activity Logging Service - Real-time tracking of user interactions
import { DatabaseUser } from '@/services/realTimeDataService';
import { safeStorage } from '@/services/safeStorage';

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

// New comprehensive activity interfaces
export interface SearchActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  searchQuery: string;
  searchCategory: 'news' | 'quiz' | 'general';
  resultsCount: number;
  selectedResult?: string;
  timestamp: Date;
  timeSpent: number;
  deviceInfo: DeviceInfo;
}

export interface NavigationActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  fromPage: string;
  toPage: string;
  timeSpent: number; // seconds spent on previous page
  timestamp: Date;
  deviceInfo: DeviceInfo;
  navigationMethod: 'click' | 'direct' | 'back' | 'forward';
}

export interface LoginActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  loginTime: Date;
  loginMethod: 'email' | 'social' | 'guest';
  deviceInfo: DeviceInfo;
  ipAddress?: string;
  success: boolean;
  failureReason?: string;
}

export interface LogoutActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  logoutTime: Date;
  sessionDuration: number; // seconds
  totalActivities: number;
  deviceInfo: DeviceInfo;
}

export interface SystemEventActivity {
  id: string;
  userId?: string;
  eventType: 'page_load' | 'error' | 'performance' | 'export' | 'share' | 'bookmark';
  eventDescription: string;
  metadata: Record<string, any>;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
}

export interface UserEngagementActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  engagementType: 'scroll' | 'click' | 'hover' | 'focus' | 'copy' | 'download';
  targetElement: string;
  targetPage: string;
  engagementDuration: number;
  timestamp: Date;
  additionalData?: Record<string, any>;
}

export interface DeviceInfo {
  isMobile: boolean;
  browser: string;
  os: string;
  screenResolution?: string;
  userAgent?: string;
}

class ActivityLoggingService {
  private newsViewActivities: NewsViewActivity[] = [];
  private quizAttemptActivities: QuizAttemptActivity[] = [];
  private userSessionActivities: UserSessionActivity[] = [];
  private searchActivities: SearchActivity[] = [];
  private navigationActivities: NavigationActivity[] = [];
  private loginActivities: LoginActivity[] = [];
  private logoutActivities: LogoutActivity[] = [];
  private systemEventActivities: SystemEventActivity[] = [];
  private userEngagementActivities: UserEngagementActivity[] = [];
  private subscribers: Array<(data: any) => void> = [];
  private currentUser: DatabaseUser | null = null;
  private currentSessionStart: Date | null = null;
  private currentPage: string = '';
  private pageStartTime: Date | null = null;

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
        sessionActivities: this.userSessionActivities,
        searchActivities: this.searchActivities,
        navigationActivities: this.navigationActivities,
        loginActivities: this.loginActivities,
        logoutActivities: this.logoutActivities,
        systemEventActivities: this.systemEventActivities,
        userEngagementActivities: this.userEngagementActivities
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

  // Enhanced Activity Logging Methods

  // Log user login
  async logUserLogin(loginMethod: 'email' | 'social' | 'guest', success: boolean, failureReason?: string): Promise<void> {
    if (!this.currentUser && success) {
      console.warn('No current user set for login logging');
      return;
    }

    const activity: LoginActivity = {
      id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser?.id || 'anonymous',
      userName: this.currentUser?.name || 'Anonymous',
      userEmail: this.currentUser?.email || 'anonymous',
      loginTime: new Date(),
      loginMethod,
      deviceInfo: this.getDeviceInfo(),
      success,
      failureReason
    };

    this.loginActivities.unshift(activity);
    
    if (success) {
      this.currentSessionStart = new Date();
    }
    
    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Log user logout
  async logUserLogout(): Promise<void> {
    if (!this.currentUser) return;

    const sessionDuration = this.currentSessionStart 
      ? Math.floor((Date.now() - this.currentSessionStart.getTime()) / 1000)
      : 0;

    const totalActivities = this.getTotalUserActivities(this.currentUser.id);

    const activity: LogoutActivity = {
      id: `logout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userEmail: this.currentUser.email,
      logoutTime: new Date(),
      sessionDuration,
      totalActivities,
      deviceInfo: this.getDeviceInfo()
    };

    this.logoutActivities.unshift(activity);
    this.currentSessionStart = null;
    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Log search activity
  async logSearchActivity(
    searchQuery: string, 
    searchCategory: 'news' | 'quiz' | 'general',
    resultsCount: number,
    selectedResult?: string
  ): Promise<void> {
    if (!this.currentUser) return;

    const activity: SearchActivity = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userEmail: this.currentUser.email,
      searchQuery,
      searchCategory,
      resultsCount,
      selectedResult,
      timestamp: new Date(),
      timeSpent: 0,
      deviceInfo: this.getDeviceInfo()
    };

    this.searchActivities.unshift(activity);
    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Log navigation activity
  async logNavigation(fromPage: string, toPage: string, navigationMethod: 'click' | 'direct' | 'back' | 'forward'): Promise<void> {
    if (!this.currentUser) return;

    const timeSpent = this.pageStartTime 
      ? Math.floor((Date.now() - this.pageStartTime.getTime()) / 1000)
      : 0;

    const activity: NavigationActivity = {
      id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userEmail: this.currentUser.email,
      fromPage,
      toPage,
      timeSpent,
      timestamp: new Date(),
      deviceInfo: this.getDeviceInfo(),
      navigationMethod
    };

    this.navigationActivities.unshift(activity);
    this.currentPage = toPage;
    this.pageStartTime = new Date();
    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Log system events
  async logSystemEvent(
    eventType: 'page_load' | 'error' | 'performance' | 'export' | 'share' | 'bookmark',
    eventDescription: string,
    metadata: Record<string, any> = {},
    severity: 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    const activity: SystemEventActivity = {
      id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser?.id,
      eventType,
      eventDescription,
      metadata,
      timestamp: new Date(),
      severity
    };

    this.systemEventActivities.unshift(activity);
    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Log user engagement
  async logUserEngagement(
    engagementType: 'scroll' | 'click' | 'hover' | 'focus' | 'copy' | 'download',
    targetElement: string,
    targetPage: string,
    engagementDuration: number = 0,
    additionalData?: Record<string, any>
  ): Promise<void> {
    if (!this.currentUser) return;

    const activity: UserEngagementActivity = {
      id: `engagement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userEmail: this.currentUser.email,
      engagementType,
      targetElement,
      targetPage,
      engagementDuration,
      timestamp: new Date(),
      additionalData
    };

    this.userEngagementActivities.unshift(activity);
    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Helper method to get total user activities
  private getTotalUserActivities(userId: string): number {
    return this.newsViewActivities.filter(a => a.userId === userId).length +
           this.quizAttemptActivities.filter(a => a.userId === userId).length +
           this.searchActivities.filter(a => a.userId === userId).length +
           this.navigationActivities.filter(a => a.userId === userId).length +
           this.userEngagementActivities.filter(a => a.userId === userId).length;
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

  // Enhanced Activity Getters

  // Get search activities
  getSearchActivities(filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    category?: 'news' | 'quiz' | 'general';
  }): SearchActivity[] {
    let activities = [...this.searchActivities];

    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }
    if (filters?.dateFrom) {
      activities = activities.filter(a => a.timestamp >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      activities = activities.filter(a => a.timestamp <= filters.dateTo!);
    }
    if (filters?.category) {
      activities = activities.filter(a => a.searchCategory === filters.category);
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get navigation activities
  getNavigationActivities(filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    fromPage?: string;
    toPage?: string;
  }): NavigationActivity[] {
    let activities = [...this.navigationActivities];

    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }
    if (filters?.dateFrom) {
      activities = activities.filter(a => a.timestamp >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      activities = activities.filter(a => a.timestamp <= filters.dateTo!);
    }
    if (filters?.fromPage) {
      activities = activities.filter(a => a.fromPage === filters.fromPage);
    }
    if (filters?.toPage) {
      activities = activities.filter(a => a.toPage === filters.toPage);
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get login activities
  getLoginActivities(filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    success?: boolean;
    loginMethod?: 'email' | 'social' | 'guest';
  }): LoginActivity[] {
    let activities = [...this.loginActivities];

    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }
    if (filters?.dateFrom) {
      activities = activities.filter(a => a.loginTime >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      activities = activities.filter(a => a.loginTime <= filters.dateTo!);
    }
    if (filters?.success !== undefined) {
      activities = activities.filter(a => a.success === filters.success);
    }
    if (filters?.loginMethod) {
      activities = activities.filter(a => a.loginMethod === filters.loginMethod);
    }

    return activities.sort((a, b) => b.loginTime.getTime() - a.loginTime.getTime());
  }

  // Get logout activities
  getLogoutActivities(filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): LogoutActivity[] {
    let activities = [...this.logoutActivities];

    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }
    if (filters?.dateFrom) {
      activities = activities.filter(a => a.logoutTime >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      activities = activities.filter(a => a.logoutTime <= filters.dateTo!);
    }

    return activities.sort((a, b) => b.logoutTime.getTime() - a.logoutTime.getTime());
  }

  // Get system event activities
  getSystemEventActivities(filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    eventType?: 'page_load' | 'error' | 'performance' | 'export' | 'share' | 'bookmark';
    severity?: 'info' | 'warning' | 'error';
  }): SystemEventActivity[] {
    let activities = [...this.systemEventActivities];

    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }
    if (filters?.dateFrom) {
      activities = activities.filter(a => a.timestamp >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      activities = activities.filter(a => a.timestamp <= filters.dateTo!);
    }
    if (filters?.eventType) {
      activities = activities.filter(a => a.eventType === filters.eventType);
    }
    if (filters?.severity) {
      activities = activities.filter(a => a.severity === filters.severity);
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get user engagement activities
  getUserEngagementActivities(filters?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    engagementType?: 'scroll' | 'click' | 'hover' | 'focus' | 'copy' | 'download';
    targetPage?: string;
  }): UserEngagementActivity[] {
    let activities = [...this.userEngagementActivities];

    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }
    if (filters?.dateFrom) {
      activities = activities.filter(a => a.timestamp >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      activities = activities.filter(a => a.timestamp <= filters.dateTo!);
    }
    if (filters?.engagementType) {
      activities = activities.filter(a => a.engagementType === filters.engagementType);
    }
    if (filters?.targetPage) {
      activities = activities.filter(a => a.targetPage === filters.targetPage);
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get comprehensive activity data for a user
  getComprehensiveUserActivity(userId: string): {
    newsViews: NewsViewActivity[];
    quizAttempts: QuizAttemptActivity[];
    searches: SearchActivity[];
    navigation: NavigationActivity[];
    logins: LoginActivity[];
    logouts: LogoutActivity[];
    engagement: UserEngagementActivity[];
    totalActivities: number;
  } {
    return {
      newsViews: this.getNewsViewActivities({ userId }),
      quizAttempts: this.getQuizAttemptActivities({ userId }),
      searches: this.getSearchActivities({ userId }),
      navigation: this.getNavigationActivities({ userId }),
      logins: this.getLoginActivities({ userId }),
      logouts: this.getLogoutActivities({ userId }),
      engagement: this.getUserEngagementActivities({ userId }),
      totalActivities: this.getTotalUserActivities(userId)
    };
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
    // Use safeStorage abstraction (works in SSR with in-memory fallback)
    try {
      safeStorage.set('newsViewActivities', JSON.stringify(this.newsViewActivities.slice(0, 1000)));
      safeStorage.set('quizAttemptActivities', JSON.stringify(this.quizAttemptActivities.slice(0, 1000)));
      safeStorage.set('userSessionActivities', JSON.stringify(this.userSessionActivities.slice(0, 500)));
      safeStorage.set('searchActivities', JSON.stringify(this.searchActivities.slice(0, 1000)));
      safeStorage.set('navigationActivities', JSON.stringify(this.navigationActivities.slice(0, 1000)));
      safeStorage.set('loginActivities', JSON.stringify(this.loginActivities.slice(0, 500)));
      safeStorage.set('logoutActivities', JSON.stringify(this.logoutActivities.slice(0, 500)));
      safeStorage.set('systemEventActivities', JSON.stringify(this.systemEventActivities.slice(0, 1000)));
      safeStorage.set('userEngagementActivities', JSON.stringify(this.userEngagementActivities.slice(0, 2000)));
    } catch (error) {
      console.warn('Failed to save activities (safeStorage):', error);
    }
  }

  private loadActivitiesFromStorage() {
    try {
      const newsActivities = safeStorage.get('newsViewActivities');
      const quizActivities = safeStorage.get('quizAttemptActivities');
      const sessionActivities = safeStorage.get('userSessionActivities');
      const searchActivities = safeStorage.get('searchActivities');
      const navigationActivities = safeStorage.get('navigationActivities');
      const loginActivities = safeStorage.get('loginActivities');
      const logoutActivities = safeStorage.get('logoutActivities');
      const systemEventActivities = safeStorage.get('systemEventActivities');
      const userEngagementActivities = safeStorage.get('userEngagementActivities');

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

      if (searchActivities) {
        this.searchActivities = JSON.parse(searchActivities).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
      }

      if (navigationActivities) {
        this.navigationActivities = JSON.parse(navigationActivities).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
      }

      if (loginActivities) {
        this.loginActivities = JSON.parse(loginActivities).map((a: any) => ({
          ...a,
          loginTime: new Date(a.loginTime)
        }));
      }

      if (logoutActivities) {
        this.logoutActivities = JSON.parse(logoutActivities).map((a: any) => ({
          ...a,
          logoutTime: new Date(a.logoutTime)
        }));
      }

      if (systemEventActivities) {
        this.systemEventActivities = JSON.parse(systemEventActivities).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
      }

      if (userEngagementActivities) {
        this.userEngagementActivities = JSON.parse(userEngagementActivities).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load activities (safeStorage):', error);
    }
  }

  // Clear all activities (for testing)
  clearAllActivities() {
    this.newsViewActivities = [];
    this.quizAttemptActivities = [];
    this.userSessionActivities = [];
    this.searchActivities = [];
    this.navigationActivities = [];
    this.loginActivities = [];
    this.logoutActivities = [];
    this.systemEventActivities = [];
    this.userEngagementActivities = [];
    this.saveActivitiesToStorage();
    this.notifySubscribers();
  }

  // Generate sample activities for demonstration
  generateSampleActivities() {
    const now = new Date();
    const users = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
      { id: '4', name: 'Alice Brown', email: 'alice@example.com' },
      { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com' }
    ];

    const newsArticles = [
      { id: 'news1', title: 'Market Outlook 2025: Tech Stocks Show Promise', category: 'Technology', source: 'Financial Times' },
      { id: 'news2', title: 'Fed Interest Rate Decision Impact on Markets', category: 'Economy', source: 'Reuters' },
      { id: 'news3', title: 'AI Stocks Surge as New Regulations Announced', category: 'Technology', source: 'Bloomberg' },
      { id: 'news4', title: 'Energy Sector Shows Strong Q4 Performance', category: 'Energy', source: 'Wall Street Journal' }
    ];

    const quizzes = [
      { id: 'quiz1', title: 'Stock Market Basics', category: 'Investing', difficulty: 'Beginner' },
      { id: 'quiz2', title: 'Options Trading Fundamentals', category: 'Options', difficulty: 'Intermediate' },
      { id: 'quiz3', title: 'Technical Analysis', category: 'Analysis', difficulty: 'Advanced' }
    ];

    // Generate activities from the last 24 hours
    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const timeOffset = Math.random() * 24 * 60 * 60 * 1000; // Random time in last 24 hours
      const timestamp = new Date(now.getTime() - timeOffset);

      const activityType = Math.random();
      
      if (activityType < 0.3) {
        // News view activity
        const article = newsArticles[Math.floor(Math.random() * newsArticles.length)];
        const activity: NewsViewActivity = {
          id: `news_view_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          newsId: article.id,
          newsTitle: article.title,
          newsSource: article.source,
          newsCategory: article.category,
          viewedAt: timestamp,
          timeSpent: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          deviceInfo: {
            isMobile: Math.random() > 0.7,
            browser: 'Chrome',
            os: 'Windows'
          }
        };
        this.newsViewActivities.unshift(activity);
      } else if (activityType < 0.5) {
        // Quiz activity
        const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
        const isCompleted = Math.random() > 0.3;
        const activity: QuizAttemptActivity = {
          id: `quiz_attempt_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          quizId: quiz.id,
          quizTitle: quiz.title,
          quizCategory: quiz.category,
          quizDifficulty: quiz.difficulty,
          startedAt: timestamp,
          completedAt: isCompleted ? new Date(timestamp.getTime() + Math.random() * 600000) : undefined,
          score: isCompleted ? Math.floor(Math.random() * 40) + 60 : 0, // 60-100% for completed
          totalQuestions: 10,
          correctAnswers: isCompleted ? Math.floor((Math.random() * 4) + 6) : 0, // 6-10 correct
          timeSpent: Math.floor(Math.random() * 900) + 300, // 5-20 minutes
          answers: [],
          isCompleted,
          deviceInfo: {
            isMobile: Math.random() > 0.7,
            browser: 'Chrome',
            os: 'Windows'
          }
        };
        this.quizAttemptActivities.unshift(activity);
      } else if (activityType < 0.7) {
        // Search activity
        const searchTerms = ['AAPL', 'Tesla stock', 'bitcoin price', 'dividend stocks', 'market analysis', 'S&P 500'];
        const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        const activity: SearchActivity = {
          id: `search_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          searchQuery: term,
          searchCategory: 'general',
          resultsCount: Math.floor(Math.random() * 50) + 10,
          timeSpent: Math.floor(Math.random() * 60) + 5, // 5-65 seconds
          timestamp,
          deviceInfo: {
            isMobile: Math.random() > 0.7,
            browser: 'Chrome',
            os: 'Windows'
          }
        };
        this.searchActivities.unshift(activity);
      } else {
        // Login activity
        const activity: LoginActivity = {
          id: `login_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          loginTime: timestamp,
          loginMethod: Math.random() > 0.8 ? 'social' : 'email',
          success: Math.random() > 0.05, // 95% success rate
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          deviceInfo: {
            isMobile: Math.random() > 0.7,
            browser: 'Chrome',
            os: 'Windows'
          }
        };
        this.loginActivities.unshift(activity);
      }
    }

    // Add some system events
    const systemEvent1: SystemEventActivity = {
      id: `system_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
                eventType: 'error',
      eventDescription: 'Application server started successfully',
      severity: 'info',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      userId: undefined,
      metadata: { server: 'web-01', version: '1.0.0' }
    };
    this.systemEventActivities.unshift(systemEvent1);

    const systemEvent2: SystemEventActivity = {
      id: `system_${now.getTime() + 1}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'performance',
      eventDescription: 'Daily database backup completed',
      severity: 'info',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      userId: undefined,
      metadata: { backup_size: '2.1GB', duration: '45s' }
    };
    this.systemEventActivities.unshift(systemEvent2);

    this.saveActivitiesToStorage();
    this.notifySubscribers();
    console.log('Sample activities generated successfully');
  }
}

export const activityLogger = new ActivityLoggingService();
export default activityLogger;

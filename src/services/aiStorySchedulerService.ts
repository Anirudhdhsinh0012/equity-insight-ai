import { aiStoryService } from './aiStoryGenerationService';
import { aiStoryDatabase } from './aiStoryDatabase';
import { StoryData } from '@/types';

interface SchedulerConfig {
  dailyGenerationTime: string; // HH:MM format
  timezone: string;
  maxStoriesPerDay: number;
  retryAttempts: number;
  retryDelay: number; // seconds
}

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  url: string;
  type: 'daily_stories' | 'breaking_news' | 'portfolio_alert';
  data?: any;
}

class AIStorySchedulerService {
  private config: SchedulerConfig = {
    dailyGenerationTime: '07:00', // 7:00 AM
    timezone: 'America/New_York',
    maxStoriesPerDay: 10,
    retryAttempts: 3,
    retryDelay: 300 // 5 minutes
  };

  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting AI Story Scheduler...');

    // Schedule daily story generation
    this.scheduleDailyGeneration();

    // Schedule hourly trending story updates
    this.scheduleHourlyUpdates();

    // Schedule weekly cleanup
    this.scheduleWeeklyCleanup();

    console.log('AI Story Scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    // Clear all intervals
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();

    this.isRunning = false;
    console.log('AI Story Scheduler stopped');
  }

  /**
   * Schedule daily story generation
   */
  private scheduleDailyGeneration(): void {
    // Calculate next execution time
    const nextRun = this.getNextDailyRunTime();
    const delay = nextRun.getTime() - Date.now();

    console.log(`Next daily story generation scheduled for: ${nextRun.toISOString()}`);

    // Set timeout for the first run
    setTimeout(() => {
      this.generateDailyStories();
      
      // Then set up recurring daily generation
      const dailyInterval = setInterval(() => {
        this.generateDailyStories();
      }, 24 * 60 * 60 * 1000); // 24 hours

      this.intervals.set('daily_generation', dailyInterval);
    }, delay);
  }

  /**
   * Schedule hourly trending story updates
   */
  private scheduleHourlyUpdates(): void {
    const hourlyInterval = setInterval(() => {
      this.updateTrendingStories();
    }, 60 * 60 * 1000); // 1 hour

    this.intervals.set('hourly_updates', hourlyInterval);
    console.log('Hourly trending updates scheduled');
  }

  /**
   * Schedule weekly database cleanup
   */
  private scheduleWeeklyCleanup(): void {
    const weeklyInterval = setInterval(() => {
      this.performWeeklyCleanup();
    }, 7 * 24 * 60 * 60 * 1000); // 7 days

    this.intervals.set('weekly_cleanup', weeklyInterval);
    console.log('Weekly cleanup scheduled');
  }

  /**
   * Generate daily stories for all users
   */
  private async generateDailyStories(): Promise<void> {
    console.log('Starting daily story generation...');
    
    try {
      // Get trending stocks for the day
      const trendingStocks = await this.getTrendingStocks();
      
      // Get all user preferences
      const userPreferences = await this.getAllUserPreferences();
      
      const today = new Date().toISOString().split('T')[0];
      const totalStories: StoryData[] = [];

      // Generate stories for trending stocks
      const trendingStories = await aiStoryService.generatePortfolioStories(
        trendingStocks.slice(0, 5), // Top 5 trending
        'professional'
      );

      totalStories.push(...trendingStories);

      // Generate personalized stories for each user
      for (const userPref of userPreferences) {
        if (!userPref.notificationSettings.dailyStories) {
          continue; // Skip users who don't want daily stories
        }

        try {
          const personalizedStories = await aiStoryService.generatePortfolioStories(
            userPref.preferredTickers.slice(0, 3), // Top 3 user stocks
            userPref.storyTone
          );

          // Add user context to stories
          const userStories = personalizedStories.map(story => ({
            ...story,
            id: `${story.id}-${userPref.userId}`,
            // In a real database, you'd store the userId relationship
          }));

          totalStories.push(...userStories);

          // Send notification to user
          await this.sendNotification({
            userId: userPref.userId,
            title: '📊 Your Daily Investment Stories Are Ready!',
            message: `${personalizedStories.length} new AI-generated stories about your portfolio`,
            url: '/dashboard?tab=ai-stories',
            type: 'daily_stories',
            data: { storiesCount: personalizedStories.length }
          });

        } catch (error) {
          console.error(`Error generating stories for user ${userPref.userId}:`, error);
        }
      }

      // Save daily batch
      const batchId = `daily-${today}`;
      await aiStoryDatabase.saveDailyBatch({
        id: batchId,
        date: today,
        stories: totalStories.map(s => s.id),
        generatedAt: new Date(),
        totalStories: totalStories.length,
        trending: trendingStocks
      });

      // Save all stories to database
      for (const story of totalStories) {
        await aiStoryDatabase.saveStory(story);
      }

      console.log(`Daily story generation completed: ${totalStories.length} stories generated`);

    } catch (error) {
      console.error('Error in daily story generation:', error);
      
      // Send error notification to admin (if configured)
      await this.sendAdminAlert('Daily story generation failed', error);
    }
  }

  /**
   * Update trending stories throughout the day
   */
  private async updateTrendingStories(): Promise<void> {
    console.log('Updating trending stories...');
    
    try {
      // Get current market movers
      const marketMovers = await this.getMarketMovers();
      
      if (marketMovers.length === 0) {
        console.log('No significant market movers found');
        return;
      }

      // Generate breaking news stories for significant movers
      const breakingStories = await aiStoryService.generatePortfolioStories(
        marketMovers,
        'professional'
      );

      // Save breaking stories
      for (const story of breakingStories) {
        await aiStoryDatabase.saveStory(story);
      }

      // Notify users who have these stocks in their portfolios
      await this.notifyRelevantUsers(breakingStories);

      console.log(`Trending stories updated: ${breakingStories.length} new stories`);

    } catch (error) {
      console.error('Error updating trending stories:', error);
    }
  }

  /**
   * Perform weekly database cleanup
   */
  private async performWeeklyCleanup(): Promise<void> {
    console.log('Performing weekly cleanup...');
    
    try {
      await aiStoryDatabase.cleanup();
      
      // Send cleanup report
      const analytics = await aiStoryDatabase.getAnalytics();
      console.log('Weekly cleanup completed', analytics.summary);
      
    } catch (error) {
      console.error('Error during weekly cleanup:', error);
    }
  }

  /**
   * Get next daily run time based on configuration
   */
  private getNextDailyRunTime(): Date {
    const now = new Date();
    const [hours, minutes] = this.config.dailyGenerationTime.split(':').map(Number);
    
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (nextRun.getTime() <= now.getTime()) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun;
  }

  /**
   * Get trending stocks (mock implementation)
   */
  private async getTrendingStocks(): Promise<string[]> {
    // In production, this would call a real trending stocks API
    const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN', 'NFLX'];
    return popularStocks.sort(() => Math.random() - 0.5).slice(0, 8);
  }

  /**
   * Get stocks with significant price movements
   */
  private async getMarketMovers(): Promise<string[]> {
    try {
      // In production, this would call market data APIs to find stocks with >5% moves
      const movers = [];
      const candidates = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN'];
      
      for (const ticker of candidates) {
        // Simulate checking if stock moved significantly
        if (Math.random() > 0.8) { // 20% chance of being a mover
          movers.push(ticker);
        }
      }
      
      return movers;
    } catch (error) {
      console.error('Error getting market movers:', error);
      return [];
    }
  }

  /**
   * Get all user preferences from database
   */
  private async getAllUserPreferences(): Promise<any[]> {
    // In production, this would query the database for all user preferences
    // For now, return mock data
    return [
      {
        userId: 'user1',
        storyTone: 'professional',
        preferredTickers: ['AAPL', 'GOOGL', 'MSFT'],
        notificationSettings: { dailyStories: true, breakingNews: true, portfolioAlerts: true }
      },
      {
        userId: 'user2',
        storyTone: 'casual',
        preferredTickers: ['TSLA', 'NVDA', 'META'],
        notificationSettings: { dailyStories: true, breakingNews: false, portfolioAlerts: true }
      }
    ];
  }

  /**
   * Send notification to user
   */
  private async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      console.log(`Sending notification to user ${payload.userId}:`, payload.title);
      
      // In production, this would integrate with:
      // - Push notification service (Firebase, OneSignal, etc.)
      // - Email service (SendGrid, SES, etc.)
      // - SMS service (Twilio, etc.)
      // - In-app notifications
      
      // For now, just log the notification
      console.log('Notification payload:', {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type
      });
      
      // Store notification in local storage for demo
      const notifications = JSON.parse(localStorage.getItem('user_notifications') || '[]');
      notifications.push({
        ...payload,
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false
      });
      localStorage.setItem('user_notifications', JSON.stringify(notifications));
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Notify users who have relevant stocks in their portfolios
   */
  private async notifyRelevantUsers(stories: StoryData[]): Promise<void> {
    const userPreferences = await this.getAllUserPreferences();
    
    for (const story of stories) {
      const relevantUsers = userPreferences.filter(user => 
        user.preferredTickers.includes(story.ticker) &&
        user.notificationSettings.breakingNews
      );
      
      for (const user of relevantUsers) {
        await this.sendNotification({
          userId: user.userId,
          title: `🚨 Breaking: ${story.ticker} News`,
          message: story.title,
          url: `/dashboard?tab=ai-stories&story=${story.id}`,
          type: 'breaking_news',
          data: { ticker: story.ticker, sentiment: story.sentiment }
        });
      }
    }
  }

  /**
   * Send admin alert for system issues
   */
  private async sendAdminAlert(title: string, error: any): Promise<void> {
    console.error('Admin Alert:', title, error);
    
    // In production, this would send alerts to system administrators
    // via email, Slack, PagerDuty, etc.
  }

  /**
   * Manual trigger for daily generation (for testing)
   */
  async triggerDailyGeneration(): Promise<void> {
    console.log('Manually triggering daily story generation...');
    await this.generateDailyStories();
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    nextDailyRun: Date;
    activeIntervals: string[];
    config: SchedulerConfig;
  } {
    return {
      isRunning: this.isRunning,
      nextDailyRun: this.getNextDailyRunTime(),
      activeIntervals: Array.from(this.intervals.keys()),
      config: this.config
    };
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart if running to apply new config
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

// Export singleton instance
export const aiStoryScheduler = new AIStorySchedulerService();
export default AIStorySchedulerService;

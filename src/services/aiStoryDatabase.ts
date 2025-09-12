import { StoryData } from '@/types';

// Database interfaces
interface UserPreferences {
  userId: string;
  storyTone: 'professional' | 'casual' | 'funny';
  preferredTickers: string[];
  notificationSettings: {
    dailyStories: boolean;
    breakingNews: boolean;
    portfolioAlerts: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface StoredStory extends StoryData {
  userId?: string;
  isBookmarked: boolean;
  isRead: boolean;
  engagement: {
    views: number;
    timeSpent: number;
    shared: boolean;
  };
  generationMeta: {
    model: string;
    promptVersion: string;
    generationTime: number;
    dataQuality: number;
  };
}

interface DailyStoryBatch {
  id: string;
  date: string; // YYYY-MM-DD
  stories: string[]; // Story IDs
  generatedAt: Date;
  totalStories: number;
  trending: string[]; // Trending tickers for this batch
}

class AIStoryDatabase {
  private storageKeys = {
    stories: 'ai_stories_db',
    userPreferences: 'ai_user_preferences_db',
    dailyBatches: 'ai_daily_batches_db',
    analytics: 'ai_analytics_db'
  };

  // Helper methods for safe localStorage access
  private safeSetLocalStorage(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private safeGetLocalStorage(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Save a story to the database
   */
  async saveStory(story: StoryData, userId?: string): Promise<string> {
    try {
      const storedStory: StoredStory = {
        ...story,
        userId,
        isBookmarked: false,
        isRead: false,
        engagement: {
          views: 0,
          timeSpent: 0,
          shared: false
        },
        generationMeta: {
          model: 'mock-ai-model',
          promptVersion: 'v1.0',
          generationTime: Date.now(),
          dataQuality: story.aiConfidence
        }
      };

      const existingStories = this.getStoredStories();
      existingStories.push(storedStory);
      
      this.safeSetLocalStorage(this.storageKeys.stories, JSON.stringify(existingStories));
      
      // Update analytics
      this.updateAnalytics('story_generated', {
        ticker: story.ticker,
        sentiment: story.sentiment,
        confidence: story.aiConfidence
      });

      return story.id;
    } catch (error) {
      console.error('Error saving story:', error);
      throw new Error('Failed to save story to database');
    }
  }

  /**
   * Get stories from database with filtering options
   */
  async getStories(options: {
    userId?: string;
    ticker?: string;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    onlyBookmarked?: boolean;
  } = {}): Promise<StoredStory[]> {
    try {
      let stories = this.getStoredStories();

      // Apply filters
      if (options.userId) {
        stories = stories.filter(story => story.userId === options.userId);
      }

      if (options.ticker) {
        stories = stories.filter(story => 
          story.ticker.toLowerCase() === options.ticker!.toLowerCase()
        );
      }

      if (options.sentiment) {
        stories = stories.filter(story => story.sentiment === options.sentiment);
      }

      if (options.dateFrom) {
        stories = stories.filter(story => 
          new Date(story.timestamp) >= options.dateFrom!
        );
      }

      if (options.dateTo) {
        stories = stories.filter(story => 
          new Date(story.timestamp) <= options.dateTo!
        );
      }

      if (options.onlyBookmarked) {
        stories = stories.filter(story => story.isBookmarked);
      }

      // Sort by timestamp (newest first)
      stories.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply limit
      if (options.limit) {
        stories = stories.slice(0, options.limit);
      }

      return stories;
    } catch (error) {
      console.error('Error getting stories:', error);
      return [];
    }
  }

  /**
   * Update story engagement (views, time spent, etc.)
   */
  async updateStoryEngagement(
    storyId: string, 
    engagement: Partial<StoredStory['engagement']>
  ): Promise<void> {
    try {
      const stories = this.getStoredStories();
      const storyIndex = stories.findIndex(story => story.id === storyId);
      
      if (storyIndex !== -1) {
        stories[storyIndex].engagement = {
          ...stories[storyIndex].engagement,
          ...engagement
        };
        
        this.safeSetLocalStorage(this.storageKeys.stories, JSON.stringify(stories));
      }
    } catch (error) {
      console.error('Error updating story engagement:', error);
    }
  }

  /**
   * Bookmark/unbookmark a story
   */
  async toggleBookmark(storyId: string): Promise<boolean> {
    try {
      const stories = this.getStoredStories();
      const storyIndex = stories.findIndex(story => story.id === storyId);
      
      if (storyIndex !== -1) {
        stories[storyIndex].isBookmarked = !stories[storyIndex].isBookmarked;
        this.safeSetLocalStorage(this.storageKeys.stories, JSON.stringify(stories));
        return stories[storyIndex].isBookmarked;
      }
      
      return false;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return false;
    }
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      const existingPrefs = this.getUserPreferences();
      const updatedPrefs = {
        ...preferences,
        updatedAt: new Date()
      };
      
      const prefIndex = existingPrefs.findIndex(pref => pref.userId === preferences.userId);
      
      if (prefIndex !== -1) {
        existingPrefs[prefIndex] = updatedPrefs;
      } else {
        existingPrefs.push(updatedPrefs);
      }
      
      this.safeSetLocalStorage(this.storageKeys.userPreferences, JSON.stringify(existingPrefs));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreference(userId: string): Promise<UserPreferences | null> {
    try {
      const preferences = this.getUserPreferences();
      return preferences.find(pref => pref.userId === userId) || null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Save daily story batch
   */
  async saveDailyBatch(batch: DailyStoryBatch): Promise<void> {
    try {
      const batches = this.getDailyBatches();
      const existingBatchIndex = batches.findIndex(b => b.date === batch.date);
      
      if (existingBatchIndex !== -1) {
        batches[existingBatchIndex] = batch;
      } else {
        batches.push(batch);
      }
      
      this.safeSetLocalStorage(this.storageKeys.dailyBatches, JSON.stringify(batches));
    } catch (error) {
      console.error('Error saving daily batch:', error);
    }
  }

  /**
   * Get daily story batch
   */
  async getDailyBatch(date: string): Promise<DailyStoryBatch | null> {
    try {
      const batches = this.getDailyBatches();
      return batches.find(batch => batch.date === date) || null;
    } catch (error) {
      console.error('Error getting daily batch:', error);
      return null;
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(dateFrom?: Date, dateTo?: Date) {
    try {
      const analytics = this.getStoredAnalytics();
      
      let filtered = analytics;
      if (dateFrom) {
        filtered = filtered.filter(entry => new Date(entry.timestamp) >= dateFrom);
      }
      if (dateTo) {
        filtered = filtered.filter(entry => new Date(entry.timestamp) <= dateTo);
      }
      
      // Calculate summary statistics
      const totalStories = filtered.filter(entry => entry.action === 'story_generated').length;
      const totalViews = filtered.filter(entry => entry.action === 'story_viewed').length;
      const avgConfidence = filtered
        .filter(entry => entry.action === 'story_generated' && entry.data.confidence)
        .reduce((sum, entry, _, arr) => sum + entry.data.confidence / arr.length, 0);
      
      const tickerStats = filtered
        .filter(entry => entry.action === 'story_generated')
        .reduce((acc, entry) => {
          const ticker = entry.data.ticker;
          acc[ticker] = (acc[ticker] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      return {
        summary: {
          totalStories,
          totalViews,
          avgConfidence: Math.round(avgConfidence),
          engagementRate: totalStories > 0 ? (totalViews / totalStories) * 100 : 0
        },
        tickerStats,
        timeline: filtered
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        summary: { totalStories: 0, totalViews: 0, avgConfidence: 0, engagementRate: 0 },
        tickerStats: {},
        timeline: []
      };
    }
  }

  /**
   * Clean up old data (keep last 30 days)
   */
  async cleanup(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      // Clean up stories
      const stories = this.getStoredStories();
      const recentStories = stories.filter(story => 
        new Date(story.timestamp) >= cutoffDate
      );
      this.safeSetLocalStorage(this.storageKeys.stories, JSON.stringify(recentStories));
      
      // Clean up daily batches
      const batches = this.getDailyBatches();
      const recentBatches = batches.filter(batch => 
        new Date(batch.generatedAt) >= cutoffDate
      );
      this.safeSetLocalStorage(this.storageKeys.dailyBatches, JSON.stringify(recentBatches));
      
      console.log('Database cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Private helper methods
  private getStoredStories(): StoredStory[] {
    try {
      const stored = this.safeGetLocalStorage(this.storageKeys.stories);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getUserPreferences(): UserPreferences[] {
    try {
      const stored = this.safeGetLocalStorage(this.storageKeys.userPreferences);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getDailyBatches(): DailyStoryBatch[] {
    try {
      const stored = this.safeGetLocalStorage(this.storageKeys.dailyBatches);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private getStoredAnalytics(): any[] {
    try {
      const stored = this.safeGetLocalStorage(this.storageKeys.analytics);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private updateAnalytics(action: string, data: any): void {
    try {
      const analytics = this.getStoredAnalytics();
      analytics.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action,
        data,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 entries
      if (analytics.length > 1000) {
        analytics.splice(0, analytics.length - 1000);
      }
      
      this.safeSetLocalStorage(this.storageKeys.analytics, JSON.stringify(analytics));
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }
}

// Export singleton instance
export const aiStoryDatabase = new AIStoryDatabase();
export default AIStoryDatabase;
export type { UserPreferences, StoredStory, DailyStoryBatch };

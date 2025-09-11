/**
 * Background Scheduler for Automated Stock Price Monitoring
 * Handles periodic price checks, alert triggers, and API quota management
 */

import * as cron from 'node-cron';
import { finnhubService } from '@/services/finnhubService';
import { notificationDB } from '@/services/notificationDatabase';

interface SchedulerConfig {
  priceCheckInterval: string; // Cron expression
  quotaResetInterval: string; // Cron expression
  healthCheckInterval: string; // Cron expression
  enableScheduling: boolean;
}

class StockPriceScheduler {
  private config: SchedulerConfig;
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;
  private userPortfolios = new Map<string, string[]>(); // userId -> tickers

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = {
      priceCheckInterval: '*/30 * * * * *', // Every 30 seconds
      quotaResetInterval: '0 * * * *', // Every hour
      healthCheckInterval: '*/5 * * * *', // Every 5 minutes
      enableScheduling: true,
      ...config
    };
  }

  /**
   * Start the scheduler
   */
  public start(): void {
    if (this.isRunning) {
      console.log('Stock price scheduler is already running');
      return;
    }

    console.log('Starting stock price scheduler...');

    // Price monitoring task
    const priceTask = cron.schedule(
      this.config.priceCheckInterval,
      () => this.performPriceCheck(),
      {
        name: 'price-check'
      }
    );

    // Health check task
    const healthTask = cron.schedule(
      this.config.healthCheckInterval,
      () => this.performHealthCheck(),
      {
        name: 'health-check'
      }
    );

    // Quota reset notification task
    const quotaTask = cron.schedule(
      this.config.quotaResetInterval,
      () => this.handleQuotaReset(),
      {
        name: 'quota-reset'
      }
    );

    this.tasks.set('price-check', priceTask);
    this.tasks.set('health-check', healthTask);
    this.tasks.set('quota-reset', quotaTask);

    if (this.config.enableScheduling) {
      // Start all tasks
      this.tasks.forEach(task => task.start());
      this.isRunning = true;
      console.log('Stock price scheduler started successfully');
    } else {
      this.isRunning = true;
      console.log('Stock price scheduler initialized but not started (scheduling disabled)');
    }
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('Stock price scheduler is not running');
      return;
    }

    console.log('Stopping stock price scheduler...');
    
    this.tasks.forEach(task => {
      task.stop();
      task.destroy();
    });
    
    this.tasks.clear();
    this.isRunning = false;
    console.log('Stock price scheduler stopped');
  }

  /**
   * Add user portfolio for monitoring
   */
  public addUserPortfolio(userId: string, tickers: string[]): void {
    this.userPortfolios.set(userId, tickers.map(t => t.toUpperCase()));
    console.log(`Added portfolio monitoring for user ${userId}: ${tickers.join(', ')}`);
  }

  /**
   * Remove user portfolio from monitoring
   */
  public removeUserPortfolio(userId: string): void {
    this.userPortfolios.delete(userId);
    console.log(`Removed portfolio monitoring for user ${userId}`);
  }

  /**
   * Update user portfolio
   */
  public updateUserPortfolio(userId: string, tickers: string[]): void {
    this.userPortfolios.set(userId, tickers.map(t => t.toUpperCase()));
    console.log(`Updated portfolio monitoring for user ${userId}: ${tickers.join(', ')}`);
  }

  /**
   * Get all unique tickers being monitored
   */
  private getAllMonitoredTickers(): string[] {
    const allTickers = new Set<string>();
    this.userPortfolios.forEach(tickers => {
      tickers.forEach(ticker => allTickers.add(ticker));
    });
    return Array.from(allTickers);
  }

  /**
   * Perform periodic price check
   */
  private async performPriceCheck(): Promise<void> {
    try {
      const apiStatus = finnhubService.getApiStatus();
      
      // Skip if API limit reached
      if (apiStatus.isLimitReached) {
        console.log('Skipping price check - API limit reached');
        return;
      }

      const tickers = this.getAllMonitoredTickers();
      
      if (tickers.length === 0) {
        return; // No tickers to monitor
      }

      console.log(`Checking prices for ${tickers.length} tickers...`);
      
      // Fetch prices in batches to respect rate limits
      const batchSize = 5;
      const currentPrices = new Map<string, number>();
      
      for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);
        
        try {
          const batchQuotes = await finnhubService.getBatchQuotes(batch);
          
          // Extract current prices
          batchQuotes.forEach((quote, ticker) => {
            currentPrices.set(ticker, quote.currentPrice);
          });
          
          // Small delay between batches
          if (i + batchSize < tickers.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error fetching batch ${i}-${i + batchSize}:`, error);
        }
      }
      
      // Check position-based alerts
      await this.checkPositionAlerts(currentPrices);
      
      console.log(`Price check completed for ${tickers.length} tickers`);
      
    } catch (error) {
      console.error('Error during price check:', error);
    }
  }

  /**
   * Check position-based alerts for all users
   */
  private async checkPositionAlerts(currentPrices: Map<string, number>): Promise<void> {
    try {
      const { historicalPriceService } = await import('./historicalPriceService');
      
      // Get all user IDs that have portfolios
      const userIds = Array.from(this.userPortfolios.keys());
      
      for (const userId of userIds) {
        try {
          // Get user's positions
          const positions = historicalPriceService.getUserPositions(userId);
          
          if (positions.length === 0) continue;
          
          // Check alerts for this user's positions
          const newAlerts = await historicalPriceService.checkPositionAlerts(positions, currentPrices);
          
          if (newAlerts.length > 0) {
            console.log(`Generated ${newAlerts.length} position alerts for user ${userId}`);
          }
          
        } catch (error) {
          console.error(`Error checking position alerts for user ${userId}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Error during position alert checking:', error);
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await finnhubService.healthCheck();
      
      if (health.status === 'unhealthy') {
        console.warn('Finnhub service is unhealthy:', health);
        await this.notifyUsersOfServiceIssue();
      } else if (health.status === 'degraded') {
        console.warn('Finnhub service is degraded:', health);
      }
      
      // Log health status
      console.log(`Health check: ${health.status} | WebSocket: ${health.websocketConnected} | Cache: ${health.cacheSize} tickers`);
      
    } catch (error) {
      console.error('Error during health check:', error);
    }
  }

  /**
   * Handle quota reset
   */
  private async handleQuotaReset(): Promise<void> {
    try {
      const apiStatus = finnhubService.getApiStatus();
      
      console.log(`Quota status: ${apiStatus.quotaUsed}/${apiStatus.quotaLimit} used, limit reached: ${apiStatus.isLimitReached}`);
      
      // If we were at the limit, notify users that service is resuming
      if (apiStatus.isLimitReached) {
        await this.notifyUsersOfServiceResumption();
      }
      
    } catch (error) {
      console.error('Error during quota reset handling:', error);
    }
  }

  /**
   * Notify users of service issues
   */
  private async notifyUsersOfServiceIssue(): Promise<void> {
    try {
      const userIds = Array.from(this.userPortfolios.keys());
      
      for (const userId of userIds) {
        const notification = {
          id: `service_issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          title: 'Stock Monitoring Service Issue',
          message: 'Live updates temporarily paused: API usage limit reached, will resume after reset',
          type: 'WARNING' as const,
          timestamp: new Date(),
          isRead: false,
          isPush: true
        };
        
        await notificationDB.addNotification(notification);
      }
      
      console.log(`Notified ${userIds.length} users of service issue`);
      
    } catch (error) {
      console.error('Error notifying users of service issue:', error);
    }
  }

  /**
   * Notify users of service resumption
   */
  private async notifyUsersOfServiceResumption(): Promise<void> {
    try {
      const userIds = Array.from(this.userPortfolios.keys());
      
      for (const userId of userIds) {
        const notification = {
          id: `service_resumed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          title: 'Stock Monitoring Service Resumed',
          message: 'Live stock price updates have resumed. All monitoring features are now active.',
          type: 'SUCCESS' as const,
          timestamp: new Date(),
          isRead: false,
          isPush: true
        };
        
        await notificationDB.addNotification(notification);
      }
      
      console.log(`Notified ${userIds.length} users of service resumption`);
      
    } catch (error) {
      console.error('Error notifying users of service resumption:', error);
    }
  }

  /**
   * Get scheduler status
   */
  public getStatus(): {
    isRunning: boolean;
    config: SchedulerConfig;
    activeUsers: number;
    monitoredTickers: number;
    activeTasks: string[];
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      activeUsers: this.userPortfolios.size,
      monitoredTickers: this.getAllMonitoredTickers().length,
      activeTasks: Array.from(this.tasks.keys())
    };
  }

  /**
   * Update scheduler configuration
   */
  public updateConfig(newConfig: Partial<SchedulerConfig>): void {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning && newConfig.enableScheduling !== false) {
      this.start();
    }
    
    console.log('Scheduler configuration updated:', this.config);
  }

  /**
   * Force price check for specific tickers
   */
  public async forcePriceCheck(tickers: string[]): Promise<void> {
    console.log(`Force checking prices for: ${tickers.join(', ')}`);
    
    try {
      await finnhubService.getBatchQuotes(tickers);
      console.log('Force price check completed');
    } catch (error) {
      console.error('Error during force price check:', error);
      throw error;
    }
  }

  /**
   * Get monitoring statistics
   */
  public getStats(): {
    totalUsers: number;
    totalTickers: number;
    tickersByUser: Map<string, string[]>;
    lastPriceCheck: Date | null;
    nextPriceCheck: Date | null;
  } {
    const priceTask = this.tasks.get('price-check');
    
    return {
      totalUsers: this.userPortfolios.size,
      totalTickers: this.getAllMonitoredTickers().length,
      tickersByUser: new Map(this.userPortfolios),
      lastPriceCheck: priceTask ? new Date() : null, // This would need to be tracked properly
      nextPriceCheck: priceTask ? new Date(Date.now() + 30000) : null // Estimated based on 30s interval
    };
  }
}

// Global singleton guard
const globalAny = global as any;
if (!globalAny.__STOCK_SCHEDULER_SINGLETON__) {
  globalAny.__STOCK_SCHEDULER_SINGLETON__ = { instance: new StockPriceScheduler() };
}
export const stockPriceScheduler = globalAny.__STOCK_SCHEDULER_SINGLETON__.instance as StockPriceScheduler;

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  stockPriceScheduler.start();
  console.log('Stock price scheduler auto-started in production mode');
}

export default StockPriceScheduler;

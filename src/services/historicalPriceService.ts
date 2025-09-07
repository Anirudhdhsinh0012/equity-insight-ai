/**
 * Historical Price Service for Date/Time-Based Stock Monitoring
 * Fetches historical prices and manages position-based alerts
 */

import { HistoricalPriceRequest, HistoricalPriceData, StockPosition, PositionAlert, DateTimeCandle } from '@/types';

interface FinnhubCandleResponse {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  t: number[]; // Timestamps
  v: number[]; // Volumes
  s: string;   // Status
}

class HistoricalPriceService {
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';
  private positionsCache = new Map<string, StockPosition>();
  private alertsCache = new Map<string, PositionAlert[]>();

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || 'd2ojf0pr01qga5g9iob0d2ojf0pr01qga5g9iobg';
  }

  /**
   * Fetch historical price for a specific date and time
   */
  public async getHistoricalPrice(request: HistoricalPriceRequest): Promise<HistoricalPriceData | null> {
    try {
      const { ticker, date, time, quantity } = request;
      
      // Validate inputs
      if (!ticker || !date || !time || quantity <= 0) {
        throw new Error('Invalid request parameters');
      }

      // Parse the requested date and time
      const requestedDateTime = this.parseDateTime(date, time);
      
      // Calculate the date range for API query (get data for the whole day)
      const startOfDay = new Date(requestedDateTime);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(requestedDateTime);
      endOfDay.setHours(23, 59, 59, 999);

      // Convert to Unix timestamps
      const from = Math.floor(startOfDay.getTime() / 1000);
      const to = Math.floor(endOfDay.getTime() / 1000);

      // Fetch candle data from Finnhub
      const candleData = await this.fetchCandleData(ticker, from, to, 'D'); // Daily resolution

      if (!candleData || candleData.s !== 'ok' || !candleData.c || candleData.c.length === 0) {
        // Try with different resolution or previous trading day
        return await this.fallbackHistoricalPrice(request, requestedDateTime);
      }

      // Find the closest price to the requested time
      const closestCandle = this.findClosestCandle(candleData, requestedDateTime);
      
      if (!closestCandle) {
        throw new Error('No historical data available for the requested date');
      }

      const price = closestCandle.close;
      const totalValue = price * quantity;

      const historicalData: HistoricalPriceData = {
        ticker,
        requestedDateTime,
        actualDateTime: new Date(closestCandle.timestamp * 1000),
        price,
        quantity,
        totalValue,
        volume: closestCandle.volume,
        high: closestCandle.high,
        low: closestCandle.low,
        open: closestCandle.open,
        close: closestCandle.close
      };

      return historicalData;

    } catch (error) {
      console.error('Error fetching historical price:', error);
      return null;
    }
  }

  /**
   * Fetch candle data from Finnhub API
   */
  private async fetchCandleData(
    ticker: string, 
    from: number, 
    to: number, 
    resolution: string = 'D'
  ): Promise<FinnhubCandleResponse | null> {
    try {
      const url = `${this.baseUrl}/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API rate limit exceeded');
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: FinnhubCandleResponse = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching candle data:', error);
      return null;
    }
  }

  /**
   * Parse date and time strings into a Date object
   */
  private parseDateTime(date: string, time: string): Date {
    // Expected format: date = "2024-08-29", time = "14:30"
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create date in local timezone
    const dateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    if (isNaN(dateTime.getTime())) {
      throw new Error('Invalid date or time format');
    }
    
    return dateTime;
  }

  /**
   * Find the closest candle to the requested time
   */
  private findClosestCandle(candleData: FinnhubCandleResponse, targetDateTime: Date): DateTimeCandle | null {
    const targetTimestamp = Math.floor(targetDateTime.getTime() / 1000);
    
    let closestIndex = 0;
    let closestDiff = Math.abs(candleData.t[0] - targetTimestamp);
    
    for (let i = 1; i < candleData.t.length; i++) {
      const diff = Math.abs(candleData.t[i] - targetTimestamp);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    
    return {
      timestamp: candleData.t[closestIndex],
      open: candleData.o[closestIndex],
      high: candleData.h[closestIndex],
      low: candleData.l[closestIndex],
      close: candleData.c[closestIndex],
      volume: candleData.v[closestIndex]
    };
  }

  /**
   * Fallback method for historical price when primary method fails
   */
  private async fallbackHistoricalPrice(
    request: HistoricalPriceRequest, 
    requestedDateTime: Date
  ): Promise<HistoricalPriceData | null> {
    try {
      // Try previous trading days (up to 7 days back)
      for (let daysBack = 1; daysBack <= 7; daysBack++) {
        const fallbackDate = new Date(requestedDateTime);
        fallbackDate.setDate(fallbackDate.getDate() - daysBack);
        
        const from = Math.floor(fallbackDate.getTime() / 1000);
        const to = from + 86400; // 24 hours
        
        const candleData = await this.fetchCandleData(request.ticker, from, to, 'D');
        
        if (candleData && candleData.s === 'ok' && candleData.c && candleData.c.length > 0) {
          const price = candleData.c[candleData.c.length - 1]; // Last available price
          const totalValue = price * request.quantity;
          
          return {
            ticker: request.ticker,
            requestedDateTime,
            actualDateTime: new Date(candleData.t[candleData.t.length - 1] * 1000),
            price,
            quantity: request.quantity,
            totalValue,
            volume: candleData.v[candleData.v.length - 1],
            high: candleData.h[candleData.h.length - 1],
            low: candleData.l[candleData.l.length - 1],
            open: candleData.o[candleData.o.length - 1],
            close: candleData.c[candleData.c.length - 1]
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Fallback historical price failed:', error);
      return null;
    }
  }

  /**
   * Create a stock position with historical reference price
   */
  public async createStockPosition(
    userId: string,
    historicalData: HistoricalPriceData,
    upperThreshold?: number,
    lowerThreshold?: number
  ): Promise<StockPosition> {
    const position: StockPosition = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      ticker: historicalData.ticker,
      referenceDate: historicalData.actualDateTime,
      referencePrice: historicalData.price,
      quantity: historicalData.quantity,
      totalValue: historicalData.totalValue,
      upperThreshold,
      lowerThreshold,
      isMonitoring: true,
      createdAt: new Date(),
      alerts: []
    };

    // Cache the position
    this.positionsCache.set(position.id, position);
    
    // Save to database (you might want to implement this based on your DB choice)
    await this.savePositionToDatabase(position);
    
    return position;
  }

  /**
   * Get user's stock positions
   */
  public getUserPositions(userId: string): StockPosition[] {
    const userPositions: StockPosition[] = [];
    
    this.positionsCache.forEach(position => {
      if (position.userId === userId) {
        userPositions.push(position);
      }
    });
    
    return userPositions;
  }

  /**
   * Update position thresholds
   */
  public async updatePositionThresholds(
    positionId: string,
    upperThreshold?: number,
    lowerThreshold?: number
  ): Promise<boolean> {
    const position = this.positionsCache.get(positionId);
    
    if (!position) {
      return false;
    }
    
    position.upperThreshold = upperThreshold;
    position.lowerThreshold = lowerThreshold;
    position.lastChecked = new Date();
    
    // Update in database
    await this.savePositionToDatabase(position);
    
    return true;
  }

  /**
   * Check position alerts against current prices
   */
  public async checkPositionAlerts(positions: StockPosition[], currentPrices: Map<string, number>): Promise<PositionAlert[]> {
    const newAlerts: PositionAlert[] = [];
    
    for (const position of positions) {
      if (!position.isMonitoring) continue;
      
      const currentPrice = currentPrices.get(position.ticker);
      if (!currentPrice) continue;
      
      // Check upper threshold breach
      if (position.upperThreshold && currentPrice >= position.upperThreshold) {
        const alert = await this.createPositionAlert(
          position,
          'UPPER_BREACH',
          currentPrice,
          position.upperThreshold
        );
        newAlerts.push(alert);
      }
      
      // Check lower threshold breach
      if (position.lowerThreshold && currentPrice <= position.lowerThreshold) {
        const alert = await this.createPositionAlert(
          position,
          'LOWER_BREACH',
          currentPrice,
          position.lowerThreshold
        );
        newAlerts.push(alert);
      }
      
      // Update last checked time
      position.lastChecked = new Date();
    }
    
    return newAlerts;
  }

  /**
   * Create a position alert
   */
  private async createPositionAlert(
    position: StockPosition,
    alertType: 'UPPER_BREACH' | 'LOWER_BREACH',
    triggerPrice: number,
    threshold: number
  ): Promise<PositionAlert> {
    const alert: PositionAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      positionId: position.id,
      userId: position.userId,
      ticker: position.ticker,
      alertType,
      triggerPrice,
      referencePrice: position.referencePrice,
      threshold,
      triggeredAt: new Date(),
      isRead: false,
      notificationSent: false
    };
    
    // Add to position alerts
    position.alerts.push(alert);
    
    // Cache the alert
    const userAlerts = this.alertsCache.get(position.userId) || [];
    userAlerts.push(alert);
    this.alertsCache.set(position.userId, userAlerts);
    
    // Save to database
    await this.saveAlertToDatabase(alert);
    
    // Send notification
    await this.sendPositionAlert(alert);
    
    return alert;
  }

  /**
   * Send position alert notification
   */
  private async sendPositionAlert(alert: PositionAlert): Promise<void> {
    try {
      // Import notification service dynamically
      const { notificationDB } = await import('./notificationDatabase');
      
      const notification = {
        id: `pos_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: alert.userId,
        title: `Position Alert: ${alert.ticker}`,
        message: this.generateAlertMessage(alert),
        type: 'ALERT' as const,
        ticker: alert.ticker,
        currentPrice: alert.triggerPrice,
        targetPrice: alert.threshold,
        timestamp: new Date(),
        isRead: false,
        isPush: true,
        isWhatsApp: true
      };

      await notificationDB.addNotification(notification);
      
      // Send WhatsApp notification
      try {
        const { whatsAppService } = await import('./whatsappService');
        // You'll need to implement a position alert method in WhatsApp service
        // await whatsAppService.sendPositionAlert(alert);
      } catch (error) {
        console.error('Failed to send WhatsApp position alert:', error);
      }

      alert.notificationSent = true;
      
    } catch (error) {
      console.error('Failed to send position alert:', error);
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(alert: PositionAlert): string {
    const direction = alert.alertType === 'UPPER_BREACH' ? 'above' : 'below';
    const thresholdText = alert.alertType === 'UPPER_BREACH' ? 'upper' : 'lower';
    
    return `${alert.ticker} is now ${direction} your ${thresholdText} threshold!\n` +
           `Current Price: $${alert.triggerPrice.toFixed(2)}\n` +
           `Threshold: $${alert.threshold.toFixed(2)}\n` +
           `Reference Price: $${alert.referencePrice.toFixed(2)}`;
  }

  /**
   * Get position alerts for user
   */
  public getUserAlerts(userId: string): PositionAlert[] {
    return this.alertsCache.get(userId) || [];
  }

  /**
   * Mark alert as read
   */
  public async markAlertAsRead(alertId: string): Promise<boolean> {
    for (const [userId, alerts] of this.alertsCache.entries()) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.isRead = true;
        await this.saveAlertToDatabase(alert);
        return true;
      }
    }
    return false;
  }

  /**
   * Delete a position
   */
  public async deletePosition(positionId: string): Promise<boolean> {
    const position = this.positionsCache.get(positionId);
    if (!position) return false;
    
    this.positionsCache.delete(positionId);
    
    // Remove from database
    await this.deletePositionFromDatabase(positionId);
    
    return true;
  }

  /**
   * Validate date and time input
   */
  public validateDateTime(date: string, time: string): { isValid: boolean; error?: string } {
    try {
      const dateTime = this.parseDateTime(date, time);
      const now = new Date();
      
      if (dateTime > now) {
        return { isValid: false, error: 'Cannot fetch future prices' };
      }
      
      // Check if date is too far in the past (Finnhub limitations)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);
      
      if (dateTime < twoYearsAgo) {
        return { isValid: false, error: 'Historical data only available for the last 2 years' };
      }
      
      return { isValid: true };
      
    } catch (error) {
      return { isValid: false, error: 'Invalid date or time format' };
    }
  }

  /**
   * Database operations (implement based on your database choice)
   */
  private async savePositionToDatabase(position: StockPosition): Promise<void> {
    // Implement based on your database choice (IndexedDB, PostgreSQL, etc.)
    console.log('Saving position to database:', position.id);
  }

  private async saveAlertToDatabase(alert: PositionAlert): Promise<void> {
    // Implement based on your database choice
    console.log('Saving alert to database:', alert.id);
  }

  private async deletePositionFromDatabase(positionId: string): Promise<void> {
    // Implement based on your database choice
    console.log('Deleting position from database:', positionId);
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    totalPositions: number;
    activePositions: number;
    totalAlerts: number;
    unreadAlerts: number;
  } {
    const totalPositions = this.positionsCache.size;
    const activePositions = Array.from(this.positionsCache.values()).filter(p => p.isMonitoring).length;
    const allAlerts = Array.from(this.alertsCache.values()).flat();
    const totalAlerts = allAlerts.length;
    const unreadAlerts = allAlerts.filter(a => !a.isRead).length;
    
    return {
      totalPositions,
      activePositions,
      totalAlerts,
      unreadAlerts
    };
  }
}

// Singleton instance
export const historicalPriceService = new HistoricalPriceService();
export default HistoricalPriceService;

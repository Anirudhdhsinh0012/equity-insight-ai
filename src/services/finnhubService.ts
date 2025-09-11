/**
 * Finnhub Real-Time Stock Market API Service
 * Handles real-time price updates, user alerts, and API quota management
 */

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

interface FinnhubApiStatus {
  quotaUsed: number;
  quotaLimit: number;
  quotaRemaining: number;
  resetTime: Date;
  isLimitReached: boolean;
  lastUpdated: Date;
}

interface PriceAlert {
  id: string;
  userId: string;
  ticker: string;
  upperThreshold?: number;
  lowerThreshold?: number;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

interface RealtimePrice {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
  volume?: number;
}

class FinnhubService {
  private apiKey: string;
  private webhookSecurity: string;
  private baseUrl = 'https://finnhub.io/api/v1';
  private wsUrl = 'wss://ws.finnhub.io';
  private apiStatus: FinnhubApiStatus;
  private priceCache = new Map<string, RealtimePrice>();
  private userAlerts = new Map<string, PriceAlert[]>();
  private rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private websocket: WebSocket | null = null;
  private subscribedTickers = new Set<string>();
  private lastWsLog: { [key: string]: number } = {};

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || '';
  this.webhookSecurity = process.env.WEBHOOK_SECURITY || '';
    
    // Debug logging for API key configuration
    console.log('🔑 Finnhub API Key configured:', this.apiKey ? 'YES' : 'NO');
    console.log('🔑 API Key length:', this.apiKey?.length || 0);
    console.log('🔑 API Key starts with:', this.apiKey?.substring(0, 8) + '...');
    console.log('🔑 Environment FINNHUB_API_KEY exists:', !!process.env.FINNHUB_API_KEY);
    
    if (!this.apiKey) {
      console.warn('⚠️ FINNHUB_API_KEY not found in environment variables!');
      console.warn('⚠️ Service will run in demo mode with simulated data');
      console.warn('⚠️ Add your Finnhub API key to .env.local for real data');
    } else {
      console.log('✅ Finnhub API key loaded successfully');
    }
    
    this.apiStatus = {
      quotaUsed: 0,
      quotaLimit: 60, // Free tier: 60 calls/minute
      quotaRemaining: 60,
      resetTime: new Date(Date.now() + 60000), // Reset every minute
      isLimitReached: false,
      lastUpdated: new Date()
    };

    this.initializeWebSocket();
    this.startQueueProcessor();
  }

  /**
   * Initialize WebSocket connection for real-time data
   */
  private initializeWebSocket(): void {
    try {
      // Don't initialize if API key is missing or invalid
      if (!this.apiKey || this.apiKey === 'your_finnhub_api_key_here') {
        this.logOnce('ws-missing-key', 'Finnhub WebSocket not initialized: API key not configured, using demo data mode');
        return;
      }

      this.websocket = new WebSocket(`${this.wsUrl}?token=${this.apiKey}`);
      
      this.websocket.onopen = () => {
        this.logOnce('ws-connected', 'Finnhub WebSocket connected');
        // Subscribe to all tickers that users are tracking
        this.resubscribeToTickers();
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'trade') {
            this.handleRealtimeUpdate(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        if (event.code === 1006 || event.code === 1011 || event.code === 1002) {
          this.logOnce('ws-perm-close', 'Finnhub WebSocket disconnected (likely API key issue or plan limitation), using demo data mode');
          // Don't try to reconnect if it's an auth/permission issue
          return;
        }
        this.logOnce('ws-temp-close', 'Finnhub WebSocket disconnected, reconnecting in 5 seconds...');
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.websocket.onerror = () => {
        this.logOnce('ws-error', 'Finnhub WebSocket error (likely API key not configured or insufficient permissions), using demo data');
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Handle real-time price updates from WebSocket
   */
  private handleRealtimeUpdate(data: any): void {
    if (!data.data || !Array.isArray(data.data)) return;

    data.data.forEach((trade: any) => {
      const ticker = trade.s;
      const price = trade.p;
      const timestamp = new Date(trade.t);
      const volume = trade.v;

      // Update price cache
      const existingPrice = this.priceCache.get(ticker);
      if (existingPrice) {
        const change = price - existingPrice.previousClose;
        const changePercent = (change / existingPrice.previousClose) * 100;

        const updatedPrice: RealtimePrice = {
          ...existingPrice,
          currentPrice: price,
          change,
          changePercent,
          timestamp,
          volume
        };

        this.priceCache.set(ticker, updatedPrice);
        this.checkUserAlerts(ticker, price);

        // Broadcast to connected clients
        this.broadcastPriceUpdate({
          ticker,
          price,
          change,
          changePercent,
          timestamp: timestamp.getTime(),
          volume
        });
      }
    });
  }

  /**
   * Broadcast price update to WebSocket clients
   */
  private broadcastPriceUpdate(update: {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    timestamp: number;
    volume?: number;
  }): void {
    // This will be called by the Socket.IO server
    if (global.socketIOServer) {
      const subscribers = global.tickerSubscribers?.get(update.ticker);
      if (subscribers && subscribers.size > 0) {
        subscribers.forEach((socketId: string) => {
          global.socketIOServer.to(socketId).emit('priceUpdate', update);
        });
      }
    }
  }

  /**
   * Subscribe to real-time updates for a ticker
   */
  public subscribeToTicker(ticker: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'subscribe',
        symbol: ticker
      }));
      this.subscribedTickers.add(ticker);
    }
  }

  /**
   * Unsubscribe from real-time updates for a ticker
   */
  public unsubscribeFromTicker(ticker: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'unsubscribe',
        symbol: ticker
      }));
      this.subscribedTickers.delete(ticker);
    }
  }

  /**
   * Resubscribe to all tickers after WebSocket reconnection
   */
  private resubscribeToTickers(): void {
    this.subscribedTickers.forEach(ticker => {
      this.subscribeToTicker(ticker);
    });
  }

  /**
   * Rate-limited API request queue processor
   */
  private async startQueueProcessor(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (true) {
      if (this.requestQueue.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      if (this.apiStatus.isLimitReached) {
        const now = new Date();
        if (now < this.apiStatus.resetTime) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        } else {
          this.resetApiQuota();
        }
      }

      const request = this.requestQueue.shift();
      if (request) {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
          await new Promise(resolve => 
            setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
          );
        }

        try {
          await request();
          this.updateApiQuota();
        } catch (error) {
          console.error('API request failed:', error);
        }

        this.lastRequestTime = Date.now();
      }
    }
  }

  /**
   * Add request to rate-limited queue
   */
  private queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Update API quota tracking
   */
  private updateApiQuota(): void {
    this.apiStatus.quotaUsed++;
    this.apiStatus.quotaRemaining--;
    this.apiStatus.lastUpdated = new Date();

    if (this.apiStatus.quotaRemaining <= 0) {
      this.apiStatus.isLimitReached = true;
      this.apiStatus.resetTime = new Date(Date.now() + 60000); // Reset in 1 minute
    }
  }

  /**
   * Reset API quota (called when rate limit window resets)
   */
  private resetApiQuota(): void {
    this.apiStatus.quotaUsed = 0;
    this.apiStatus.quotaRemaining = this.apiStatus.quotaLimit;
    this.apiStatus.isLimitReached = false;
    this.apiStatus.resetTime = new Date(Date.now() + 60000);
    this.apiStatus.lastUpdated = new Date();
  }

  /**
   * Fetch current quote for a single ticker
   */
  public async getCurrentQuote(ticker: string): Promise<RealtimePrice | null> {
    // Check cache first
    const cached = this.priceCache.get(ticker);
    if (cached && Date.now() - cached.timestamp.getTime() < 30000) { // 30 second cache
      return cached;
    }

    // If no API key, return demo data immediately
    if (!this.apiKey) {
      console.log(`🎭 No API key configured, using demo data for ${ticker}`);
      return this.getDemoQuoteData(ticker);
    }

    return this.queueRequest(async () => {
      try {
        console.log(`📊 Fetching real-time data for ${ticker} from Finnhub API...`);
        console.log(`🔗 API URL: ${this.baseUrl}/quote?symbol=${ticker}&token=${this.apiKey.substring(0, 8)}...`);
        
        const response = await fetch(
          `${this.baseUrl}/quote?symbol=${ticker}&token=${this.apiKey}`
        );

        console.log(`📈 Finnhub API Response for ${ticker}:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          if (response.status === 429) {
            this.apiStatus.isLimitReached = true;
            console.log(`⚠️ Finnhub rate limit exceeded for ${ticker}`);
            throw new Error('API rate limit exceeded');
          }
          if (response.status === 401) {
            // Return demo data for unauthorized access
            console.log(`❌ Finnhub API key unauthorized, using demo data for ${ticker}`);
            return this.getDemoQuoteData(ticker);
          }
          console.log(`❌ Finnhub API error ${response.status} for ${ticker}, using demo data`);
          return this.getDemoQuoteData(ticker);
        }

        const data: FinnhubQuote = await response.json();
        
        // Validate that we received real data (not empty or invalid response)
        if (!data || data.c === undefined || data.c === null || data.c === 0) {
          console.log(`⚠️ Invalid/empty data received for ${ticker}, might be unsupported symbol or sandbox data`);
          console.log('📊 Response data:', data);
          
          // Instead of throwing an error, generate fallback demo data for unsupported symbols
          console.log(`🎭 Generating fallback demo data for unsupported symbol: ${ticker}`);
          console.log(`💡 Note: ${ticker} may not be supported by Finnhub US market API`);
          
          return this.getDemoQuoteData(ticker);
        }
        
        console.log(`✅ REAL Finnhub data confirmed for ${ticker}:`, {
          currentPrice: data.c,
          change: data.d,
          changePercent: data.dp,
          source: '🔴 LIVE_FINNHUB_API',
          timestamp: new Date(data.t * 1000).toISOString(),
          dataQuality: 'VERIFIED_REAL'
        });
        
        const priceData: RealtimePrice = {
          ticker,
          currentPrice: data.c,
          change: data.d,
          changePercent: data.dp,
          high: data.h,
          low: data.l,
          open: data.o,
          previousClose: data.pc,
          timestamp: new Date(data.t * 1000)
        };

        this.priceCache.set(ticker, priceData);
        this.checkUserAlerts(ticker, data.c);
        
        return priceData;
      } catch (error) {
        console.error(`Failed to fetch quote for ${ticker}:`, error);
        return null;
      }
    });
  }

  /**
   * Fetch quotes for multiple tickers in batch
   */
  public async getBatchQuotes(tickers: string[]): Promise<Map<string, RealtimePrice>> {
    const results = new Map<string, RealtimePrice>();
    
    // Process in batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      const batchPromises = batch.map(ticker => this.getCurrentQuote(ticker));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batch.forEach((ticker, index) => {
        const result = batchResults[index];
        if (result.status === 'fulfilled' && result.value) {
          results.set(ticker, result.value);
        }
      });

      // Small delay between batches
      if (i + batchSize < tickers.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  /**
   * Add price alert for a user
   */
  public addPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): string {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAlert: PriceAlert = {
      ...alert,
      id: alertId,
      createdAt: new Date()
    };

    const userAlerts = this.userAlerts.get(alert.userId) || [];
    userAlerts.push(newAlert);
    this.userAlerts.set(alert.userId, userAlerts);

    // Subscribe to real-time updates for this ticker
    this.subscribeToTicker(alert.ticker);

    return alertId;
  }

  /**
   * Remove price alert
   */
  public removePriceAlert(userId: string, alertId: string): boolean {
    const userAlerts = this.userAlerts.get(userId) || [];
    const alertIndex = userAlerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex !== -1) {
      const removedAlert = userAlerts.splice(alertIndex, 1)[0];
      this.userAlerts.set(userId, userAlerts);
      
      // Check if any other users are tracking this ticker
      const stillTracked = Array.from(this.userAlerts.values())
        .flat()
        .some(alert => alert.ticker === removedAlert.ticker && alert.isActive);
      
      if (!stillTracked) {
        this.unsubscribeFromTicker(removedAlert.ticker);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Get user's price alerts
   */
  public getUserAlerts(userId: string): PriceAlert[] {
    return this.userAlerts.get(userId) || [];
  }

  /**
   * Check if current price triggers any user alerts
   */
  private async checkUserAlerts(ticker: string, currentPrice: number): Promise<void> {
    const allAlerts = Array.from(this.userAlerts.entries());
    
    for (const [userId, alerts] of allAlerts) {
      const relevantAlerts = alerts.filter(
        alert => alert.ticker === ticker && alert.isActive
      );

      for (const alert of relevantAlerts) {
        let shouldTrigger = false;
        let alertType = '';

        if (alert.upperThreshold && currentPrice >= alert.upperThreshold) {
          shouldTrigger = true;
          alertType = 'ABOVE';
        } else if (alert.lowerThreshold && currentPrice <= alert.lowerThreshold) {
          shouldTrigger = true;
          alertType = 'BELOW';
        }

        if (shouldTrigger) {
          // Prevent duplicate alerts (only trigger once per hour)
          const now = new Date();
          if (alert.lastTriggered && 
              now.getTime() - alert.lastTriggered.getTime() < 3600000) {
            continue;
          }

          alert.lastTriggered = now;
          await this.triggerPriceAlert(userId, alert, currentPrice, alertType);
        }
      }
    }
  }

  /**
   * Trigger price alert and send notification
   */
  private async triggerPriceAlert(
    userId: string, 
    alert: PriceAlert, 
    currentPrice: number, 
    alertType: string
  ): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependencies
      const { notificationDB } = await import('./notificationDatabase');
      
      const notification = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: `Price Alert: ${alert.ticker}`,
        message: `${alert.ticker} is now ${alertType} your threshold at $${currentPrice.toFixed(2)}`,
        type: 'ALERT' as const,
        ticker: alert.ticker,
        currentPrice,
        targetPrice: alertType === 'ABOVE' ? alert.upperThreshold : alert.lowerThreshold,
        timestamp: new Date(),
        isRead: false,
        isPush: true,
        isWhatsApp: true
      };

      await notificationDB.addNotification(notification);
      
      // Send WhatsApp notification if enabled
      try {
        const { whatsAppService } = await import('./whatsappService');
        // Create a temporary StockAlert object for the WhatsApp service
        const stockAlert = {
          id: alert.id,
          userId,
          ticker: alert.ticker,
          type: alertType === 'ABOVE' ? 'ABOVE' as const : 'BELOW' as const,
          targetPrice: alertType === 'ABOVE' ? (alert.upperThreshold || currentPrice) : (alert.lowerThreshold || currentPrice),
          isActive: true,
          createdAt: alert.createdAt,
          triggeredAt: new Date()
        };
        
        // Get user's phone number from notification settings
        const settings = await notificationDB.getNotificationSettings(userId);
        if (settings?.enableWhatsAppNotifications) {
          // For now, we'll need to get phone number from user data
          // This would typically come from your user management system
          const phoneNumber = '+1234567890'; // Replace with actual user phone lookup
          await whatsAppService.sendPriceAlert(stockAlert, currentPrice, userId, phoneNumber);
        }
      } catch (error) {
        console.error('Failed to send WhatsApp alert:', error);
      }

    } catch (error) {
      console.error('Failed to trigger price alert:', error);
    }
  }

  /**
   * Test API key and verify it returns real data
   */
  public async testApiKey(): Promise<{ success: boolean; message: string; isReal: boolean }> {
    try {
      console.log('🧪 Testing Finnhub API key...');
      const testTicker = 'AAPL';
      
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${testTicker}&token=${this.apiKey}`
      );

      if (!response.ok) {
        return {
          success: false,
          message: `API key test failed: ${response.status} ${response.statusText}`,
          isReal: false
        };
      }

      const data: FinnhubQuote = await response.json();
      
      // Check if we got real data
      const hasValidData = data && data.c !== undefined && data.c !== null && data.c > 0;
      
      if (!hasValidData) {
        return {
          success: false,
          message: 'API key valid but returning empty/invalid data (might be sandbox)',
          isReal: false
        };
      }

      console.log('✅ API key test successful - receiving real data');
      return {
        success: true,
        message: `API key working! Current AAPL price: $${data.c}`,
        isReal: true
      };
    } catch (error) {
      console.error('❌ API key test failed:', error);
      return {
        success: false,
        message: `API key test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isReal: false
      };
    }
  }

  /**
   * Get current API status and quota information
   */
  public getApiStatus(): FinnhubApiStatus {
    return { ...this.apiStatus };
  }

  /**
   * Get cached prices for multiple tickers
   */
  public getCachedPrices(tickers: string[]): Map<string, RealtimePrice> {
    const results = new Map<string, RealtimePrice>();
    
    tickers.forEach(ticker => {
      const cached = this.priceCache.get(ticker);
      if (cached) {
        results.set(ticker, cached);
      }
    });

    return results;
  }

  /**
   * Start monitoring prices for user's portfolio
   */
  public async startMonitoring(userId: string, tickers: string[]): Promise<void> {
    // Subscribe to real-time updates
    tickers.forEach(ticker => this.subscribeToTicker(ticker));
    
    // Fetch initial prices
    await this.getBatchQuotes(tickers);
  }

  /**
   * Stop monitoring prices for user
   */
  public stopMonitoring(userId: string): void {
    const userAlerts = this.userAlerts.get(userId) || [];
    
    // Remove user's alerts
    this.userAlerts.delete(userId);
    
    // Check which tickers are no longer needed
    const stillNeededTickers = new Set<string>();
    Array.from(this.userAlerts.values())
      .flat()
      .forEach(alert => stillNeededTickers.add(alert.ticker));
    
    // Unsubscribe from tickers no longer needed
    userAlerts.forEach(alert => {
      if (!stillNeededTickers.has(alert.ticker)) {
        this.unsubscribeFromTicker(alert.ticker);
      }
    });
  }

  /**
   * Health check for the service
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    apiQuota: FinnhubApiStatus;
    websocketConnected: boolean;
    cacheSize: number;
  }> {
    const wsConnected = this.websocket?.readyState === WebSocket.OPEN;
    const quotaHealthy = !this.apiStatus.isLimitReached;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!wsConnected && !quotaHealthy) {
      status = 'unhealthy';
    } else if (!wsConnected || !quotaHealthy) {
      status = 'degraded';
    }

    return {
      status,
      apiQuota: this.getApiStatus(),
      websocketConnected: wsConnected,
      cacheSize: this.priceCache.size
    };
  }

  /**
   * Generate demo quote data for when API key is not configured
   */
  private getDemoQuoteData(ticker: string): RealtimePrice {
    console.log(`🎭 Using DEMO DATA for ${ticker} (${ticker === 'FINNIFTY' ? 'Unsupported symbol - using fallback data' : 'API not available'})`);
    
    // Demo data for popular stocks
    const demoData: Record<string, { basePrice: number; change: number }> = {
      'AAPL': { basePrice: 185.50, change: 2.25 },
      'GOOGL': { basePrice: 135.20, change: -1.80 },
      'MSFT': { basePrice: 410.75, change: 5.40 },
      'AMZN': { basePrice: 145.30, change: 1.95 },
      'TSLA': { basePrice: 220.85, change: -8.30 },
      'META': { basePrice: 315.60, change: 4.20 },
      'NVDA': { basePrice: 485.25, change: 12.75 },
      'NFLX': { basePrice: 425.40, change: -2.15 },
      'AMD': { basePrice: 115.80, change: 3.60 },
      'INTC': { basePrice: 35.90, change: -0.85 },
      'FINNIFTY': { basePrice: 23500.00, change: -125.50 } // Indian market index fallback
    };

    const data = demoData[ticker] || { basePrice: 100.00, change: 0.00 };
    
    // Add some random variation to make it look realistic
    const randomVariation = (Math.random() - 0.5) * 2; // -1 to +1
    const currentPrice = data.basePrice + randomVariation;
    const change = data.change + (randomVariation * 0.1);
    const changePercent = (change / (currentPrice - change)) * 100;

    return {
      ticker,
      currentPrice: Number(currentPrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      previousClose: Number((currentPrice - change).toFixed(2)),
      open: Number((currentPrice - change + (Math.random() - 0.5)).toFixed(2)),
      high: Number((currentPrice + Math.abs(change) + Math.random() * 2).toFixed(2)),
      low: Number((currentPrice - Math.abs(change) - Math.random() * 2).toFixed(2)),
      timestamp: new Date()
    };
  }

  private logOnce(key: string, message: string, throttleMs = 10000) {
    const now = Date.now();
    if (!this.lastWsLog[key] || now - this.lastWsLog[key] > throttleMs) {
      this.lastWsLog[key] = now;
      console.log(message);
    }
  }
}

// Singleton instance
export const finnhubService = new FinnhubService();

// Make available globally for WebSocket server
declare global {
  var finnhubService: FinnhubService;
  var socketIOServer: any;
  var tickerSubscribers: Map<string, Set<string>>;
}

if (typeof global !== 'undefined') {
  global.finnhubService = finnhubService;
}

export type { RealtimePrice, PriceAlert, FinnhubApiStatus };
export default finnhubService;

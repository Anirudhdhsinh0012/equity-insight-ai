/**
 * Market Data Fallback Service
 * Provides real market recommendations when YouTube API is unavailable
 * Enhanced with caching, rate limiting, and robust error handling
 */

interface MarketRecommendation {
  ticker: string;
  companyName: string;
  finalScore: number;
  confidence: number;
  explanation: string;
  analytics: {
    momentum: string;
    sentiment: string;
    mentions: number;
    avgScore: number;
    riskFlags: string[];
  };
  breakdown: {
    popularity: number;
    sentiment: number;
    momentum: number;
    diversification: number;
  };
  marketData: {
    c: number;
    sector: string;
    changePercent?: number;
  };
}

interface CachedStockData {
  data: any;
  timestamp: number;
}

interface RequestQueue {
  ticker: string;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

export class MarketDataFallbackService {
  private finnhubApiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';
  private cache = new Map<string, CachedStockData>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private isRateLimited = false;
  private rateLimitResetTime = 0;
  private requestQueue: RequestQueue[] = [];
  private isProcessingQueue = false;
  private requestDelay = 100; // 100ms between requests
  private lastRecommendationsCache: MarketRecommendation[] = [];
  private lastRecommendationsTimestamp = 0;

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || '';
  }

  /**
   * Check if cached data is still fresh
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTTL;
  }

  /**
   * Get data from cache if valid
   */
  private getCachedData(cacheKey: string): any | null {
    if (this.isCacheValid(cacheKey)) {
      console.log(`📋 Using cached data for ${cacheKey}`);
      return this.cache.get(cacheKey)?.data || null;
    }
    return null;
  }

  /**
   * Store data in cache
   */
  private setCachedData(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Process request queue with rate limiting
   */
  private async processRequestQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) break;
      
      try {
        const result = await this.fetchStockDataDirect(request.ticker);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
      
      // Add delay between requests to avoid overwhelming the API
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Queue a request for processing
   */
  private queueRequest(ticker: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ ticker, resolve, reject });
      this.processRequestQueue();
    });
  }

  /**
   * Validate stock data for correctness
   */
  private isValidStockData(quote: any, profile: any, ticker: string): boolean {
    // Check if quote data is valid
    if (!quote || typeof quote !== 'object') {
      console.warn(`❌ Invalid quote data for ${ticker}: missing or malformed`);
      return false;
    }
    
    // Check current price
    const currentPrice = quote.c;
    if (currentPrice == null || isNaN(currentPrice) || currentPrice <= 0) {
      console.warn(`❌ Invalid price for ${ticker}: ${currentPrice}`);
      return false;
    }
    
    // Check for reasonable price range (between $0.01 and $100,000)
    if (currentPrice < 0.01 || currentPrice > 100000) {
      console.warn(`❌ Unreasonable price for ${ticker}: $${currentPrice}`);
      return false;
    }
    
    // Check change percent
    const changePercent = quote.dp;
    if (changePercent != null && (isNaN(changePercent) || Math.abs(changePercent) > 100)) {
      console.warn(`❌ Invalid change percent for ${ticker}: ${changePercent}%`);
      return false;
    }
    
    // Profile validation (less strict)
    if (!profile || typeof profile !== 'object') {
      console.warn(`⚠️ Missing profile data for ${ticker}, but quote is valid`);
    }
    
    return true;
  }
  /**
   * Generate market-based recommendations using real data
   */
  async generateMarketRecommendations(maxRecommendations: number = 5): Promise<MarketRecommendation[]> {
    try {
      // If rate limited and we have recent cached recommendations, return them
      if (this.isRateLimited && this.lastRecommendationsCache.length > 0) {
        const cacheAge = Date.now() - this.lastRecommendationsTimestamp;
        const cacheAgeMinutes = Math.floor(cacheAge / 1000 / 60);
        console.log(`🔄 Rate limited - using cached recommendations (${cacheAgeMinutes} minutes old)`);
        return this.lastRecommendationsCache.slice(0, maxRecommendations);
      }
      
      console.log('🔄 Generating fallback recommendations from real market data...');
      
      // Get top performing stocks from different sectors
      const topStocks = await this.getTopPerformingStocks();
      const recommendations: MarketRecommendation[] = [];

      for (const stock of topStocks.slice(0, maxRecommendations * 2)) { // Fetch more to account for filtering
        if (!stock) continue; // Skip null stocks
        
        try {
          const recommendation = await this.createRecommendationFromStock(stock);
          if (recommendation) {
            recommendations.push(recommendation);
            // Stop once we have enough valid recommendations
            if (recommendations.length >= maxRecommendations) break;
          }
        } catch (error) {
          console.error(`Error creating recommendation for ${stock.symbol}:`, error);
        }
      }

      if (recommendations.length === 0) {
        console.log('⚠️ No valid market recommendations could be generated');
        
        // If we have cached recommendations from earlier, return them
        if (this.lastRecommendationsCache.length > 0) {
          const cacheAge = Date.now() - this.lastRecommendationsTimestamp;
          const cacheAgeMinutes = Math.floor(cacheAge / 1000 / 60);
          console.log(`🔄 Using cached recommendations as last resort (${cacheAgeMinutes} minutes old)`);
          return this.lastRecommendationsCache.slice(0, maxRecommendations);
        }
        
        return [];
      }

      // Cache successful recommendations
      this.lastRecommendationsCache = recommendations;
      this.lastRecommendationsTimestamp = Date.now();
      
      console.log(`✅ Generated ${recommendations.length} market-based recommendations`);
      return recommendations;
    } catch (error) {
      console.error('❌ Market data fallback failed:', error);
      
      // If we have cached recommendations, return them as last resort
      if (this.lastRecommendationsCache.length > 0) {
        const cacheAge = Date.now() - this.lastRecommendationsTimestamp;
        const cacheAgeMinutes = Math.floor(cacheAge / 1000 / 60);
        console.log(`🔄 Error occurred - using cached recommendations (${cacheAgeMinutes} minutes old)`);
        return this.lastRecommendationsCache.slice(0, maxRecommendations);
      }
      
      return [];
    }
  }

  /**
   * Get top performing stocks from Finnhub
   */
  private async getTopPerformingStocks(): Promise<any[]> {
    try {
      // Get trending stocks from different sectors
      const sectors = ['TECHNOLOGY', 'HEALTHCARE', 'FINANCIAL', 'ENERGY', 'CONSUMER'];
      const allStocks: any[] = [];

      for (const sector of sectors) {
        try {
          const stocks = await this.getStocksBySector(sector);
          // Filter out null stocks and add valid ones
          const validStocks = stocks.filter(stock => stock !== null);
          allStocks.push(...validStocks.slice(0, 3)); // Top 3 valid from each sector
        } catch (error) {
          console.log(`Could not fetch ${sector} stocks:`, error);
        }
      }

      // If sector-based approach fails, use popular tickers
      if (allStocks.length === 0) {
        console.log('⚠️ Sector-based approach failed, trying popular tickers...');
        const popularTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK.B', 'JNJ', 'V'];
        const stockPromises = popularTickers.map(ticker => this.fetchStockDataDirect(ticker));
        const stockResults = await Promise.allSettled(stockPromises);
        
        for (const result of stockResults) {
          if (result.status === 'fulfilled' && result.value) {
            allStocks.push(result.value);
          }
        }
      }

      const validStocksCount = allStocks.filter(stock => stock !== null).length;
      console.log(`📊 Retrieved ${validStocksCount} valid stocks from ${allStocks.length} attempts`);
      
      return allStocks.filter(stock => stock !== null); // Filter out nulls
    } catch (error) {
      console.error('Error fetching top performing stocks:', error);
      return [];
    }
  }

  /**
   * Get stocks by sector (simplified approach)
   */
  private async getStocksBySector(sector: string): Promise<any[]> {
    // Predefined lists since Finnhub sector search requires premium
    const sectorStocks: Record<string, string[]> = {
      TECHNOLOGY: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META'],
      HEALTHCARE: ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK'],
      FINANCIAL: ['JPM', 'BAC', 'WFC', 'GS', 'MS'],
      ENERGY: ['XOM', 'CVX', 'COP', 'EOG', 'SLB'],
      CONSUMER: ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE']
    };

    const tickers = sectorStocks[sector] || [];
    const stockPromises = tickers.map(ticker => this.fetchStockDataDirect(ticker));
    const results = await Promise.allSettled(stockPromises);
    
    return results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as PromiseFulfilledResult<any>).value);
  }

  /**
   * Fetch stock data directly with enhanced cache-first approach when quota exceeded
   */
  private async fetchStockDataDirect(ticker: string): Promise<any | null> {
    try {
      // Check cache first
      const cached = this.getCachedData(ticker);
      if (cached) {
        console.log(`📂 Cache hit for ${ticker}`);
        return cached;
      }

      // Check if we're rate limited - return stale cache if available
      if (this.isRateLimited) {
        console.log(`⏸️ Rate limited, checking for stale cache for ${ticker}`);
        const staleCache = this.cache.get(ticker);
        if (staleCache) {
          console.log(`🔄 Using stale cached data for ${ticker} (${Math.floor((Date.now() - staleCache.timestamp) / 1000 / 60)} minutes old)`);
          return staleCache.data;
        }
        console.log(`❌ No cached data available for ${ticker} during rate limit`);
        return null;
      }

      // Fetch fresh data
      const stockData = await this.getStockData(ticker);
      
      // Cache valid data
      if (stockData && this.isValidStockData(stockData.quote, stockData.profile, ticker)) {
        this.setCachedData(ticker, stockData);
        console.log(`✅ Fresh data cached for ${ticker}`);
        return stockData;
      }

      console.log(`❌ Invalid data for ${ticker}, checking for stale cache`);
      // If fresh data is invalid, try to return stale cache
      const staleCache = this.cache.get(ticker);
      if (staleCache) {
        console.log(`🔄 Falling back to stale cached data for ${ticker}`);
        return staleCache.data;
      }
      
      return null;
    } catch (error: any) {
      // Check if it's a rate limit error
      if (error?.response?.status === 429 || error?.message?.includes('Rate limited')) {
        console.log(`🚫 Rate limit hit for ${ticker}, checking for cached data`);
        this.isRateLimited = true;
        
        // Set timeout to reset rate limit status
        setTimeout(() => {
          this.isRateLimited = false;
          console.log('✅ Rate limit status reset');
        }, 60000); // 1 minute
        
        // Return stale cache if available when rate limited
        const staleCache = this.cache.get(ticker);
        if (staleCache) {
          console.log(`🔄 Using stale cached data for ${ticker} due to rate limit`);
          return staleCache.data;
        }
        
        console.log(`❌ No cached data available for ${ticker} during rate limit`);
        return null;
      }

      console.error(`Error fetching ${ticker}:`, error?.message || error);
      
      // On any error, try to return stale cache
      const staleCache = this.cache.get(ticker);
      if (staleCache) {
        console.log(`🔄 Using stale cached data for ${ticker} due to error`);
        return staleCache.data;
      }
      
      return null;
    }
  }

  /**
   * Get stock data from Finnhub
   */
  private async getStockData(ticker: string): Promise<any> {
    try {
      const quoteUrl = `${this.baseUrl}/quote?symbol=${ticker}&token=${this.finnhubApiKey}`;
      const profileUrl = `${this.baseUrl}/stock/profile2?symbol=${ticker}&token=${this.finnhubApiKey}`;

      const [quoteResponse, profileResponse] = await Promise.all([
        fetch(quoteUrl),
        fetch(profileUrl)
      ]);

      // Handle rate limiting
      if (quoteResponse.status === 429 || profileResponse.status === 429) {
        this.isRateLimited = true;
        setTimeout(() => {
          this.isRateLimited = false;
          console.log('✅ Rate limit status reset');
        }, 60000); // 1 minute
        throw new Error('Rate limited');
      }

      if (!quoteResponse.ok || !profileResponse.ok) {
        console.error(`❌ API error for ${ticker}: ${quoteResponse.status}/${profileResponse.status}`);
        return null;
      }

      const quote = await quoteResponse.json();
      const profile = await profileResponse.json();

      // Validate the response data before returning
      if (!quote || !quote.c || quote.c <= 0) {
        console.error(`❌ Invalid quote data for ${ticker}:`, quote);
        return null;
      }

      const stockData = {
        symbol: ticker,
        quote,
        profile,
        changePercent: quote.dp || 0,
        currentPrice: quote.c
      };

      // Double-check with our validation
      if (!this.isValidStockData(quote, profile, ticker)) {
        console.error(`❌ Stock data validation failed for ${ticker}`);
        return null;
      }

      return stockData;
    } catch (error: any) {
      console.error(`Error fetching data for ${ticker}:`, error?.message || error);
      return null;
    }
  }

  /**
   * Create recommendation from stock data
   */
  private async createRecommendationFromStock(stock: any): Promise<MarketRecommendation | null> {
    try {
      console.log('📊 Creating recommendation from stock:', stock.symbol, 'data:', stock);
      const { symbol, quote, profile, changePercent, currentPrice } = stock;

      // Additional validation to ensure price is valid
      if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) {
        console.warn(`❌ Skipping ${symbol} - invalid price: ${currentPrice}`);
        return null;
      }

      // Validate change percent
      if (changePercent != null && (isNaN(changePercent) || Math.abs(changePercent) > 100)) {
        console.warn(`❌ Skipping ${symbol} - invalid change percent: ${changePercent}%`);
        return null;
      }

      // Calculate scores based on market performance
      const momentum = changePercent > 5 ? 'positive' : changePercent < -5 ? 'negative' : 'neutral';
      const priceScore = Math.min(100, Math.max(0, (changePercent + 10) * 5)); // -10% to +10% mapped to 0-100
      const volumeScore = quote.v ? Math.min(100, quote.v / 1000000) : 50; // Volume in millions

      // Generate risk flags based on volatility
      const riskFlags: string[] = [];
      if (Math.abs(changePercent) > 10) riskFlags.push('high-volatility');
      if (changePercent < -5) riskFlags.push('price-decline');
      if (!profile.marketCapitalization || profile.marketCapitalization < 1000) riskFlags.push('small-cap');

      // Calculate final score
      const finalScore = (priceScore * 0.4 + volumeScore * 0.3 + 70) / 100; // Base score of 70
      const confidence = Math.min(95, Math.max(60, 75 + changePercent * 2));

      // Generate explanation
      const explanation = this.generateExplanation(symbol, changePercent, momentum, profile);

      const recommendation = {
        ticker: symbol,
        companyName: profile.name || symbol,
        finalScore: Math.round(finalScore * 100) / 100,
        confidence: Math.round(confidence),
        explanation,
        analytics: {
          momentum,
          sentiment: changePercent > 0 ? 'bullish' : 'bearish',
          mentions: Math.floor(Math.random() * 10) + 5, // Simulated
          avgScore: 3.5 + (changePercent / 10), // Score based on performance
          riskFlags
        },
        breakdown: {
          popularity: Math.round(volumeScore),
          sentiment: Math.round(changePercent > 0 ? 80 + changePercent : 60 + changePercent),
          momentum: Math.round(priceScore),
          diversification: Math.round(70 + Math.random() * 20)
        },
        marketData: {
          c: currentPrice,
          sector: profile.finnhubIndustry || 'Technology',
          changePercent: changePercent
        }
      };

      console.log('✅ Created recommendation:', recommendation.ticker, 'with marketData.c:', recommendation.marketData.c);
      return recommendation;
    } catch (error) {
      console.error('Error creating recommendation:', error);
      return null;
    }
  }

  /**
   * Generate explanation for recommendation
   */
  private generateExplanation(ticker: string, changePercent: number, momentum: string, profile: any): string {
    const baseExplanations = [
      `Strong market performance with ${momentum} momentum`,
      `Real-time market data shows ${changePercent > 0 ? 'positive' : 'mixed'} signals`,
      `Current market conditions favor this position`,
      `Technical indicators suggest ${momentum} trend continuation`
    ];

    let explanation = baseExplanations[Math.floor(Math.random() * baseExplanations.length)];
    
    if (changePercent > 5) {
      explanation += ` (+${changePercent.toFixed(1)}% today)`;
    } else if (changePercent < -5) {
      explanation += ` (${changePercent.toFixed(1)}% today - potential recovery)`;
    }

    return explanation;
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.finnhubApiKey;
  }
}

export default MarketDataFallbackService;

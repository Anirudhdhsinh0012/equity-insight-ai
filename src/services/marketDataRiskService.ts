/**
 * Enhanced Market Data & Analytics Service
 * Comprehensive market data with technical analysis and price tracking
 */

interface RiskFlag {
  type: 'earnings' | 'volatility' | 'float' | 'news' | 'sector';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: number; // 0-1 negative impact on recommendation score
}

interface PricePerformance {
  "1h": number;
  "24h": number;
  "7d": number;
  "30d": number;
  "ytd": number;
  "1y": number;
}

interface TechnicalIndicators {
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  rsi14: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr14: number; // Average True Range
}

interface VolumeAnalysis {
  current: number;
  average20d: number;
  ratio: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface VolatilityMetrics {
  current: number;
  average30d: number;
  percentile: number;
  ranking: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ChartDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  indicator: string;
  strength: number; // 0-1
  description: string;
  expires?: string;
}

interface MarketAnalytics {
  currentPrice: number;
  priceChange: {
    amount: number;
    percentage: number;
    timeframe: string;
  };
  performance: PricePerformance;
  volatility: VolatilityMetrics;
  volume: VolumeAnalysis;
  technicals: TechnicalIndicators;
  chartData: ChartDataPoint[];
  signals: TradingSignal[];
  trend: {
    direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number;
    duration: string;
  };
  support: number[];
  resistance: number[];
}

interface MarketData {
  ticker: string;
  currentPrice: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  earningsDate?: string;
  volatility30d: number;
  shareFloat: number;
  sector: string;
  riskFlags: RiskFlag[];
  lastUpdated: Date;
  // Enhanced analytics
  analytics?: MarketAnalytics;
}

interface EarningsData {
  ticker: string;
  earningsDate: string;
  estimate: number;
  actual?: number;
  surprise?: number;
}

export class MarketDataRiskService {
  private finnhubApiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';
  private marketDataCache = new Map<string, MarketData>();
  private earningsCache = new Map<string, EarningsData>();
  private historicalCache = new Map<string, ChartDataPoint[]>();
  private analyticsCache = new Map<string, MarketAnalytics>();
  private cacheExpiry = 15 * 60 * 1000; // 15 minutes
  private historicalCacheExpiry = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || 'your_finnhub_key_here';
  }

  /**
   * Get comprehensive market analytics for a ticker
   */
  async getMarketAnalytics(ticker: string, timeframe: string = '1Y'): Promise<MarketAnalytics | null> {
    try {
      const cacheKey = `${ticker}-${timeframe}`;
      const cached = this.analyticsCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Import technical analysis service
      const { default: TechnicalAnalysisService } = await import('./technicalAnalysisService');
      const technicalService = new TechnicalAnalysisService();

      // Fetch all required data
      const [currentData, historicalData] = await Promise.all([
        this.getCurrentQuote(ticker),
        this.getHistoricalData(ticker, timeframe)
      ]);

      if (!currentData || !historicalData || historicalData.length === 0) {
        return null;
      }

      // Calculate analytics
      const analytics: MarketAnalytics = {
        currentPrice: currentData.c,
        priceChange: {
          amount: currentData.d,
          percentage: currentData.dp,
          timeframe: '24h'
        },
        performance: this.calculatePerformance(historicalData, currentData.c),
        volatility: this.calculateVolatilityMetrics(historicalData),
        volume: this.calculateVolumeAnalysis(historicalData),
        technicals: technicalService.calculateTechnicalIndicators(historicalData),
        chartData: historicalData,
        signals: technicalService.generateTradingSignals(historicalData),
        trend: technicalService.analyzeTrend(historicalData),
        support: technicalService.findSupportLevels(historicalData),
        resistance: technicalService.findResistanceLevels(historicalData)
      };

      this.analyticsCache.set(cacheKey, analytics);
      return analytics;

    } catch (error) {
      console.error(`Error fetching analytics for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Get historical price data
   */
  async getHistoricalData(ticker: string, timeframe: string = '1Y'): Promise<ChartDataPoint[]> {
    try {
      const cacheKey = `${ticker}-${timeframe}`;
      const cached = this.historicalCache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const endDate = Math.floor(Date.now() / 1000);
      const startDate = this.getStartDateForTimeframe(timeframe, endDate);

      const url = `${this.baseUrl}/stock/candle?symbol=${ticker}&resolution=D&from=${startDate}&to=${endDate}&token=${this.finnhubApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.s !== 'ok' || !data.c) {
        throw new Error(`No historical data available for ${ticker}`);
      }

      const chartData: ChartDataPoint[] = data.t.map((timestamp: number, index: number) => ({
        timestamp: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close: data.c[index],
        volume: data.v[index]
      }));

      this.historicalCache.set(cacheKey, chartData);
      return chartData;

    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      return [];
    }
  }

  /**
   * Get current quote with enhanced data
   */
  private async getCurrentQuote(ticker: string): Promise<any> {
    const url = `${this.baseUrl}/quote?symbol=${ticker}&token=${this.finnhubApiKey}`;
    const response = await fetch(url);
    return await response.json();
  }

  /**
   * Calculate price performance across different timeframes
   */
  private calculatePerformance(data: ChartDataPoint[], currentPrice: number): PricePerformance {
    const latest = data[data.length - 1];
    const performance: PricePerformance = {
      "1h": 0, // Would need intraday data
      "24h": ((currentPrice - latest.close) / latest.close) * 100,
      "7d": 0,
      "30d": 0,
      "ytd": 0,
      "1y": 0
    };

    // Calculate other timeframes
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const weekPrice = this.findPriceByDate(data, oneWeekAgo);
    const monthPrice = this.findPriceByDate(data, oneMonthAgo);
    const ytdPrice = this.findPriceByDate(data, yearStart);
    const yearPrice = this.findPriceByDate(data, oneYearAgo);

    if (weekPrice) performance["7d"] = ((currentPrice - weekPrice) / weekPrice) * 100;
    if (monthPrice) performance["30d"] = ((currentPrice - monthPrice) / monthPrice) * 100;
    if (ytdPrice) performance["ytd"] = ((currentPrice - ytdPrice) / ytdPrice) * 100;
    if (yearPrice) performance["1y"] = ((currentPrice - yearPrice) / yearPrice) * 100;

    return performance;
  }

  /**
   * Calculate volume analysis
   */
  private calculateVolumeAnalysis(data: ChartDataPoint[]): VolumeAnalysis {
    const recent20Days = data.slice(-20);
    const currentVolume = data[data.length - 1].volume;
    const average20d = recent20Days.reduce((sum, d) => sum + d.volume, 0) / recent20Days.length;
    const ratio = currentVolume / average20d;

    // Determine trend
    const recentVolumes = recent20Days.slice(-5).map(d => d.volume);
    const earlierVolumes = recent20Days.slice(-10, -5).map(d => d.volume);
    const recentAvg = recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;
    const earlierAvg = earlierVolumes.reduce((sum, v) => sum + v, 0) / earlierVolumes.length;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const change = (recentAvg - earlierAvg) / earlierAvg;
    if (change > 0.1) trend = 'increasing';
    else if (change < -0.1) trend = 'decreasing';

    return {
      current: currentVolume,
      average20d,
      ratio,
      trend
    };
  }

  /**
   * Get comprehensive market data for a ticker
   */
  async getMarketData(ticker: string): Promise<MarketData | null> {
    try {
      // Check cache first
      const cached = this.marketDataCache.get(ticker);
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry) {
        return cached;
      }

      // Fetch fresh data
      const [quote, profile, metrics, earnings] = await Promise.all([
        this.fetchQuote(ticker),
        this.fetchCompanyProfile(ticker),
        this.fetchBasicFinancials(ticker),
        this.fetchEarningsCalendar(ticker)
      ]);

      if (!quote) return null;

      const marketData: MarketData = {
        ticker,
        currentPrice: quote.c || 0,
        changePercent: quote.dp || 0,
        volume: quote.v || 0,
        marketCap: profile?.marketCapitalization || 0,
        peRatio: metrics?.peBasicExclExtraTTM || 0,
        earningsDate: earnings?.earningsDate,
        volatility30d: this.calculateVolatility(quote),
        shareFloat: profile?.shareOutstanding || 0,
        sector: profile?.finnhubIndustry || 'Unknown',
        riskFlags: [],
        lastUpdated: new Date()
      };

      // Assess risk flags
      marketData.riskFlags = await this.assessRiskFlags(marketData, earnings);

      // Cache the result
      this.marketDataCache.set(ticker, marketData);

      return marketData;
    } catch (error) {
      console.error(`Error fetching market data for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Fetch real-time quote data
   */
  private async fetchQuote(ticker: string): Promise<any> {
    const url = `${this.baseUrl}/quote?symbol=${ticker}&token=${this.finnhubApiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Quote API error: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Fetch company profile
   */
  private async fetchCompanyProfile(ticker: string): Promise<any> {
    const url = `${this.baseUrl}/stock/profile2?symbol=${ticker}&token=${this.finnhubApiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Profile API error: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Fetch basic financial metrics
   */
  private async fetchBasicFinancials(ticker: string): Promise<any> {
    const url = `${this.baseUrl}/stock/metric?symbol=${ticker}&metric=all&token=${this.finnhubApiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Metrics API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.metric;
  }

  /**
   * Fetch earnings calendar
   */
  private async fetchEarningsCalendar(ticker: string): Promise<EarningsData | null> {
    try {
      // Check cache first
      const cached = this.earningsCache.get(ticker);
      if (cached) return cached;

      const today = new Date();
      const future = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
      
      const url = `${this.baseUrl}/calendar/earnings?from=${this.formatDate(today)}&to=${this.formatDate(future)}&symbol=${ticker}&token=${this.finnhubApiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const earnings = data.earningsCalendar?.[0];
      
      if (earnings) {
        const earningsData: EarningsData = {
          ticker,
          earningsDate: earnings.date,
          estimate: earnings.epsEstimate || 0,
          actual: earnings.epsActual,
          surprise: earnings.surprise
        };
        
        this.earningsCache.set(ticker, earningsData);
        return earningsData;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching earnings for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Calculate volatility from quote data
   */
  private calculateVolatility(quote: any): number {
    // Simplified volatility calculation
    // In production, use historical price data for accurate calculation
    const high = quote.h || 0;
    const low = quote.l || 0;
    const current = quote.c || 0;
    
    if (current === 0) return 0;
    
    return ((high - low) / current) * 100;
  }

  /**
   * Assess various risk flags for a stock
   */
  private async assessRiskFlags(marketData: MarketData, earnings: EarningsData | null): Promise<RiskFlag[]> {
    const flags: RiskFlag[] = [];

    // Earnings risk
    if (earnings && this.isEarningsWithin7Days(earnings.earningsDate)) {
      flags.push({
        type: 'earnings',
        severity: 'medium',
        description: `Earnings announcement on ${earnings.earningsDate}`,
        impact: 0.15
      });
    }

    // Volatility risk
    if (marketData.volatility30d > 30) {
      flags.push({
        type: 'volatility',
        severity: marketData.volatility30d > 50 ? 'high' : 'medium',
        description: `High volatility: ${marketData.volatility30d.toFixed(1)}% in 30 days`,
        impact: marketData.volatility30d > 50 ? 0.25 : 0.15
      });
    }

    // Low float risk
    if (marketData.shareFloat > 0 && marketData.shareFloat < 50) {
      flags.push({
        type: 'float',
        severity: 'medium',
        description: `Low share float: ${marketData.shareFloat}M shares`,
        impact: 0.1
      });
    }

    // P/E ratio risk
    if (marketData.peRatio > 50) {
      flags.push({
        type: 'news',
        severity: 'low',
        description: `High P/E ratio: ${marketData.peRatio.toFixed(1)}`,
        impact: 0.05
      });
    }

    // Sector concentration will be assessed at portfolio level

    return flags;
  }

  /**
   * Check if earnings are within 7 days
   */
  private isEarningsWithin7Days(earningsDate: string): boolean {
    const earnings = new Date(earningsDate);
    const today = new Date();
    const diffTime = Math.abs(earnings.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 7;
  }

  /**
   * Format date for API calls
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get sector exposure for diversification analysis
   */
  async getSectorExposure(tickers: string[]): Promise<Map<string, number>> {
    const sectorCount = new Map<string, number>();
    
    for (const ticker of tickers) {
      const marketData = await this.getMarketData(ticker);
      if (marketData) {
        const sector = marketData.sector;
        sectorCount.set(sector, (sectorCount.get(sector) || 0) + 1);
      }
    }
    
    return sectorCount;
  }

  /**
   * Assess sector concentration risk
   */
  assessSectorConcentration(sectorExposure: Map<string, number>, totalStocks: number): RiskFlag[] {
    const flags: RiskFlag[] = [];
    
    for (const [sector, count] of sectorExposure.entries()) {
      const concentration = count / totalStocks;
      
      if (concentration > 0.4) { // More than 40% in one sector
        flags.push({
          type: 'sector',
          severity: concentration > 0.6 ? 'high' : 'medium',
          description: `High concentration in ${sector}: ${(concentration * 100).toFixed(1)}%`,
          impact: concentration > 0.6 ? 0.2 : 0.1
        });
      }
    }
    
    return flags;
  }

  /**
   * Get news sentiment for risk assessment
   */
  async getNewsSentiment(ticker: string, days: number = 7): Promise<{ sentiment: number; newsCount: number }> {
    try {
      const today = new Date();
      const past = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
      
      const url = `${this.baseUrl}/company-news?symbol=${ticker}&from=${this.formatDate(past)}&to=${this.formatDate(today)}&token=${this.finnhubApiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return { sentiment: 0, newsCount: 0 };
      }
      
      const news = await response.json();
      
      if (!news || news.length === 0) {
        return { sentiment: 0, newsCount: 0 };
      }
      
      // Simple sentiment analysis based on headline keywords
      let totalSentiment = 0;
      const sentimentKeywords = {
        positive: ['rally', 'surge', 'gain', 'profit', 'beat', 'strong', 'growth', 'upgrade'],
        negative: ['fall', 'drop', 'loss', 'miss', 'weak', 'decline', 'downgrade', 'concern']
      };
      
      news.forEach((article: any) => {
        const headline = article.headline.toLowerCase();
        let sentiment = 0;
        
        sentimentKeywords.positive.forEach(word => {
          if (headline.includes(word)) sentiment += 1;
        });
        
        sentimentKeywords.negative.forEach(word => {
          if (headline.includes(word)) sentiment -= 1;
        });
        
        totalSentiment += sentiment;
      });
      
      return {
        sentiment: news.length > 0 ? totalSentiment / news.length : 0,
        newsCount: news.length
      };
    } catch (error) {
      console.error(`Error fetching news sentiment for ${ticker}:`, error);
      return { sentiment: 0, newsCount: 0 };
    }
  }

  /**
   * Calculate overall risk score for a stock
   */
  calculateRiskScore(marketData: MarketData): number {
    let riskScore = 0;
    
    marketData.riskFlags.forEach(flag => {
      riskScore += flag.impact;
    });
    
    // Normalize to 0-1 scale (0 = no risk, 1 = very high risk)
    return Math.min(1, riskScore);
  }

  /**
   * Get batch market data for multiple tickers
   */
  async getBatchMarketData(tickers: string[]): Promise<Map<string, MarketData>> {
    const results = new Map<string, MarketData>();
    
    // Process in batches to respect API limits
    const batchSize = 10;
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (ticker) => {
        try {
          const data = await this.getMarketData(ticker);
          if (data) {
            results.set(ticker, data);
          }
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
        }
      });
      
      await Promise.all(batchPromises);
      
      // Rate limiting pause
      if (i + batchSize < tickers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.marketDataCache.clear();
    this.earningsCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { marketData: number; earnings: number } {
    return {
      marketData: this.marketDataCache.size,
      earnings: this.earningsCache.size
    };
  }

  // ===== HELPER METHODS FOR ANALYTICS =====

  /**
   * Get start date for different timeframes
   */
  private getStartDateForTimeframe(timeframe: string, endDate: number): number {
    const secondsInDay = 24 * 60 * 60;
    
    switch (timeframe) {
      case '1D': return endDate - (1 * secondsInDay);
      case '7D': return endDate - (7 * secondsInDay);
      case '1M': return endDate - (30 * secondsInDay);
      case '3M': return endDate - (90 * secondsInDay);
      case '6M': return endDate - (180 * secondsInDay);
      case '1Y': return endDate - (365 * secondsInDay);
      case '2Y': return endDate - (730 * secondsInDay);
      default: return endDate - (365 * secondsInDay); // Default to 1 year
    }
  }

  /**
   * Find price by date
   */
  private findPriceByDate(data: ChartDataPoint[], targetDate: Date): number | null {
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // Find exact match or closest date
    let closestPoint = null;
    let closestDiff = Infinity;
    
    for (const point of data) {
      const pointDate = new Date(point.timestamp);
      const diff = Math.abs(pointDate.getTime() - targetDate.getTime());
      
      if (diff < closestDiff) {
        closestDiff = diff;
        closestPoint = point;
      }
    }
    
    return closestPoint ? closestPoint.close : null;
  }

  /**
   * Calculate volatility metrics
   */
  private calculateVolatilityMetrics(data: ChartDataPoint[]): VolatilityMetrics {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const dailyReturn = (data[i].close - data[i - 1].close) / data[i - 1].close;
      returns.push(dailyReturn);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

    // Calculate 30-day rolling volatility
    const recent30Days = returns.slice(-30);
    const mean30 = recent30Days.reduce((sum, r) => sum + r, 0) / recent30Days.length;
    const variance30 = recent30Days.reduce((sum, r) => sum + Math.pow(r - mean30, 2), 0) / recent30Days.length;
    const volatility30 = Math.sqrt(variance30) * Math.sqrt(252);

    // Determine ranking
    let ranking: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (volatility < 0.20) ranking = 'LOW';
    else if (volatility > 0.40) ranking = 'HIGH';

    return {
      current: volatility,
      average30d: volatility30,
      percentile: this.calculateVolatilityPercentile(volatility, returns),
      ranking
    };
  }

  /**
   * Calculate volatility percentile
   */
  private calculateVolatilityPercentile(currentVolatility: number, returns: number[]): number {
    // Calculate rolling volatilities for comparison
    const rollingVolatilities = [];
    const windowSize = 30;
    
    for (let i = windowSize; i < returns.length; i++) {
      const window = returns.slice(i - windowSize, i);
      const mean = window.reduce((sum, r) => sum + r, 0) / window.length;
      const variance = window.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / window.length;
      const vol = Math.sqrt(variance) * Math.sqrt(252);
      rollingVolatilities.push(vol);
    }
    
    // Find percentile
    const sorted = rollingVolatilities.sort((a, b) => a - b);
    const lowerCount = sorted.filter(vol => vol < currentVolatility).length;
    return Math.round((lowerCount / sorted.length) * 100);
  }
}

export default MarketDataRiskService;

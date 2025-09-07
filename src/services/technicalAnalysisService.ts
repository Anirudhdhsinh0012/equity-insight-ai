/**
 * Technical Analysis Service
 * Comprehensive technical indicators and market analysis
 */

export interface TechnicalIndicators {
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

export interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  indicator: string;
  strength: number; // 0-1
  description: string;
  expires?: string;
}

export interface ChartDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class TechnicalAnalysisService {
  
  /**
   * Calculate technical indicators for price data
   */
  calculateTechnicalIndicators(data: ChartDataPoint[]): TechnicalIndicators {
    if (data.length < 200) {
      throw new Error('Insufficient data for technical analysis (minimum 200 data points required)');
    }

    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    return {
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, 50),
      sma200: this.calculateSMA(prices, 200),
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
      rsi14: this.calculateRSI(prices, 14),
      macd: this.calculateMACD(prices),
      bollingerBands: this.calculateBollingerBands(prices, 20, 2),
      atr14: this.calculateATR(highs, lows, prices, 14)
    };
  }

  /**
   * Generate trading signals based on technical analysis
   */
  generateTradingSignals(data: ChartDataPoint[]): TradingSignal[] {
    const signals: TradingSignal[] = [];
    
    if (data.length < 50) return signals;

    try {
      const indicators = this.calculateTechnicalIndicators(data);
      const currentPrice = data[data.length - 1].close;
      
      // SMA Crossover Signals
      const smaSignal = this.analyzeSMACrossover(indicators, currentPrice);
      if (smaSignal) signals.push(smaSignal);

      // RSI Signals
      const rsiSignal = this.analyzeRSI(indicators.rsi14);
      if (rsiSignal) signals.push(rsiSignal);

      // MACD Signals
      const macdSignal = this.analyzeMACD(indicators.macd);
      if (macdSignal) signals.push(macdSignal);

      // Bollinger Bands Signals
      const bbSignal = this.analyzeBollingerBands(indicators.bollingerBands, currentPrice);
      if (bbSignal) signals.push(bbSignal);

    } catch (error) {
      console.error('Error generating trading signals:', error);
    }

    return signals;
  }

  /**
   * Analyze price trend
   */
  analyzeTrend(data: ChartDataPoint[]): { direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number; duration: string } {
    if (data.length < 20) {
      return { direction: 'NEUTRAL', strength: 0, duration: '0 days' };
    }

    const prices = data.map(d => d.close);
    const recentPrices = prices.slice(-20);
    
    // Linear regression to determine trend
    const trendSlope = this.calculateTrendSlope(recentPrices);
    const trendStrength = Math.abs(trendSlope);
    
    let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (trendSlope > 0.02) direction = 'BULLISH';
    else if (trendSlope < -0.02) direction = 'BEARISH';

    // Calculate trend duration
    let duration = 1;
    const currentTrend = direction;
    for (let i = data.length - 2; i >= 0; i--) {
      const dayTrend = this.getDayTrend(data, i);
      if (dayTrend === currentTrend) {
        duration++;
      } else {
        break;
      }
    }

    return {
      direction,
      strength: Math.min(1, trendStrength * 10),
      duration: `${duration} days`
    };
  }

  /**
   * Find support levels
   */
  findSupportLevels(data: ChartDataPoint[]): number[] {
    const lows = data.map(d => d.low);
    const supports: number[] = [];
    
    // Find local minima as potential support levels
    for (let i = 2; i < lows.length - 2; i++) {
      if (lows[i] <= lows[i-1] && lows[i] <= lows[i-2] && 
          lows[i] <= lows[i+1] && lows[i] <= lows[i+2]) {
        supports.push(lows[i]);
      }
    }

    // Return the 3 most significant support levels
    return supports
      .sort((a, b) => b - a)
      .slice(0, 3);
  }

  /**
   * Find resistance levels
   */
  findResistanceLevels(data: ChartDataPoint[]): number[] {
    const highs = data.map(d => d.high);
    const resistances: number[] = [];
    
    // Find local maxima as potential resistance levels
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] >= highs[i-1] && highs[i] >= highs[i-2] && 
          highs[i] >= highs[i+1] && highs[i] >= highs[i+2]) {
        resistances.push(highs[i]);
      }
    }

    // Return the 3 most significant resistance levels
    return resistances
      .sort((a, b) => b - a)
      .slice(0, 3);
  }

  // ===== TECHNICAL INDICATOR CALCULATIONS =====

  /**
   * Simple Moving Average
   */
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / period;
  }

  /**
   * Exponential Moving Average
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  /**
   * Relative Strength Index
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    // Calculate signal line (9-period EMA of MACD line)
    // For simplicity, using a basic calculation here
    const signal = macdLine * 0.2; // Simplified signal line
    const histogram = macdLine - signal;

    return {
      line: macdLine,
      signal: signal,
      histogram: histogram
    };
  }

  /**
   * Bollinger Bands
   */
  private calculateBollingerBands(prices: number[], period: number = 20, standardDeviations: number = 2): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    
    // Calculate standard deviation
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + (stdDev * standardDeviations),
      middle: sma,
      lower: sma - (stdDev * standardDeviations)
    };
  }

  /**
   * Average True Range
   */
  private calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (highs.length < period + 1) return 0;

    const trueRanges: number[] = [];

    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    // Calculate average of last 'period' true ranges
    const recent = trueRanges.slice(-period);
    return recent.reduce((sum, tr) => sum + tr, 0) / recent.length;
  }

  // ===== SIGNAL ANALYSIS METHODS =====

  private analyzeSMACrossover(indicators: TechnicalIndicators, currentPrice: number): TradingSignal | null {
    if (currentPrice > indicators.sma20 && indicators.sma20 > indicators.sma50) {
      return {
        type: 'BUY',
        indicator: 'SMA_CROSSOVER',
        strength: 0.8,
        description: 'Price above SMA20 and SMA50, bullish trend confirmed'
      };
    } else if (currentPrice < indicators.sma20 && indicators.sma20 < indicators.sma50) {
      return {
        type: 'SELL',
        indicator: 'SMA_CROSSOVER',
        strength: 0.7,
        description: 'Price below SMA20 and SMA50, bearish trend confirmed'
      };
    }
    return null;
  }

  private analyzeRSI(rsi: number): TradingSignal | null {
    if (rsi < 30) {
      return {
        type: 'BUY',
        indicator: 'RSI_OVERSOLD',
        strength: 0.6,
        description: `RSI at ${rsi.toFixed(1)}, oversold condition`
      };
    } else if (rsi > 70) {
      return {
        type: 'SELL',
        indicator: 'RSI_OVERBOUGHT',
        strength: 0.6,
        description: `RSI at ${rsi.toFixed(1)}, overbought condition`
      };
    }
    return null;
  }

  private analyzeMACD(macd: { line: number; signal: number; histogram: number }): TradingSignal | null {
    if (macd.line > macd.signal && macd.histogram > 0) {
      return {
        type: 'BUY',
        indicator: 'MACD_BULLISH',
        strength: 0.7,
        description: 'MACD line above signal line, bullish momentum'
      };
    } else if (macd.line < macd.signal && macd.histogram < 0) {
      return {
        type: 'SELL',
        indicator: 'MACD_BEARISH',
        strength: 0.7,
        description: 'MACD line below signal line, bearish momentum'
      };
    }
    return null;
  }

  private analyzeBollingerBands(bands: { upper: number; middle: number; lower: number }, currentPrice: number): TradingSignal | null {
    if (currentPrice <= bands.lower) {
      return {
        type: 'BUY',
        indicator: 'BOLLINGER_OVERSOLD',
        strength: 0.6,
        description: 'Price at lower Bollinger Band, potential reversal'
      };
    } else if (currentPrice >= bands.upper) {
      return {
        type: 'SELL',
        indicator: 'BOLLINGER_OVERBOUGHT',
        strength: 0.6,
        description: 'Price at upper Bollinger Band, potential reversal'
      };
    }
    return null;
  }

  // ===== HELPER METHODS =====

  private calculateTrendSlope(prices: number[]): number {
    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = prices;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope / prices[0]; // Normalize by first price
  }

  private getDayTrend(data: ChartDataPoint[], index: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    if (index === 0) return 'NEUTRAL';
    
    const change = (data[index].close - data[index - 1].close) / data[index - 1].close;
    if (change > 0.01) return 'BULLISH';
    if (change < -0.01) return 'BEARISH';
    return 'NEUTRAL';
  }
}

export default TechnicalAnalysisService;

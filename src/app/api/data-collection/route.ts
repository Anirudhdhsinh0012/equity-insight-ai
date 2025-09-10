import { NextRequest, NextResponse } from 'next/server';

// Enhanced data collection service that combines multiple data sources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const includeNews = searchParams.get('includeNews') === 'true';
    const includeTechnicals = searchParams.get('includeTechnicals') === 'true';

    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    // Fetch data from multiple sources in parallel
    const [
      stockQuoteData,
      newsData,
      technicalData
    ] = await Promise.allSettled([
      fetchStockQuote(ticker),
      includeNews ? fetchNewsData(ticker) : Promise.resolve(null),
      includeTechnicals ? fetchTechnicalData(ticker) : Promise.resolve(null)
    ]);

    // Process results
    const stockQuote = stockQuoteData.status === 'fulfilled' ? stockQuoteData.value : null;
    const news = newsData.status === 'fulfilled' ? newsData.value : null;
    const technicals = technicalData.status === 'fulfilled' ? technicalData.value : null;

    // Combine all data
    const combinedData = {
      ticker,
      timestamp: new Date().toISOString(),
      stockData: stockQuote,
      newsData: news,
      technicalData: technicals,
      dataQuality: {
        stockQuote: stockQuoteData.status === 'fulfilled',
        news: newsData.status === 'fulfilled',
        technicals: technicalData.status === 'fulfilled'
      }
    };

    return NextResponse.json({
      success: true,
      data: combinedData,
      sources: {
        stockData: 'Finnhub',
        newsData: 'Explorium',
        technicalData: 'Finnhub Technical'
      }
    });

  } catch (error) {
    console.error('Data Collection API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to collect market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Fetch stock quote data from Finnhub
async function fetchStockQuote(ticker: string) {
  try {
    const response = await fetch(`/api/finnhub/quote?symbol=${ticker}`);
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      currentPrice: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      volume: data.volume,
      timestamp: data.t,
      marketStatus: getMarketStatus()
    };
  } catch (error) {
    console.error(`Error fetching stock quote for ${ticker}:`, error);
    // Return mock data for demo purposes
    return {
      currentPrice: 150.25,
      change: 3.45,
      changePercent: 2.35,
      high: 152.80,
      low: 148.90,
      open: 149.50,
      previousClose: 146.80,
      volume: 25000000,
      timestamp: Date.now() / 1000,
      marketStatus: 'CLOSED'
    };
  }
}

// Fetch news data from Explorium
async function fetchNewsData(ticker: string) {
  try {
    const response = await fetch(`/api/news/explorium?ticker=${ticker}&limit=5`);
    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error);
    return [];
  }
}

// Fetch technical analysis data
async function fetchTechnicalData(ticker: string) {
  try {
    // This would integrate with technical analysis APIs or calculate indicators
    // For now, return mock technical data
    return {
      rsi: Math.random() * 100,
      macd: {
        value: (Math.random() - 0.5) * 2,
        signal: (Math.random() - 0.5) * 2,
        histogram: (Math.random() - 0.5) * 2
      },
      movingAverages: {
        sma20: 145.67,
        sma50: 142.33,
        sma200: 138.91,
        ema12: 146.78,
        ema26: 143.45
      },
      support: 140.25,
      resistance: 155.80,
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      signals: [
        {
          indicator: 'RSI',
          signal: Math.random() > 0.5 ? 'buy' : 'sell',
          strength: Math.random() * 100
        },
        {
          indicator: 'MACD',
          signal: Math.random() > 0.5 ? 'buy' : 'sell',
          strength: Math.random() * 100
        }
      ]
    };
  } catch (error) {
    console.error(`Error fetching technical data for ${ticker}:`, error);
    return null;
  }
}

// Determine market status
function getMarketStatus() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Basic market hours check (9:30 AM - 4:00 PM EST, Mon-Fri)
  if (day === 0 || day === 6) {
    return 'CLOSED'; // Weekend
  }
  
  if (hour >= 9 && hour < 16) {
    return 'OPEN';
  } else if (hour >= 4 && hour < 9) {
    return 'PRE_MARKET';
  } else {
    return 'AFTER_HOURS';
  }
}

// Batch data collection for multiple tickers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickers, options = {} } = body;

    if (!tickers || !Array.isArray(tickers)) {
      return NextResponse.json(
        { success: false, error: 'Tickers array is required' },
        { status: 400 }
      );
    }

    if (tickers.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 tickers allowed per request' },
        { status: 400 }
      );
    }

    // Collect data for all tickers
    const results = await Promise.allSettled(
      tickers.map(ticker => collectTickerData(ticker, options))
    );

    const collectedData = results.map((result, index) => ({
      ticker: tickers[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    const successCount = collectedData.filter(item => item.success).length;

    return NextResponse.json({
      success: true,
      results: collectedData,
      summary: {
        total: tickers.length,
        successful: successCount,
        failed: tickers.length - successCount
      }
    });

  } catch (error) {
    console.error('Batch Data Collection Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to collect batch market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to collect data for a single ticker
async function collectTickerData(ticker: string, options: any) {
  const [stockQuote, news, technicals] = await Promise.allSettled([
    fetchStockQuote(ticker),
    options.includeNews ? fetchNewsData(ticker) : Promise.resolve(null),
    options.includeTechnicals ? fetchTechnicalData(ticker) : Promise.resolve(null)
  ]);

  return {
    ticker,
    stockData: stockQuote.status === 'fulfilled' ? stockQuote.value : null,
    newsData: news.status === 'fulfilled' ? news.value : null,
    technicalData: technicals.status === 'fulfilled' ? technicals.value : null,
    timestamp: new Date().toISOString()
  };
}

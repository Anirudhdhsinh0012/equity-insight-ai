import { NextRequest, NextResponse } from 'next/server';

// Mock data generator for demo purposes
function generateMockChartData() {
  const data = [];
  const basePrice = Math.random() * 100 + 50;
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const variation = (Math.random() - 0.5) * 10;
    const price = Math.max(10, basePrice + variation);
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.toISOString(),
      open: price + (Math.random() - 0.5) * 2,
      high: price + Math.random() * 3,
      low: price - Math.random() * 3,
      close: price,
      volume: Math.floor(Math.random() * 10000000),
      sma20: price + (Math.random() - 0.5) * 5,
      sma50: price + (Math.random() - 0.5) * 8,
      sma200: price + (Math.random() - 0.5) * 15,
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 2,
      signal: (Math.random() - 0.5) * 1.5,
    });
  }
  
  return data;
}

/**
 * Price Analytics API
 * GET /api/analytics/prices/[ticker]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const resolvedParams = await params;
    const ticker = resolvedParams.ticker.toUpperCase();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const format = searchParams.get('format') || 'simple';
    const timeframe = searchParams.get('timeframe') || '1M';

    // Validate ticker
    if (!ticker || ticker.length > 10) {
      return NextResponse.json({
        success: false,
        message: 'Invalid ticker symbol',
      }, { status: 400 });
    }

    // Validate format
    const validFormats = ['simple', 'chart', 'technicals', 'detailed'];
    if (!validFormats.includes(format)) {
      return NextResponse.json({
        success: false,
        message: `Invalid format. Must be one of: ${validFormats.join(', ')}`,
      }, { status: 400 });
    }

    console.log(`Fetching price analytics for ${ticker} with format ${format} and timeframe ${timeframe}`);

    // Generate mock data for demo (replace with real API call later)
    const basePrice = Math.random() * 200 + 50;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;

    const mockData = {
      currentPrice: basePrice,
      priceChange: change,
      priceChangePercent: changePercent,
      volume: Math.floor(Math.random() * 50000000),
      marketCap: Math.floor(basePrice * Math.random() * 1000000000),
      sector: 'Technology',
      chartData: generateMockChartData(),
      technicals: {
        rsi: Math.random() * 100,
        macd: (Math.random() - 0.5) * 2,
        signal: (Math.random() - 0.5) * 1.5,
        sma20: basePrice + (Math.random() - 0.5) * 10,
        sma50: basePrice + (Math.random() - 0.5) * 15,
        sma200: basePrice + (Math.random() - 0.5) * 25,
        bollingerBands: {
          upper: basePrice + Math.random() * 10,
          middle: basePrice,
          lower: basePrice - Math.random() * 10,
        },
      },
      signals: ['mock_signal_1', 'mock_signal_2'],
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      momentum: Math.random() > 0.5 ? 'strong' : 'weak',
      support: basePrice - Math.random() * 20,
      resistance: basePrice + Math.random() * 20,
      returns: {
        daily: changePercent,
        weekly: (Math.random() - 0.5) * 15,
        monthly: (Math.random() - 0.5) * 30,
        quarterly: (Math.random() - 0.5) * 50,
        yearly: (Math.random() - 0.5) * 100,
      },
      volatility: {
        daily: Math.random() * 0.05,
        weekly: Math.random() * 0.15,
        annualized: Math.random() * 0.5,
      },
      risk: {
        sharpeRatio: Math.random() * 3,
        beta: Math.random() * 2,
        var95: -Math.random() * 0.1,
        maxDrawdown: -Math.random() * 30,
      },
    };

    let responseData: any = {
      success: true,
      ticker,
      timestamp: new Date().toISOString(),
    };

    switch (format) {
      case 'simple':
        responseData.data = {
          currentPrice: mockData.currentPrice,
          change: mockData.priceChange,
          changePercent: mockData.priceChangePercent,
          volume: mockData.volume,
          marketCap: mockData.marketCap,
          sector: mockData.sector,
        };
        break;

      case 'chart':
        responseData.data = {
          currentPrice: mockData.currentPrice,
          chartData: mockData.chartData,
          technicals: mockData.technicals,
        };
        break;

      case 'technicals':
        // Return technicals as an array of data points for charting
        const technicalDataPoints = [];
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          
          technicalDataPoints.push({
            date: date.toISOString().split('T')[0],
            rsi: Math.random() * 100,
            macd: (Math.random() - 0.5) * 2,
            signal: (Math.random() - 0.5) * 1.5,
            histogram: (Math.random() - 0.5) * 1,
            stochK: Math.random() * 100,
            stochD: Math.random() * 100,
            atr: Math.random() * 5,
            volume: Math.floor(Math.random() * 10000000),
          });
        }
        
        responseData.data = {
          technicals: technicalDataPoints,
          signals: mockData.signals,
          trend: mockData.trend,
          momentum: mockData.momentum,
          support: mockData.support,
          resistance: mockData.resistance,
        };
        break;

      case 'detailed':
        responseData.data = {
          currentPrice: mockData.currentPrice,
          analytics: {
            returns: mockData.returns,
            volatility: mockData.volatility,
            risk: mockData.risk,
          },
          technical: {
            trend: mockData.trend,
            momentum: mockData.momentum,
            support: mockData.support,
            resistance: mockData.resistance,
            signals: mockData.signals,
          },
          priceStats: {
            currentPrice: mockData.currentPrice,
            dayHigh: mockData.currentPrice + Math.random() * 5,
            dayLow: mockData.currentPrice - Math.random() * 5,
            weekHigh52: mockData.currentPrice + Math.random() * 50,
            weekLow52: mockData.currentPrice - Math.random() * 30,
            marketCap: mockData.marketCap,
            peRatio: Math.random() * 30 + 10,
          },
        };
        break;

      default:
        responseData.data = mockData;
    }

    responseData.note = 'Demo data - using mock financial data for testing';

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60', // 1 minute cache for demo
      },
    });

  } catch (error) {
    console.error('Error in price analytics API:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch price analytics',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }, { status: 500 });
  }
}

/**
 * POST request for data refresh
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const resolvedParams = await params;
    const ticker = resolvedParams.ticker.toUpperCase();
    const body = await request.json();

    if (body.action === 'refresh') {
      return NextResponse.json({
        success: true,
        message: 'Mock data refreshed successfully',
        ticker,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action',
    }, { status: 400 });

  } catch (error) {
    console.error('Error in POST price analytics API:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process request',
    }, { status: 500 });
  }
}

/**
 * OPTIONS request for CORS
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

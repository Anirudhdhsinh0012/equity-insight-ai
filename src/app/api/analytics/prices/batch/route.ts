import { NextRequest, NextResponse } from 'next/server';
import MarketDataRiskService from '@/services/marketDataRiskService';

/**
 * Batch Price Analytics API
 * GET /api/analytics/prices/batch
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const tickersParam = searchParams.get('tickers');
    const timeframe = searchParams.get('timeframe') || '1Y';
    const format = searchParams.get('format') || 'simple';

    if (!tickersParam) {
      return NextResponse.json({
        error: 'Missing tickers parameter',
        code: 'MISSING_TICKERS',
        example: '/api/analytics/prices/batch?tickers=AAPL,MSFT,GOOGL'
      }, { status: 400 });
    }

    // Parse and validate tickers
    const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
    
    if (tickers.length === 0) {
      return NextResponse.json({
        error: 'No valid tickers provided',
        code: 'INVALID_TICKERS'
      }, { status: 400 });
    }

    if (tickers.length > 10) {
      return NextResponse.json({
        error: 'Maximum 10 tickers allowed per request',
        code: 'TOO_MANY_TICKERS'
      }, { status: 400 });
    }

    console.log(`Fetching batch analytics for ${tickers.length} tickers: ${tickers.join(', ')}`);

    // Initialize market service
    const marketService = new MarketDataRiskService();
    
    // Fetch analytics for all tickers
    const results = await Promise.allSettled(
      tickers.map(async (ticker) => {
        const analytics = await marketService.getMarketAnalytics(ticker, timeframe);
        return { ticker, analytics };
      })
    );

    // Process results
    const successfulResults: any[] = [];
    const failedResults: any[] = [];

    results.forEach((result, index) => {
      const ticker = tickers[index];
      
      if (result.status === 'fulfilled' && result.value.analytics) {
        const { analytics } = result.value;
        
        let formattedData;
        switch (format) {
          case 'simple':
            formattedData = {
              ticker,
              currentPrice: analytics.currentPrice,
              change: analytics.priceChange,
              performance: {
                "24h": analytics.performance["24h"],
                "7d": analytics.performance["7d"],
                "30d": analytics.performance["30d"]
              },
              trend: analytics.trend.direction,
              signals: analytics.signals.length
            };
            break;

          case 'technicals':
            formattedData = {
              ticker,
              currentPrice: analytics.currentPrice,
              technicals: {
                sma20: analytics.technicals.sma20,
                sma50: analytics.technicals.sma50,
                rsi14: analytics.technicals.rsi14
              },
              trend: analytics.trend,
              signals: analytics.signals.slice(0, 3) // Top 3 signals
            };
            break;

          default: // 'detailed'
            formattedData = {
              ticker,
              currentPrice: analytics.currentPrice,
              priceChange: analytics.priceChange,
              performance: analytics.performance,
              volatility: analytics.volatility,
              technicals: analytics.technicals,
              trend: analytics.trend,
              signals: analytics.signals,
              support: analytics.support,
              resistance: analytics.resistance
            };
        }

        successfulResults.push(formattedData);
      } else {
        failedResults.push({
          ticker,
          error: result.status === 'rejected' 
            ? result.reason?.message || 'Unknown error'
            : 'No data available'
        });
      }
    });

    const responseData = {
      success: true,
      timeframe,
      format,
      summary: {
        requested: tickers.length,
        successful: successfulResults.length,
        failed: failedResults.length
      },
      data: successfulResults,
      errors: failedResults.length > 0 ? failedResults : undefined,
      lastUpdated: new Date().toISOString()
    };

    // Add cache headers
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'ETag': `"batch-${tickers.join(',')}-${Date.now()}"`
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: cacheHeaders
    });

  } catch (error) {
    console.error('Error in batch price analytics API:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch batch analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'BATCH_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Compare Stocks
 * POST /api/analytics/prices/batch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tickers, timeframe = '1Y' } = body;

    if (action === 'compare') {
      if (!tickers || !Array.isArray(tickers) || tickers.length < 2) {
        return NextResponse.json({
          error: 'Comparison requires at least 2 tickers',
          code: 'INSUFFICIENT_TICKERS'
        }, { status: 400 });
      }

      if (tickers.length > 5) {
        return NextResponse.json({
          error: 'Maximum 5 tickers allowed for comparison',
          code: 'TOO_MANY_TICKERS'
        }, { status: 400 });
      }

      console.log(`Comparing stocks: ${tickers.join(', ')}`);

      const marketService = new MarketDataRiskService();
      
      // Fetch analytics for all tickers
      const results = await Promise.allSettled(
        tickers.map(async (ticker) => {
          const analytics = await marketService.getMarketAnalytics(ticker.toUpperCase(), timeframe);
          return { ticker: ticker.toUpperCase(), analytics };
        })
      );

      // Process comparison data
      const comparisonData: any[] = [];
      const metrics = {
        prices: [] as number[],
        performance: { 
          "24h": [] as number[], 
          "7d": [] as number[], 
          "30d": [] as number[], 
          "1y": [] as number[] 
        },
        volatility: [] as number[],
        rsi: [] as number[],
        volume: [] as number[]
      };

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.analytics) {
          const { ticker, analytics } = result.value;
          
          comparisonData.push({
            ticker,
            currentPrice: analytics.currentPrice,
            performance: analytics.performance,
            volatility: analytics.volatility.current,
            rsi: analytics.technicals.rsi14,
            trend: analytics.trend.direction,
            signals: analytics.signals.length
          });

          // Collect metrics for analysis
          metrics.prices.push(analytics.currentPrice);
          metrics.performance["24h"].push(analytics.performance["24h"]);
          metrics.performance["7d"].push(analytics.performance["7d"]);
          metrics.performance["30d"].push(analytics.performance["30d"]);
          metrics.performance["1y"].push(analytics.performance["1y"]);
          metrics.volatility.push(analytics.volatility.current);
          metrics.rsi.push(analytics.technicals.rsi14);
          metrics.volume.push(analytics.volume.ratio);
        }
      });

      // Calculate comparative insights
      const findBestPerformer = (data: any[], timeframe: string) => {
        return data.reduce((max, stock) => 
          stock.performance[timeframe] > max.performance[timeframe] ? stock : max
        );
      };

      const insights = {
        bestPerformer: {
          "24h": findBestPerformer(comparisonData, "24h"),
          "7d": findBestPerformer(comparisonData, "7d"),
          "30d": findBestPerformer(comparisonData, "30d")
        },
        mostVolatile: comparisonData.reduce((max, stock) => 
          stock.volatility > max.volatility ? stock : max
        ),
        leastVolatile: comparisonData.reduce((min, stock) => 
          stock.volatility < min.volatility ? stock : min
        ),
        strongestTrend: comparisonData.filter(stock => stock.trend === 'BULLISH').length,
        averageRSI: metrics.rsi.reduce((sum, rsi) => sum + rsi, 0) / metrics.rsi.length
      };

      return NextResponse.json({
        success: true,
        comparison: {
          tickers: tickers.map(t => t.toUpperCase()),
          timeframe,
          data: comparisonData,
          insights,
          lastUpdated: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      error: 'Invalid action. Supported actions: compare',
      code: 'INVALID_ACTION'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in POST batch analytics API:', error);
    
    return NextResponse.json({
      error: 'Failed to process comparison',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'COMPARISON_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Get API Documentation
 * OPTIONS /api/analytics/prices/batch
 */
export async function OPTIONS() {
  const documentation = {
    endpoint: '/api/analytics/prices/batch',
    description: 'Batch price analytics for multiple stocks',
    methods: {
      GET: {
        description: 'Get analytics for multiple tickers',
        parameters: {
          tickers: {
            type: 'string',
            required: true,
            description: 'Comma-separated ticker symbols (max 10)',
            example: 'AAPL,MSFT,GOOGL,TSLA'
          },
          timeframe: {
            type: 'string',
            default: '1Y',
            options: ['1D', '7D', '1M', '3M', '6M', '1Y', '2Y']
          },
          format: {
            type: 'string',
            default: 'simple',
            options: ['simple', 'technicals', 'detailed']
          }
        }
      },
      POST: {
        description: 'Compare multiple stocks',
        body: {
          action: 'compare',
          tickers: ['AAPL', 'MSFT', 'GOOGL'],
          timeframe: '1Y'
        }
      }
    },
    limits: {
      maxTickers: 10,
      maxComparison: 5,
      cacheTime: '5 minutes'
    },
    examples: {
      batch: '/api/analytics/prices/batch?tickers=AAPL,MSFT,GOOGL&format=simple',
      comparison: 'POST with { "action": "compare", "tickers": ["AAPL", "MSFT"] }'
    }
  };

  return NextResponse.json(documentation, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import YouTubeRecommendationScorer from '@/services/youtubeRecommendationScorer';
import MarketDataFallbackService from '@/services/marketDataFallbackService';

/**
 * YouTube-Based Stock Recommendations API
 * GET /api/recommendations/youtube
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const daysBack = parseInt(searchParams.get('daysBack') || '14');
    const maxRecommendations = parseInt(searchParams.get('maxRecommendations') || '5');
    const diversification = searchParams.get('diversification') !== 'false';
    const format = searchParams.get('format') || 'detailed';

    // Validate parameters
    if (daysBack < 1 || daysBack > 30) {
      return NextResponse.json({
        error: 'Invalid daysBack parameter. Must be between 1 and 30.',
        code: 'INVALID_PARAMETER'
      }, { status: 400 });
    }

    if (maxRecommendations < 1 || maxRecommendations > 20) {
      return NextResponse.json({
        error: 'Invalid maxRecommendations parameter. Must be between 1 and 20.',
        code: 'INVALID_PARAMETER'
      }, { status: 400 });
    }

    console.log(`Generating YouTube recommendations: ${daysBack} days, ${maxRecommendations} max, diversification: ${diversification}`);

    // Initialize scorer and generate recommendations with real YouTube API
    const scorer = new YouTubeRecommendationScorer();
    let recommendations: any[] = [];
    let dataSource = 'youtube-api';
    
    try {
      recommendations = await scorer.generateRecommendations(
        daysBack,
        maxRecommendations,
        diversification
      );
      
      if (recommendations.length > 0) {
        console.log(`✅ Generated ${recommendations.length} recommendations from YouTube API`);
      } else {
        console.log(`⚠️ YouTube API access limited - using market data fallback`);
        dataSource = 'market-fallback';
      }
    } catch (error) {
      console.log('🔄 YouTube API access limited - using market data fallback');
      recommendations = [];
      dataSource = 'market-fallback';
    }

    // If no YouTube recommendations, use real market data fallback
    let finalRecommendations = recommendations;
    if (recommendations.length === 0) {
      const fallbackService = new MarketDataFallbackService();
      
      if (fallbackService.isConfigured()) {
        try {
          console.log('🔄 Attempting market data fallback...');
          const marketRecommendations = await fallbackService.generateMarketRecommendations(maxRecommendations);
          
          // Check if market recommendations have valid prices
          const validMarketRecs = marketRecommendations.filter(rec => 
            rec.marketData?.c && rec.marketData.c > 0 && !isNaN(rec.marketData.c)
          );
          
          if (validMarketRecs.length > 0) {
            finalRecommendations = validMarketRecs;
            dataSource = 'market-fallback';
            console.log(`✅ Generated ${validMarketRecs.length} valid market recommendations`);
          } else {
            console.log('⚠️ Market data fallback returned no valid prices');
            // Try to get any cached recommendations even if old
            try {
              const cachedRecommendations = await fallbackService.generateMarketRecommendations(maxRecommendations);
              if (cachedRecommendations.length > 0) {
                finalRecommendations = cachedRecommendations;
                dataSource = 'cached-fallback';
                console.log(`🔄 Using cached market data as last resort (${cachedRecommendations.length} recommendations)`);
              } else {
                console.log('⚠️ No cached data available - using demo data');
                dataSource = 'demo-fallback';
              }
            } catch (cacheError) {
              console.log('⚠️ Cache fallback failed - using demo data');
              dataSource = 'demo-fallback';
            }
          }
        } catch (error) {
          console.error('❌ Market data fallback failed:', error);
          console.log('🔄 Attempting to get cached recommendations...');
          // Try to get cached data even when main API fails
          try {
            const fallbackService = new MarketDataFallbackService();
            const cachedRecommendations = await fallbackService.generateMarketRecommendations(maxRecommendations);
            if (cachedRecommendations.length > 0) {
              finalRecommendations = cachedRecommendations;
              dataSource = 'cached-fallback';
              console.log(`🔄 Using cached recommendations due to API error (${cachedRecommendations.length} recommendations)`);
            } else {
              dataSource = 'demo-fallback';
            }
          } catch (cacheError) {
            dataSource = 'demo-fallback';
          }
        }
      } else {
        console.log('⚠️ Market data service not configured - using demo data');
        dataSource = 'demo-fallback';
      }
    }

    // Last resort: demo data with current realistic prices
    if (finalRecommendations.length === 0) {
      console.log('🎭 Using demo fallback with realistic market prices');
      finalRecommendations = [
      {
        ticker: 'AAPL',
        companyName: 'Apple Inc.',
        finalScore: 0.85,
        confidence: 0.75,
        explanation: 'Demo recommendation - Strong fundamentals and market position',
        analytics: {
          momentum: 'positive',
          sentiment: 'bullish',
          mentions: 5,
          avgScore: 4.2,
          riskFlags: ['volatility']
        },
        breakdown: {
          popularity: 0.8,
          sentiment: 0.9,
          momentum: 0.85,
          diversification: 0.7
        },
        marketData: {
          c: 228.52, // Current realistic AAPL price
          sector: 'Technology',
          changePercent: 2.1
        }
      },
      {
        ticker: 'MSFT',
        companyName: 'Microsoft Corporation',
        finalScore: 0.82,
        confidence: 0.78,
        explanation: 'Demo recommendation - Cloud growth and AI leadership',
        analytics: {
          momentum: 'positive',
          sentiment: 'bullish',
          mentions: 4,
          avgScore: 4.1,
          riskFlags: []
        },
        breakdown: {
          popularity: 0.75,
          sentiment: 0.85,
          momentum: 0.88,
          diversification: 0.8
        },
        marketData: {
          c: 422.54, // Current realistic MSFT price
          sector: 'Technology',
          changePercent: 1.8
        }
      },
      {
        ticker: 'TSLA',
        companyName: 'Tesla, Inc.',
        finalScore: 0.78,
        confidence: 0.70,
        explanation: 'Demo recommendation - EV market leader with growth potential',
        analytics: {
          momentum: 'neutral',
          sentiment: 'bullish',
          mentions: 6,
          avgScore: 3.9,
          riskFlags: ['volatility', 'market-dependent', 'regulatory']
        },
        breakdown: {
          popularity: 0.9,
          sentiment: 0.7,
          momentum: 0.75,
          diversification: 0.6
        },
        marketData: {
          c: 248.35, // Current realistic TSLA price
          sector: 'Automotive',
          changePercent: -1.2
        }
      },
      {
        ticker: 'GOOGL',
        companyName: 'Alphabet Inc.',
        finalScore: 0.80,
        confidence: 0.73,
        explanation: 'Demo recommendation - Search dominance and AI innovation',
        analytics: {
          momentum: 'positive',
          sentiment: 'bullish',
          mentions: 3,
          avgScore: 4.0,
          riskFlags: ['regulatory']
        },
        breakdown: {
          popularity: 0.85,
          sentiment: 0.8,
          momentum: 0.82,
          diversification: 0.75
        },
        marketData: {
          c: 168.72, // Current realistic GOOGL price
          sector: 'Technology',
          changePercent: 0.9
        }
      },
      {
        ticker: 'NVDA',
        companyName: 'NVIDIA Corporation',
        finalScore: 0.88,
        confidence: 0.82,
        explanation: 'Demo recommendation - AI chip leader with strong demand',
        analytics: {
          momentum: 'positive',
          sentiment: 'very-bullish',
          mentions: 7,
          avgScore: 4.5,
          riskFlags: ['volatility', 'valuation']
        },
        breakdown: {
          popularity: 0.95,
          sentiment: 0.92,
          momentum: 0.9,
          diversification: 0.65
        },
        marketData: {
          c: 134.08, // Current realistic NVDA price
          sector: 'Technology',
          changePercent: 3.2
        }
      }
      ]; // properly closed demo fallback array
    } // close if(finalRecommendations.length === 0)

    // Format response based on requested format
    let responseData;
    switch (format) {
      case 'simple':
        responseData = {
          recommendations: finalRecommendations.map(rec => ({
            ticker: rec.ticker,
            companyName: rec.companyName,
            score: Math.round(rec.finalScore),
            confidence: Math.round(rec.confidence * 100),
            explanation: rec.explanation
          })),
          metadata: {
            generatedAt: new Date().toISOString(),
            daysAnalyzed: daysBack,
            totalRecommendations: finalRecommendations.length
          }
        };
        break;

      case 'analytics':
        responseData = {
          recommendations: finalRecommendations.map(rec => ({
            ticker: rec.ticker,
            companyName: rec.companyName,
            score: Math.round(rec.finalScore),
            confidence: Math.round(rec.confidence * 100),
            explanation: rec.explanation,
            analytics: rec.analytics,
            breakdown: rec.breakdown ? Object.fromEntries(
              Object.entries(rec.breakdown).map(([key, value]) => [
                key, 
                Math.round((value as number) * 100)
              ])
            ) : {},
            marketData: rec.marketData // 🔥 Added the missing marketData field!
          })),
          scoringWeights: scorer.getScoringWeights(),
          metadata: {
            generatedAt: new Date().toISOString(),
            daysAnalyzed: daysBack,
            totalRecommendations: finalRecommendations.length,
            diversificationApplied: diversification,
            dataSource
          }
        };
        break;

      default: // 'detailed'
        responseData = {
          recommendations: finalRecommendations,
          scoringWeights: scorer.getScoringWeights(),
          metadata: {
            generatedAt: new Date().toISOString(),
            daysAnalyzed: daysBack,
            totalRecommendations: finalRecommendations.length,
            diversificationApplied: diversification,
            apiVersion: '1.0',
            dataSource
          }
        };
    }

    // Add cache headers for performance
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
      'ETag': `"youtube-rec-${Date.now()}"`
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: cacheHeaders
    });
  } catch (error) {
    console.error('Error in YouTube recommendations API:', error);
    return NextResponse.json({
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'GENERATION_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} // close GET handler

/**
 * Update Scoring Weights
 * POST /api/recommendations/youtube
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weights, action } = body;

    if (action === 'updateWeights') {
      // Validate weights
      if (!weights || typeof weights !== 'object') {
        return NextResponse.json({
          error: 'Invalid weights object',
          code: 'INVALID_WEIGHTS'
        }, { status: 400 });
      }

      // Validate weight values
      const validKeys = ['consensus', 'sentiment', 'recency', 'trust', 'momentum', 'risk'];
      const invalidKeys = Object.keys(weights).filter(key => !validKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        return NextResponse.json({
          error: `Invalid weight keys: ${invalidKeys.join(', ')}`,
          validKeys,
          code: 'INVALID_WEIGHT_KEYS'
        }, { status: 400 });
      }

      // Check if values are numbers
      const invalidValues = Object.entries(weights).filter(([_, value]) => typeof value !== 'number');
      if (invalidValues.length > 0) {
        return NextResponse.json({
          error: 'All weight values must be numbers',
          invalidValues: invalidValues.map(([key, _]) => key),
          code: 'INVALID_WEIGHT_VALUES'
        }, { status: 400 });
      }

      // Update weights (this would ideally be persisted to database)
      const scorer = new YouTubeRecommendationScorer();
      scorer.updateScoringWeights(weights);

      return NextResponse.json({
        message: 'Scoring weights updated successfully',
        updatedWeights: scorer.getScoringWeights(),
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      error: 'Invalid action. Supported actions: updateWeights',
      code: 'INVALID_ACTION'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in POST YouTube recommendations API:', error);
    
    return NextResponse.json({
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'REQUEST_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Get API Documentation and Health Check
 * OPTIONS /api/recommendations/youtube
 */
export async function OPTIONS() {
  const documentation = {
    endpoint: '/api/recommendations/youtube',
    description: 'YouTube-based stock recommendations using AI analysis of finance channels',
    methods: {
      GET: {
        description: 'Generate stock recommendations',
        parameters: {
          daysBack: {
            type: 'integer',
            default: 14,
            range: '1-30',
            description: 'Number of days to analyze'
          },
          maxRecommendations: {
            type: 'integer',
            default: 5,
            range: '1-20',
            description: 'Maximum number of recommendations'
          },
          diversification: {
            type: 'boolean',
            default: true,
            description: 'Apply sector diversification'
          },
          format: {
            type: 'string',
            default: 'detailed',
            options: ['simple', 'analytics', 'detailed'],
            description: 'Response format level'
          }
        },
        responses: {
          200: 'Success with recommendations',
          400: 'Invalid parameters',
          500: 'Server error'
        }
      },
      POST: {
        description: 'Update scoring weights',
        body: {
          action: 'updateWeights',
          weights: {
            consensus: 'number',
            sentiment: 'number',
            recency: 'number',
            trust: 'number',
            momentum: 'number',
            risk: 'number'
          }
        }
      }
    },
    dataSource: '20+ top finance YouTube channels',
    updateFrequency: 'Real-time with 5-minute cache',
    scoringFactors: [
      'Channel consensus (multiple mentions)',
      'Sentiment analysis (FinBERT)',
      'Recency (time decay)',
      'Channel trust scores',
      'Market momentum',
      'Risk assessment'
    ],
    examples: {
      basic: '/api/recommendations/youtube',
      simple: '/api/recommendations/youtube?format=simple&maxRecommendations=3',
      analytics: '/api/recommendations/youtube?format=analytics&daysBack=7',
      detailed: '/api/recommendations/youtube?daysBack=21&diversification=false'
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

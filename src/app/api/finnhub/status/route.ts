/**
 * API Routes for Finnhub Service Status and Health
 * /api/finnhub/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/services/finnhubService';

/**
 * GET /api/finnhub/status
 * Get API status, quota information, and service health
 */
export async function GET(request: NextRequest) {
  try {
    const healthCheck = await finnhubService.healthCheck();
    const apiStatus = finnhubService.getApiStatus();
    
    // Test API key if requested
    const url = new URL(request.url);
    const testApi = url.searchParams.get('test') === 'true';
    
    let apiKeyTest = null;
    if (testApi) {
      apiKeyTest = await finnhubService.testApiKey();
    }

    return NextResponse.json({
      success: true,
      data: {
        health: healthCheck,
        quota: {
          used: apiStatus.quotaUsed,
          limit: apiStatus.quotaLimit,
          remaining: apiStatus.quotaRemaining,
          resetTime: apiStatus.resetTime.toISOString(),
          isLimitReached: apiStatus.isLimitReached,
          lastUpdated: apiStatus.lastUpdated.toISOString()
        },
        apiKeyTest,
        message: healthCheck.status === 'unhealthy' 
          ? 'Live updates temporarily paused: API usage limit reached, will resume after reset'
          : healthCheck.status === 'degraded'
          ? 'Service running with limited functionality'
          : 'All systems operational'
      }
    });

  } catch (error) {
    console.error('Error fetching service status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * API Routes for Real-Time Monitoring Management
 * /api/finnhub/monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/services/finnhubService';

/**
 * POST /api/finnhub/monitoring/start
 * Start real-time monitoring for user's portfolio
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tickers } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { error: 'Tickers array is required and must not be empty' },
        { status: 400 }
      );
    }

    const normalizedTickers = tickers.map((ticker: string) => ticker.toUpperCase());
    
    await finnhubService.startMonitoring(userId, normalizedTickers);

    return NextResponse.json({
      success: true,
      message: 'Real-time monitoring started',
      data: {
        userId,
        monitoredTickers: normalizedTickers,
        startedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error starting monitoring:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

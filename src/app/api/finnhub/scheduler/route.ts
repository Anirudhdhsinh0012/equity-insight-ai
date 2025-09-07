/**
 * API Routes for Stock Price Scheduler Management
 * /api/finnhub/scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { stockPriceScheduler } from '@/services/stockPriceScheduler';

/**
 * GET /api/finnhub/scheduler
 * Get scheduler status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const status = stockPriceScheduler.getStatus();
    const stats = stockPriceScheduler.getStats();

    return NextResponse.json({
      success: true,
      data: {
        status,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finnhub/scheduler/start
 * Start the price monitoring scheduler
 */
export async function POST(request: NextRequest) {
  try {
    stockPriceScheduler.start();

    return NextResponse.json({
      success: true,
      message: 'Stock price scheduler started',
      data: stockPriceScheduler.getStatus()
    });

  } catch (error) {
    console.error('Error starting scheduler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

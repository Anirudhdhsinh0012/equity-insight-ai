/**
 * API Routes for Scheduler Control Actions
 * /api/finnhub/scheduler/stop
 */

import { NextRequest, NextResponse } from 'next/server';
import { stockPriceScheduler } from '@/services/stockPriceScheduler';

/**
 * POST /api/finnhub/scheduler/stop
 * Stop the price monitoring scheduler
 */
export async function POST(request: NextRequest) {
  try {
    stockPriceScheduler.stop();

    return NextResponse.json({
      success: true,
      message: 'Stock price scheduler stopped',
      data: stockPriceScheduler.getStatus()
    });

  } catch (error) {
    console.error('Error stopping scheduler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

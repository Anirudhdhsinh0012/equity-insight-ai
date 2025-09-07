/**
 * API Routes for Stopping Real-Time Monitoring
 * /api/finnhub/monitoring/stop
 */

import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/services/finnhubService';

/**
 * POST /api/finnhub/monitoring/stop
 * Stop real-time monitoring for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    finnhubService.stopMonitoring(userId);

    return NextResponse.json({
      success: true,
      message: 'Real-time monitoring stopped',
      data: {
        userId,
        stoppedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error stopping monitoring:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

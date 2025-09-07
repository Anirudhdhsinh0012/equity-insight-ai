/**
 * API Routes for Price Alerts Management
 * /api/finnhub/alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/services/finnhubService';

/**
 * GET /api/finnhub/alerts?userId=xxx
 * Get all price alerts for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const alerts = finnhubService.getUserAlerts(userId);

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length
    });

  } catch (error) {
    console.error('Error fetching user alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finnhub/alerts
 * Create a new price alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ticker, upperThreshold, lowerThreshold } = body;

    if (!userId || !ticker) {
      return NextResponse.json(
        { error: 'User ID and ticker are required' },
        { status: 400 }
      );
    }

    if (!upperThreshold && !lowerThreshold) {
      return NextResponse.json(
        { error: 'At least one threshold (upper or lower) is required' },
        { status: 400 }
      );
    }

    if (upperThreshold && upperThreshold <= 0) {
      return NextResponse.json(
        { error: 'Upper threshold must be positive' },
        { status: 400 }
      );
    }

    if (lowerThreshold && lowerThreshold <= 0) {
      return NextResponse.json(
        { error: 'Lower threshold must be positive' },
        { status: 400 }
      );
    }

    if (upperThreshold && lowerThreshold && upperThreshold <= lowerThreshold) {
      return NextResponse.json(
        { error: 'Upper threshold must be greater than lower threshold' },
        { status: 400 }
      );
    }

    const alertId = finnhubService.addPriceAlert({
      userId,
      ticker: ticker.toUpperCase(),
      upperThreshold,
      lowerThreshold,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      data: {
        alertId,
        userId,
        ticker: ticker.toUpperCase(),
        upperThreshold,
        lowerThreshold,
        isActive: true,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error creating price alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/finnhub/alerts
 * Remove a price alert
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const alertId = searchParams.get('alertId');

    if (!userId || !alertId) {
      return NextResponse.json(
        { error: 'User ID and Alert ID are required' },
        { status: 400 }
      );
    }

    const removed = finnhubService.removePriceAlert(userId, alertId);

    if (!removed) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert removed successfully'
    });

  } catch (error) {
    console.error('Error removing price alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API Routes for Position Alerts Management
 * /api/positions/alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { historicalPriceService } from '@/services/historicalPriceService';

/**
 * GET /api/positions/alerts?userId=xxx
 * Get all position alerts for a user
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

    const alerts = historicalPriceService.getUserAlerts(userId);

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
      unreadCount: alerts.filter(a => !a.isRead).length
    });

  } catch (error) {
    console.error('Error fetching position alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/positions/alerts
 * Mark alert as read
 * 
 * Request Body:
 * {
 *   "alertId": "alert_xxx"
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const success = await historicalPriceService.markAlertAsRead(alertId);

    if (!success) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Alert marked as read'
    });

  } catch (error) {
    console.error('Error marking alert as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

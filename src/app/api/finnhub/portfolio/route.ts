/**
 * API Routes for Portfolio Monitoring Management
 * /api/finnhub/portfolio
 */

import { NextRequest, NextResponse } from 'next/server';
import { stockPriceScheduler } from '@/services/stockPriceScheduler';

/**
 * POST /api/finnhub/portfolio
 * Add or update user portfolio for monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tickers, action = 'add' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!tickers || !Array.isArray(tickers)) {
      return NextResponse.json(
        { error: 'Tickers array is required' },
        { status: 400 }
      );
    }

    const normalizedTickers = tickers.map((ticker: string) => ticker.toUpperCase());

    if (action === 'add' || action === 'update') {
      if (action === 'add') {
        stockPriceScheduler.addUserPortfolio(userId, normalizedTickers);
      } else {
        stockPriceScheduler.updateUserPortfolio(userId, normalizedTickers);
      }

      return NextResponse.json({
        success: true,
        message: `Portfolio ${action}ed for monitoring`,
        data: {
          userId,
          tickers: normalizedTickers,
          action
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "update"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error managing portfolio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/finnhub/portfolio?userId=xxx
 * Remove user portfolio from monitoring
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    stockPriceScheduler.removeUserPortfolio(userId);

    return NextResponse.json({
      success: true,
      message: 'Portfolio removed from monitoring',
      data: { userId }
    });

  } catch (error) {
    console.error('Error removing portfolio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

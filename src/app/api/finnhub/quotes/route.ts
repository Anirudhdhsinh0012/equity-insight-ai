/**
 * API Routes for Batch Stock Quotes
 * /api/finnhub/quotes (POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/services/finnhubService';

/**
 * POST /api/finnhub/quotes
 * Get real-time quotes for multiple tickers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tickers, userId } = body;

    if (!tickers || !Array.isArray(tickers)) {
      return NextResponse.json(
        { error: 'Tickers array is required' },
        { status: 400 }
      );
    }

    if (tickers.length === 0) {
      return NextResponse.json(
        { error: 'At least one ticker is required' },
        { status: 400 }
      );
    }

    if (tickers.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 tickers allowed per request' },
        { status: 400 }
      );
    }

    // Normalize tickers to uppercase
    const normalizedTickers = tickers.map((ticker: string) => ticker.toUpperCase());

    const quotes = await finnhubService.getBatchQuotes(normalizedTickers);
    
    // Convert Map to object for JSON response
    const quotesObject: Record<string, any> = {};
    quotes.forEach((quote, ticker) => {
      quotesObject[ticker] = quote;
    });

    // Start monitoring these tickers for the user if userId provided
    if (userId) {
      await finnhubService.startMonitoring(userId, normalizedTickers);
    }

    return NextResponse.json({
      success: true,
      data: quotesObject,
      apiStatus: finnhubService.getApiStatus(),
      requestedTickers: normalizedTickers,
      retrievedCount: quotes.size
    });

  } catch (error) {
    console.error('Error fetching batch quotes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API Routes for Finnhub Real-Time Stock Market Integration
 * /api/finnhub/* endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { finnhubService } from '@/services/finnhubService';

/**
 * GET /api/finnhub/quote/[ticker]
 * Get real-time quote for a specific ticker
 */
// Note: Relaxed context typing to avoid Next.js RouteContext generic mismatch during build
export async function GET(
  request: NextRequest,
  context: { params: { ticker?: string } } | any
) {
  const params = (context?.params ?? {}) as { ticker?: string };
  try {
    const { ticker } = params;
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    const quote = await finnhubService.getCurrentQuote(ticker.toUpperCase());
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Unable to fetch quote for ticker' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
      apiStatus: finnhubService.getApiStatus()
    });

  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

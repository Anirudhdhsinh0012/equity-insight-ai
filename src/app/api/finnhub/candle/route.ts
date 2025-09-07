/**
 * Historical Candle Data API Endpoint
 * Provides OHLC (Open, High, Low, Close) data for charts
 */

import { NextRequest, NextResponse } from 'next/server';

interface FinnhubCandleResponse {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string;   // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

// Cache for candle data
const candleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for real-time data

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, resolution, from, to } = body;

    // Validate required parameters
    if (!symbol || !resolution || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: symbol, resolution, from, to' },
        { status: 400 }
      );
    }

    // Validate symbol format
    if (typeof symbol !== 'string' || symbol.length > 10) {
      return NextResponse.json(
        { error: 'Invalid symbol format' },
        { status: 400 }
      );
    }

    // Validate timestamps
    if (isNaN(from) || isNaN(to) || from >= to) {
      return NextResponse.json(
        { error: 'Invalid timestamp range' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${symbol}-${resolution}-${from}-${to}`;
    const cached = candleCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Get Finnhub API key
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Make request to Finnhub candle endpoint
    const finnhubUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
    
    const response = await fetch(finnhubUrl, {
      headers: {
        'X-Finnhub-Token': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (response.status === 403) {
        console.error(`Finnhub candle API error: 403 - Access denied for symbol ${symbol}`);
        return NextResponse.json(
          { 
            error: 'Historical data access restricted',
            message: 'Your Finnhub API plan does not include access to historical candle data. Please upgrade your subscription.',
            code: 'PLAN_LIMITATION',
            suggestion: 'Upgrade to a paid Finnhub plan for historical chart data access'
          },
          { status: 403 }
        );
      }
      
      console.error(`Finnhub candle API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Historical data temporarily unavailable' },
        { status: 503 }
      );
    }

    const data: FinnhubCandleResponse = await response.json();

    // Check if data is valid
    if (data.s === 'no_data') {
      return NextResponse.json({
        s: 'no_data',
        message: 'No historical data available for this symbol and time range',
        symbol,
        resolution,
        from,
        to,
      });
    }

    if (data.s === 'error') {
      return NextResponse.json(
        { error: 'Error fetching historical data from provider' },
        { status: 400 }
      );
    }

    // Validate data integrity
    if (!data.c || !data.h || !data.l || !data.o || !data.t || !data.v) {
      return NextResponse.json(
        { error: 'Invalid data format received' },
        { status: 500 }
      );
    }

    const dataLength = data.c.length;
    if (data.h.length !== dataLength || 
        data.l.length !== dataLength || 
        data.o.length !== dataLength || 
        data.t.length !== dataLength || 
        data.v.length !== dataLength) {
      return NextResponse.json(
        { error: 'Inconsistent data array lengths' },
        { status: 500 }
      );
    }

    // Format response
    const result = {
      s: data.s,
      c: data.c,
      h: data.h,
      l: data.l,
      o: data.o,
      t: data.t,
      v: data.v,
      symbol,
      resolution,
      from,
      to,
      count: dataLength,
      timestamp: new Date().toISOString(),
    };

    // Cache successful results
    if (data.s === 'ok' && dataLength > 0) {
      candleCache.set(cacheKey, { data: result, timestamp: Date.now() });

      // Clean up old cache entries
      if (candleCache.size > 100) {
        const entries = Array.from(candleCache.entries())
          .sort(([,a], [,b]) => a.timestamp - b.timestamp);
        
        // Remove oldest 25 entries
        for (let i = 0; i < 25; i++) {
          candleCache.delete(entries[i][0]);
        }
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Candle data error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for basic candle data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const resolution = searchParams.get('resolution') || 'D';
  const days = parseInt(searchParams.get('days') || '30');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  // Calculate timestamps
  const to = Math.floor(Date.now() / 1000);
  const from = to - (days * 24 * 60 * 60);

  // Forward to POST handler
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ symbol, resolution, from, to }),
  }));
}

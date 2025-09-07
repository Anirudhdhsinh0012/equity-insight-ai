/**
 * Stock Search API Endpoint
 * Provides autocomplete functionality for stock symbols
 */

import { NextRequest, NextResponse } from 'next/server';

interface FinnhubSearchResponse {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

// Rate limiting
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30; // 30 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = RATE_LIMIT.get(key);

  if (!limit || now > limit.resetTime) {
    RATE_LIMIT.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  limit.count++;
  return true;
}

function getDemoSearchResults(query: string) {
  const demoStocks = [
    { symbol: 'AAPL', description: 'Apple Inc.', type: 'Common Stock' },
    { symbol: 'GOOGL', description: 'Alphabet Inc.', type: 'Common Stock' },
    { symbol: 'MSFT', description: 'Microsoft Corporation', type: 'Common Stock' },
    { symbol: 'AMZN', description: 'Amazon.com Inc.', type: 'Common Stock' },
    { symbol: 'TSLA', description: 'Tesla Inc.', type: 'Common Stock' },
    { symbol: 'META', description: 'Meta Platforms Inc.', type: 'Common Stock' },
    { symbol: 'NVDA', description: 'NVIDIA Corporation', type: 'Common Stock' },
    { symbol: 'NFLX', description: 'Netflix Inc.', type: 'Common Stock' },
    { symbol: 'AMD', description: 'Advanced Micro Devices Inc.', type: 'Common Stock' },
    { symbol: 'INTC', description: 'Intel Corporation', type: 'Common Stock' },
    { symbol: 'BABA', description: 'Alibaba Group Holding Limited', type: 'Common Stock' },
    { symbol: 'TSM', description: 'Taiwan Semiconductor Manufacturing Company Limited', type: 'Common Stock' },
    { symbol: 'V', description: 'Visa Inc.', type: 'Common Stock' },
    { symbol: 'MA', description: 'Mastercard Incorporated', type: 'Common Stock' },
    { symbol: 'JPM', description: 'JPMorgan Chase & Co.', type: 'Common Stock' },
    { symbol: 'JNJ', description: 'Johnson & Johnson', type: 'Common Stock' },
    { symbol: 'WMT', description: 'Walmart Inc.', type: 'Common Stock' },
    { symbol: 'PG', description: 'The Procter & Gamble Company', type: 'Common Stock' },
    { symbol: 'UNH', description: 'UnitedHealth Group Incorporated', type: 'Common Stock' },
    { symbol: 'HD', description: 'The Home Depot Inc.', type: 'Common Stock' },
    { symbol: 'DIS', description: 'The Walt Disney Company', type: 'Common Stock' },
    { symbol: 'BAC', description: 'Bank of America Corporation', type: 'Common Stock' },
    { symbol: 'XOM', description: 'Exxon Mobil Corporation', type: 'Common Stock' },
    { symbol: 'CVX', description: 'Chevron Corporation', type: 'Common Stock' },
    { symbol: 'PFE', description: 'Pfizer Inc.', type: 'Common Stock' },
    { symbol: 'KO', description: 'The Coca-Cola Company', type: 'Common Stock' },
    { symbol: 'ADBE', description: 'Adobe Inc.', type: 'Common Stock' },
    { symbol: 'CRM', description: 'Salesforce Inc.', type: 'Common Stock' },
    { symbol: 'ORCL', description: 'Oracle Corporation', type: 'Common Stock' },
    { symbol: 'IBM', description: 'International Business Machines Corporation', type: 'Common Stock' }
  ];

  const queryUpper = query.toUpperCase();
  
  return demoStocks
    .filter(stock => 
      stock.symbol.includes(queryUpper) || 
      stock.description.toUpperCase().includes(queryUpper)
    )
    .sort((a, b) => {
      // Prioritize exact symbol matches
      const aExact = a.symbol === queryUpper;
      const bExact = b.symbol === queryUpper;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then prioritize symbol prefix matches
      const aPrefix = a.symbol.startsWith(queryUpper);
      const bPrefix = b.symbol.startsWith(queryUpper);
      
      if (aPrefix && !bPrefix) return -1;
      if (!aPrefix && bPrefix) return 1;
      
      // Finally sort alphabetically
      return a.symbol.localeCompare(b.symbol);
    })
    .slice(0, 10)
    .map(stock => ({
      symbol: stock.symbol,
      displaySymbol: stock.symbol,
      description: stock.description,
      type: stock.type,
      label: `${stock.symbol} - ${stock.description}`
    }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const normalizedQuery = query.trim().toLowerCase();

    // Check cache
    const cached = searchCache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Get Finnhub API key
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey || apiKey === 'your_finnhub_api_key_here') {
      // Return demo data when API key is not configured
      const demoResults = getDemoSearchResults(query);
      return NextResponse.json({
        count: demoResults.length,
        result: demoResults,
        query: query,
        timestamp: new Date().toISOString(),
        demo: true,
        message: 'Using demo data. Configure FINNHUB_API_KEY for real data.'
      });
    }

    // Make request to Finnhub
    const finnhubUrl = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`;
    
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
      
      console.error(`Finnhub search API error: ${response.status}`);
      return NextResponse.json(
        { error: 'Stock search temporarily unavailable' },
        { status: 503 }
      );
    }

    const data: FinnhubSearchResponse = await response.json();
    
    // Filter and format results
    const filteredResults = (data.result || [])
      .filter(stock => {
        // Filter for common stocks and valid symbols
        const isStock = stock.type === 'Common Stock' || !stock.type;
        const hasValidSymbol = stock.symbol && stock.symbol.length <= 5;
        const hasDescription = stock.description && stock.description.trim().length > 0;
        const isUSStock = !stock.symbol.includes('.') || stock.symbol.endsWith('.US');
        
        return isStock && hasValidSymbol && hasDescription && isUSStock;
      })
      .sort((a, b) => {
        // Prioritize exact symbol matches
        const queryUpper = query.toUpperCase();
        const aExact = a.symbol === queryUpper;
        const bExact = b.symbol === queryUpper;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then prioritize symbol prefix matches
        const aPrefix = a.symbol.startsWith(queryUpper);
        const bPrefix = b.symbol.startsWith(queryUpper);
        
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;
        
        // Finally sort alphabetically
        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 10)
      .map(stock => ({
        symbol: stock.symbol.replace('.US', ''), // Remove .US suffix
        displaySymbol: stock.displaySymbol?.replace('.US', '') || stock.symbol.replace('.US', ''),
        description: stock.description,
        type: stock.type,
        label: `${stock.symbol.replace('.US', '')} - ${stock.description}`
      }));

    const result = {
      count: filteredResults.length,
      result: filteredResults,
      query: query,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    searchCache.set(normalizedQuery, { data: result, timestamp: Date.now() });

    // Clean up old cache entries
    if (searchCache.size > 200) {
      const entries = Array.from(searchCache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      // Remove oldest 50 entries
      for (let i = 0; i < 50; i++) {
        searchCache.delete(entries[i][0]);
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

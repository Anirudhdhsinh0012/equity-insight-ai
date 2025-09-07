/**
 * Simplified Stock Search API Endpoint
 * GET /api/search?query=AAPL
 * Returns valid ticker + name list from Finnhub
 */

import { NextRequest, NextResponse } from 'next/server';

interface StockSearchResult {
  symbol: string;
  name: string;
}

// Rate limiting
const searchCache = new Map<string, { data: StockSearchResult[]; timestamp: number }>();
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

function getDemoSearchResults(query: string): StockSearchResult[] {
  const demoStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
    { symbol: 'INTC', name: 'Intel Corporation' },
    { symbol: 'BABA', name: 'Alibaba Group Holding Limited' },
    { symbol: 'TSM', name: 'Taiwan Semiconductor Manufacturing Company Limited' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'MA', name: 'Mastercard Incorporated' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'PG', name: 'The Procter & Gamble Company' },
    { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' },
    { symbol: 'HD', name: 'The Home Depot Inc.' },
    { symbol: 'DIS', name: 'The Walt Disney Company' },
    { symbol: 'BAC', name: 'Bank of America Corporation' },
    { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
    { symbol: 'CVX', name: 'Chevron Corporation' },
    { symbol: 'PFE', name: 'Pfizer Inc.' },
    { symbol: 'KO', name: 'The Coca-Cola Company' },
    { symbol: 'ADBE', name: 'Adobe Inc.' },
    { symbol: 'CRM', name: 'Salesforce Inc.' },
    { symbol: 'ORCL', name: 'Oracle Corporation' },
    { symbol: 'IBM', name: 'International Business Machines Corporation' }
  ];

  const queryUpper = query.toUpperCase();
  
  return demoStocks
    .filter(stock => 
      stock.symbol.includes(queryUpper) || 
      stock.name.toUpperCase().includes(queryUpper)
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
    .slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim().length < 1) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    if (query.trim().length < 2) {
      return NextResponse.json([]);
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
    
    let results: StockSearchResult[] = [];

    if (!apiKey || apiKey === 'your_finnhub_api_key_here') {
      // Use demo data when API key is not configured
      results = getDemoSearchResults(query);
    } else {
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
            { error: 'Stock data temporarily unavailable, please try again later.' },
            { status: 429 }
          );
        }
        
        if (response.status === 422) {
          console.log(`Finnhub search API error: 422 - Invalid query format for "${query}", using demo data`);
          // Fallback to demo data on invalid query format
          results = getDemoSearchResults(query);
        } else {
          console.error(`Finnhub search API error: ${response.status}`);
          // Fallback to demo data on other API errors
          results = getDemoSearchResults(query);
        }
      } else {
        const data = await response.json();
        
        // Format Finnhub results to our simplified format
        results = (data.result || [])
          .filter((stock: any) => {
            const isStock = stock.type === 'Common Stock' || !stock.type;
            const hasValidSymbol = stock.symbol && stock.symbol.length <= 5;
            const hasDescription = stock.description && stock.description.trim().length > 0;
            const isUSStock = !stock.symbol.includes('.') || stock.symbol.endsWith('.US');
            
            return isStock && hasValidSymbol && hasDescription && isUSStock;
          })
          .slice(0, 10)
          .map((stock: any) => ({
            symbol: stock.symbol.replace('.US', ''),
            name: stock.description
          }));
      }
    }

    // Cache the results
    searchCache.set(normalizedQuery, { data: results, timestamp: Date.now() });

    // Clean up old cache entries
    if (searchCache.size > 200) {
      const entries = Array.from(searchCache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      // Remove oldest 50 entries
      for (let i = 0; i < 50; i++) {
        searchCache.delete(entries[i][0]);
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

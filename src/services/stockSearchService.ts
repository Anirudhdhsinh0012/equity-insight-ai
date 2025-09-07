/**
 * Stock Search Service for autocomplete functionality
 * Uses Finnhub API to search for stock symbols and company names
 */

interface FinnhubSearchResult {
  description: string; // Company name
  displaySymbol: string; // Display ticker
  symbol: string; // Actual ticker
  type: string; // Type of security
}

interface SearchCacheEntry {
  results: FinnhubSearchResult[];
  timestamp: number;
}

class StockSearchService {
  private cache = new Map<string, SearchCacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_SEARCH_LENGTH = 2;
  private readonly API_BASE_URL = '/api/finnhub';

  /**
   * Search for stocks with autocomplete functionality
   */
  async searchStocks(query: string): Promise<FinnhubSearchResult[]> {
    if (!query || query.length < this.MIN_SEARCH_LENGTH) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    
    // Check cache first
    const cached = this.getCachedResults(normalizedQuery);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API_LIMIT_EXCEEDED');
        }
        
        // Get more details about the error
        let errorDetails = '';
        try {
          const errorData = await response.text();
          errorDetails = errorData ? ` - ${errorData}` : '';
        } catch {
          // Ignore error getting details
        }
        
        console.error(`Search API Error: ${response.status} ${response.statusText}${errorDetails}`);
        
        // For 500 errors, provide a more user-friendly message
        if (response.status === 500) {
          throw new Error('SERVICE_UNAVAILABLE');
        }
        
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data || typeof data !== 'object') {
        console.error('Invalid response format:', data);
        return [];
      }
      
      // Check if this is demo mode
      if (data.demo) {
        console.log('Using demo data for stock search');
      }
      
      const results = data.result || [];

      // Filter and sort results
      const filteredResults = this.filterAndSortResults(results, query);

      // Cache the results
      this.cacheResults(normalizedQuery, filteredResults);

      return filteredResults;

    } catch (error) {
      console.error('Stock search error:', error);
      
      if (error instanceof Error) {
        if (error.message === 'API_LIMIT_EXCEEDED') {
          throw error;
        }
        if (error.message === 'SERVICE_UNAVAILABLE') {
          throw new Error('Stock search service temporarily unavailable. Please try again in a moment.');
        }
      }
      
      // For network errors or other issues, return empty results
      return [];
    }
  }

  /**
   * Get stock details for a specific symbol
   */
  async getStockDetails(symbol: string): Promise<FinnhubSearchResult | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/search?q=${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const results = data.result || [];
      
      // Find exact match or closest match
      return results.find((stock: FinnhubSearchResult) => 
        stock.symbol.toLowerCase() === symbol.toLowerCase()
      ) || results[0] || null;

    } catch (error) {
      console.error('Stock details error:', error);
      return null;
    }
  }

  /**
   * Filter and sort search results for better relevance
   */
  private filterAndSortResults(results: FinnhubSearchResult[], query: string): FinnhubSearchResult[] {
    const queryLower = query.toLowerCase();
    
    return results
      .filter(stock => {
        // Filter out non-stock types and irrelevant results
        const isStock = stock.type === 'Common Stock' || !stock.type;
        const hasValidSymbol = stock.symbol && stock.symbol.length <= 5;
        const hasDescription = stock.description && stock.description.trim().length > 0;
        
        return isStock && hasValidSymbol && hasDescription;
      })
      .sort((a, b) => {
        // Prioritize exact symbol matches
        const aSymbolMatch = a.symbol.toLowerCase().startsWith(queryLower);
        const bSymbolMatch = b.symbol.toLowerCase().startsWith(queryLower);
        
        if (aSymbolMatch && !bSymbolMatch) return -1;
        if (!aSymbolMatch && bSymbolMatch) return 1;
        
        // Then prioritize company name matches
        const aNameMatch = a.description.toLowerCase().includes(queryLower);
        const bNameMatch = b.description.toLowerCase().includes(queryLower);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Finally sort alphabetically by symbol
        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 10); // Limit to 10 results
  }

  /**
   * Get cached results if available and not expired
   */
  private getCachedResults(query: string): FinnhubSearchResult[] | null {
    const cached = this.cache.get(query);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.results;
    }
    
    // Clean up expired cache entry
    if (cached) {
      this.cache.delete(query);
    }
    
    return null;
  }

  /**
   * Cache search results
   */
  private cacheResults(query: string, results: FinnhubSearchResult[]): void {
    this.cache.set(query, {
      results,
      timestamp: Date.now()
    });

    // Clean up old cache entries if cache gets too large
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Format stock for display in dropdown
   */
  formatStockOption(stock: FinnhubSearchResult): string {
    return `${stock.symbol} - ${stock.description}`;
  }
}

export const stockSearchService = new StockSearchService();
export type { FinnhubSearchResult };

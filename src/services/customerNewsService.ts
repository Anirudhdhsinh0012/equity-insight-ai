// Customer News Service - Auto-fetching from multiple news APIs
export interface CustomerNewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  source: string;
  category: string;
  publishedAt: Date;
  imageUrl?: string;
  url: string;
  tags: string[];
  relatedStocks?: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  readTime: number; // estimated minutes
  isBreaking?: boolean;
  language: string;
  country: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string; name: string };
    author: string;
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    content: string;
  }>;
}

interface GNewsResponse {
  articles: Array<{
    title: string;
    description: string;
    content: string;
    url: string;
    image: string;
    publishedAt: string;
    source: { name: string; url: string };
  }>;
}

class CustomerNewsService {
  private articles: CustomerNewsArticle[] = [];
  private subscribers: Array<(articles: CustomerNewsArticle[]) => void> = [];
  private isLoading = false;
  private lastFetchTime = 0;
  private refreshInterval: NodeJS.Timeout | null = null;
  
  // API keys and endpoints
  private readonly NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || 'demo_key';
  private readonly GNEWS_API_KEY = process.env.NEXT_PUBLIC_GNEWS_API_KEY || 'demo_key';
  
  private readonly FINANCIAL_KEYWORDS = [
    'stock market', 'stocks', 'finance', 'investment', 'trading',
    'NYSE', 'NASDAQ', 'S&P 500', 'Dow Jones', 'cryptocurrency',
    'bitcoin', 'ethereum', 'fed', 'federal reserve', 'interest rates',
    'inflation', 'economy', 'earnings', 'IPO', 'merger', 'acquisition'
  ];

  private readonly MAJOR_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK.B', 'JPM', 'V'
  ];

  constructor() {
    this.loadArticlesFromStorage();
    this.startAutoRefresh();
  }

  // Subscribe to news updates
  subscribe(callback: (articles: CustomerNewsArticle[]) => void) {
    this.subscribers.push(callback);
    // Immediately send current articles
    callback(this.articles);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.articles));
  }

  // Get all articles with optional filtering
  getArticles(filters?: {
    category?: string;
    limit?: number;
    dateFrom?: Date;
    search?: string;
  }): CustomerNewsArticle[] {
    let filteredArticles = [...this.articles];

    if (filters?.category && filters.category !== 'all') {
      filteredArticles = filteredArticles.filter(article => 
        article.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    if (filters?.dateFrom) {
      filteredArticles = filteredArticles.filter(article => 
        article.publishedAt >= filters.dateFrom!
      );
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        article.summary.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by published date (newest first)
    filteredArticles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    if (filters?.limit) {
      filteredArticles = filteredArticles.slice(0, filters.limit);
    }

    return filteredArticles;
  }

  // Get breaking news
  getBreakingNews(): CustomerNewsArticle[] {
    return this.articles
      .filter(article => article.isBreaking)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, 5);
  }

  // Get trending topics
  getTrendingTopics(): Array<{ topic: string; count: number }> {
    const tagCount = new Map<string, number>();
    
    this.articles.forEach(article => {
      article.tags.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCount.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Fetch news from multiple sources
  async fetchLatestNews(): Promise<void> {
    if (this.isLoading) return;
    
    const now = Date.now();
    // Prevent too frequent requests (minimum 5 minutes between fetches)
    if (now - this.lastFetchTime < 5 * 60 * 1000) return;

    this.isLoading = true;
    this.lastFetchTime = now;

    try {
      const allArticles: CustomerNewsArticle[] = [];

      // Fetch from multiple sources in parallel
      const fetchPromises = [
        this.fetchFromNewsAPI(),
        this.fetchFromGNews(),
        this.fetchFromBenzinga(),
        this.fetchFinancialRSSFeeds()
      ];

      const results = await Promise.allSettled(fetchPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allArticles.push(...result.value);
        } else {
          console.warn(`News source ${index} failed:`, result.reason);
        }
      });

      // Remove duplicates and merge with existing articles
      const uniqueArticles = this.removeDuplicates([...allArticles, ...this.articles]);
      
      // Keep only last 500 articles to prevent memory issues
      this.articles = uniqueArticles
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 500);

      this.saveArticlesToStorage();
      this.notifySubscribers();

    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Fetch from NewsAPI
  private async fetchFromNewsAPI(): Promise<CustomerNewsArticle[]> {
    const articles: CustomerNewsArticle[] = [];
    
    try {
      // Financial news
      const queries = [
        'stock market OR stocks OR NYSE OR NASDAQ',
        'cryptocurrency OR bitcoin OR ethereum',
        'federal reserve OR interest rates OR inflation',
        'earnings OR IPO OR merger OR acquisition'
      ];

      for (const query of queries) {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${this.NEWS_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const data: NewsAPIResponse = await response.json();
        
        data.articles.forEach(article => {
          if (this.isFinancialNews(article.title + ' ' + article.description)) {
            articles.push(this.transformNewsAPIArticle(article));
          }
        });
      }
    } catch (error) {
      console.warn('NewsAPI fetch failed:', error);
    }

    return articles;
  }

  // Fetch from GNews
  private async fetchFromGNews(): Promise<CustomerNewsArticle[]> {
    const articles: CustomerNewsArticle[] = [];
    
    try {
      const queries = ['stock market', 'cryptocurrency', 'federal reserve', 'wall street'];
      
      for (const query of queries) {
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=us&max=20&apikey=${this.GNEWS_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const data: GNewsResponse = await response.json();
        
        data.articles.forEach(article => {
          articles.push(this.transformGNewsArticle(article));
        });
      }
    } catch (error) {
      console.warn('GNews fetch failed:', error);
    }

    return articles;
  }

  // Fetch from existing Benzinga API
  private async fetchFromBenzinga(): Promise<CustomerNewsArticle[]> {
    const articles: CustomerNewsArticle[] = [];
    const base = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') : '';
    try {
      for (const stock of this.MAJOR_STOCKS.slice(0, 5)) {
        const url = `${base}/api/news/benzinga?ticker=${stock}&limit=10&days=1`;
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        if (data.success && data.news) {
          data.news.forEach((article: any) => {
            articles.push(this.transformBenzingaArticle(article, stock));
          });
        }
      }
    } catch (error) {
      console.warn('Benzinga fetch failed:', error);
    }
    return articles;
  }

  // Fetch from RSS feeds
  private async fetchFinancialRSSFeeds(): Promise<CustomerNewsArticle[]> {
    const articles: CustomerNewsArticle[] = [];
    
    // Since we can't directly fetch RSS due to CORS, we'll use mock data
    // In a real implementation, you'd use a backend proxy or RSS-to-JSON service
    const mockRSSData = [
      {
        title: 'Market Analysis: Tech Stocks Lead Pre-Market Trading',
        description: 'Technology stocks show strong momentum in pre-market trading as investors await quarterly earnings reports.',
        link: 'https://example.com/tech-stocks-analysis',
        pubDate: new Date().toISOString(),
        source: 'Financial Wire'
      },
      {
        title: 'Federal Reserve Signals Potential Rate Changes',
        description: 'Fed officials hint at possible adjustments to interest rates based on recent economic indicators.',
        link: 'https://example.com/fed-signals',
        pubDate: new Date(Date.now() - 3600000).toISOString(),
        source: 'Economic Times'
      }
    ];

    mockRSSData.forEach(item => {
      articles.push({
        id: `rss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: item.title,
        summary: item.description,
        content: item.description + ' Read more at the source for complete details.',
        author: 'RSS Feed',
        source: item.source,
        category: 'market',
        publishedAt: new Date(item.pubDate),
        url: item.link,
        tags: this.extractTags(item.title + ' ' + item.description),
        relatedStocks: this.extractStockSymbols(item.title + ' ' + item.description),
        sentiment: 'neutral',
        readTime: 2,
        language: 'en',
        country: 'US'
      });
    });

    return articles;
  }

  // Transform functions for different APIs
  private transformNewsAPIArticle(article: any): CustomerNewsArticle {
    return {
      id: `newsapi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: article.title,
      summary: article.description || '',
      content: article.content || article.description || '',
      author: article.author || 'Unknown',
      source: article.source.name,
      category: this.categorizeNews(article.title + ' ' + article.description),
      publishedAt: new Date(article.publishedAt),
      imageUrl: article.urlToImage,
      url: article.url,
      tags: this.extractTags(article.title + ' ' + article.description),
      relatedStocks: this.extractStockSymbols(article.title + ' ' + article.description),
      sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
      readTime: this.estimateReadTime(article.content || article.description || ''),
      isBreaking: this.isBreakingNews(article.title),
      language: 'en',
      country: 'US'
    };
  }

  private transformGNewsArticle(article: any): CustomerNewsArticle {
    return {
      id: `gnews_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: article.title,
      summary: article.description || '',
      content: article.content || article.description || '',
      author: 'GNews',
      source: article.source.name,
      category: this.categorizeNews(article.title + ' ' + article.description),
      publishedAt: new Date(article.publishedAt),
      imageUrl: article.image,
      url: article.url,
      tags: this.extractTags(article.title + ' ' + article.description),
      relatedStocks: this.extractStockSymbols(article.title + ' ' + article.description),
      sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
      readTime: this.estimateReadTime(article.content || article.description || ''),
      isBreaking: this.isBreakingNews(article.title),
      language: 'en',
      country: 'US'
    };
  }

  private transformBenzingaArticle(article: any, relatedStock: string): CustomerNewsArticle {
    return {
      id: `benzinga_${article.id || Date.now()}`,
      title: article.title,
      summary: article.summary || article.teaser || '',
      content: article.body || article.summary || '',
      author: 'Benzinga',
      source: 'Benzinga',
      category: 'stocks',
      publishedAt: new Date(article.created || article.publishedAt),
      url: article.url,
      tags: [relatedStock, 'Stock News', 'Market Analysis'],
      relatedStocks: [relatedStock],
      sentiment: this.analyzeSentiment(article.title),
      readTime: this.estimateReadTime(article.body || article.summary || ''),
      isBreaking: false,
      language: 'en',
      country: 'US'
    };
  }

  // Helper functions
  private isFinancialNews(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.FINANCIAL_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }

  private categorizeNews(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('crypto') || lowerText.includes('bitcoin') || lowerText.includes('ethereum')) {
      return 'crypto';
    }
    if (lowerText.includes('stock') || lowerText.includes('NYSE') || lowerText.includes('NASDAQ')) {
      return 'stocks';
    }
    if (lowerText.includes('fed') || lowerText.includes('interest rate') || lowerText.includes('inflation')) {
      return 'economy';
    }
    if (lowerText.includes('earnings') || lowerText.includes('IPO') || lowerText.includes('merger')) {
      return 'earnings';
    }
    if (lowerText.includes('tech') || lowerText.includes('AI') || lowerText.includes('software')) {
      return 'technology';
    }
    
    return 'market';
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Add relevant tags based on content
    if (lowerText.includes('breaking')) tags.push('Breaking News');
    if (lowerText.includes('earnings')) tags.push('Earnings');
    if (lowerText.includes('merger') || lowerText.includes('acquisition')) tags.push('M&A');
    if (lowerText.includes('IPO')) tags.push('IPO');
    if (lowerText.includes('crypto') || lowerText.includes('bitcoin')) tags.push('Cryptocurrency');
    if (lowerText.includes('fed') || lowerText.includes('federal reserve')) tags.push('Federal Reserve');
    
    return tags;
  }

  private extractStockSymbols(text: string): string[] {
    const symbols: string[] = [];
    
    // Look for major stock symbols in the text
    this.MAJOR_STOCKS.forEach(symbol => {
      if (text.toUpperCase().includes(symbol)) {
        symbols.push(symbol);
      }
    });
    
    return symbols;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    const positiveWords = ['gain', 'rise', 'up', 'surge', 'rally', 'strong', 'growth', 'profit', 'bull'];
    const negativeWords = ['fall', 'drop', 'down', 'crash', 'decline', 'loss', 'weak', 'bear', 'recession'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private estimateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  private isBreakingNews(title: string): boolean {
    const breakingKeywords = ['breaking', 'urgent', 'alert', 'just in', 'live'];
    const lowerTitle = title.toLowerCase();
    return breakingKeywords.some(keyword => lowerTitle.includes(keyword));
  }

  private removeDuplicates(articles: CustomerNewsArticle[]): CustomerNewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private startAutoRefresh() {
    // Fetch initial news
    this.fetchLatestNews();
    
    // Set up auto-refresh every 30 minutes
    this.refreshInterval = setInterval(() => {
      this.fetchLatestNews();
    }, 30 * 60 * 1000);
  }

  private saveArticlesToStorage() {
    if (typeof window === 'undefined' || !('localStorage' in window)) return; // SSR guard
    try {
      // Save only the last 100 articles to localStorage
      const articlesToSave = this.articles.slice(0, 100);
      localStorage.setItem('customerNewsArticles', JSON.stringify(articlesToSave));
    } catch (error) {
      console.warn('Failed to save articles to localStorage:', error);
    }
  }

  private loadArticlesFromStorage() {
    if (typeof window === 'undefined' || !('localStorage' in window)) return; // SSR guard
    try {
      const savedArticles = localStorage.getItem('customerNewsArticles');
      if (savedArticles) {
        this.articles = JSON.parse(savedArticles).map((article: any) => ({
          ...article,
          publishedAt: new Date(article.publishedAt)
        }));
      }
    } catch (error) {
      console.warn('Failed to load articles from localStorage:', error);
    }
  }

  // Force refresh
  async forceRefresh(): Promise<void> {
    this.lastFetchTime = 0; // Reset the throttle
    await this.fetchLatestNews();
  }

  // Clean up
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

export const customerNewsService = new CustomerNewsService();
export default customerNewsService;

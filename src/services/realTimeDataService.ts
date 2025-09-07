/**
 * Real-time Data Management Service
 * Handles all real-time data operations for admin and user sync
 * Uses local storage with real-time API integration
 */

interface RealTimeDataService {
  // User Management
  users: RealTimeUsersService;
  // Stock Management
  stocks: RealTimeStocksService;
  // Quiz Management
  quizzes: RealTimeQuizzesService;
  // News Management
  news: RealTimeNewsService;
  // Real-time sync
  sync: RealTimeSyncService;
}

// Real-time Users Service
class RealTimeUsersService {
  private subscribers: Array<(users: DatabaseUser[]) => void> = [];
  private users: DatabaseUser[] = [];

  constructor() {
    this.loadUsers();
    this.startRealTimeUpdates();
  }

  private loadUsers() {
    const stored = localStorage.getItem('realtime_users');
    if (stored) {
      this.users = JSON.parse(stored);
    } else {
      // Initialize with current auth service users
      this.migrateFromAuthService();
    }
  }

  private migrateFromAuthService() {
    try {
      const authUsers = JSON.parse(localStorage.getItem('stockAdvisorUsers') || '[]');
      this.users = authUsers.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber || '',
        registrationDate: user.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'active' as const,
        portfolioValue: this.calculatePortfolioValue(user.id),
        totalTrades: this.calculateTotalTrades(user.id),
        watchlistItems: this.calculateWatchlistItems(user.id),
        quizzesCompleted: 0,
        subscriptionTier: 'free' as const,
        createdAt: new Date(user.createdAt || Date.now()),
        updatedAt: new Date()
      }));
      this.saveUsers();
    } catch (error) {
      console.error('Error migrating users:', error);
    }
  }

  private calculatePortfolioValue(userId: string): number {
    try {
      const userStocks = JSON.parse(localStorage.getItem(`stocks_${userId}`) || '[]');
      return userStocks.reduce((total: number, stock: any) => {
        return total + (stock.quantity * stock.buyPrice);
      }, 0);
    } catch {
      return 0;
    }
  }

  private calculateTotalTrades(userId: string): number {
    try {
      const userStocks = JSON.parse(localStorage.getItem(`stocks_${userId}`) || '[]');
      return userStocks.length;
    } catch {
      return 0;
    }
  }

  private calculateWatchlistItems(userId: string): number {
    try {
      const userStocks = JSON.parse(localStorage.getItem(`stocks_${userId}`) || '[]');
      return userStocks.length;
    } catch {
      return 0;
    }
  }

  private saveUsers() {
    localStorage.setItem('realtime_users', JSON.stringify(this.users));
    this.notifySubscribers();
  }

  private startRealTimeUpdates() {
    // Update user data every 30 seconds
    setInterval(() => {
      this.updateUserMetrics();
    }, 30000);
  }

  private updateUserMetrics() {
    let updated = false;
    this.users = this.users.map(user => {
      const newPortfolioValue = this.calculatePortfolioValue(user.id);
      const newTotalTrades = this.calculateTotalTrades(user.id);
      const newWatchlistItems = this.calculateWatchlistItems(user.id);

      if (newPortfolioValue !== user.portfolioValue || 
          newTotalTrades !== user.totalTrades || 
          newWatchlistItems !== user.watchlistItems) {
        updated = true;
        return {
          ...user,
          portfolioValue: newPortfolioValue,
          totalTrades: newTotalTrades,
          watchlistItems: newWatchlistItems,
          updatedAt: new Date()
        };
      }
      return user;
    });

    if (updated) {
      this.saveUsers();
    }
  }

  subscribe(callback: (users: DatabaseUser[]) => void) {
    this.subscribers.push(callback);
    callback(this.users); // Send initial data
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.users));
  }

  async createUser(userData: Omit<DatabaseUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newUser: DatabaseUser = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.push(newUser);
    this.saveUsers();
    
    return newUser.id;
  }

  async updateUser(userId: string, userData: Partial<DatabaseUser>): Promise<void> {
    const index = this.users.findIndex(user => user.id === userId);
    if (index !== -1) {
      this.users[index] = {
        ...this.users[index],
        ...userData,
        updatedAt: new Date()
      };
      this.saveUsers();
    }
  }

  async deleteUser(userId: string): Promise<void> {
    this.users = this.users.filter(user => user.id !== userId);
    this.saveUsers();
  }

  getUsers(): DatabaseUser[] {
    return this.users;
  }

  getUser(userId: string): DatabaseUser | null {
    return this.users.find(user => user.id === userId) || null;
  }
}

// Real-time Stocks Service
class RealTimeStocksService {
  private subscribers: Array<(stocks: DatabaseStock[]) => void> = [];
  private stocks: DatabaseStock[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadStocks();
    this.startRealTimeUpdates();
  }

  private loadStocks() {
    const stored = localStorage.getItem('realtime_stocks');
    if (stored) {
      this.stocks = JSON.parse(stored);
    } else {
      this.initializeDefaultStocks();
    }
  }

  private initializeDefaultStocks() {
    this.stocks = [
      {
        id: '1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        currentPrice: 0,
        change24h: 0,
        changePercent24h: 0,
        marketCap: '2.9T',
        volume24h: 0,
        watchersCount: 0,
        holdersCount: 0,
        avgHoldingValue: 0,
        totalHoldingValue: 0,
        sentiment: 'neutral' as const,
        riskLevel: 'medium' as const,
        lastUpdated: new Date()
      },
      {
        id: '2',
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        sector: 'Technology',
        currentPrice: 0,
        change24h: 0,
        changePercent24h: 0,
        marketCap: '2.0T',
        volume24h: 0,
        watchersCount: 0,
        holdersCount: 0,
        avgHoldingValue: 0,
        totalHoldingValue: 0,
        sentiment: 'neutral' as const,
        riskLevel: 'medium' as const,
        lastUpdated: new Date()
      },
      {
        id: '3',
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        sector: 'Technology',
        currentPrice: 0,
        change24h: 0,
        changePercent24h: 0,
        marketCap: '2.8T',
        volume24h: 0,
        watchersCount: 0,
        holdersCount: 0,
        avgHoldingValue: 0,
        totalHoldingValue: 0,
        sentiment: 'neutral' as const,
        riskLevel: 'low' as const,
        lastUpdated: new Date()
      },
      {
        id: '4',
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        sector: 'Automotive',
        currentPrice: 0,
        change24h: 0,
        changePercent24h: 0,
        marketCap: '792B',
        volume24h: 0,
        watchersCount: 0,
        holdersCount: 0,
        avgHoldingValue: 0,
        totalHoldingValue: 0,
        sentiment: 'neutral' as const,
        riskLevel: 'high' as const,
        lastUpdated: new Date()
      }
    ];
    this.saveStocks();
  }

  private saveStocks() {
    localStorage.setItem('realtime_stocks', JSON.stringify(this.stocks));
    this.notifySubscribers();
  }

  private startRealTimeUpdates() {
    // Update stock prices every 10 seconds
    this.updateInterval = setInterval(() => {
      this.updateStockPrices();
    }, 10000);
  }

  private async updateStockPrices() {
    try {
      // Get current prices from Finnhub API
      for (const stock of this.stocks) {
        const response = await fetch('/api/finnhub/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: [stock.symbol] })
        });

        if (response.ok) {
          const data = await response.json();
          const priceData = data[stock.symbol];
          
          if (priceData) {
            stock.currentPrice = priceData.currentPrice;
            stock.change24h = priceData.change;
            stock.changePercent24h = priceData.changePercent;
            stock.lastUpdated = new Date();

            // Update sentiment based on price movement
            if (priceData.changePercent > 2) {
              stock.sentiment = 'bullish';
            } else if (priceData.changePercent < -2) {
              stock.sentiment = 'bearish';
            } else {
              stock.sentiment = 'neutral';
            }
          }
        }
      }

      // Update user metrics
      this.updateUserMetrics();
      this.saveStocks();
    } catch (error) {
      console.error('Error updating stock prices:', error);
    }
  }

  private updateUserMetrics() {
    // Count watchers and holders for each stock
    this.stocks = this.stocks.map(stock => {
      let watchersCount = 0;
      let holdersCount = 0;
      let totalHoldingValue = 0;

      // Count from all user portfolios
      const allUsers = this.getAllUsers();
      allUsers.forEach(userId => {
        try {
          const userStocks = JSON.parse(localStorage.getItem(`stocks_${userId}`) || '[]');
          const userStock = userStocks.find((s: any) => s.ticker === stock.symbol);
          if (userStock) {
            watchersCount++;
            holdersCount++;
            totalHoldingValue += userStock.quantity * stock.currentPrice;
          }
        } catch (error) {
          // Ignore user stock errors
        }
      });

      return {
        ...stock,
        watchersCount,
        holdersCount,
        totalHoldingValue,
        avgHoldingValue: holdersCount > 0 ? totalHoldingValue / holdersCount : 0
      };
    });
  }

  private getAllUsers(): string[] {
    try {
      const users = JSON.parse(localStorage.getItem('realtime_users') || '[]');
      return users.map((user: any) => user.id);
    } catch {
      return [];
    }
  }

  subscribe(callback: (stocks: DatabaseStock[]) => void) {
    this.subscribers.push(callback);
    callback(this.stocks); // Send initial data
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.stocks));
  }

  async createStock(stockData: Omit<DatabaseStock, 'id' | 'lastUpdated'>): Promise<string> {
    const newStock: DatabaseStock = {
      ...stockData,
      id: Date.now().toString(),
      lastUpdated: new Date()
    };
    
    this.stocks.push(newStock);
    this.saveStocks();
    
    return newStock.id;
  }

  async updateStock(stockId: string, stockData: Partial<DatabaseStock>): Promise<void> {
    const index = this.stocks.findIndex(stock => stock.id === stockId);
    if (index !== -1) {
      this.stocks[index] = {
        ...this.stocks[index],
        ...stockData,
        lastUpdated: new Date()
      };
      this.saveStocks();
    }
  }

  async deleteStock(stockId: string): Promise<void> {
    this.stocks = this.stocks.filter(stock => stock.id !== stockId);
    this.saveStocks();
  }

  getStocks(): DatabaseStock[] {
    return this.stocks;
  }

  getStock(stockId: string): DatabaseStock | null {
    return this.stocks.find(stock => stock.id === stockId) || null;
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Real-time Quizzes Service
class RealTimeQuizzesService {
  private subscribers: Array<(quizzes: DatabaseQuiz[]) => void> = [];
  private quizzes: DatabaseQuiz[] = [];

  constructor() {
    this.loadQuizzes();
  }

  private loadQuizzes() {
    const stored = localStorage.getItem('realtime_quizzes');
    if (stored) {
      this.quizzes = JSON.parse(stored);
    } else {
      this.initializeDefaultQuizzes();
    }
  }

  private initializeDefaultQuizzes() {
    this.quizzes = [
      {
        id: '1',
        title: 'Stock Market Fundamentals',
        description: 'Test your knowledge of basic stock market concepts',
        category: 'stocks' as const,
        difficulty: 'beginner' as const,
        questions: [],
        status: 'approved' as const,
        createdAt: new Date(),
        completions: 0,
        averageScore: 0,
        tags: ['basics', 'stocks'],
        estimatedTime: 15
      }
    ];
    this.saveQuizzes();
  }

  private saveQuizzes() {
    localStorage.setItem('realtime_quizzes', JSON.stringify(this.quizzes));
    this.notifySubscribers();
  }

  subscribe(callback: (quizzes: DatabaseQuiz[]) => void) {
    this.subscribers.push(callback);
    callback(this.quizzes);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.quizzes));
  }

  async createQuiz(quizData: Omit<DatabaseQuiz, 'id' | 'createdAt'>): Promise<string> {
    const newQuiz: DatabaseQuiz = {
      ...quizData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    this.quizzes.push(newQuiz);
    this.saveQuizzes();
    
    return newQuiz.id;
  }

  async updateQuiz(quizId: string, quizData: Partial<DatabaseQuiz>): Promise<void> {
    const index = this.quizzes.findIndex(quiz => quiz.id === quizId);
    if (index !== -1) {
      this.quizzes[index] = {
        ...this.quizzes[index],
        ...quizData
      };
      this.saveQuizzes();
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    this.quizzes = this.quizzes.filter(quiz => quiz.id !== quizId);
    this.saveQuizzes();
  }

  getQuizzes(): DatabaseQuiz[] {
    return this.quizzes;
  }
}

// Real-time News Service
class RealTimeNewsService {
  private subscribers: Array<(news: DatabaseNews[]) => void> = [];
  private news: DatabaseNews[] = [];

  constructor() {
    this.loadNews();
    this.startNewsFetching();
  }

  private loadNews() {
    const stored = localStorage.getItem('realtime_news');
    if (stored) {
      this.news = JSON.parse(stored);
    } else {
      this.initializeDefaultNews();
    }
  }

  private initializeDefaultNews() {
    this.news = [];
    this.saveNews();
  }

  private saveNews() {
    localStorage.setItem('realtime_news', JSON.stringify(this.news));
    this.notifySubscribers();
  }

  private startNewsFetching() {
    // Fetch news every 5 minutes
    setInterval(() => {
      this.fetchLatestNews();
    }, 5 * 60 * 1000);
    
    // Initial fetch
    this.fetchLatestNews();
  }

  private async fetchLatestNews() {
    try {
      // You can integrate with news APIs like NewsAPI, Alpha Vantage News, etc.
      // For now, we'll use mock data that updates
      const mockNews: DatabaseNews = {
        id: Date.now().toString(),
        title: `Market Update - ${new Date().toLocaleDateString()}`,
        summary: 'Latest market developments and stock movements',
        content: 'Detailed market analysis and news content...',
        source: 'Stock Advisor News',
        author: 'Market Analyst',
        category: 'market' as const,
        sentiment: 'neutral' as const,
        impact: 'medium' as const,
        publishedAt: new Date(),
        createdAt: new Date(),
        isPinned: false,
        tags: ['market', 'daily'],
        relatedSymbols: ['AAPL', 'GOOGL', 'MSFT'],
        views: 0,
        shares: 0,
        originalUrl: '',
        isBreaking: false
      };

      // Keep only last 50 news items
      if (this.news.length >= 50) {
        this.news = this.news.slice(0, 49);
      }
      
      this.news.unshift(mockNews);
      this.saveNews();
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  }

  subscribe(callback: (news: DatabaseNews[]) => void) {
    this.subscribers.push(callback);
    callback(this.news);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.news));
  }

  async createNews(newsData: Omit<DatabaseNews, 'id' | 'createdAt'>): Promise<string> {
    const newNews: DatabaseNews = {
      ...newsData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    this.news.unshift(newNews);
    this.saveNews();
    
    return newNews.id;
  }

  async updateNews(newsId: string, newsData: Partial<DatabaseNews>): Promise<void> {
    const index = this.news.findIndex(item => item.id === newsId);
    if (index !== -1) {
      this.news[index] = {
        ...this.news[index],
        ...newsData
      };
      this.saveNews();
    }
  }

  async deleteNews(newsId: string): Promise<void> {
    this.news = this.news.filter(item => item.id !== newsId);
    this.saveNews();
  }

  getNews(): DatabaseNews[] {
    return this.news;
  }
}

// Real-time Sync Service
class RealTimeSyncService {
  private syncCallbacks: Array<() => void> = [];

  triggerSync() {
    this.syncCallbacks.forEach(callback => callback());
  }

  onSync(callback: () => void) {
    this.syncCallbacks.push(callback);
    
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }
}

// Main Real-time Data Service
class RealTimeDataServiceImpl implements RealTimeDataService {
  users: RealTimeUsersService;
  stocks: RealTimeStocksService;
  quizzes: RealTimeQuizzesService;
  news: RealTimeNewsService;
  sync: RealTimeSyncService;

  constructor() {
    this.users = new RealTimeUsersService();
    this.stocks = new RealTimeStocksService();
    this.quizzes = new RealTimeQuizzesService();
    this.news = new RealTimeNewsService();
    this.sync = new RealTimeSyncService();
  }

  destroy() {
    this.stocks.destroy();
  }
}

// Export singleton instance
const realTimeDataService = new RealTimeDataServiceImpl();

export default realTimeDataService;
export type { DatabaseUser, DatabaseStock, DatabaseQuiz, DatabaseNews };

// Types for the interfaces
interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  lastLogin: string;
  status: 'active' | 'inactive' | 'suspended';
  portfolioValue: number;
  totalTrades: number;
  watchlistItems: number;
  quizzesCompleted: number;
  subscriptionTier: 'free' | 'premium' | 'pro';
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseStock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  marketCap: string;
  volume24h: number;
  watchersCount: number;
  holdersCount: number;
  avgHoldingValue: number;
  totalHoldingValue: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

interface DatabaseQuiz {
  id: string;
  title: string;
  description: string;
  category: 'general' | 'stocks' | 'crypto' | 'options' | 'fundamental' | 'technical';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuizQuestion[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  completions: number;
  averageScore: number;
  tags: string[];
  estimatedTime: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
}

interface DatabaseNews {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  author: string;
  category: 'market' | 'stocks' | 'crypto' | 'economy' | 'politics' | 'technology' | 'earnings';
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  publishedAt: Date;
  createdAt: Date;
  isPinned: boolean;
  tags: string[];
  relatedSymbols: string[];
  views: number;
  shares: number;
  imageUrl?: string;
  originalUrl: string;
  isBreaking: boolean;
}

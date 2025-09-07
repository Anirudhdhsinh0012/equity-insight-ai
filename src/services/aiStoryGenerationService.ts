import { StoryData } from '@/types';

// Story generation service interface
interface StoryGenerationRequest {
  ticker: string;
  stockData: {
    currentPrice: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    high52Week: number;
    low52Week: number;
  };
  newsHeadlines: Array<{
    title: string;
    summary: string;
    url: string;
    publishedAt: string;
    source: string;
  }>;
  tone: 'professional' | 'casual' | 'funny';
  userPortfolio?: string[];
}

interface AIStoryResponse {
  title: string;
  content: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  emoji: string;
  tags: string[];
  confidence: number;
}

class AIStoryGenerationService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY || '';
    this.apiEndpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Generate an AI-powered investment story based on stock data and news
   */
  async generateStory(request: StoryGenerationRequest): Promise<AIStoryResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      // In a real implementation, this would call OpenAI or Claude API
      const aiResponse = await this.callAIAPI(prompt, request.tone);
      
      return this.parseAIResponse(aiResponse, request);
    } catch (error) {
      console.error('Error generating AI story:', error);
      throw new Error('Failed to generate AI story');
    }
  }

  /**
   * Generate multiple stories for a portfolio of stocks
   */
  async generatePortfolioStories(
    tickers: string[],
    tone: 'professional' | 'casual' | 'funny' = 'professional'
  ): Promise<StoryData[]> {
    const stories: StoryData[] = [];
    
    for (const ticker of tickers) {
      try {
        // Fetch stock data and news for each ticker
        const stockData = await this.fetchStockData(ticker);
        const newsHeadlines = await this.fetchNewsHeadlines(ticker);
        
        const request: StoryGenerationRequest = {
          ticker,
          stockData,
          newsHeadlines,
          tone,
          userPortfolio: tickers
        };
        
        const aiStory = await this.generateStory(request);
        
        const story: StoryData = {
          id: `${ticker}-${Date.now()}`,
          title: aiStory.title,
          content: aiStory.content,
          ticker,
          sentiment: aiStory.sentiment,
          emoji: aiStory.emoji,
          readTime: this.calculateReadTime(aiStory.content),
          timestamp: new Date(),
          priceData: {
            currentPrice: stockData.currentPrice,
            change: stockData.change,
            changePercent: stockData.changePercent
          },
          tags: aiStory.tags,
          aiConfidence: aiStory.confidence
        };
        
        stories.push(story);
      } catch (error) {
        console.error(`Error generating story for ${ticker}:`, error);
        // Continue with other tickers even if one fails
      }
    }
    
    return stories;
  }

  /**
   * Build the AI prompt based on request data
   */
  private buildPrompt(request: StoryGenerationRequest): string {
    const toneInstructions = {
      professional: "Write in a professional, analytical tone suitable for financial advisors and serious investors.",
      casual: "Write in a conversational, accessible tone that's easy to understand for everyday investors.",
      funny: "Write with humor and personality while maintaining accuracy. Use witty observations and light jokes."
    };

    const sentimentAnalysis = request.stockData.changePercent > 2 ? 'bullish' : 
                             request.stockData.changePercent < -2 ? 'bearish' : 'neutral';

    return `
You are an expert financial storyteller and market analyst. Create an engaging investment story about ${request.ticker}.

STOCK DATA:
- Current Price: $${request.stockData.currentPrice}
- Change: ${request.stockData.change >= 0 ? '+' : ''}${request.stockData.change} (${request.stockData.changePercent.toFixed(2)}%)
- Volume: ${request.stockData.volume.toLocaleString()}
- Market Cap: $${(request.stockData.marketCap / 1e9).toFixed(2)}B
- 52W High: $${request.stockData.high52Week}
- 52W Low: $${request.stockData.low52Week}

RECENT NEWS HEADLINES:
${request.newsHeadlines.map(news => `- ${news.title} (${news.source})`).join('\n')}

TONE: ${toneInstructions[request.tone]}

REQUIREMENTS:
1. Create a compelling title (max 60 characters)
2. Write a 150-200 word story that explains the stock movement
3. Include relevant context from the news headlines
4. Determine sentiment: bullish, bearish, or neutral
5. Suggest an appropriate emoji that matches the story
6. Generate 3-5 relevant tags
7. Provide a confidence score (1-100) for your analysis

Expected sentiment based on price movement: ${sentimentAnalysis}

Respond in JSON format:
{
  "title": "Story title here",
  "content": "Full story content here",
  "sentiment": "bullish|bearish|neutral",
  "emoji": "📈",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 85
}
`;
  }

  /**
   * Call the AI API (OpenAI or Claude)
   */
  private async callAIAPI(prompt: string, tone: string): Promise<any> {
    // Mock implementation - in production, this would call the actual AI API
    console.log('AI API Call:', { prompt: prompt.substring(0, 100) + '...', tone });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock response based on tone
    const mockResponses = {
      professional: {
        title: "Technical Analysis Signals Strong Momentum",
        content: "Recent market dynamics indicate significant institutional interest in this equity position. The confluence of technical indicators and fundamental catalysts suggests sustained upward trajectory, supported by robust trading volume and positive sentiment across multiple analyst coverage reports.",
        sentiment: "bullish",
        emoji: "📊",
        tags: ["Technical Analysis", "Institutional", "Volume", "Momentum"],
        confidence: 88
      },
      casual: {
        title: "This Stock is Making Moves Today",
        content: "Hey investors! This stock caught everyone's attention today with some solid gains. The company seems to be hitting all the right notes lately, and traders are definitely taking notice. It's one of those days where everything just clicks - good news, strong volume, and positive vibes all around.",
        sentiment: "bullish",
        emoji: "🚀",
        tags: ["Trending", "Volume", "Gains", "Positive"],
        confidence: 82
      },
      funny: {
        title: "Stock Goes Brrrr (In a Good Way)",
        content: "Well, well, well... look who decided to show up to the party! This stock just pulled a classic 'hold my coffee' move and shot up like it remembered it left the stove on. Investors are probably doing their happy dance right about now, and who can blame them? When the market gives you lemons, sometimes it gives you rocket fuel instead! 🤷‍♂️",
        sentiment: "bullish",
        emoji: "🎉",
        tags: ["Meme", "Rally", "Surprise", "Fun"],
        confidence: 75
      }
    };
    
    return (mockResponses as any)[tone] || mockResponses.professional;
  }

  /**
   * Parse AI response and validate format
   */
  private parseAIResponse(aiResponse: any, request: StoryGenerationRequest): AIStoryResponse {
    // In a real implementation, this would parse the actual AI response
    return {
      title: aiResponse.title || `${request.ticker} Market Update`,
      content: aiResponse.content || "Market analysis unavailable at this time.",
      sentiment: aiResponse.sentiment || 'neutral',
      emoji: aiResponse.emoji || '📊',
      tags: aiResponse.tags || ['Market', 'Analysis'],
      confidence: aiResponse.confidence || 70
    };
  }

  /**
   * Fetch current stock data from Finnhub
   */
  private async fetchStockData(ticker: string) {
    try {
      const response = await fetch(`/api/finnhub/quote?symbol=${ticker}`);
      const data = await response.json();
      
      return {
        currentPrice: data.c || 0,
        change: data.d || 0,
        changePercent: data.dp || 0,
        volume: data.volume || 0,
        marketCap: data.marketCapitalization || 0,
        high52Week: data.h || 0,
        low52Week: data.l || 0
      };
    } catch (error) {
      console.error(`Error fetching stock data for ${ticker}:`, error);
      // Return mock data if API fails
      return {
        currentPrice: 100,
        change: 2.5,
        changePercent: 2.56,
        volume: 1000000,
        marketCap: 50000000000,
        high52Week: 120,
        low52Week: 80
      };
    }
  }

  /**
   * Fetch news headlines from Benzinga API
   */
  private async fetchNewsHeadlines(ticker: string) {
    try {
      const response = await fetch(`/api/news/benzinga?ticker=${ticker}`);
      const data = await response.json();
      
      return data.news || [];
    } catch (error) {
      console.error(`Error fetching news for ${ticker}:`, error);
      // Return mock news if API fails
      return [
        {
          title: `${ticker} Shows Strong Performance in Latest Quarter`,
          summary: "Company reports positive results amid market volatility.",
          url: "#",
          publishedAt: new Date().toISOString(),
          source: "Market News"
        }
      ];
    }
  }

  /**
   * Calculate estimated read time for content
   */
  private calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
  }

  /**
   * Get daily story recommendations based on user portfolio and market trends
   */
  async getDailyRecommendations(
    userPortfolio: string[],
    tone: 'professional' | 'casual' | 'funny' = 'professional',
    limit: number = 5
  ): Promise<StoryData[]> {
    try {
      // Combine user portfolio with trending stocks
      const trendingStocks = await this.getTrendingStocks();
      const allTickers = [...new Set([...userPortfolio, ...trendingStocks])];
      
      // Generate stories for all tickers
      const allStories = await this.generatePortfolioStories(allTickers, tone);
      
      // Sort by AI confidence and relevance
      const sortedStories = allStories
        .sort((a, b) => b.aiConfidence - a.aiConfidence)
        .slice(0, limit);
      
      return sortedStories;
    } catch (error) {
      console.error('Error getting daily recommendations:', error);
      return [];
    }
  }

  /**
   * Get currently trending stocks for story generation
   */
  private async getTrendingStocks(): Promise<string[]> {
    // In production, this would fetch from trending/most active stocks API
    return ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'META', 'AMZN'];
  }

  /**
   * Save generated story to database
   */
  async saveStory(story: StoryData): Promise<void> {
    try {
      // In production, this would save to your database
      console.log('Saving story to database:', {
        id: story.id,
        ticker: story.ticker,
        title: story.title
      });
      
      // Mock database save
      const stories = JSON.parse(localStorage.getItem('ai_stories') || '[]');
      stories.push(story);
      localStorage.setItem('ai_stories', JSON.stringify(stories));
    } catch (error) {
      console.error('Error saving story:', error);
    }
  }

  /**
   * Get stored stories from database
   */
  async getStoredStories(limit: number = 10): Promise<StoryData[]> {
    try {
      // In production, this would query your database
      const stories = JSON.parse(localStorage.getItem('ai_stories') || '[]');
      return stories
        .sort((a: StoryData, b: StoryData) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting stored stories:', error);
      return [];
    }
  }
}

// Export singleton instance
export const aiStoryService = new AIStoryGenerationService();
export default AIStoryGenerationService;

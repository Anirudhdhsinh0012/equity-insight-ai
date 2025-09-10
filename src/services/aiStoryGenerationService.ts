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
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY || '';
    this.apiEndpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
    // For server-side calls, use localhost. In production, this should be your domain
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';
  }

  /**
   * Generate an AI-powered investment story based on stock data and news
   */
  async generateStory(request: StoryGenerationRequest): Promise<AIStoryResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      // In a real implementation, this would call OpenAI or Claude API
      const aiResponse = await this.callAIAPI(prompt, request.tone, request.ticker);
      
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
  private async callAIAPI(prompt: string, tone: string, ticker?: string): Promise<any> {
    // Mock implementation - in production, this would call the actual AI API
    console.log('AI API Call:', { prompt: prompt.substring(0, 100) + '...', tone });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate ticker-specific responses for diversity
    return this.generateTickerSpecificResponse(ticker || 'UNKNOWN', tone);
  }

  /**
   * Generate ticker-specific mock responses
   */
  private generateTickerSpecificResponse(ticker: string, tone: string): any {
    const responses = {
      AAPL: {
        professional: {
          title: "Apple Shows Resilience in Tech Sector Volatility",
          content: "Apple Inc. demonstrates strong fundamentals amid broader tech market fluctuations. The company's diversified revenue streams, including services and hardware, continue to provide stability. Recent iPhone sales data and services growth indicate sustained consumer demand and ecosystem strength.",
          sentiment: "bullish",
          emoji: "🍎",
          tags: ["Technology", "Consumer Electronics", "Services", "Innovation"],
          confidence: 85
        },
        casual: {
          title: "Apple Stock Making Investors Happy Today",
          content: "Apple's doing what Apple does best - keeping investors satisfied! The tech giant continues to innovate while maintaining its loyal customer base. Whether it's new iPhone features or growing App Store revenue, Apple seems to have that magic touch that keeps the stock moving in the right direction.",
          sentiment: "bullish",
          emoji: "📱",
          tags: ["Tech", "Innovation", "Growth", "Consumer"],
          confidence: 82
        }
      },
      GOOGL: {
        professional: {
          title: "Alphabet's Cloud Division Drives Revenue Growth",
          content: "Alphabet Inc. continues to capitalize on digital transformation trends, with Google Cloud showing impressive growth rates. The company's advertising business remains robust while AI investments position Google for future market opportunities. Search dominance and YouTube's performance contribute to stable revenue streams.",
          sentiment: "bullish",
          emoji: "🔍",
          tags: ["Cloud Computing", "Advertising", "AI", "Digital Transformation"],
          confidence: 88
        },
        casual: {
          title: "Google's Getting Into Everything (And It's Working)",
          content: "From search to cloud to AI, Google just keeps expanding and succeeding. Their cloud business is booming, YouTube ads are printing money, and they're leading the AI race. It's like watching a tech octopus that's really good at making money with all its arms!",
          sentiment: "bullish",
          emoji: "🐙",
          tags: ["Cloud", "AI", "Search", "Growth"],
          confidence: 80
        }
      },
      MSFT: {
        professional: {
          title: "Microsoft Azure Gains Enterprise Market Share",
          content: "Microsoft Corporation strengthens its position in enterprise cloud computing with Azure adoption accelerating across industries. Office 365 subscriptions provide recurring revenue stability while AI integration across products enhances competitive positioning. Strong balance sheet supports continued innovation investments.",
          sentiment: "bullish",
          emoji: "☁️",
          tags: ["Enterprise Software", "Cloud", "Subscription", "AI Integration"],
          confidence: 90
        },
        casual: {
          title: "Microsoft is Crushing It in the Cloud Game",
          content: "Microsoft's Azure cloud platform is seriously taking off! Businesses everywhere are switching to their services, and it's paying off big time. Plus, everyone's still using Office 365, so they've got that steady income flowing in. They're basically the reliable friend of the tech world.",
          sentiment: "bullish",
          emoji: "💼",
          tags: ["Cloud", "Office", "Enterprise", "Reliable"],
          confidence: 87
        }
      },
      TSLA: {
        professional: {
          title: "Tesla Maintains EV Market Leadership Position",
          content: "Tesla Inc. continues to lead electric vehicle adoption with expanding production capacity and technological innovation. Supercharger network growth and autonomous driving developments strengthen the company's competitive moat. Energy storage and solar businesses provide additional growth avenues beyond automotive.",
          sentiment: "bullish",
          emoji: "⚡",
          tags: ["Electric Vehicles", "Autonomous Driving", "Energy", "Innovation"],
          confidence: 83
        },
        casual: {
          title: "Tesla's Electric Dreams Keep Getting Bigger",
          content: "Tesla isn't just making electric cars anymore - they're building the whole electric future! From charging stations everywhere to self-driving tech that's getting scary good, Elon and the team keep pushing boundaries. Plus, those solar panels and batteries are starting to make real money too.",
          sentiment: "bullish",
          emoji: "🚗",
          tags: ["EV", "Future Tech", "Innovation", "Elon"],
          confidence: 81
        }
      },
      NVDA: {
        professional: {
          title: "NVIDIA Dominates AI Infrastructure Market",
          content: "NVIDIA Corporation capitalizes on unprecedented AI demand with data center revenue reaching new heights. The company's GPU technology remains essential for machine learning and artificial intelligence applications. Strategic partnerships with major tech companies secure long-term growth prospects in the expanding AI ecosystem.",
          sentiment: "bullish",
          emoji: "🤖",
          tags: ["Artificial Intelligence", "Data Centers", "GPU", "Machine Learning"],
          confidence: 92
        },
        casual: {
          title: "NVIDIA is the Pickaxe Seller of the AI Gold Rush",
          content: "Everyone wants AI, and guess who's selling the shovels? NVIDIA! Their GPUs are basically the brains behind every AI breakthrough. While everyone else is trying to build the next ChatGPT, NVIDIA is making bank selling them the hardware to do it. Smart business!",
          sentiment: "bullish",
          emoji: "⛏️",
          tags: ["AI", "Hardware", "Gold Rush", "Smart"],
          confidence: 89
        }
      },
      META: {
        professional: {
          title: "Meta Platforms Advances Metaverse Vision",
          content: "Meta Platforms Inc. continues substantial investments in virtual reality and metaverse technologies while maintaining strong social media advertising revenue. Instagram and Facebook user engagement remains high, supporting advertising growth. VR hardware adoption shows promising early-stage development.",
          sentiment: "neutral",
          emoji: "🥽",
          tags: ["Social Media", "VR", "Metaverse", "Advertising"],
          confidence: 78
        },
        casual: {
          title: "Meta's Betting Big on Virtual Worlds",
          content: "Mark Zuckerberg is really going all-in on this metaverse thing! While everyone's still scrolling Instagram and Facebook (and making Meta tons of ad money), they're quietly building the future of virtual reality. It's either genius or crazy - maybe both!",
          sentiment: "neutral",
          emoji: "�",
          tags: ["VR", "Social", "Future", "Risky"],
          confidence: 75
        }
      }
    };

    const tickerResponses = responses[ticker as keyof typeof responses];
    const toneResponse = tickerResponses?.[tone as keyof typeof tickerResponses];
    
    if (toneResponse) {
      return toneResponse;
    }

    // Generic fallback with ticker name
    return {
      title: `${ticker} Shows Market Resilience`,
      content: `${ticker} demonstrates stable performance in current market conditions. The company maintains solid fundamentals with consistent operational execution. Investors continue to monitor key metrics and strategic developments for future growth potential.`,
      sentiment: "neutral",
      emoji: "📊",
      tags: ["Market", "Stability", "Fundamentals", "Performance"],
      confidence: 70
    };
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
      const response = await fetch(`${this.baseUrl}/api/finnhub/quote/${ticker}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch quote data');
      }
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch quote data');
      }
      
      const quote = data.data;
      
      return {
        currentPrice: quote.currentPrice || 0,
        change: quote.change || 0,
        changePercent: quote.changePercent || 0,
        volume: quote.volume || 0,
        marketCap: quote.marketCap || 0,
        high52Week: quote.high || 0,
        low52Week: quote.low || 0
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
   * Generate diverse news specific to each ticker
   */
  private generateDiverseNewsForTicker(ticker: string) {
    const newsTemplates = {
      AAPL: [
        {
          title: "Apple Unveils Revolutionary iPhone Features Ahead of Holiday Season",
          summary: "Apple's latest technological innovations demonstrate continued market leadership in premium smartphone segment with enhanced AI capabilities and battery life improvements.",
          source: "TechCrunch"
        },
        {
          title: "Apple Services Revenue Hits New Milestone, App Store Growth Accelerates",
          summary: "Strong performance in digital services continues to diversify Apple's revenue streams, with subscription services showing robust growth metrics.",
          source: "Bloomberg Technology"
        }
      ],
      GOOGL: [
        {
          title: "Google Cloud Wins Major Enterprise Contracts, AI Integration Drives Growth",
          summary: "Alphabet's cloud division secures significant partnerships while advanced AI features attract more businesses to Google's cloud infrastructure.",
          source: "Forbes"
        },
        {
          title: "YouTube Advertising Revenue Surges as Creator Economy Expands",
          summary: "Strong digital advertising trends benefit Google's video platform, with new monetization features driving creator engagement and revenue growth.",
          source: "Ad Age"
        }
      ],
      MSFT: [
        {
          title: "Microsoft Azure Gains Market Share in Enterprise Cloud Computing",
          summary: "Strong demand for cloud services and AI-powered business solutions continues to drive Microsoft's growth in the competitive enterprise market.",
          source: "ZDNet"
        },
        {
          title: "Microsoft 365 Subscription Growth Outpaces Expectations in Q3",
          summary: "Enterprise software demand remains robust as businesses continue digital transformation initiatives, boosting Microsoft's recurring revenue model.",
          source: "Business Insider"
        }
      ],
      TSLA: [
        {
          title: "Tesla Supercharger Network Expansion Accelerates Global EV Adoption",
          summary: "Strategic infrastructure investments position Tesla as a key player in the electric vehicle ecosystem beyond just manufacturing.",
          source: "Electrek"
        },
        {
          title: "Tesla Autopilot Technology Receives Safety Certification Updates",
          summary: "Continued improvements in autonomous driving capabilities strengthen Tesla's competitive advantage in the premium EV market.",
          source: "Reuters Auto"
        }
      ],
      NVDA: [
        {
          title: "NVIDIA Data Center Revenue Soars on AI Chip Demand",
          summary: "Unprecedented demand for AI processing power drives record-breaking performance in NVIDIA's data center business segment.",
          source: "VentureBeat"
        },
        {
          title: "NVIDIA Partners with Major Tech Giants for Next-Gen AI Computing",
          summary: "Strategic partnerships strengthen NVIDIA's position in the rapidly expanding artificial intelligence hardware market.",
          source: "TechRadar"
        }
      ],
      META: [
        {
          title: "Meta's VR Division Reports Strong User Engagement Growth",
          summary: "Virtual reality platform adoption accelerates as Meta continues investing heavily in metaverse infrastructure and user experience.",
          source: "The Verge"
        },
        {
          title: "Instagram Reels Advertising Revenue Exceeds Expectations",
          summary: "Short-form video content continues to drive advertising growth, positioning Meta competitively against TikTok in the social media market.",
          source: "Social Media Today"
        }
      ]
    };

    // Get ticker-specific news or use generic template
    const tickerNews = newsTemplates[ticker as keyof typeof newsTemplates];
    if (tickerNews) {
      return tickerNews.map((news, index) => ({
        ...news,
        url: "#",
        publishedAt: new Date(Date.now() - (index + 1) * 3600000).toISOString() // Stagger by hours
      }));
    }

    // Generic fallback for other tickers
    const genericTemplates = [
      {
        title: `${ticker} Reports Strong Quarterly Earnings Beat`,
        summary: `${ticker} demonstrates resilient performance with revenue growth exceeding analyst expectations and positive forward guidance.`,
        source: "Financial Times"
      },
      {
        title: `Institutional Investors Increase ${ticker} Holdings`,
        summary: `Major investment firms show growing confidence in ${ticker}'s long-term prospects amid favorable market conditions.`,
        source: "Investor's Business Daily"
      }
    ];

    return genericTemplates.map((news, index) => ({
      ...news,
      url: "#",
      publishedAt: new Date(Date.now() - (index + 1) * 3600000).toISOString()
    }));
  }

  /**
   * Fetch news headlines from Explorium API
   */
  private async fetchNewsHeadlines(ticker: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/news/explorium?ticker=${ticker}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }
      
      const data = await response.json();
      
      return data.news || [];
    } catch (error) {
      console.error(`Error fetching news for ${ticker}:`, error);
      // Return diverse mock news based on ticker
      return this.generateDiverseNewsForTicker(ticker);
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

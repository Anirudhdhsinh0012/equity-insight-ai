import { DatabaseQuiz, DatabaseNews } from '@/services/realTimeDataService';

interface NewsHeadline {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface AIGeneratedQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  estimatedTime: number;
}

interface AIGeneratedNews {
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  source: string;
  relatedStocks: string[];
}

interface AIGeneratedQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  estimatedTime: number;
}

interface AIGeneratedNews {     
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  source: string;
  relatedStocks: string[];
}
  
class AIContentGenerationService {
  private apiKey: string;
  private newsApiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.CLAUDE_API_KEY || '';
    this.newsApiKey = 'c118fac8faa941d987aca7da618e7e29'; // Explorium API key
  }

  /**
   * Fetch latest stock market news from multiple sources
   */
  async fetchLatestMarketNews(limit: number = 20): Promise<NewsHeadline[]> {
    try {
      // Fetch from multiple top stocks
      const topStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK.B', 'JPM', 'V'];
      const allNews: NewsHeadline[] = [];

      for (const stock of topStocks.slice(0, 5)) { // Limit to prevent API overuse
        try {
          const response = await fetch(`/api/news/explorium?ticker=${stock}&limit=4&days=3`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.news) {
              allNews.push(...data.news.slice(0, 2)); // Take top 2 from each stock
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch news for ${stock}:`, error);
        }
      }

      // Remove duplicates and sort by date
      const uniqueNews = allNews.filter((news, index, self) => 
        index === self.findIndex(n => n.title === news.title)
      ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      return uniqueNews.slice(0, limit);
    } catch (error) {
      console.error('Error fetching market news:', error);
      return this.getMockMarketNews();
    }
  }

  /**
   * Generate AI-powered quiz based on recent market news
   */
  async generateMarketQuiz(): Promise<DatabaseQuiz> {
    try {
      const latestNews = await this.fetchLatestMarketNews(10);
      
      if (latestNews.length === 0) {
        throw new Error('No news available for quiz generation');
      }

      const newsContext = latestNews.map(news => 
        `${news.title} - ${news.summary} (Source: ${news.source})`
      ).join('\n');

      const prompt = `Based on the following recent stock market news, create a comprehensive financial quiz with 5 questions:

${newsContext}

Generate a JSON response with this exact structure:
{
  "title": "Weekly Stock Market Quiz",
  "description": "Test your knowledge on recent market developments",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of the correct answer"
    }
  ],
  "difficulty": "medium",
  "category": "Market News",
  "estimatedTime": 5
}

Requirements:
- 5 multiple choice questions
- Questions should be based on the news provided
- Include specific company names and stock tickers when relevant
- Make questions educational and informative
- Provide clear explanations for correct answers
- Mix difficulty levels within the quiz
- Include both fundamental and technical analysis concepts`;

      const aiResponse = await this.callAIAPI(prompt);
      
      if (!aiResponse) {
        throw new Error('Failed to get AI response');
      }

      const quizData: AIGeneratedQuiz = JSON.parse(aiResponse);

      // Convert to DatabaseQuiz format
      const databaseQuiz: DatabaseQuiz = {
        id: `quiz_${Date.now()}`,
        title: quizData.title,
        description: quizData.description,
        questions: quizData.questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: 3 // Medium difficulty level (1=easy, 3=medium, 5=hard)
        })),
        difficulty: 'intermediate' as const,
        category: 'stocks' as const,
        estimatedTime: quizData.estimatedTime,
        tags: ['AI Generated', 'Market News', 'Stock Analysis'],
        status: 'approved' as const,
        createdAt: new Date(),
        completions: 0,
        averageScore: 0
      };

      return databaseQuiz;
    } catch (error) {
      console.error('Error generating AI quiz:', error);
      return this.getFallbackQuiz();
    }
  }

  /**
   * Generate AI-powered news article based on market data
   */
  async generateMarketNews(): Promise<DatabaseNews> {
    try {
      const latestNews = await this.fetchLatestMarketNews(15);
      
      if (latestNews.length === 0) {
        throw new Error('No source news available for article generation');
      }

      const newsContext = latestNews.slice(0, 8).map(news => 
        `${news.title} - ${news.summary}`
      ).join('\n');

      const prompt = `Based on the following recent stock market developments, write a comprehensive financial news article:

${newsContext}

Generate a JSON response with this exact structure:
{
  "title": "Market Analysis: Key Developments This Week",
  "content": "Full article content here (minimum 500 words)",
  "summary": "Brief 2-3 sentence summary",
  "category": "Market Analysis",
  "tags": ["Market Trends", "Stock Analysis", "Financial News"],
  "source": "AI Market Analyst",
  "relatedStocks": ["AAPL", "MSFT", "GOOGL"]
}

Requirements:
- Write a professional, informative article synthesizing the news
- Include specific stock tickers and companies mentioned in the source news
- Provide analysis and insights, not just summary
- Use financial terminology appropriately
- Structure with clear paragraphs
- Include both opportunities and risks
- Mention specific price movements or market trends if available
- Keep tone professional and analytical
- Minimum 500 words for the content field`;

      const aiResponse = await this.callAIAPI(prompt);
      
      if (!aiResponse) {
        throw new Error('Failed to get AI response');
      }

      const newsData: AIGeneratedNews = JSON.parse(aiResponse);

      // Convert to DatabaseNews format
      const databaseNews: DatabaseNews = {
        id: `news_${Date.now()}`,
        title: newsData.title,
        content: newsData.content,
        summary: newsData.summary,
        author: 'AI Market Analyst',
        publishedAt: new Date(),
        category: 'market' as const,
        tags: [...newsData.tags, 'AI Generated'],
        imageUrl: '/api/placeholder/600/300',
        source: newsData.source,
        originalUrl: '#',
        isPinned: false,
        views: 0,
        shares: 0,
        relatedSymbols: newsData.relatedStocks,
        sentiment: 'neutral' as const,
        impact: 'medium' as const,
        isBreaking: false,
        createdAt: new Date()
      };

      return databaseNews;
    } catch (error) {
      console.error('Error generating AI news:', error);
      return this.getFallbackNews();
    }
  }

  /**
   * Call AI API (OpenAI or Claude)
   */
  private async callAIAPI(prompt: string): Promise<string | null> {
    try {
      if (!this.apiKey) {
        console.warn('No AI API key configured, using fallback content');
        return null;
      }

      // Using OpenAI format (adjust for Claude if needed)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional financial analyst and content creator. Generate accurate, educational financial content based on real market data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('AI API call failed:', error);
      return null;
    }
  }

  /**
   * Fallback quiz when AI generation fails
   */
  private getFallbackQuiz(): DatabaseQuiz {
    return {
      id: `fallback_quiz_${Date.now()}`,
      title: 'Daily Market Knowledge Quiz',
      description: 'Test your understanding of current market conditions',
      questions: [
        {
          id: 'q1',
          question: 'What does P/E ratio measure in stock analysis?',
          options: [
            'Price to Earnings ratio',
            'Profit to Equity ratio',
            'Performance to Expectation ratio',
            'Portfolio to Exchange ratio'
          ],
          correctAnswer: 0,
          explanation: 'P/E ratio (Price-to-Earnings) compares a company\'s stock price to its earnings per share.',
          difficulty: 2
        },
        {
          id: 'q2',
          question: 'Which market index primarily tracks technology stocks?',
          options: ['S&P 500', 'Dow Jones', 'NASDAQ', 'Russell 2000'],
          correctAnswer: 2,
          explanation: 'NASDAQ is heavily weighted with technology companies and is often used as a tech stock benchmark.',
          difficulty: 2
        },
        {
          id: 'q3',
          question: 'What does "market volatility" refer to?',
          options: [
            'The speed of stock price changes',
            'The volume of trading activity',
            'The variety of available stocks',
            'The value of market capitalization'
          ],
          correctAnswer: 0,
          explanation: 'Market volatility measures how much and how quickly stock prices move up and down.',
          difficulty: 3
        }
      ],
      difficulty: 'intermediate' as const,
      category: 'fundamental' as const,
      estimatedTime: 3,
      tags: ['Market Basics', 'Educational'],
      status: 'approved' as const,
      createdAt: new Date(),
      completions: 0,
      averageScore: 0
    };
  }

  /**
   * Fallback news when AI generation fails
   */
  private getFallbackNews(): DatabaseNews {
    return {
      id: `fallback_news_${Date.now()}`,
      title: 'Market Update: Key Trends to Watch',
      content: `The financial markets continue to show dynamic movement as investors navigate various economic factors. Recent trading sessions have highlighted the importance of staying informed about market developments.

Key areas of focus include technology sector performance, Federal Reserve policy decisions, and global economic indicators. Market participants are closely monitoring earnings reports and economic data releases for insights into future market direction.

Investors are advised to maintain diversified portfolios and stay updated with the latest market analysis. Understanding market fundamentals remains crucial for making informed investment decisions.

The current market environment presents both opportunities and challenges, requiring careful analysis and strategic planning for optimal investment outcomes.`,
      summary: 'Analysis of current market trends and key factors influencing trading activity.',
      author: 'Market Analysis Team',
      publishedAt: new Date(),
      category: 'market' as const,
      tags: ['Market Trends', 'Investment Strategy', 'Analysis'],
      imageUrl: '/api/placeholder/600/300',
      source: 'Internal Analysis',
      originalUrl: '#',
      isPinned: false,
      views: 0,
      shares: 0,
      relatedSymbols: ['SPY', 'QQQ', 'DIA'],
      sentiment: 'neutral' as const,
      impact: 'medium' as const,
      isBreaking: false,
      createdAt: new Date()
    };
  }

  /**
   * Mock market news for fallback
   */
  private getMockMarketNews(): NewsHeadline[] {
    return [
      {
        title: 'Tech Stocks Show Strong Performance in Morning Trading',
        summary: 'Major technology companies are leading market gains as investors show renewed confidence in the sector.',
        url: '#',
        publishedAt: new Date().toISOString(),
        source: 'Financial News'
      },
      {
        title: 'Federal Reserve Maintains Current Interest Rate Policy',
        summary: 'The Fed keeps rates steady as economic indicators suggest stability in the current market environment.',
        url: '#',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'Economic Report'
      },
      {
        title: 'Energy Sector Responds to Global Supply Chain Updates',
        summary: 'Oil and gas companies adjust strategies following recent developments in international trade.',
        url: '#',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: 'Energy News'
      }
    ];
  }
}

export const aiContentService = new AIContentGenerationService();
export default aiContentService;

import { NextRequest, NextResponse } from 'next/server';
import { aiStoryService } from '@/services/aiStoryGenerationService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tone = searchParams.get('tone') as 'professional' | 'casual' | 'funny' || 'professional';
    const limit = parseInt(searchParams.get('limit') || '5');
    const tickers = searchParams.get('tickers')?.split(',') || [];

    // Get user's portfolio tickers if userId is provided
    let userPortfolio: string[] = [];
    if (userId) {
      // In production, fetch user's portfolio from database
      // For now, use default portfolio
      userPortfolio = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
    }

    // Combine user portfolio with requested tickers
    const allTickers = [...new Set([...userPortfolio, ...tickers])].filter(t => t.length > 0);

    let stories;
    if (allTickers.length > 0) {
      // Generate fresh stories for specific tickers
      stories = await aiStoryService.getDailyRecommendations(allTickers, tone, limit);
    } else {
      // Get stored stories if no specific tickers
      stories = await aiStoryService.getStoredStories(limit);
    }

    return NextResponse.json({
      success: true,
      stories,
      count: stories.length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Stories API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate AI stories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      ticker, 
      tone = 'professional', 
      forceRegenerate = false 
    } = body;

    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    // Generate a new story for the specific ticker
    const stories = await aiStoryService.generatePortfolioStories([ticker], tone);
    
    if (stories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate story for ticker' },
        { status: 500 }
      );
    }

    const story = stories[0];

    // Save the story
    await aiStoryService.saveStory(story);

    return NextResponse.json({
      success: true,
      story,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Story Generation Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate AI story',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

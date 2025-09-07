import { NextRequest, NextResponse } from 'next/server';
import { aiStoryDatabase } from '@/services/aiStoryDatabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    switch (action) {
      case 'stories':
        const storyOptions = {
          userId: userId || undefined,
          ticker: searchParams.get('ticker') || undefined,
          sentiment: searchParams.get('sentiment') as any || undefined,
          limit: parseInt(searchParams.get('limit') || '10'),
          onlyBookmarked: searchParams.get('bookmarked') === 'true'
        };
        
        const stories = await aiStoryDatabase.getStories(storyOptions);
        return NextResponse.json({ success: true, stories });

      case 'preferences':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID required for preferences' },
            { status: 400 }
          );
        }
        
        const preferences = await aiStoryDatabase.getUserPreference(userId);
        return NextResponse.json({ success: true, preferences });

      case 'analytics':
        const dateFrom = searchParams.get('dateFrom') 
          ? new Date(searchParams.get('dateFrom')!) : undefined;
        const dateTo = searchParams.get('dateTo') 
          ? new Date(searchParams.get('dateTo')!) : undefined;
          
        const analytics = await aiStoryDatabase.getAnalytics(dateFrom, dateTo);
        return NextResponse.json({ success: true, analytics });

      case 'daily-batch':
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const batch = await aiStoryDatabase.getDailyBatch(date);
        return NextResponse.json({ success: true, batch });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'save-story':
        const { story, userId } = body;
        if (!story) {
          return NextResponse.json(
            { success: false, error: 'Story data is required' },
            { status: 400 }
          );
        }
        
        const storyId = await aiStoryDatabase.saveStory(story, userId);
        return NextResponse.json({ success: true, storyId });

      case 'save-preferences':
        const { preferences } = body;
        if (!preferences || !preferences.userId) {
          return NextResponse.json(
            { success: false, error: 'Valid preferences with userId required' },
            { status: 400 }
          );
        }
        
        await aiStoryDatabase.saveUserPreferences(preferences);
        return NextResponse.json({ success: true });

      case 'save-daily-batch':
        const { batch } = body;
        if (!batch) {
          return NextResponse.json(
            { success: false, error: 'Batch data is required' },
            { status: 400 }
          );
        }
        
        await aiStoryDatabase.saveDailyBatch(batch);
        return NextResponse.json({ success: true });

      case 'update-engagement': {
        const { storyId, engagement } = body;
        if (!storyId || !engagement) {
          return NextResponse.json(
            { success: false, error: 'Story ID and engagement data required' },
            { status: 400 }
          );
        }
        
        await aiStoryDatabase.updateStoryEngagement(storyId, engagement);
        return NextResponse.json({ success: true });
      }

      case 'toggle-bookmark': {
        const { storyId } = body;
        if (!storyId) {
          return NextResponse.json(
            { success: false, error: 'Story ID is required' },
            { status: 400 }
          );
        }
        
        const isBookmarked = await aiStoryDatabase.toggleBookmark(storyId);
        return NextResponse.json({ success: true, isBookmarked });
      }

      case 'cleanup':
        await aiStoryDatabase.cleanup();
        return NextResponse.json({ success: true, message: 'Database cleanup completed' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'update-preferences':
        const { userId, preferences } = body;
        if (!userId || !preferences) {
          return NextResponse.json(
            { success: false, error: 'User ID and preferences are required' },
            { status: 400 }
          );
        }
        
        const updatedPreferences = {
          ...preferences,
          userId,
          updatedAt: new Date()
        };
        
        await aiStoryDatabase.saveUserPreferences(updatedPreferences);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Database API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

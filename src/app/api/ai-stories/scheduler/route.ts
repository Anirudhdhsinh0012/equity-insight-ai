import { NextRequest, NextResponse } from 'next/server';
import { aiStoryScheduler } from '@/services/aiStorySchedulerService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = aiStoryScheduler.getStatus();
        return NextResponse.json({
          success: true,
          status
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Scheduler API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Scheduler operation failed',
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
      case 'start':
        aiStoryScheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Scheduler started successfully'
        });

      case 'stop':
        aiStoryScheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Scheduler stopped successfully'
        });

      case 'trigger-daily':
        await aiStoryScheduler.triggerDailyGeneration();
        return NextResponse.json({
          success: true,
          message: 'Daily story generation triggered'
        });

      case 'update-config':
        const { config } = body;
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'Configuration data required' },
            { status: 400 }
          );
        }
        
        aiStoryScheduler.updateConfig(config);
        return NextResponse.json({
          success: true,
          message: 'Scheduler configuration updated'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Scheduler API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Scheduler operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

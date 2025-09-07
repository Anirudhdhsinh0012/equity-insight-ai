import { NextRequest, NextResponse } from 'next/server';
import YouTubeSchedulerService from '@/services/youtubeSchedulerService';

// Global scheduler instance (in production, this would be managed differently)
let schedulerInstance: YouTubeSchedulerService | null = null;

/**
 * YouTube Scheduler Management API
 * GET /api/scheduler/youtube
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    // Initialize scheduler if not exists
    if (!schedulerInstance) {
      schedulerInstance = new YouTubeSchedulerService();
    }

    switch (action) {
      case 'status':
        const status = schedulerInstance.getSchedulerStatus();
        const healthCheck = schedulerInstance.healthCheck();
        
        return NextResponse.json({
          status: 'success',
          scheduler: status,
          health: healthCheck,
          timestamp: new Date().toISOString()
        });

      case 'stats':
        const stats = schedulerInstance.getProcessingStats();
        return NextResponse.json({
          status: 'success',
          stats: stats.slice(-20), // Last 20 processing runs
          summary: {
            totalRuns: stats.length,
            avgDuration: stats.length > 0 
              ? Math.round(stats.reduce((sum, s) => sum + s.duration, 0) / stats.length)
              : 0,
            totalErrors: stats.reduce((sum, s) => sum + s.errors.length, 0)
          },
          timestamp: new Date().toISOString()
        });

      case 'health':
        return NextResponse.json({
          status: 'success',
          health: schedulerInstance.healthCheck(),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: ['status', 'stats', 'health'],
          code: 'INVALID_ACTION'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in scheduler GET endpoint:', error);
    
    return NextResponse.json({
      error: 'Failed to get scheduler information',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'SCHEDULER_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Scheduler Control Actions
 * POST /api/scheduler/youtube
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    // Initialize scheduler if not exists
    if (!schedulerInstance) {
      schedulerInstance = new YouTubeSchedulerService();
    }

    switch (action) {
      case 'start':
        schedulerInstance.startScheduler();
        return NextResponse.json({
          status: 'success',
          message: 'Scheduler started successfully',
          timestamp: new Date().toISOString()
        });

      case 'stop':
        schedulerInstance.stopScheduler();
        return NextResponse.json({
          status: 'success',
          message: 'Scheduler stopped successfully',
          timestamp: new Date().toISOString()
        });

      case 'restart':
        schedulerInstance.stopScheduler();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        schedulerInstance.startScheduler();
        return NextResponse.json({
          status: 'success',
          message: 'Scheduler restarted successfully',
          timestamp: new Date().toISOString()
        });

      case 'updateConfig':
        if (!config) {
          return NextResponse.json({
            error: 'Configuration object required for updateConfig action',
            code: 'MISSING_CONFIG'
          }, { status: 400 });
        }

        // Validate config
        const validConfigKeys = ['videoCollection', 'dataProcessing', 'recommendation', 'cleanup', 'enabled'];
        const invalidKeys = Object.keys(config).filter(key => !validConfigKeys.includes(key));
        
        if (invalidKeys.length > 0) {
          return NextResponse.json({
            error: `Invalid config keys: ${invalidKeys.join(', ')}`,
            validKeys: validConfigKeys,
            code: 'INVALID_CONFIG_KEYS'
          }, { status: 400 });
        }

        schedulerInstance.updateSchedulerConfig(config);
        return NextResponse.json({
          status: 'success',
          message: 'Scheduler configuration updated successfully',
          newConfig: schedulerInstance.getSchedulerStatus().config,
          timestamp: new Date().toISOString()
        });

      case 'triggerUpdate':
        const stats = await schedulerInstance.triggerImmediateUpdate();
        return NextResponse.json({
          status: 'success',
          message: 'Immediate update triggered successfully',
          processingStats: stats,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: ['start', 'stop', 'restart', 'updateConfig', 'triggerUpdate'],
          code: 'INVALID_ACTION'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in scheduler POST endpoint:', error);
    
    return NextResponse.json({
      error: 'Failed to execute scheduler action',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'SCHEDULER_ACTION_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Get API Documentation
 * OPTIONS /api/scheduler/youtube
 */
export async function OPTIONS() {
  const documentation = {
    endpoint: '/api/scheduler/youtube',
    description: 'YouTube recommendation data collection scheduler management',
    methods: {
      GET: {
        description: 'Get scheduler status and statistics',
        parameters: {
          action: {
            type: 'string',
            default: 'status',
            options: ['status', 'stats', 'health'],
            description: 'Type of information to retrieve'
          }
        },
        examples: {
          status: '/api/scheduler/youtube?action=status',
          stats: '/api/scheduler/youtube?action=stats',
          health: '/api/scheduler/youtube?action=health'
        }
      },
      POST: {
        description: 'Control scheduler operations',
        body: {
          action: {
            type: 'string',
            required: true,
            options: ['start', 'stop', 'restart', 'updateConfig', 'triggerUpdate']
          },
          config: {
            type: 'object',
            required: false,
            description: 'Configuration object for updateConfig action',
            properties: {
              videoCollection: 'Cron expression for video collection',
              dataProcessing: 'Cron expression for data processing',
              recommendation: 'Cron expression for recommendation updates',
              cleanup: 'Cron expression for data cleanup',
              enabled: 'Boolean to enable/disable scheduler'
            }
          }
        },
        examples: {
          start: '{ "action": "start" }',
          stop: '{ "action": "stop" }',
          updateConfig: '{ "action": "updateConfig", "config": { "enabled": true, "videoCollection": "*/15 * * * *" } }',
          triggerUpdate: '{ "action": "triggerUpdate" }'
        }
      }
    },
    schedulerTasks: [
      'Video Collection: Fetch new videos from YouTube channels',
      'Data Processing: Extract stock mentions and analyze sentiment',
      'Recommendations: Generate updated stock recommendations',
      'Cleanup: Remove old data and maintain database'
    ],
    defaultSchedule: {
      videoCollection: 'Every 30 minutes',
      dataProcessing: 'Every 10 minutes',
      recommendation: 'Every 5 minutes',
      cleanup: 'Daily at 2 AM EST'
    },
    healthMetrics: [
      'Processing success rate',
      'Last execution time',
      'Error frequency',
      'Task completion status'
    ]
  };

  return NextResponse.json(documentation, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

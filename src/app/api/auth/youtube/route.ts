import { NextRequest, NextResponse } from 'next/server';
import YouTubeOAuthService from '@/services/youtubeOAuthService';

/**
 * YouTube OAuth Authorization Endpoint
 * GET /api/auth/youtube
 */
export async function GET() {
  try {
    if (!YouTubeOAuthService.isConfigured()) {
      return NextResponse.json({
        error: 'YouTube OAuth not configured',
        message: 'Please set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in environment variables'
      }, { status: 500 });
    }

    const authUrl = YouTubeOAuthService.getAuthUrl();
    
    return NextResponse.json({
      authUrl,
      message: 'Visit this URL to authorize YouTube access'
    });
  } catch (error) {
    console.error('YouTube OAuth initiation error:', error);
    return NextResponse.json({
      error: 'Failed to initiate OAuth',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

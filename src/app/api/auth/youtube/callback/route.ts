import { NextRequest, NextResponse } from 'next/server';
import YouTubeOAuthService from '@/services/youtubeOAuthService';

/**
 * YouTube OAuth Callback Endpoint
 * GET /api/auth/youtube/callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Handle OAuth errors
    if (error) {
      return NextResponse.json({
        error: 'OAuth authorization failed',
        details: error,
        message: 'User denied authorization or an error occurred'
      }, { status: 400 });
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.json({
        error: 'Missing authorization code',
        message: 'No authorization code received from YouTube'
      }, { status: 400 });
    }

    // Validate state parameter (basic security check)
    if (!state || !state.startsWith('youtube_auth_')) {
      return NextResponse.json({
        error: 'Invalid state parameter',
        message: 'State parameter validation failed'
      }, { status: 400 });
    }

    // Exchange code for token
    const tokenResponse = await YouTubeOAuthService.exchangeCodeForToken(code);
    
    if (!tokenResponse.success) {
      return NextResponse.json({
        error: 'Token exchange failed',
        message: tokenResponse.error || 'Unknown error'
      }, { status: 400 });
    }
    
    // In a real app, you'd store this token in a database associated with the user
    // For now, we'll just return success and store in service memory
    
    return NextResponse.json({
      success: true,
      message: 'YouTube OAuth authorization successful!',
      tokenInfo: {
        hasToken: !!tokenResponse.credentials?.access_token,
        hasRefreshToken: !!tokenResponse.credentials?.refresh_token,
        expiresIn: tokenResponse.credentials?.expires_in,
        tokenType: tokenResponse.credentials?.token_type
      }
    });
    
  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    return NextResponse.json({
      error: 'OAuth callback failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

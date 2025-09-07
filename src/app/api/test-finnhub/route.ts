/**
 * API Route for Testing Finnhub Configuration
 * GET /api/test-finnhub
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    console.log('🧪 Testing Finnhub API Key Configuration...');
    console.log('🔑 API Key found:', !!apiKey);
    console.log('🔑 API Key length:', apiKey?.length || 0);
    console.log('🔑 API Key starts with:', apiKey?.substring(0, 8) + '...' || 'N/A');
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'No API key found in environment variables',
        configured: false
      });
    }
    
    // Test the API call
    console.log('📡 Making test call to Finnhub...');
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`);
    
    console.log('📈 Finnhub Response Status:', response.status);
    console.log('📈 Finnhub Response OK:', response.ok);
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `API Error: ${response.status} ${response.statusText}`,
        configured: true,
        valid: false,
        status: response.status
      });
    }
    
    const data = await response.json();
    console.log('📊 Finnhub Response Data:', data);
    
    const hasValidData = data && data.c !== undefined && data.c !== null && data.c > 0;
    
    if (hasValidData) {
      console.log('✅ SUCCESS! Real data confirmed - AAPL price:', data.c);
    } else {
      console.log('⚠️ Invalid data received:', data);
    }
    
    return NextResponse.json({
      success: hasValidData,
      message: hasValidData ? 
        `API key working! Current AAPL price: $${data.c}` : 
        'API key valid but no data received',
      configured: true,
      valid: true,
      realData: hasValidData,
      data: hasValidData ? {
        ticker: 'AAPL',
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        timestamp: new Date(data.t * 1000).toISOString()
      } : null
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json({
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      configured: !!process.env.FINNHUB_API_KEY,
      valid: false
    });
  }
}

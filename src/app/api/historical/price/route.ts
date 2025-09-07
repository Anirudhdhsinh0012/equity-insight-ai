/**
 * API Routes for Historical Price Fetching
 * /api/historical/price
 */

import { NextRequest, NextResponse } from 'next/server';
import { historicalPriceService } from '@/services/historicalPriceService';
import { HistoricalPriceRequest } from '@/types';

/**
 * POST /api/historical/price
 * Fetch historical price for a specific date, time, and quantity
 * 
 * Request Body:
 * {
 *   "ticker": "AAPL",
 *   "date": "2024-08-29",
 *   "time": "14:30",
 *   "quantity": 100
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "ticker": "AAPL",
 *     "requestedDateTime": "2024-08-29T14:30:00.000Z",
 *     "actualDateTime": "2024-08-29T20:00:00.000Z",
 *     "price": 150.25,
 *     "quantity": 100,
 *     "totalValue": 15025.00,
 *     "volume": 1234567,
 *     "high": 152.00,
 *     "low": 148.50,
 *     "open": 149.00,
 *     "close": 150.25
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, date, time, quantity } = body as HistoricalPriceRequest;

    // Validate required fields
    if (!ticker || !date || !time || !quantity) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['ticker', 'date', 'time', 'quantity']
        },
        { status: 400 }
      );
    }

    // Validate ticker format
    if (typeof ticker !== 'string' || ticker.length < 1 || ticker.length > 10) {
      return NextResponse.json(
        { error: 'Invalid ticker symbol' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0 || quantity > 1000000) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number between 1 and 1,000,000' },
        { status: 400 }
      );
    }

    // Validate date and time format
    const validation = historicalPriceService.validateDateTime(date, time);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Fetch historical price
    const historicalData = await historicalPriceService.getHistoricalPrice({
      ticker: ticker.toUpperCase(),
      date,
      time,
      quantity
    });

    if (!historicalData) {
      return NextResponse.json(
        { error: 'Unable to fetch historical price for the specified date and time' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: historicalData,
      message: 'Historical price fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching historical price:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

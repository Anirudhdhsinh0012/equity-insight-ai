/**
 * API Routes for Stock Positions Management
 * /api/positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { historicalPriceService } from '@/services/historicalPriceService';

/**
 * GET /api/positions?userId=xxx
 * Get all stock positions for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const positions = historicalPriceService.getUserPositions(userId);

    return NextResponse.json({
      success: true,
      data: positions,
      count: positions.length
    });

  } catch (error) {
    console.error('Error fetching user positions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/positions
 * Create a new stock position with historical reference price
 * 
 * Request Body:
 * {
 *   "userId": "user123",
 *   "historicalData": {
 *     "ticker": "AAPL",
 *     "requestedDateTime": "2024-08-29T14:30:00.000Z",
 *     "actualDateTime": "2024-08-29T20:00:00.000Z",
 *     "price": 150.25,
 *     "quantity": 100,
 *     "totalValue": 15025.00
 *   },
 *   "upperThreshold": 160.00,
 *   "lowerThreshold": 140.00
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, historicalData, upperThreshold, lowerThreshold } = body;

    if (!userId || !historicalData) {
      return NextResponse.json(
        { error: 'User ID and historical data are required' },
        { status: 400 }
      );
    }

    // Validate thresholds
    if (upperThreshold && lowerThreshold && upperThreshold <= lowerThreshold) {
      return NextResponse.json(
        { error: 'Upper threshold must be greater than lower threshold' },
        { status: 400 }
      );
    }

    if (upperThreshold && upperThreshold <= historicalData.price) {
      return NextResponse.json(
        { error: 'Upper threshold should be above the reference price' },
        { status: 400 }
      );
    }

    if (lowerThreshold && lowerThreshold >= historicalData.price) {
      return NextResponse.json(
        { error: 'Lower threshold should be below the reference price' },
        { status: 400 }
      );
    }

    const position = await historicalPriceService.createStockPosition(
      userId,
      historicalData,
      upperThreshold,
      lowerThreshold
    );

    return NextResponse.json({
      success: true,
      data: position,
      message: 'Stock position created successfully'
    });

  } catch (error) {
    console.error('Error creating stock position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/positions
 * Update position thresholds
 * 
 * Request Body:
 * {
 *   "positionId": "pos_xxx",
 *   "upperThreshold": 165.00,
 *   "lowerThreshold": 135.00
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { positionId, upperThreshold, lowerThreshold } = body;

    if (!positionId) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    if (!upperThreshold && !lowerThreshold) {
      return NextResponse.json(
        { error: 'At least one threshold is required' },
        { status: 400 }
      );
    }

    if (upperThreshold && lowerThreshold && upperThreshold <= lowerThreshold) {
      return NextResponse.json(
        { error: 'Upper threshold must be greater than lower threshold' },
        { status: 400 }
      );
    }

    const success = await historicalPriceService.updatePositionThresholds(
      positionId,
      upperThreshold,
      lowerThreshold
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Position thresholds updated successfully'
    });

  } catch (error) {
    console.error('Error updating position thresholds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/positions?positionId=xxx
 * Delete a stock position
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get('positionId');

    if (!positionId) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    const success = await historicalPriceService.deletePosition(positionId);

    if (!success) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Position deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

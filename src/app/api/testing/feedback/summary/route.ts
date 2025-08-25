/**
 * Feedback Summary API Route
 * Phase 2.8 - Testing & User Feedback
 * 
 * API endpoint for retrieving feedback summary and analytics
 * for AI personalization testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/ai-logger';
import { db } from '@/lib/db';

// Initialize services
const logger = new (Logger as any)();

/**
 * GET /api/testing/feedback/summary - Get feedback summary
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = searchParams.get('page');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query filters
    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (page) whereClause.page = page;
    if (startDate) whereClause.timestamp = { gte: new Date(startDate) };
    if (endDate) whereClause.timestamp = { ...whereClause.timestamp, lte: new Date(endDate) };

    // Get feedback summary from database
    const totalCount = await db.userFeedback.count({ where: whereClause });
    const avgRating = await db.userFeedback.aggregate({
      where: whereClause,
      _avg: { rating: true }
    });

    // Get top suggestions from feedback analysis
    const suggestionsData = await db.feedbackAnalysis.findMany({
      where: whereClause,
      select: { improvements: true }
    });

    const allSuggestions = suggestionsData
      .filter(item => item.improvements)
      .flatMap(item => {
        try {
          return JSON.parse(item.improvements!);
        } catch {
          return [];
        }
      });
    const suggestionCounts = allSuggestions.reduce((acc, suggestion) => {
      acc[suggestion] = (acc[suggestion] || 0) + 1;
      return acc;
    }, {});

    const topSuggestions = Object.entries(suggestionCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([suggestion, count]) => ({ suggestion, count }));

    // Get sentiment analysis
    const sentimentData = await db.feedbackAnalysis.groupBy({
      by: ['sentiment'],
      where: whereClause,
      _count: { sentiment: true }
    });

    const sentimentAnalysis = sentimentData.reduce((acc, item) => {
      acc[item.sentiment] = item._count.sentiment;
      return acc;
    }, {});

    // Get feedback trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendsData = await db.userFeedback.groupBy({
      by: ['timestamp'],
      where: {
        ...whereClause,
        timestamp: { gte: sevenDaysAgo }
      },
      _count: { timestamp: true },
      _avg: { rating: true }
    });

    const trends = {
      dailyFeedback: trendsData.map(item => ({
        date: item.timestamp.toISOString().split('T')[0],
        count: item._count.timestamp,
        avgRating: item._avg.rating
      }))
    };

    const summary = {
      total: totalCount,
      averageRating: avgRating._avg.rating || 0
    };

    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        topSuggestions,
        sentimentAnalysis,
        trends
      },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Failed to get feedback summary', error);
    return NextResponse.json(
      { 
        error: 'Failed to get feedback summary',
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
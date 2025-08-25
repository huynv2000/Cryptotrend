/**
 * User Feedback API Route
 * Phase 2.8 - Testing & User Feedback
 * 
 * API endpoint for collecting and managing user feedback
 * for AI personalization testing and optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/ai-logger';
import { db } from '@/lib/db';

// Initialize services
const logger = new (Logger as any)();

interface FeedbackData {
  userId: string;
  sessionId: string;
  testId?: string;
  rating: number;
  feedback: string;
  suggestions: string[];
  timestamp: Date;
  context: {
    page: string;
    section?: string;
    deviceType: string;
    experienceLevel: string;
  };
}

/**
 * POST /api/testing/feedback - Submit user feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      sessionId,
      testId,
      rating,
      feedback,
      suggestions = [],
      context
    } = body;

    // Validate required fields
    if (!userId || !sessionId || rating === undefined || !context) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['userId', 'sessionId', 'rating', 'context']
        },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { 
          error: 'Rating must be between 1 and 5',
          received: rating
        },
        { status: 400 }
      );
    }

    // Create feedback data
    const feedbackData: FeedbackData = {
      userId,
      sessionId,
      testId,
      rating,
      feedback: feedback || '',
      suggestions: Array.isArray(suggestions) ? suggestions : [],
      timestamp: new Date(),
      context: {
        page: context.page || 'unknown',
        section: context.section,
        deviceType: context.deviceType || 'web',
        experienceLevel: context.experienceLevel || 'beginner'
      }
    };

    // Save feedback to database
    const savedFeedback = await db.userFeedback.create({
      data: {
        userId: feedbackData.userId,
        sessionId: feedbackData.sessionId,
        testId: feedbackData.testId || null,
        rating: feedbackData.rating,
        feedback: feedbackData.feedback,
        suggestions: feedbackData.suggestions ? JSON.stringify(feedbackData.suggestions) : null,
        page: feedbackData.context.page,
        section: feedbackData.context.section || null,
        deviceType: feedbackData.context.deviceType,
        experienceLevel: feedbackData.context.experienceLevel,
        timestamp: feedbackData.timestamp
      }
    });

    // Log feedback submission
    logger.info('User feedback submitted', {
      userId,
      sessionId,
      rating,
      hasFeedback: !!feedback,
      suggestionsCount: suggestions.length,
      page: context.page
    });

    // Trigger feedback analysis if needed
    await analyzeFeedback(feedbackData);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: savedFeedback.id,
      timestamp: feedbackData.timestamp
    });

  } catch (error) {
    logger.error('Failed to submit user feedback', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/testing/feedback - Get feedback data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const testId = searchParams.get('testId');
    const page = searchParams.get('page');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (sessionId) whereClause.sessionId = sessionId;
    if (testId) whereClause.testId = testId;
    if (page) whereClause.page = page;

    // Get feedback from database
    const feedbackData = await db.userFeedback.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' }
    });

    // Get summary statistics
    const totalCount = await db.userFeedback.count({ where: whereClause });
    const avgRating = await db.userFeedback.aggregate({
      where: whereClause,
      _avg: { rating: true }
    });

    const summary = {
      total: totalCount,
      averageRating: avgRating._avg.rating || 0,
      ratingDistribution: {} // Could be enhanced with actual distribution
    };

    return NextResponse.json({
      success: true,
      feedback: feedbackData,
      summary,
      pagination: {
        limit,
        offset,
        total: summary.total
      }
    });

  } catch (error) {
    logger.error('Failed to get user feedback', error);
    return NextResponse.json(
      { 
        error: 'Failed to get feedback',
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

/**
 * Analyze feedback and generate insights
 */
async function analyzeFeedback(feedback: FeedbackData): Promise<void> {
  try {
    // Analyze sentiment based on rating and feedback text
    const sentiment = analyzeSentiment(feedback);
    
    // Extract key themes from feedback
    const themes = extractThemes(feedback);
    
    // Generate improvement suggestions
    const improvements = generateImprovementSuggestions(feedback, sentiment, themes);
    
    // Save analysis results
    await db.feedbackAnalysis.create({
      data: {
        feedbackId: feedback.testId || 'unknown',
        userId: feedback.userId,
        sentiment,
        themes: themes.length > 0 ? JSON.stringify(themes) : null,
        improvements: improvements.length > 0 ? JSON.stringify(improvements) : null,
        timestamp: new Date()
      }
    });

    logger.info('Feedback analysis completed', {
      userId: feedback.userId,
      sentiment,
      themesCount: themes.length,
      improvementsCount: improvements.length
    });

  } catch (error) {
    logger.error('Failed to analyze feedback', error);
    // Don't throw error to avoid breaking the feedback submission
  }
}

/**
 * Analyze sentiment from feedback
 */
function analyzeSentiment(feedback: FeedbackData): string {
  // Simple sentiment analysis based on rating and keywords
  if (feedback.rating >= 4) {
    return 'positive';
  } else if (feedback.rating <= 2) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

/**
 * Extract themes from feedback
 */
function extractThemes(feedback: FeedbackData): string[] {
  const themes: string[] = [];
  const text = (feedback.feedback + ' ' + feedback.suggestions.join(' ')).toLowerCase();

  // Common themes in personalization feedback
  const themeKeywords = {
    'accuracy': ['accurate', 'correct', 'wrong', 'inaccurate', 'precision'],
    'speed': ['fast', 'slow', 'quick', 'delay', 'responsive'],
    'relevance': ['relevant', 'irrelevant', 'useful', 'helpful', 'not helpful'],
    'ui_ux': ['interface', 'design', 'layout', 'user experience', 'easy to use'],
    'recommendations': ['recommendation', 'suggestion', 'advice', 'tip'],
    'personalization': ['personalized', 'customized', 'tailored', 'individual'],
    'performance': ['performance', 'lag', 'crash', 'bug', 'error'],
    'features': ['feature', 'functionality', 'capability', 'option']
  };

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  }

  return themes;
}

/**
 * Generate improvement suggestions based on feedback
 */
function generateImprovementSuggestions(
  feedback: FeedbackData, 
  sentiment: string, 
  themes: string[]
): string[] {
  const suggestions: string[] = [];

  // Generate suggestions based on sentiment and themes
  if (sentiment === 'negative') {
    if (themes.includes('accuracy')) {
      suggestions.push('Improve AI model accuracy and prediction quality');
    }
    if (themes.includes('speed')) {
      suggestions.push('Optimize response time and performance');
    }
    if (themes.includes('relevance')) {
      suggestions.push('Enhance content relevance and personalization quality');
    }
    if (themes.includes('ui_ux')) {
      suggestions.push('Improve user interface and experience design');
    }
  }

  // Add general improvement suggestions
  if (feedback.rating <= 3) {
    suggestions.push('Consider implementing user feedback for continuous improvement');
    suggestions.push('Enhance AI model training with more diverse data');
  }

  // Add specific suggestions based on context
  if (feedback.context.page === 'dashboard') {
    suggestions.push('Optimize dashboard personalization and layout');
  }

  return suggestions;
}
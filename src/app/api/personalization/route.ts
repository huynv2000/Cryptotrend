/**
 * Personalization API Routes
 * Phase 2.7 - AI Personalization Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersonalizationSystemIntegration, PersonalizationSystemConfig } from '@/lib/personalization-system';
import { Logger } from '@/lib/ai-logger';
import { db } from '@/lib/db';

// Initialize services
const logger = new (Logger as any)();

// Configuration
const config: PersonalizationSystemConfig = {
  zai: {
    timeout: 30000,
    maxRetries: 3,
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000
  },
  behaviorAnalytics: {
    maxEventsPerSession: 50,
    sessionTimeout: 30, // minutes
    analysisInterval: 5, // minutes
    enableRealTimeAnalysis: true,
    storageRetentionDays: 30
  },
  contentPersonalization: {
    enableRealTimeAdaptation: true,
    contentRefreshInterval: 10, // minutes
    maxRecommendationsPerType: 5,
    confidenceThreshold: 0.6,
    enableAATesting: false
  },
  realTimeProcessing: {
    enableWebSocket: true,
    maxConnections: 1000,
    messageRateLimit: 100,
    processingInterval: 1000, // milliseconds
    enableRealTimeAnalysis: true,
    marketDataUpdateInterval: 30 // seconds
  },
  enableFeatures: {
    behaviorTracking: true,
    contentPersonalization: true,
    realTimeProcessing: true,
    aiAnalysis: true
  },
  performance: {
    cacheSize: 1000,
    processingTimeout: 30000,
    maxConcurrentRequests: 100
  }
};

// Initialize personalization system
let personalizationSystem: PersonalizationSystemIntegration;

async function getPersonalizationSystem(): Promise<PersonalizationSystemIntegration> {
  if (!personalizationSystem) {
    personalizationSystem = new PersonalizationSystemIntegration(config, db, logger);
  }
  return personalizationSystem;
}

/**
 * GET /api/personalization - Get personalized content for user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const page = searchParams.get('page') || 'dashboard';
    const section = searchParams.get('section') || undefined;
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'User ID and Session ID are required' },
        { status: 400 }
      );
    }

    const system = await getPersonalizationSystem();
    
    const response = await system.getPersonalization({
      userId,
      sessionId,
      context: {
        page,
        section,
        deviceType: 'web',
        experienceLevel: 'beginner' // This would come from user profile
      },
      forceRefresh
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to get personalization', error);
    return NextResponse.json(
      { 
        error: 'Failed to get personalization',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/personalization/track - Track user event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, eventType, target, value, metadata } = body;

    if (!userId || !sessionId || !eventType || !target) {
      return NextResponse.json(
        { error: 'User ID, Session ID, Event Type, and Target are required' },
        { status: 400 }
      );
    }

    const system = await getPersonalizationSystem();
    
    await system.trackUserEvent({
      userId,
      sessionId,
      eventType,
      target,
      value,
      metadata
    });

    return NextResponse.json({ 
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    logger.error('Failed to track user event', error);
    return NextResponse.json(
      { 
        error: 'Failed to track event',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
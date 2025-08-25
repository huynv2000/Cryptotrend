/**
 * Test Results API Route
 * Phase 2.8 - Testing & User Feedback
 * 
 * API endpoint for retrieving and managing test results
 * for AI personalization testing framework
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/ai-logger';
import { db } from '@/lib/db';
import { PersonalizationTestingFramework } from '@/lib/testing/personalization-testing';

// Initialize services
const logger = new (Logger as any)();

// Global testing framework instance
let testingFramework: PersonalizationTestingFramework | null = null;

/**
 * GET /api/testing/results - Get test results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as any;
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query filters
    const whereClause: any = {};
    if (category) whereClause.category = category;
    if (status) whereClause.status = status;
    if (startDate) whereClause.timestamp = { gte: new Date(startDate) };
    if (endDate) whereClause.timestamp = { ...whereClause.timestamp, lte: new Date(endDate) };

    // Get test results from database - using simulated data for now
    // In a real implementation, this would query test results table
    const testResults: any[] = []; // await db.testResults.findMany({ where: whereClause, take: limit, skip: offset });

    // Get summary statistics - using simulated data for now
    const summary = {
      total: testResults.length,
      passed: testResults.filter(r => r.status === 'PASSED').length,
      failed: testResults.filter(r => r.status === 'FAILED').length,
      successRate: testResults.length > 0 ? (testResults.filter(r => r.status === 'PASSED').length / testResults.length) * 100 : 0
    };

    return NextResponse.json({
      success: true,
      results: testResults,
      summary,
      pagination: {
        limit,
        offset,
        total: summary.total
      }
    });

  } catch (error) {
    logger.error('Failed to get test results', error);
    return NextResponse.json(
      { 
        error: 'Failed to get test results',
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/testing/results - Run tests and get results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      testTypes = ['unit', 'integration', 'performance'],
      iterations = 1,
      timeout = 30000,
      parallel = false,
      verbose = false,
      generateReport = true,
      collectUserFeedback = false,
      enableRealTimeMonitoring = false
    } = body;

    // Initialize testing framework if not already done
    if (!testingFramework) {
      const config = {
        testTypes,
        iterations,
        timeout,
        parallel,
        verbose,
        generateReport,
        collectUserFeedback,
        enableRealTimeMonitoring
      };
      
      testingFramework = new PersonalizationTestingFramework(
        config,
        logger,
        db
      );
    }

    // Run the testing suite
    const results = await testingFramework.runTestingSuite();

    // Save results to database - using simulated data for now
    // In a real implementation, this would save to test results table
    // for (const result of results) {
    //   await db.testResults.create({ data: result });
    // }

    // Get testing summary
    const summary = testingFramework.getTestingSummary();

    logger.info('Testing suite completed', {
      totalTests: results.length,
      passedTests: results.filter(r => r.status === 'PASSED').length,
      failedTests: results.filter(r => r.status === 'FAILED').length,
      successRate: summary.successRate
    });

    return NextResponse.json({
      success: true,
      message: 'Testing suite completed successfully',
      results,
      summary,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Failed to run testing suite', error);
    return NextResponse.json(
      { 
        error: 'Failed to run testing suite',
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/testing/results - Clear test results
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '30');

    // Clear old test results - using simulated data for now
    // In a real implementation, this would delete from test results table
    const deletedCount = 0; // await db.testResults.deleteMany({ where: { timestamp: { lt: new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000) } } });

    logger.info('Test results cleared', {
      olderThanDays,
      deletedCount
    });

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} test results older than ${olderThanDays} days`,
      deletedCount
    });

  } catch (error) {
    logger.error('Failed to clear test results', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear test results',
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
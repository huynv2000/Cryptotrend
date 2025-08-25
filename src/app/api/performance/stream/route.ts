import { NextRequest } from 'next/server';
import { realTimeMetricsCollector } from '@/lib/real-time-metrics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || 'unknown';
    
    console.log(`🔗 New WebSocket connection from client: ${clientId}`);

    // In a real implementation, this would use WebSocket or Server-Sent Events
    // For now, we'll return the current metrics and setup instructions
    
    const latestMetrics = realTimeMetricsCollector.getLatestMetrics();
    const aggregatedMetrics = realTimeMetricsCollector.getAggregatedMetrics();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Real-time metrics endpoint',
      clientId,
      latestMetrics,
      aggregatedMetrics,
      config: {
        collectionInterval: 5000,
        retentionPeriod: 3600000,
        enableRealTimeAlerts: true,
        enablePredictiveAnalysis: true,
      },
      instructions: {
        websocket: 'Use WebSocket connection for real-time streaming',
        sse: 'Use Server-Sent Events for real-time updates',
        polling: 'Poll this endpoint every 5 seconds for updates',
      },
      timestamp: new Date().toISOString(),
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ Performance stream API failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'track-request':
        return await trackRequest(params);
      
      case 'track-error':
        return await trackError();
      
      case 'update-metrics':
        return await updateMetrics(params);
      
      case 'get-history':
        return await getMetricsHistory(params);
      
      default:
        return new Response(JSON.stringify({
          error: 'Invalid action parameter',
          timestamp: new Date().toISOString(),
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('❌ Performance stream API POST failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function trackRequest(params: { responseTime: number; clientId?: string }) {
  try {
    const { responseTime, clientId } = params;
    
    if (typeof responseTime !== 'number' || responseTime < 0) {
      return new Response(JSON.stringify({
        error: 'Invalid response time parameter',
        timestamp: new Date().toISOString(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    realTimeMetricsCollector.trackRequest(responseTime);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Request tracked successfully',
      clientId,
      responseTime,
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Failed to track request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Failed to track request',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function trackError() {
  try {
    realTimeMetricsCollector.trackError();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Error tracked successfully',
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Failed to track error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Failed to track error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function updateMetrics(params: { 
  activeUsers?: number; 
  queueLength?: number;
  clientId?: string;
}) {
  try {
    const { activeUsers, queueLength, clientId } = params;
    
    if (activeUsers !== undefined) {
      realTimeMetricsCollector.updateActiveUsers(activeUsers);
    }
    
    if (queueLength !== undefined) {
      realTimeMetricsCollector.updateQueueLength(queueLength);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Metrics updated successfully',
      clientId,
      updates: { activeUsers, queueLength },
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Failed to update metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Failed to update metrics',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function getMetricsHistory(params: { duration?: number; clientId?: string }) {
  try {
    const { duration = 300000, clientId } = params; // Default 5 minutes
    
    const history = realTimeMetricsCollector.getMetricsHistory(duration);
    const aggregated = realTimeMetricsCollector.getAggregatedMetrics(duration);
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        history,
        aggregated,
        count: history.length,
        duration,
      },
      clientId,
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Failed to get metrics history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      error: 'Failed to get metrics history',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitoringService } from '@/lib/performance/performance-monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'dashboard':
        return await getDashboard();
      
      case 'metrics':
        return await getMetrics();
      
      case 'alerts':
        return await getAlerts();
      
      case 'health':
        return await getHealth();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Performance Monitoring API GET request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      
      case 'resolve-alert':
        return await resolveAlert(params);
      
      case 'start':
        return await startMonitoring();
      
      case 'stop':
        return await stopMonitoring();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Performance Monitoring API POST request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getDashboard() {
  try {
    const dashboard = performanceMonitoringService.getDashboard();
    
    return NextResponse.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard' },
      { status: 500 }
    );
  }
}

async function getMetrics() {
  try {
    const dashboard = performanceMonitoringService.getDashboard();
    
    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not available' },
        { status: 404 }
      );
    }

    const metrics = {
      system: dashboard.system,
      application: dashboard.application,
      database: dashboard.database,
      cache: dashboard.cache,
      timestamp: dashboard.timestamp,
    };
    
    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}

async function getAlerts() {
  try {
    const alerts = performanceMonitoringService.getAlerts();
    
    return NextResponse.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get alerts:', error);
    return NextResponse.json(
      { error: 'Failed to get alerts' },
      { status: 500 }
    );
  }
}

async function getHealth() {
  try {
    const dashboard = performanceMonitoringService.getDashboard();
    
    if (!dashboard) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'UNKNOWN',
          healthy: false,
          issues: ['Dashboard not initialized'],
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    const health = {
      status: dashboard.health,
      healthy: dashboard.health === 'HEALTHY',
      issues: dashboard.alerts
        .filter(alert => !alert.resolved)
        .map(alert => `${alert.category}: ${alert.title}`),
      alertCount: dashboard.alerts.filter(alert => !alert.resolved).length,
      timestamp: dashboard.timestamp,
    };
    
    return NextResponse.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get health:', error);
    return NextResponse.json(
      { error: 'Failed to get health' },
      { status: 500 }
    );
  }
}

async function trackRequest(params: { responseTime: number }) {
  try {
    const { responseTime } = params;
    
    if (typeof responseTime !== 'number' || responseTime < 0) {
      return NextResponse.json(
        { error: 'Invalid response time parameter' },
        { status: 400 }
      );
    }

    performanceMonitoringService.trackRequest(responseTime);
    
    return NextResponse.json({
      success: true,
      message: 'Request tracked successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to track request:', error);
    return NextResponse.json(
      { error: 'Failed to track request' },
      { status: 500 }
    );
  }
}

async function trackError() {
  try {
    performanceMonitoringService.trackError();
    
    return NextResponse.json({
      success: true,
      message: 'Error tracked successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to track error:', error);
    return NextResponse.json(
      { error: 'Failed to track error' },
      { status: 500 }
    );
  }
}

async function resolveAlert(params: { alertId: string }) {
  try {
    const { alertId } = params;
    
    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID parameter is required' },
        { status: 400 }
      );
    }

    const success = await performanceMonitoringService.resolveAlert(alertId);
    
    return NextResponse.json({
      success,
      message: success ? 'Alert resolved successfully' : 'Failed to resolve alert',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to resolve alert:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}

async function startMonitoring() {
  try {
    await performanceMonitoringService.initialize();
    
    return NextResponse.json({
      success: true,
      message: 'Performance monitoring started successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to start monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to start monitoring' },
      { status: 500 }
    );
  }
}

async function stopMonitoring() {
  try {
    await performanceMonitoringService.stop();
    
    return NextResponse.json({
      success: true,
      message: 'Performance monitoring stopped successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to stop monitoring:', error);
    return NextResponse.json(
      { error: 'Failed to stop monitoring' },
      { status: 500 }
    );
  }
}
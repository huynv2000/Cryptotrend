import { NextRequest, NextResponse } from 'next/server';
import { enhancedCachingService } from '@/lib/enhanced-caching-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'metrics':
        return await getCacheMetrics();
      
      case 'health':
        return await getCacheHealth();
      
      case 'stats':
        return await getCacheStats();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Cache API GET request failed:', error);
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
      case 'warm':
        return await warmCache(params);
      
      case 'invalidate':
        return await invalidateCache(params);
      
      case 'clear':
        return await clearCache();
      
      case 'set':
        return await setCacheValue(params);
      
      case 'get':
        return await getCacheValue(params);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Cache API POST request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getCacheMetrics() {
  try {
    const metrics = await enhancedCachingService.getPerformanceMetrics();
    
    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get cache metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get cache metrics' },
      { status: 500 }
    );
  }
}

async function getCacheHealth() {
  try {
    const health = await enhancedCachingService.getCacheHealth();
    
    return NextResponse.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get cache health:', error);
    return NextResponse.json(
      { error: 'Failed to get cache health' },
      { status: 500 }
    );
  }
}

async function getCacheStats() {
  try {
    const { multiLayerCachingStrategy } = await import('@/lib/performance/caching-strategy');
    const stats = await multiLayerCachingStrategy.getCacheStats();
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

async function warmCache(params: { keys: string[]; data: any[] }) {
  try {
    const { keys, data } = params;
    
    if (!keys || !data || keys.length !== data.length) {
      return NextResponse.json(
        { error: 'Invalid parameters for cache warming' },
        { status: 400 }
      );
    }

    await enhancedCachingService.warmCache(keys, data);
    
    return NextResponse.json({
      success: true,
      message: `Cache warming completed for ${keys.length} keys`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to warm cache:', error);
    return NextResponse.json(
      { error: 'Failed to warm cache' },
      { status: 500 }
    );
  }
}

async function invalidateCache(params: { pattern: string }) {
  try {
    const { pattern } = params;
    
    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern parameter is required' },
        { status: 400 }
      );
    }

    const success = await enhancedCachingService.invalidate(pattern);
    
    return NextResponse.json({
      success,
      message: success ? `Cache invalidated for pattern: ${pattern}` : 'Failed to invalidate cache',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to invalidate cache:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}

async function clearCache() {
  try {
    await enhancedCachingService.clearCache();
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

async function setCacheValue(params: { key: string; data: any; options?: any }) {
  try {
    const { key, data, options } = params;
    
    if (!key || data === undefined) {
      return NextResponse.json(
        { error: 'Key and data parameters are required' },
        { status: 400 }
      );
    }

    const success = await enhancedCachingService.set(key, data, options);
    
    return NextResponse.json({
      success,
      message: success ? `Cache value set for key: ${key}` : 'Failed to set cache value',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to set cache value:', error);
    return NextResponse.json(
      { error: 'Failed to set cache value' },
      { status: 500 }
    );
  }
}

async function getCacheValue(params: { key: string; options?: any }) {
  try {
    const { key, options } = params;
    
    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    const data = await enhancedCachingService.get(key, options);
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to get cache value:', error);
    return NextResponse.json(
      { error: 'Failed to get cache value' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Process the request
  const response = NextResponse.next();
  
  // Calculate response time
  const responseTime = Date.now() - startTime;
  
  // Track performance metrics (non-blocking)
  if (process.env.NODE_ENV === 'production') {
    trackPerformanceMetrics(request, responseTime).catch(console.error);
  }
  
  return response;
}

async function trackPerformanceMetrics(request: NextRequest, responseTime: number) {
  try {
    // Skip tracking for static assets and health checks
    const url = request.nextUrl;
    if (url.pathname.startsWith('/_next') || 
        url.pathname.startsWith('/static') || 
        url.pathname === '/api/health') {
      return;
    }

    // Track request metrics
    await fetch('http://localhost:3000/api/performance/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track-request',
        responseTime
      })
    }).catch(() => {
      // Silently fail if tracking service is unavailable
    });

    // Track error metrics for error responses
    const response = await fetch(request.url);
    if (!response.ok) {
      await fetch('http://localhost:3000/api/performance/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track-error'
        })
      }).catch(() => {
        // Silently fail if tracking service is unavailable
      });
    }
  } catch (error) {
    // Silently fail to avoid impacting application performance
    console.debug('Performance tracking failed:', error);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
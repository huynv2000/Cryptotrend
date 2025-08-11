import { NextRequest, NextResponse } from 'next/server'
import { systemTester } from '@/lib/system-test'

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Running system health check...')
    
    // Run comprehensive tests
    const healthReport = await systemTester.runComprehensiveTests()
    
    // Return appropriate HTTP status based on overall health
    let httpStatus = 200
    if (healthReport.overall === 'UNHEALTHY') {
      httpStatus = 503
    } else if (healthReport.overall === 'DEGRADED') {
      httpStatus = 200
    }
    
    return NextResponse.json(healthReport, { status: httpStatus })
    
  } catch (error) {
    console.error('❌ System health check failed:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: 'UNHEALTHY',
      tests: [],
      recommendations: ['System health check failed - check server logs'],
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'detailed_test') {
      // Run more detailed tests with custom configuration
      console.log('🔍 Running detailed system tests...')
      
      const healthReport = await systemTester.runComprehensiveTests()
      
      // Add additional system metrics
      const systemMetrics = {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
      
      return NextResponse.json({
        ...healthReport,
        systemMetrics,
        testType: 'detailed'
      })
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    
  } catch (error) {
    console.error('❌ Detailed system test failed:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
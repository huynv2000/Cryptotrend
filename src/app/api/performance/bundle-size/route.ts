import { NextRequest, NextResponse } from 'next/server';
import { bundleSizeOptimizer } from '@/lib/performance/bundle-size-optimization';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'analyze':
        const analysis = await bundleSizeOptimizer.analyzeBundle();
        return NextResponse.json({
          success: true,
          data: analysis,
          message: 'Bundle analysis completed successfully'
        });

      case 'optimize':
        await bundleSizeOptimizer.optimizeBundle();
        return NextResponse.json({
          success: true,
          message: 'Bundle optimization completed successfully'
        });

      case 'report':
        const report = bundleSizeOptimizer.getOptimizationReport();
        return NextResponse.json({
          success: true,
          data: report,
          message: 'Bundle optimization report generated successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Bundle size optimization error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const lastAnalysis = bundleSizeOptimizer.getLastAnalysis();
    const history = bundleSizeOptimizer.getAnalysisHistory();

    return NextResponse.json({
      success: true,
      data: {
        lastAnalysis,
        history,
        hasAnalysis: !!lastAnalysis,
        analysisCount: history.length
      }
    });
  } catch (error) {
    console.error('Failed to get bundle size optimization data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
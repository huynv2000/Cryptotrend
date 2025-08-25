import { NextRequest, NextResponse } from 'next/server';
import { AIBuildAnalysis } from '@/lib/performance/ai-build-analysis';

// Initialize AI build analysis instance
const aiBuildAnalysis = new AIBuildAnalysis();

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'analyze':
        const buildMetrics = await aiBuildAnalysis.analyzeBuild();
        return NextResponse.json({
          success: true,
          data: buildMetrics,
          message: 'Build analysis completed successfully'
        });

      case 'predict':
        const prediction = await aiBuildAnalysis.predictBuild();
        return NextResponse.json({
          success: true,
          data: prediction,
          message: 'Build prediction completed successfully'
        });

      case 'report':
        const report = aiBuildAnalysis.generateReport();
        return NextResponse.json({
          success: true,
          data: JSON.parse(report),
          message: 'Build analysis report generated successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI build analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const history = aiBuildAnalysis.getBuildHistory();
    const patterns = aiBuildAnalysis.getPatterns();
    const models = aiBuildAnalysis.getModels();

    return NextResponse.json({
      success: true,
      data: {
        history,
        patterns,
        models,
        summary: {
          totalBuilds: history.length,
          successRate: history.length > 0 ? history.filter(b => b.success).length / history.length : 0,
          avgBuildTime: history.length > 0 ? history.reduce((sum, b) => sum + b.buildTime, 0) / history.length : 0,
          patternsIdentified: patterns.length,
          modelsTrained: models.filter(m => m.isTrained).length
        }
      }
    });
  } catch (error) {
    console.error('Failed to get AI build analysis data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAIAnalysis() {
  try {
    console.log('🔍 Checking AI Analysis data in database...\n');
    
    // Check for any recent analysis entries
    const analyses = await prisma.analysisHistory.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 5,
      include: {
        crypto: true
      }
    });
    
    console.log(`📊 Found ${analyses.length} analysis entries:\n`);
    
    analyses.forEach((analysis, index) => {
      console.log(`${index + 1}. ${analysis.crypto?.name || 'Unknown'} (${analysis.coinId})`);
      console.log(`   Signal: ${analysis.signal}`);
      console.log(`   Confidence: ${analysis.confidence}%`);
      console.log(`   Type: ${analysis.analysisType || 'N/A'}`);
      console.log(`   Created: ${analysis.timestamp}`);
      console.log(`   Has analysisData: ${analysis.analysisData ? 'Yes' : 'No'}`);
      
      if (analysis.analysisData) {
        try {
          const parsed = JSON.parse(analysis.analysisData);
          console.log(`   Recommendation: ${parsed.recommendation}`);
          console.log(`   Z.AI Confidence: ${parsed.zaiAnalysis?.confidence || 'N/A'}%`);
          console.log(`   ChatGPT Confidence: ${parsed.chatGPTAnalysis?.confidence || 'N/A'}%`);
        } catch (e) {
          console.log(`   Error parsing analysis data: ${e.message}`);
        }
      }
      
      console.log('');
    });
    
    if (analyses.length === 0) {
      console.log('❌ No analysis entries found in database');
    } else {
      console.log('✅ Analysis data is being saved to database correctly');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAIAnalysis();
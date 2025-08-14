// Node.js v18+ has built-in fetch
async function testTokenSpecificDashboard() {
  console.log('🧪 Testing Token-Specific Dashboard Integration...\n');

  try {
    // Test different tokens
    const tokens = ['bitcoin', 'ethereum', 'binancecoin'];
    
    for (const coinId of tokens) {
      console.log(`\n🔍 Testing dashboard for: ${coinId.toUpperCase()}`);
      
      try {
        const dashboardResponse = await fetch(`http://localhost:3000/api/dashboard?coinId=${coinId}`);
        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          console.log('✅ Dashboard API: Success');
          
          if (dashboardData.defi) {
            console.log(`   - DeFi metrics integrated: ${Object.keys(dashboardData.defi).length} fields`);
            console.log(`   - Token TVL: ${dashboardData.defi.token?.tvl ? '$' + (dashboardData.defi.token.tvl / 1e9).toFixed(2) + 'B' : 'N/A'}`);
            console.log(`   - Chain Name: ${dashboardData.defi.token?.chainName || 'N/A'}`);
            console.log(`   - Token Protocols: ${dashboardData.defi.token?.protocols ? dashboardData.defi.token.protocols.length : 0}`);
            console.log(`   - Total TVL: ${dashboardData.defi.totalTVL ? '$' + (dashboardData.defi.totalTVL / 1e9).toFixed(2) + 'B' : 'N/A'}`);
            console.log(`   - Data source: ${dashboardData.defi.source || 'N/A'}`);
            console.log(`   - Last updated: ${dashboardData.defi.last_updated || 'N/A'}`);
            
            // Show token-specific protocols if available
            if (dashboardData.defi.token?.protocols && dashboardData.defi.token.protocols.length > 0) {
              console.log(`   - Top protocols for ${coinId}:`);
              dashboardData.defi.token.protocols.slice(0, 3).forEach((protocol, index) => {
                console.log(`     ${index + 1}. ${protocol.name}: $${(protocol.tvl / 1e9).toFixed(2)}B`);
              });
            }
          } else {
            console.log('⚠️  DeFi metrics not found in dashboard response');
          }
        } else {
          console.log(`❌ Dashboard API: HTTP ${dashboardResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Dashboard API: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Token-specific dashboard integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTokenSpecificDashboard().catch(console.error);
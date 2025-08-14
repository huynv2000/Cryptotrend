// Node.js v18+ has built-in fetch
async function testDeFiLlamaIntegration() {
  console.log('🧪 Testing DeFiLlama Integration...\n');

  try {
    // Test 1: Basic DeFiLlama API endpoints
    console.log('📡 Testing DeFiLlama API endpoints...');
    
    const endpoints = [
      'https://api.llama.fi/v2/chains',
      'https://api.llama.fi/protocols',
      'https://api.llama.fi/stablecoins',
      'https://api.llama.fi/overview/dexs',
      'https://api.llama.fi/overview/fees',
      'https://api.llama.fi/yields',
      'https://api.llama.fi/bridges'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint.split('/').pop()}: ${Array.isArray(data) ? data.length : 'OK'} records`);
        } else {
          const data = await response.text();
          console.log(`❌ ${endpoint.split('/').pop()}: HTTP ${response.status} - ${data.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.split('/').pop()}: ${error.message}`);
      }
    }

    console.log('\n🌐 Testing our API endpoints...');

    // Test 2: Our API endpoints
    const ourEndpoints = [
      'http://localhost:3000/api/defillama?action=metrics',
      'http://localhost:3000/api/defillama?action=chains',
      'http://localhost:3000/api/defillama?action=protocols',
      'http://localhost:3000/api/defillama?action=stablecoins',
      'http://localhost:3000/api/defillama?action=dex-volume',
      'http://localhost:3000/api/defillama?action=fees',
      'http://localhost:3000/api/defillama?action=yields',
      'http://localhost:3000/api/defillama?action=bridges'
    ];

    for (const endpoint of ourEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          const action = endpoint.split('action=')[1];
          console.log(`✅ ${action}: Success`);
          
          // Show some sample data for metrics
          if (action === 'metrics' && data.defi) {
            console.log(`   - Total TVL: $${(data.defi.totalTVL / 1e9).toFixed(2)}B`);
            console.log(`   - Stablecoins MC: $${(data.defi.totalStablecoinMarketCap / 1e9).toFixed(2)}B`);
            console.log(`   - DEX Volume 24h: $${(data.defi.totalDEXVolume24h / 1e6).toFixed(2)}M`);
          }
        } else {
          const data = await response.text();
          const action = endpoint.split('action=')[1];
          console.log(`❌ ${action}: HTTP ${response.status} - ${data.substring(0, 100)}`);
        }
      } catch (error) {
        const action = endpoint.split('action=')[1];
        console.log(`❌ ${action}: ${error.message}`);
      }
    }

    console.log('\n🔍 Testing dashboard integration...');

    // Test 3: Dashboard integration
    try {
      const dashboardResponse = await fetch('http://localhost:3000/api/dashboard?coinId=bitcoin');
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('✅ Dashboard API: Success');
        
        if (dashboardData.defi) {
          console.log(`   - DeFi metrics integrated: ${Object.keys(dashboardData.defi).length} fields`);
          console.log(`   - Total TVL: ${dashboardData.defi.totalTVL ? '$' + (dashboardData.defi.totalTVL / 1e9).toFixed(2) + 'B' : 'N/A'}`);
          console.log(`   - Top chains: ${dashboardData.defi.topChains ? dashboardData.defi.topChains.length : 0}`);
          console.log(`   - Top protocols: ${dashboardData.defi.topProtocols ? dashboardData.defi.topProtocols.length : 0}`);
          console.log(`   - Data source: ${dashboardData.defi.source || 'N/A'}`);
          console.log(`   - Last updated: ${dashboardData.defi.last_updated || 'N/A'}`);
        } else {
          console.log('⚠️  DeFi metrics not found in dashboard response');
        }
      } else {
        console.log(`❌ Dashboard API: HTTP ${dashboardResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Dashboard API: ${error.message}`);
    }

    console.log('\n🎉 DeFiLlama integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDeFiLlamaIntegration().catch(console.error);
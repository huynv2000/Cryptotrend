// Test script to check API response
import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    console.log('Making request to: http://localhost:3000/api/v2/blockchain/usage-metrics?blockchain=bitcoin&timeframe=24h');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('http://localhost:3000/api/v2/blockchain/usage-metrics?blockchain=bitcoin&timeframe=24h', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    const data = await response.text();
    console.log('Raw response data:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON data:', JSON.stringify(jsonData, null, 2));
      
      // Check if data has the expected structure
      if (jsonData && jsonData.dailyActiveAddresses) {
        console.log('✅ API response has correct structure');
        console.log('Daily active addresses:', jsonData.dailyActiveAddresses);
      } else {
        console.log('❌ API response structure is incorrect');
        console.log('Available keys:', Object.keys(jsonData || {}));
      }
    } catch (parseError) {
      console.log('❌ Failed to parse JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
  }
}

testAPI().catch(console.error);
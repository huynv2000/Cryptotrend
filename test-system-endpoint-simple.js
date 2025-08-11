#!/usr/bin/env node

const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 3999; // Use different port to avoid conflicts

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/api/system-test' && req.method === 'GET') {
    console.log('🧪 System test endpoint called');
    
    const results = [];
    const start = Date.now();
    
    // Test database connectivity
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      const duration = Date.now() - start;
      
      results.push({
        name: 'Database Connectivity',
        status: 'PASS',
        duration: duration,
        message: 'Successfully connected to database'
      });
      
      console.log('✅ Database connectivity: PASS');
    } catch (error) {
      results.push({
        name: 'Database Connectivity',
        status: 'FAIL',
        duration: Date.now() - start,
        message: 'Failed to connect to database',
        details: error.message
      });
      
      console.log('❌ Database connectivity: FAIL -', error.message);
    }
    
    // Calculate overall health
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    
    let overall = 'HEALTHY';
    if (failCount > 0) {
      overall = 'UNHEALTHY';
    } else if (passCount < results.length) {
      overall = 'DEGRADED';
    }
    
    const response = {
      timestamp: new Date().toISOString(),
      overall: overall,
      healthScore: Math.round((passCount / results.length) * 100),
      tests: results,
      recommendations: failCount > 0 ? 
        ['Address failing tests immediately - system may be unstable'] : 
        ['System is running optimally - continue monitoring']
    };
    
    console.log('🎯 System test completed. Health score:', response.healthScore);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('📡 Testing system endpoint...');
  
  // Test the endpoint immediately
  setTimeout(async () => {
    try {
      // Make HTTP request to our own server
      const testReq = http.request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/system-test',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (testRes) => {
        let data = '';
        
        testRes.on('data', (chunk) => {
          data += chunk;
        });
        
        testRes.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('\n🎯 API Test Results:');
            console.log('Overall:', response.overall);
            console.log('Health Score:', response.healthScore + '%');
            console.log('Tests:', response.tests.map(t => `${t.name}: ${t.status}`).join(', '));
            
            // Close server after test
            server.close(() => {
              console.log('\n✅ Test completed successfully!');
              process.exit(0);
            });
          } catch (parseError) {
            console.error('❌ Failed to parse response:', parseError.message);
            console.error('Raw response:', data);
            process.exit(1);
          }
        });
      });
      
      testReq.on('error', (error) => {
        console.error('❌ API test failed:', error.message);
        process.exit(1);
      });
      
      testReq.end();
    } catch (error) {
      console.error('❌ Test setup failed:', error.message);
      process.exit(1);
    }
  }, 1000);
});
#!/usr/bin/env node

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3001; // Use different port to avoid conflicts

app.use(express.json());

// System test endpoint
app.get('/api/system-test', async (req, res) => {
  console.log('🧪 System test endpoint called');
  
  const results = [];
  
  // Test database connectivity
  try {
    const start = Date.now();
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
  res.json(response);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('📡 Testing system endpoint...');
  
  // Test the endpoint immediately
  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/system-test`);
      const data = await response.json();
      console.log('\n🎯 API Test Results:');
      console.log('Overall:', data.overall);
      console.log('Health Score:', data.healthScore + '%');
      console.log('Tests:', data.tests.map(t => `${t.name}: ${t.status}`).join(', '));
      
      // Close server after test
      process.exit(0);
    } catch (error) {
      console.error('❌ API test failed:', error.message);
      process.exit(1);
    }
  }, 1000);
});
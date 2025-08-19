const http = require('http');

// Expected UsageMetrics structure based on TypeScript types
const expectedUsageMetricsStructure = {
  id: 'string',
  createdAt: 'Date',
  updatedAt: 'Date',
  blockchain: 'string',
  timeframe: 'string',
  dailyActiveAddresses: {
    value: 'number',
    change: 'number',
    changePercent: 'number',
    trend: 'string',
    timestamp: 'Date'
  },
  newAddresses: {
    value: 'number',
    change: 'number',
    changePercent: 'number',
    trend: 'string',
    timestamp: 'Date'
  },
  dailyTransactions: {
    value: 'number',
    change: 'number',
    changePercent: 'number',
    trend: 'string',
    timestamp: 'Date'
  },
  transactionVolume: {
    value: 'number',
    change: 'number',
    changePercent: 'number',
    trend: 'string',
    timestamp: 'Date'
  },
  averageFee: {
    value: 'number',
    change: 'number',
    changePercent: 'number',
    trend: 'string',
    timestamp: 'Date'
  },
  hashRate: {
    value: 'number',
    change: 'number',
    changePercent: 'number',
    trend: 'string',
    timestamp: 'Date'
  },
  rollingAverages: {
    dailyActiveAddresses: { '7d': 'number', '30d': 'number', '90d': 'number' },
    newAddresses: { '7d': 'number', '30d': 'number', '90d': 'number' },
    dailyTransactions: { '7d': 'number', '30d': 'number', '90d': 'number' },
    transactionVolume: { '7d': 'number', '30d': 'number', '90d': 'number' },
    averageFee: { '7d': 'number', '30d': 'number', '90d': 'number' },
    hashRate: { '7d': 'number', '30d': 'number', '90d': 'number' }
  },
  spikeDetection: {
    dailyActiveAddresses: {
      isSpike: 'boolean',
      severity: 'string',
      confidence: 'number',
      message: 'string',
      threshold: 'number',
      currentValue: 'number',
      baseline: 'number',
      deviation: 'number'
    },
    newAddresses: {
      isSpike: 'boolean',
      severity: 'string',
      confidence: 'number',
      message: 'string',
      threshold: 'number',
      currentValue: 'number',
      baseline: 'number',
      deviation: 'number'
    },
    dailyTransactions: {
      isSpike: 'boolean',
      severity: 'string',
      confidence: 'number',
      message: 'string',
      threshold: 'number',
      currentValue: 'number',
      baseline: 'number',
      deviation: 'number'
    },
    transactionVolume: {
      isSpike: 'boolean',
      severity: 'string',
      confidence: 'number',
      message: 'string',
      threshold: 'number',
      currentValue: 'number',
      baseline: 'number',
      deviation: 'number'
    },
    averageFee: {
      isSpike: 'boolean',
      severity: 'string',
      confidence: 'number',
      message: 'string',
      threshold: 'number',
      currentValue: 'number',
      baseline: 'number',
      deviation: 'number'
    },
    hashRate: {
      isSpike: 'boolean',
      severity: 'string',
      confidence: 'number',
      message: 'string',
      threshold: 'number',
      currentValue: 'number',
      baseline: 'number',
      deviation: 'number'
    }
  }
};

function validateStructure(data, expected, path = '') {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    errors.push(`${path}: Expected object, got ${data === null ? 'null' : typeof data}`);
    return errors;
  }
  
  for (const [key, expectedType] of Object.entries(expected)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (!(key in data)) {
      errors.push(`${currentPath}: Missing required property`);
      continue;
    }
    
    const value = data[key];
    
    if (typeof expectedType === 'string') {
      // Simple type check
      if (expectedType === 'Date') {
        if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
          errors.push(`${currentPath}: Expected Date or date string, got ${typeof value}`);
        }
      } else if (typeof value !== expectedType) {
        errors.push(`${currentPath}: Expected ${expectedType}, got ${typeof value}`);
      }
    } else if (typeof expectedType === 'object') {
      // Nested object check
      if (typeof value !== 'object' || value === null) {
        errors.push(`${currentPath}: Expected object, got ${typeof value}`);
      } else {
        const nestedErrors = validateStructure(value, expectedType, currentPath);
        errors.push(...nestedErrors);
      }
    }
  }
  
  return errors;
}

function testAPI() {
  console.log('🔍 Testing API endpoint for usage metrics...');
  console.log('📡 Making request to: http://localhost:3000/api/v2/blockchain/usage-metrics?blockchain=bitcoin&timeframe=24h');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v2/blockchain/usage-metrics?blockchain=bitcoin&timeframe=24h',
    method: 'GET',
    timeout: 10000
  };
  
  const req = http.request(options, (res) => {
    console.log(`📊 Response status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`📋 Content-Type: ${res.headers['content-type']}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📄 Raw response size: ${data.length} characters`);
      
      let parsedData;
      try {
        parsedData = JSON.parse(data);
        console.log('✅ Response is valid JSON');
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError.message);
        console.log('📄 Raw response:', data);
        return;
      }
      
      console.log('\n🔍 Analyzing response structure...');
      console.log('📋 Top-level keys:', Object.keys(parsedData));
      
      // Check if this looks like the expected structure
      const structureErrors = validateStructure(parsedData, expectedUsageMetricsStructure);
      
      if (structureErrors.length === 0) {
        console.log('✅ Data structure matches expected UsageMetrics interface!');
      } else {
        console.log('❌ Data structure validation failed:');
        structureErrors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      // Check specific required fields
      console.log('\n🔍 Checking specific required fields:');
      const requiredFields = [
        'id', 'createdAt', 'updatedAt', 'blockchain', 'timeframe',
        'dailyActiveAddresses', 'newAddresses', 'dailyTransactions',
        'transactionVolume', 'averageFee', 'hashRate'
      ];
      
      requiredFields.forEach(field => {
        const hasField = field in parsedData;
        console.log(`   ${hasField ? '✅' : '❌'} ${field}: ${hasField ? 'Present' : 'Missing'}`);
        
        if (hasField && typeof parsedData[field] === 'object') {
          const metricData = parsedData[field];
          if ('value' in metricData) {
            console.log(`      - value: ${metricData.value} (${typeof metricData.value})`);
          }
          if ('changePercent' in metricData) {
            console.log(`      - changePercent: ${metricData.changePercent}%`);
          }
        }
      });
      
      // Check for potential issues
      console.log('\n🚨 Checking for potential issues:');
      
      if (parsedData.error) {
        console.log(`   ❌ API returned error: ${parsedData.error}`);
      }
      
      if (parsedData.dailyActiveAddresses && parsedData.dailyActiveAddresses.value === 0) {
        console.log('   ⚠️  dailyActiveAddresses.value is 0 - possible data issue');
      }
      
      if (parsedData.dailyActiveAddresses && !parsedData.dailyActiveAddresses.timestamp) {
        console.log('   ⚠️  dailyActiveAddresses.timestamp is missing');
      }
      
      console.log('\n📋 Summary:');
      console.log(`   - Response status: ${res.statusCode}`);
      console.log(`   - Data received: ${!!parsedData}`);
      console.log(`   - Structure validation: ${structureErrors.length === 0 ? 'PASSED' : 'FAILED'}`);
      console.log(`   - Errors found: ${structureErrors.length}`);
      
      if (structureErrors.length === 0) {
        console.log('🎉 API endpoint is working correctly!');
        console.log('   The issue might be in the frontend data processing.');
      } else {
        console.log('❌ API endpoint data structure needs to be fixed.');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error making request:', error);
  });
  
  req.on('timeout', () => {
    console.error('❌ Request timed out');
    req.destroy();
  });
  
  req.end();
}

testAPI();
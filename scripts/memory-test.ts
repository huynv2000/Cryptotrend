import { performanceManager } from '../src/lib/performance-utils';

async function testMemoryUsage() {
  console.log('🧠 Starting Memory Usage Test...\n');

  // Test 1: Baseline memory
  console.log('1. Baseline memory usage:');
  const baselineMetrics = performanceManager.getMetrics();
  if (baselineMetrics?.memoryUsage) {
    console.log(`   Used: ${(baselineMetrics.memoryUsage.used / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total: ${(baselineMetrics.memoryUsage.total / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Percentage: ${baselineMetrics.memoryUsage.percentage.toFixed(2)}%`);
  }

  // Test 2: Performance measurement test
  console.log('\n2. Performance measurement test:');
  performanceManager.measure('memory-test-1', () => {
    // Simulate some heavy computation
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += Math.sqrt(i);
    }
    return sum;
  });

  performanceManager.measure('memory-test-2', () => {
    // Simulate more heavy computation
    let product = 1;
    for (let i = 1; i <= 100000; i++) {
      product *= (i % 100) + 1;
    }
    return product;
  });

  const entries = performanceManager.getPerformanceEntries();
  console.log(`   Performance entries: ${entries.length}`);
  entries.forEach(entry => {
    console.log(`   - ${entry.name}: ${entry.duration.toFixed(2)}ms`);
  });

  // Test 3: Debounce and throttle
  console.log('\n3. Debounce and throttle test:');
  
  let debounceCount = 0;
  const debouncedFn = performanceManager.debounce(() => {
    debounceCount++;
    console.log(`   Debounced function called: ${debounceCount} times`);
  }, 100, 'debounce-test');

  let throttleCount = 0;
  const throttledFn = performanceManager.throttle(() => {
    throttleCount++;
    console.log(`   Throttled function called: ${throttleCount} times`);
  }, 100, 'throttle-test');

  // Test debounce
  for (let i = 0; i < 5; i++) {
    debouncedFn();
  }

  // Test throttle
  for (let i = 0; i < 5; i++) {
    throttledFn();
  }

  // Wait for debounce to complete
  await new Promise(resolve => setTimeout(resolve, 200));

  // Test 4: Generate performance report
  console.log('\n4. Performance report:');
  const report = performanceManager.generateReport();
  console.log(`   Summary: ${report.summary}`);
  console.log(`   Issues: ${report.issues.length}`);
  console.log(`   Recommendations: ${report.recommendations.length}`);
  
  if (report.issues.length > 0) {
    console.log('   Issues detected:');
    report.issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }

  if (report.recommendations.length > 0) {
    console.log('   Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`   - ${rec}`);
    });
  }

  // Test 5: Memory after tests
  console.log('\n5. Memory usage after tests:');
  const finalMetrics = performanceManager.getMetrics();
  if (finalMetrics?.memoryUsage) {
    console.log(`   Used: ${(finalMetrics.memoryUsage.used / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total: ${(finalMetrics.memoryUsage.total / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Percentage: ${finalMetrics.memoryUsage.percentage.toFixed(2)}%`);
    
    if (baselineMetrics?.memoryUsage) {
      const memoryIncrease = finalMetrics.memoryUsage.used - baselineMetrics.memoryUsage.used;
      console.log(`   Memory increase: ${(memoryIncrease / 1024).toFixed(2)} KB`);
    }
  }

  // Cleanup
  performanceManager.cleanup();
  console.log('\n✅ Memory test completed and cleaned up!');
}

// Run the test
testMemoryUsage().catch(console.error);
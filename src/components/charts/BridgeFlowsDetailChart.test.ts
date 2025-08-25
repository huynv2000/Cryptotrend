// Performance test for BridgeFlowsDetailChart
import { BridgeFlowService } from '@/lib/bridge-flow-service';

describe('Bridge Flow Performance Tests', () => {
  test('should handle 90 data points efficiently', async () => {
    const startTime = performance.now();
    
    // Generate 90 days of data
    const data = await BridgeFlowService.getHistoricalData(90, 'ethereum');
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    console.log(`Data generation time: ${executionTime.toFixed(2)}ms`);
    console.log(`Data points: ${data.length}`);
    
    expect(data.length).toBe(90);
    expect(executionTime).toBeLessThan(1000); // Should be under 1 second
    
    // Test moving average calculation
    const maStartTime = performance.now();
    const summary = BridgeFlowService.getSummary(data);
    const maEndTime = performance.now();
    const maExecutionTime = maEndTime - maStartTime;
    
    console.log(`Summary calculation time: ${maExecutionTime.toFixed(2)}ms`);
    expect(maExecutionTime).toBeLessThan(100); // Should be under 100ms
    expect(summary.totalValue).toBeGreaterThan(0);
  });

  test('should handle data export efficiently', async () => {
    const data = await BridgeFlowService.getHistoricalData(90, 'ethereum');
    
    const startTime = performance.now();
    const csv = BridgeFlowService.exportToCSV(data);
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    console.log(`CSV export time: ${executionTime.toFixed(2)}ms`);
    console.log(`CSV size: ${csv.length} characters`);
    
    expect(executionTime).toBeLessThan(50); // Should be under 50ms
    expect(csv.length).toBeGreaterThan(1000);
    expect(csv.includes('Date,Value (USD),Volume,Transactions,MA7,MA30,MA90')).toBe(true);
  });

  test('should handle time range filtering efficiently', async () => {
    const allData = await BridgeFlowService.getHistoricalData(90, 'ethereum');
    
    const startTime = performance.now();
    const filteredData7 = BridgeFlowService.getDataByTimeRange(allData, '7D');
    const filteredData30 = BridgeFlowService.getDataByTimeRange(allData, '30D');
    const filteredData90 = BridgeFlowService.getDataByTimeRange(allData, '90D');
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    console.log(`Time range filtering time: ${executionTime.toFixed(2)}ms`);
    console.log(`7D data points: ${filteredData7.length}`);
    console.log(`30D data points: ${filteredData30.length}`);
    console.log(`90D data points: ${filteredData90.length}`);
    
    expect(executionTime).toBeLessThan(10); // Should be under 10ms
    expect(filteredData7.length).toBe(7);
    expect(filteredData30.length).toBe(30);
    expect(filteredData90.length).toBe(90);
  });
});
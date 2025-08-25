// Performance monitoring component
import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  dataLoadTime: number;
  memoryUsage: number;
  dataPoints: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  const measurePerformance = async (operation: () => Promise<any>, operationName: string) => {
    const startTime = performance.now();
    const startMemory = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      
      const executionTime = endTime - startTime;
      const memoryDelta = endMemory - startMemory;
      
      console.log(`${operationName} Performance:`);
      console.log(`  Execution time: ${executionTime.toFixed(2)}ms`);
      console.log(`  Memory delta: ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      
      return { result, executionTime, memoryDelta };
    } catch (error) {
      console.error(`${operationName} failed:`, error);
      throw error;
    }
  };

  const startRenderMeasurement = () => {
    return performance.now();
  };

  const endRenderMeasurement = (startTime: number, dataPoints: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    const memoryUsage = (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    
    const newMetrics: PerformanceMetrics = {
      renderTime,
      dataLoadTime: 0, // This would be measured separately
      memoryUsage: memoryUsage / 1024 / 1024, // Convert to MB
      dataPoints
    };
    
    setMetrics(newMetrics);
    
    console.log('Render Performance:');
    console.log(`  Render time: ${renderTime.toFixed(2)}ms`);
    console.log(`  Memory usage: ${newMetrics.memoryUsage.toFixed(2)}MB`);
    console.log(`  Data points: ${dataPoints}`);
    
    return newMetrics;
  };

  return {
    metrics,
    measurePerformance,
    startRenderMeasurement,
    endRenderMeasurement
  };
};
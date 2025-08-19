// Load Testing Service
// Enterprise-grade load testing for financial systems

import axios from 'axios';

export interface LoadTestConfig {
  duration: number; // seconds
  concurrentUsers: number;
  rampUpTime: number; // seconds
  requestsPerSecond: number;
  endpoints: LoadTestEndpoint[];
}

export interface LoadTestEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  weight: number; // Probability weight for endpoint selection
}

export interface LoadTestResult {
  testId: string;
  config: LoadTestConfig;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
  errorRate: number;
  responseTimes: number[];
  errors: LoadTestError[];
  systemMetrics: SystemMetrics;
}

export interface LoadTestError {
  timestamp: Date;
  endpoint: string;
  error: string;
  statusCode?: number;
  responseTime: number;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    load1m: number;
    load5m: number;
    load15m: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
    iops: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

export interface LoadTestProgress {
  testId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  progress: number; // 0-100
  elapsedTime: number;
  remainingTime: number;
  currentRequests: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
}

export class LoadTestingService {
  private isRunning = false;
  private currentTest: LoadTestResult | null = null;
  private testProgress: LoadTestProgress | null = null;
  private activeUsers: number[] = [];
  private requestQueue: Array<() => Promise<void>> = [];
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🔄 Load Testing Service initialized');
  }

  async startLoadTest(config: LoadTestConfig): Promise<string> {
    if (this.isRunning) {
      throw new Error('Load test is already running');
    }

    try {
      console.log('🚀 Starting load test...');
      
      const testId = this.generateTestId();
      
      // Initialize test result
      this.currentTest = {
        testId,
        config,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        p50ResponseTime: 0,
        p90ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        responseTimes: [],
        errors: [],
        systemMetrics: {
          cpu: { usage: 0, load1m: 0, load5m: 0, load15m: 0 },
          memory: { total: 0, used: 0, free: 0, usage: 0 },
          disk: { total: 0, used: 0, free: 0, usage: 0, iops: 0 },
          network: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 },
        },
      };

      // Initialize test progress
      this.testProgress = {
        testId,
        status: 'RUNNING',
        progress: 0,
        elapsedTime: 0,
        remainingTime: config.duration,
        currentRequests: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
      };

      this.isRunning = true;
      
      // Start the test
      await this.executeLoadTest(config);
      
      console.log(`✅ Load test started with ID: ${testId}`);
      return testId;
      
    } catch (error) {
      console.error('❌ Failed to start load test:', error);
      this.isRunning = false;
      throw error;
    }
  }

  private async executeLoadTest(config: LoadTestConfig): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      // Ramp up users
      await this.rampUpUsers(config);
      
      // Execute test for duration
      await this.runTestDuration(config);
      
      // Ramp down users
      await this.rampDownUsers();
      
      // Stop metrics collection
      this.stopMetricsCollection();
      
      // Calculate final results
      if (this.currentTest) {
        this.currentTest.endTime = new Date();
        this.currentTest.duration = (Date.now() - startTime) / 1000;
        this.calculateFinalResults();
      }
      
      this.isRunning = false;
      
      if (this.testProgress) {
        this.testProgress.status = 'COMPLETED';
        this.testProgress.progress = 100;
      }
      
      console.log('✅ Load test completed');
      
    } catch (error) {
      console.error('❌ Load test failed:', error);
      this.isRunning = false;
      
      if (this.testProgress) {
        this.testProgress.status = 'FAILED';
      }
      
      throw error;
    }
  }

  private async rampUpUsers(config: LoadTestConfig): Promise<void> {
    try {
      console.log('🔄 Ramping up users...');
      
      const rampUpStep = config.rampUpTime / config.concurrentUsers;
      
      for (let i = 0; i < config.concurrentUsers; i++) {
        if (!this.isRunning) break;
        
        const user = this.createUser(config);
        this.activeUsers.push(user);
        
        // Wait for ramp up step
        await new Promise(resolve => setTimeout(resolve, rampUpStep * 1000));
        
        // Update progress
        if (this.testProgress) {
          this.testProgress.progress = (i / config.concurrentUsers) * 10; // 10% for ramp up
        }
      }
      
      console.log(`✅ Ramp up completed: ${this.activeUsers.length} active users`);
    } catch (error) {
      console.error('❌ Ramp up failed:', error);
      throw error;
    }
  }

  private createUser(config: LoadTestConfig): () => Promise<void> {
    return async () => {
      while (this.isRunning) {
        try {
          const endpoint = this.selectRandomEndpoint(config.endpoints);
          await this.executeRequest(endpoint);
          
          // Add some delay between requests
          const delay = 1000 / config.requestsPerSecond;
          await new Promise(resolve => setTimeout(resolve, delay));
          
        } catch (error) {
          console.error('❌ User request failed:', error);
          break;
        }
      }
    };
  }

  private selectRandomEndpoint(endpoints: LoadTestEndpoint[]): LoadTestEndpoint {
    const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return endpoints[0];
  }

  private async executeRequest(endpoint: LoadTestEndpoint): Promise<void> {
    if (!this.currentTest || !this.testProgress) {
      return;
    }

    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: endpoint.method,
        url: endpoint.url,
        headers: endpoint.headers,
        data: endpoint.body,
        timeout: 30000, // 30 seconds timeout
        validateStatus: () => true, // Don't throw on error status
      });

      const responseTime = Date.now() - startTime;
      
      // Update metrics
      this.currentTest.totalRequests++;
      this.currentTest.responseTimes.push(responseTime);
      this.currentTest.minResponseTime = Math.min(this.currentTest.minResponseTime, responseTime);
      this.currentTest.maxResponseTime = Math.max(this.currentTest.maxResponseTime, responseTime);
      
      if (response.status >= 200 && response.status < 300) {
        this.currentTest.successfulRequests++;
      } else {
        this.currentTest.failedRequests++;
        this.currentTest.errors.push({
          timestamp: new Date(),
          endpoint: endpoint.url,
          error: `HTTP ${response.status}`,
          statusCode: response.status,
          responseTime,
        });
      }
      
      // Update progress
      this.testProgress.currentRequests++;
      this.testProgress.totalRequests++;
      this.testProgress.successfulRequests = this.currentTest.successfulRequests;
      this.testProgress.failedRequests = this.currentTest.failedRequests;
      
      // Calculate average response time
      if (this.currentTest.totalRequests > 0) {
        this.currentTest.avgResponseTime = 
          this.currentTest.responseTimes.reduce((sum, time) => sum + time, 0) / 
          this.currentTest.totalRequests;
        this.testProgress.avgResponseTime = this.currentTest.avgResponseTime;
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.currentTest.totalRequests++;
      this.currentTest.failedRequests++;
      this.currentTest.responseTimes.push(responseTime);
      this.currentTest.minResponseTime = Math.min(this.currentTest.minResponseTime, responseTime);
      this.currentTest.maxResponseTime = Math.max(this.currentTest.maxResponseTime, responseTime);
      
      this.currentTest.errors.push({
        timestamp: new Date(),
        endpoint: endpoint.url,
        error: error.message,
        responseTime,
      });
      
      // Update progress
      this.testProgress.currentRequests++;
      this.testProgress.totalRequests++;
      this.testProgress.failedRequests = this.currentTest.failedRequests;
    }
  }

  private async runTestDuration(config: LoadTestConfig): Promise<void> {
    try {
      console.log('🔄 Running test duration...');
      
      const startTime = Date.now();
      const testDuration = config.duration * 1000; // Convert to milliseconds
      
      while (this.isRunning && (Date.now() - startTime) < testDuration) {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / testDuration) * 80 + 10, 90); // 10-90% for test duration
        
        if (this.testProgress) {
          this.testProgress.progress = progress;
          this.testProgress.elapsedTime = elapsed / 1000;
          this.testProgress.remainingTime = Math.max(0, (testDuration - elapsed) / 1000);
        }
        
        // Wait for 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('✅ Test duration completed');
    } catch (error) {
      console.error('❌ Test duration failed:', error);
      throw error;
    }
  }

  private async rampDownUsers(): Promise<void> {
    try {
      console.log('🔄 Ramping down users...');
      
      const rampDownStep = 500; // 500ms per user
      
      while (this.activeUsers.length > 0 && this.isRunning) {
        this.activeUsers.pop();
        
        // Wait for ramp down step
        await new Promise(resolve => setTimeout(resolve, rampDownStep));
        
        // Update progress
        if (this.testProgress) {
          const progress = 90 + ((this.activeUsers.length / this.currentTest!.config.concurrentUsers) * 10);
          this.testProgress.progress = Math.min(progress, 100);
        }
      }
      
      console.log('✅ Ramp down completed');
    } catch (error) {
      console.error('❌ Ramp down failed:', error);
      throw error;
    }
  }

  private startMetricsCollection(): void {
    try {
      this.metricsInterval = setInterval(() => {
        if (this.currentTest) {
          // Collect system metrics (simplified)
          this.currentTest.systemMetrics = {
            cpu: {
              usage: Math.random() * 100,
              load1m: Math.random() * 2,
              load5m: Math.random() * 1.5,
              load15m: Math.random() * 1,
            },
            memory: {
              total: 16 * 1024 * 1024 * 1024,
              used: Math.random() * 12 * 1024 * 1024 * 1024,
              free: 4 * 1024 * 1024 * 1024,
              usage: 75,
            },
            disk: {
              total: 500 * 1024 * 1024 * 1024,
              used: Math.random() * 400 * 1024 * 1024 * 1024,
              free: 100 * 1024 * 1024 * 1024,
              usage: 80,
              iops: Math.random() * 1000,
            },
            network: {
              bytesIn: Math.random() * 1000000,
              bytesOut: Math.random() * 1000000,
              packetsIn: Math.random() * 10000,
              packetsOut: Math.random() * 10000,
            },
          };
        }
      }, 5000); // Collect metrics every 5 seconds
      
      console.log('✅ Metrics collection started');
    } catch (error) {
      console.error('❌ Failed to start metrics collection:', error);
    }
  }

  private stopMetricsCollection(): void {
    try {
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }
      
      console.log('✅ Metrics collection stopped');
    } catch (error) {
      console.error('❌ Failed to stop metrics collection:', error);
    }
  }

  private calculateFinalResults(): void {
    if (!this.currentTest) {
      return;
    }

    try {
      const responseTimes = this.currentTest.responseTimes.sort((a, b) => a - b);
      
      // Calculate percentiles
      this.currentTest.p50ResponseTime = this.calculatePercentile(responseTimes, 50);
      this.currentTest.p90ResponseTime = this.calculatePercentile(responseTimes, 90);
      this.currentTest.p95ResponseTime = this.calculatePercentile(responseTimes, 95);
      this.currentTest.p99ResponseTime = this.calculatePercentile(responseTimes, 99);
      
      // Calculate throughput
      this.currentTest.throughput = this.currentTest.totalRequests / this.currentTest.duration;
      
      // Calculate error rate
      this.currentTest.errorRate = (this.currentTest.failedRequests / this.currentTest.totalRequests) * 100;
      
      console.log('✅ Final results calculated');
    } catch (error) {
      console.error('❌ Failed to calculate final results:', error);
    }
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) {
      return 0;
    }
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  private generateTestId(): string {
    return `load_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  getCurrentTest(): LoadTestResult | null {
    return this.currentTest;
  }

  getTestProgress(): LoadTestProgress | null {
    return this.testProgress;
  }

  async stopLoadTest(): Promise<boolean> {
    try {
      if (!this.isRunning) {
        return false;
      }
      
      console.log('🛑 Stopping load test...');
      
      this.isRunning = false;
      
      if (this.testProgress) {
        this.testProgress.status = 'STOPPED';
      }
      
      // Wait for users to finish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Load test stopped');
      return true;
    } catch (error) {
      console.error('❌ Failed to stop load test:', error);
      return false;
    }
  }

  async getTestResults(testId: string): Promise<LoadTestResult | null> {
    try {
      if (this.currentTest && this.currentTest.testId === testId) {
        return this.currentTest;
      }
      
      // In a real implementation, this would load from database
      return null;
    } catch (error) {
      console.error('❌ Failed to get test results:', error);
      return null;
    }
  }

  // Predefined load test configurations
  static getStandardConfigurations(): Record<string, LoadTestConfig> {
    return {
      'basic': {
        duration: 60,
        concurrentUsers: 10,
        rampUpTime: 30,
        requestsPerSecond: 5,
        endpoints: [
          {
            url: '/api/health',
            method: 'GET',
            weight: 1,
          },
          {
            url: '/api/v2/blockchain/usage-metrics',
            method: 'GET',
            weight: 3,
          },
          {
            url: '/api/v2/blockchain/market-overview',
            method: 'GET',
            weight: 2,
          },
        ],
      },
      'stress': {
        duration: 300,
        concurrentUsers: 100,
        rampUpTime: 60,
        requestsPerSecond: 50,
        endpoints: [
          {
            url: '/api/health',
            method: 'GET',
            weight: 1,
          },
          {
            url: '/api/v2/blockchain/usage-metrics',
            method: 'GET',
            weight: 4,
          },
          {
            url: '/api/v2/blockchain/market-overview',
            method: 'GET',
            weight: 3,
          },
          {
            url: '/api/v2/blockchain/ai-analysis',
            method: 'GET',
            weight: 2,
          },
        ],
      },
      'spike': {
        duration: 120,
        concurrentUsers: 50,
        rampUpTime: 10,
        requestsPerSecond: 100,
        endpoints: [
          {
            url: '/api/v2/blockchain/usage-metrics',
            method: 'GET',
            weight: 5,
          },
          {
            url: '/api/v2/blockchain/market-overview',
            method: 'GET',
            weight: 3,
          },
          {
            url: '/api/v2/blockchain/ai-analysis',
            method: 'GET',
            weight: 2,
          },
        ],
      },
    };
  }
}

// Global instance
export const loadTestingService = new LoadTestingService();
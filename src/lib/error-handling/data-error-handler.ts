// Comprehensive Error Handling System for Data Integration

import type { HistoricalDataPoint, TrendAnalysis } from '@/lib/types';
import type { HistoricalDataRequest } from '@/lib/data-sources/historical-data';

export interface DataErrorContext {
  operation: string;
  blockchain?: string;
  metric?: string;
  timeframe?: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface DataErrorType {
  category: 'network' | 'validation' | 'transformation' | 'cache' | 'api' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  userMessage: string;
  technicalMessage: string;
}

export interface ErrorHandlingResult {
  success: boolean;
  data?: any;
  error?: DataErrorType;
  fallbackApplied: boolean;
  recoveryTime: number;
  suggestions: string[];
}

export interface FallbackStrategy {
  name: string;
  description: string;
  apply: (context: DataErrorContext, error: Error) => Promise<any>;
  priority: number; // Lower number = higher priority
}

export class DataErrorHandler {
  private errorTypes: Map<string, DataErrorType> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy> = new Map();
  private errorLogger: ErrorLogger;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor() {
    this.initializeErrorTypes();
    this.initializeFallbackStrategies();
    this.errorLogger = new ErrorLogger();
    this.initializeCircuitBreakers();
  }

  private initializeErrorTypes(): void {
    // Network errors
    this.errorTypes.set('network_timeout', {
      category: 'network',
      severity: 'medium',
      retryable: true,
      userMessage: 'Network timeout occurred. Please try again.',
      technicalMessage: 'Request timeout exceeded'
    });

    this.errorTypes.set('network_connection', {
      category: 'network',
      severity: 'high',
      retryable: true,
      userMessage: 'Network connection issues detected. Please check your internet connection.',
      technicalMessage: 'Network connection failed'
    });

    // Validation errors
    this.errorTypes.set('validation_insufficient_data', {
      category: 'validation',
      severity: 'high',
      retryable: false,
      userMessage: 'Insufficient data available for analysis.',
      technicalMessage: 'Data validation failed: insufficient data points'
    });

    this.errorTypes.set('validation_invalid_format', {
      category: 'validation',
      severity: 'medium',
      retryable: false,
      userMessage: 'Invalid data format received.',
      technicalMessage: 'Data format validation failed'
    });

    // Transformation errors
    this.errorTypes.set('transformation_failed', {
      category: 'transformation',
      severity: 'medium',
      retryable: true,
      userMessage: 'Data processing failed. Using cached data if available.',
      technicalMessage: 'Data transformation pipeline failed'
    });

    // Cache errors
    this.errorTypes.set('cache_miss', {
      category: 'cache',
      severity: 'low',
      retryable: true,
      userMessage: 'Loading fresh data...',
      technicalMessage: 'Cache miss, fetching from source'
    });

    // API errors
    this.errorTypes.set('api_rate_limit', {
      category: 'api',
      severity: 'medium',
      retryable: true,
      userMessage: 'Too many requests. Please wait a moment.',
      technicalMessage: 'API rate limit exceeded'
    });

    this.errorTypes.set('api_authentication', {
      category: 'api',
      severity: 'critical',
      retryable: false,
      userMessage: 'Authentication failed. Please contact support.',
      technicalMessage: 'API authentication failed'
    });

    this.errorTypes.set('api_server_error', {
      category: 'api',
      severity: 'high',
      retryable: true,
      userMessage: 'Service temporarily unavailable. Please try again later.',
      technicalMessage: 'API server error'
    });
  }

  private initializeFallbackStrategies(): void {
    // Cache fallback strategy
    this.fallbackStrategies.set('cache', {
      name: 'Cache Fallback',
      description: 'Use cached data when fresh data fails',
      priority: 1,
      apply: async (context, error) => {
        // Implementation would check cache for data
        return { source: 'cache', data: null, message: 'Using cached data' };
      }
    });

    // Mock data fallback strategy
    this.fallbackStrategies.set('mock', {
      name: 'Mock Data Fallback',
      description: 'Use generated mock data when real data unavailable',
      priority: 2,
      apply: async (context, error) => {
        return this.generateMockData(context);
      }
    });

    // Simplified calculation fallback
    this.fallbackStrategies.set('simplified', {
      name: 'Simplified Calculation',
      description: 'Use simplified trend calculation',
      priority: 3,
      apply: async (context, error) => {
        return this.generateSimplifiedAnalysis(context);
      }
    });

    // Graceful degradation fallback
    this.fallbackStrategies.set('graceful', {
      name: 'Graceful Degradation',
      description: 'Provide minimal functionality with limited data',
      priority: 4,
      apply: async (context, error) => {
        return this.gracefulDegradation(context);
      }
    });
  }

  private initializeCircuitBreakers(): void {
    // Initialize circuit breakers for different services
    const services = ['glassnode', 'coinmetrics', 'defillama'];
    
    services.forEach(service => {
      this.circuitBreakers.set(service, new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60 * 1000, // 1 minute
        monitoringPeriod: 60 * 1000 // 1 minute
      }));
    });
  }

  async handleDataError(
    error: Error,
    context: DataErrorContext,
    operation: () => Promise<any>
  ): Promise<ErrorHandlingResult> {
    const startTime = Date.now();
    
    try {
      // Classify the error
      const errorType = this.classifyError(error, context);
      
      // Log the error
      await this.errorLogger.logError(error, errorType, context);
      
      // Check circuit breaker if applicable
      const circuitBreaker = this.circuitBreakers.get(context.blockchain || 'default');
      if (circuitBreaker && !circuitBreaker.canExecute()) {
        return {
          success: false,
          error: {
            category: 'circuit',
            severity: 'high',
            retryable: true,
            userMessage: 'Service temporarily unavailable. Please try again later.',
            technicalMessage: 'Circuit breaker open'
          },
          fallbackApplied: false,
          recoveryTime: Date.now() - startTime,
          suggestions: ['Please try again later', 'Contact support if issue persists']
        };
      }

      // Attempt retry if retryable
      if (errorType.retryable) {
        const retryResult = await this.attemptRetry(operation, context, errorType);
        if (retryResult.success) {
          return retryResult;
        }
      }

      // Apply fallback strategies
      const fallbackResult = await this.applyFallbackStrategies(context, error);
      if (fallbackResult.success) {
        return {
          ...fallbackResult,
          recoveryTime: Date.now() - startTime,
          suggestions: this.generateSuggestions(errorType, context)
        };
      }

      // Record failure in circuit breaker
      if (circuitBreaker) {
        circuitBreaker.recordFailure();
      }

      return {
        success: false,
        error: errorType,
        fallbackApplied: false,
        recoveryTime: Date.now() - startTime,
        suggestions: this.generateSuggestions(errorType, context)
      };
    } catch (handlingError) {
      // Error handling itself failed
      console.error('Error handling failed:', handlingError);
      
      return {
        success: false,
        error: {
          category: 'unknown',
          severity: 'critical',
          retryable: false,
          userMessage: 'An unexpected error occurred.',
          technicalMessage: 'Error handling system failure'
        },
        fallbackApplied: false,
        recoveryTime: Date.now() - startTime,
        suggestions: ['Please refresh the page', 'Contact support if issue persists']
      };
    }
  }

  private classifyError(error: Error, context: DataErrorContext): DataErrorType {
    const errorMessage = error.message.toLowerCase();
    
    // Network errors
    if (errorMessage.includes('timeout')) {
      return this.errorTypes.get('network_timeout')!;
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return this.errorTypes.get('network_connection')!;
    }

    // API errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return this.errorTypes.get('api_rate_limit')!;
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return this.errorTypes.get('api_authentication')!;
    }
    
    if (errorMessage.includes('500') || errorMessage.includes('server error')) {
      return this.errorTypes.get('api_server_error')!;
    }

    // Validation errors
    if (errorMessage.includes('insufficient') || errorMessage.includes('not enough')) {
      return this.errorTypes.get('validation_insufficient_data')!;
    }
    
    if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
      return this.errorTypes.get('validation_invalid_format')!;
    }

    // Transformation errors
    if (errorMessage.includes('transformation') || errorMessage.includes('parse')) {
      return this.errorTypes.get('transformation_failed')!;
    }

    // Default to unknown error
    return {
      category: 'unknown',
      severity: 'medium',
      retryable: false,
      userMessage: 'An unexpected error occurred.',
      technicalMessage: error.message
    };
  }

  private async attemptRetry(
    operation: () => Promise<any>,
    context: DataErrorContext,
    errorType: DataErrorType
  ): Promise<ErrorHandlingResult> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const result = await operation();
        
        // Record success in circuit breaker
        const circuitBreaker = this.circuitBreakers.get(context.blockchain || 'default');
        if (circuitBreaker) {
          circuitBreaker.recordSuccess();
        }
        
        return {
          success: true,
          data: result,
          fallbackApplied: false,
          recoveryTime: 0,
          suggestions: []
        };
      } catch (retryError) {
        if (attempt === maxRetries) {
          break; // All retries failed
        }
      }
    }
    
    return {
      success: false,
      error: errorType,
      fallbackApplied: false,
      recoveryTime: 0,
      suggestions: []
    };
  }

  private async applyFallbackStrategies(
    context: DataErrorContext,
    error: Error
  ): Promise<ErrorHandlingResult> {
    // Sort strategies by priority
    const strategies = Array.from(this.fallbackStrategies.values())
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of strategies) {
      try {
        const result = await strategy.apply(context, error);
        
        return {
          success: true,
          data: result,
          fallbackApplied: true,
          recoveryTime: 0,
          suggestions: []
        };
      } catch (fallbackError) {
        console.warn(`Fallback strategy ${strategy.name} failed:`, fallbackError);
        continue; // Try next strategy
      }
    }

    return {
      success: false,
      fallbackApplied: false,
      recoveryTime: 0,
      suggestions: []
    };
  }

  private async generateMockData(context: DataErrorContext): Promise<any> {
    // Generate mock historical data
    const mockData: HistoricalDataPoint[] = [];
    const now = new Date();
    const days = context.timeframe === '7d' ? 7 : context.timeframe === '30d' ? 30 : 90;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const value = Math.random() * 100 + 50; // Random value between 50-150
      
      mockData.push({
        timestamp,
        value,
        volume: Math.random() * 1000
      });
    }

    return {
      source: 'mock',
      data: mockData,
      message: 'Using generated mock data'
    };
  }

  private async generateSimplifiedAnalysis(context: DataErrorContext): Promise<TrendAnalysis> {
    return {
      direction: 'stable',
      strength: 0.5,
      momentum: 'moderate',
      volatility: 0.1,
      confidence: 0.5,
      trendline: { slope: 0, intercept: 0, rSquared: 0 },
      keyPoints: { peak: 100, trough: 50, current: 75 },
      recommendations: ['Limited data available - analysis may be less accurate']
    };
  }

  private async gracefulDegradation(context: DataErrorContext): Promise<any> {
    return {
      source: 'graceful',
      data: null,
      message: 'Service temporarily unavailable - basic functionality maintained',
      limited: true
    };
  }

  private generateSuggestions(errorType: DataErrorType, context: DataErrorContext): string[] {
    const suggestions: string[] = [];

    switch (errorType.category) {
      case 'network':
        suggestions.push('Check your internet connection');
        suggestions.push('Try refreshing the page');
        break;
      
      case 'api':
        if (errorType.severity === 'critical') {
          suggestions.push('Contact support team');
        } else {
          suggestions.push('Please try again in a few minutes');
        }
        break;
      
      case 'validation':
        suggestions.push('Check your data parameters');
        suggestions.push('Try a different timeframe');
        break;
      
      default:
        suggestions.push('Please try again');
        suggestions.push('Contact support if issue persists');
    }

    return suggestions;
  }

  // Get error statistics
  async getErrorStats(timeRange: number = 24 * 60 * 60 * 1000): Promise<any> {
    return this.errorLogger.getErrorStats(timeRange);
  }

  // Add custom error type
  addErrorType(key: string, errorType: DataErrorType): void {
    this.errorTypes.set(key, errorType);
  }

  // Add custom fallback strategy
  addFallbackStrategy(key: string, strategy: FallbackStrategy): void {
    this.fallbackStrategies.set(key, strategy);
  }

  // Get circuit breaker status
  getCircuitBreakerStatus(service: string): any {
    const breaker = this.circuitBreakers.get(service);
    return breaker ? breaker.getStatus() : null;
  }
}

// Supporting classes
class ErrorLogger {
  private errorLog: Array<{
    error: Error;
    errorType: DataErrorType;
    context: DataErrorContext;
    timestamp: Date;
  }> = [];

  async logError(error: Error, errorType: DataErrorType, context: DataErrorContext): Promise<void> {
    const logEntry = {
      error,
      errorType,
      context,
      timestamp: new Date()
    };

    this.errorLog.push(logEntry);

    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000);
    }

    // In production, this would log to external services
    console.error('Data Error:', {
      message: error.message,
      type: errorType.category,
      severity: errorType.severity,
      context,
      timestamp: logEntry.timestamp
    });
  }

  async getErrorStats(timeRange: number): Promise<any> {
    const cutoff = new Date(Date.now() - timeRange);
    const recentErrors = this.errorLog.filter(entry => entry.timestamp >= cutoff);

    const stats = {
      totalErrors: recentErrors.length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byBlockchain: {} as Record<string, number>,
      retryableCount: 0
    };

    recentErrors.forEach(entry => {
      // Count by category
      stats.byCategory[entry.errorType.category] = 
        (stats.byCategory[entry.errorType.category] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[entry.errorType.severity] = 
        (stats.bySeverity[entry.errorType.severity] || 0) + 1;
      
      // Count by blockchain
      if (entry.context.blockchain) {
        stats.byBlockchain[entry.context.blockchain] = 
          (stats.byBlockchain[entry.context.blockchain] || 0) + 1;
      }
      
      // Count retryable
      if (entry.errorType.retryable) {
        stats.retryableCount++;
      }
    });

    return stats;
  }
}

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;
  private config: {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
  };

  constructor(config: { failureThreshold: number; resetTimeout: number; monitoringPeriod: number }) {
    this.config = config;
  }

  canExecute(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow one attempt
    return true;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    }
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  getStatus(): any {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }
}

// Singleton instance
export const dataErrorHandler = new DataErrorHandler();
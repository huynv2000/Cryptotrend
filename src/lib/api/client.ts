// API Client for Blockchain Dashboard

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useBlockchainStore } from '@/store/blockchainStore';
import { utils } from '@/lib/utils';
import type { 
  ApiResponse, 
  ApiError, 
  UsageMetrics, 
  TVLMetrics,
  CashflowMetrics, 
  MarketOverview, 
  AIAnalysis,
  BlockchainValue,
  TimeframeValue
} from '@/lib/types';

class ApiClient {
  private client: AxiosInstance;
  private retryAttempts = 0;
  private maxRetryAttempts = 3;
  
  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || '/api') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timestamp for performance monitoring
        config.metadata = { startTime: new Date() };
        
        // Add blockchain context if available
        const { selectedBlockchain, selectedTimeframe } = useBlockchainStore.getState();
        if (selectedBlockchain) {
          config.headers['X-Blockchain'] = selectedBlockchain;
        }
        if (selectedTimeframe) {
          config.headers['X-Timeframe'] = selectedTimeframe;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Calculate request duration
        const endTime = new Date();
        const duration = endTime.getTime() - response.config.metadata.startTime.getTime();
        
        // Log performance metrics
        this.logPerformance(response.config, duration);
        
        // Reset retry attempts on successful response
        this.retryAttempts = 0;
        
        return response;
      },
      (error: AxiosError) => {
        // Handle different error types
        if (error.response) {
          // Server responded with error status
          this.handleResponseError(error);
        } else if (error.request) {
          // Request made but no response received
          this.handleNetworkError(error);
        } else {
          // Something happened in setting up the request
          this.handleUnknownError(error);
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token');
    }
    return null;
  }
  
  private logPerformance(config: AxiosRequestConfig, duration: number): void {
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';
    
    console.log(`API ${method} ${url} took ${duration}ms`);
    
    // Log slow requests
    if (duration > 2000) {
      console.warn(`Slow API request: ${method} ${url} took ${duration}ms`);
    }
  }
  
  private handleResponseError(error: AxiosError): void {
    const status = error.response?.status;
    const data = error.response?.data as any;
    
    switch (status) {
      case 401:
        this.handleUnauthorized();
        break;
      case 403:
        this.handleForbidden();
        break;
      case 429:
        this.handleRateLimit();
        break;
      case 500:
        this.handleServerError();
        break;
      case 502:
      case 503:
      case 504:
        this.handleServiceUnavailable();
        break;
      default:
        this.handleGenericError(error);
    }
    
    // Add error notification
    const store = useBlockchainStore.getState();
    store.addNotification({
      type: 'error',
      title: 'API Error',
      message: data?.message || error.message || 'An error occurred',
    });
  }
  
  private handleNetworkError(error: AxiosError): void {
    console.error('Network error:', error.message);
    
    // Retry logic for network errors
    if (this.retryAttempts < this.maxRetryAttempts) {
      this.retryAttempts++;
      console.log(`Retrying request (attempt ${this.retryAttempts}/${this.maxRetryAttempts})`);
      
      // Implement retry logic here
      // This would typically be done with axios retry interceptor
    }
    
    // Add network error notification
    const store = useBlockchainStore.getState();
    store.addNotification({
      type: 'error',
      title: 'Network Error',
      message: 'Please check your internet connection',
    });
  }
  
  private handleUnknownError(error: AxiosError): void {
    console.error('Unknown error:', error.message);
    
    // Add unknown error notification
    const store = useBlockchainStore.getState();
    store.addNotification({
      type: 'error',
      title: 'Unknown Error',
      message: 'An unknown error occurred',
    });
  }
  
  private handleUnauthorized(): void {
    console.warn('Unauthorized access - clearing auth token');
    
    // Clear auth token and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      // Redirect to login page
      window.location.href = '/login';
    }
  }
  
  private handleForbidden(): void {
    console.warn('Forbidden access');
    
    // Add forbidden error notification
    const store = useBlockchainStore.getState();
    store.addNotification({
      type: 'error',
      title: 'Access Denied',
      message: 'You do not have permission to access this resource',
    });
  }
  
  private handleRateLimit(): void {
    console.warn('Rate limit exceeded');
    
    // Add rate limit notification
    const store = useBlockchainStore.getState();
    store.addNotification({
      type: 'warning',
      title: 'Rate Limit Exceeded',
      message: 'Please wait before making more requests',
    });
  }
  
  private handleServerError(): void {
    console.error('Server error occurred');
    
    // Add server error notification
    const store = useBlockchainStore.getState();
    store.addNotification({
      type: 'error',
      title: 'Server Error',
      message: 'An error occurred on the server. Please try again later.',
    });
  }
  
  private handleServiceUnavailable(): void {
    console.warn('Service unavailable');
    
    // Add service unavailable notification
    const store = useBlockchainStore.getState();
    store.addNotification({
      type: 'warning',
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again later.',
    });
  }
  
  private handleGenericError(error: AxiosError): void {
    console.error('Generic error:', error.message);
    
    // Add generic error notification
    const store = useBlockchainStore.getState();
    store.addNotification({
      type: 'error',
      title: 'Error',
      message: error.message || 'An error occurred',
    });
  }
  
  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log('🔍 [ApiClient] GET request:', { url, config });
    try {
      const response = await this.client.get<ApiResponse<T> | T>(url, config);
      console.log('🔍 [ApiClient] GET response:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullData: response.data
      });
      
      // Check if response has the expected API wrapper structure
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        console.log('🔍 [ApiClient] Found wrapped response structure, extracting data');
        const wrappedData = (response.data as ApiResponse<T>).data;
        console.log('🔍 [ApiClient] Extracted wrapped data:', wrappedData);
        return wrappedData;
      }
      // If not, return the response data directly
      console.log('🔍 [ApiClient] Using direct response data');
      console.log('🔍 [ApiClient] Returning data:', response.data);
      return response.data as T;
    } catch (error) {
      console.error('❌ [ApiClient] GET request failed:', error);
      console.error('❌ [ApiClient] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error;
    }
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T> | T>(url, data, config);
    // Check if response has the expected API wrapper structure
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as ApiResponse<T>).data;
    }
    // If not, return the response data directly
    return response.data as T;
  }
  
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T> | T>(url, data, config);
    // Check if response has the expected API wrapper structure
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as ApiResponse<T>).data;
    }
    // If not, return the response data directly
    return response.data as T;
  }
  
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T> | T>(url, config);
    // Check if response has the expected API wrapper structure
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as ApiResponse<T>).data;
    }
    // If not, return the response data directly
    return response.data as T;
  }
  
  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
  
  // Retry wrapper
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError!;
  }
  
  // Timeout wrapper
  async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
}

// Create global API client instance
export const apiClient = new ApiClient();

// Blockchain API specific methods
export class BlockchainAPI {
  static async getUsageMetrics(
    blockchain: BlockchainValue, 
    timeframe: TimeframeValue = '24h'
  ): Promise<UsageMetrics> {
    return apiClient.get<UsageMetrics>('/v2/blockchain/usage-metrics', {
      params: { blockchain, timeframe }
    });
  }
  
  static async getTVLMetrics(
    blockchain: BlockchainValue, 
    timeframe: TimeframeValue = '24h'
  ): Promise<TVLMetrics> {
    return apiClient.get<TVLMetrics>('/v2/blockchain/tvl-metrics', {
      params: { blockchain, timeframe }
    });
  }
  
  static async getEnhancedTVLMetrics(
    blockchain: BlockchainValue, 
    timeframe: TimeframeValue = '24h'
  ): Promise<any> {
    return apiClient.get<any>('/v2/blockchain/enhanced-tvl', {
      params: { coinId: blockchain, timeframe }
    });
  }
  
  static async getTVLComparison(
    blockchains: string[] = ['ethereum', 'bitcoin', 'solana', 'binance-smart-chain', 'polygon']
  ): Promise<any> {
    return apiClient.get<any>('/v2/blockchain/tvl-comparison', {
      params: { blockchains: blockchains.join(',') }
    });
  }
  
  static async getCashflowMetrics(
    blockchain: BlockchainValue, 
    timeframe: TimeframeValue = '24h'
  ): Promise<CashflowMetrics> {
    return apiClient.get<CashflowMetrics>('/v2/blockchain/cashflow-metrics', {
      params: { blockchain, timeframe }
    });
  }
  
  static async getMarketOverview(
    blockchain: BlockchainValue
  ): Promise<MarketOverview> {
    return apiClient.get<MarketOverview>('/v2/blockchain/market-overview', {
      params: { blockchain }
    });
  }
  
  static async getAIAnalysis(
    blockchain: BlockchainValue
  ): Promise<AIAnalysis> {
    return apiClient.get<AIAnalysis>('/v2/blockchain/ai-analysis', {
      params: { blockchain }
    });
  }
  
  static async getHistoricalData(
    blockchain: BlockchainValue,
    metric: string,
    timeframe: TimeframeValue = '24h'
  ): Promise<any[]> {
    return apiClient.get<any[]>('/v2/blockchain/historical', {
      params: { blockchain, metric, timeframe }
    });
  }
  
  static async compareMetrics(
    blockchains: BlockchainValue[],
    metric: string,
    timeframe: TimeframeValue = '24h'
  ): Promise<any[]> {
    return apiClient.post<any[]>('/v2/blockchain/compare', {
      blockchains,
      metric,
      timeframe
    });
  }
  
  static async refreshData(
    blockchain: BlockchainValue,
    timeframe: TimeframeValue = '24h'
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/v2/blockchain/refresh', {
      blockchain,
      timeframe
    });
  }
}

// Health check API
export class HealthAPI {
  static async check(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    services: Record<string, 'healthy' | 'unhealthy'>;
  }> {
    return apiClient.get('/health');
  }
  
  static async detailed(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: Date;
    services: Record<string, any>;
    metrics: Record<string, number>;
  }> {
    return apiClient.get('/health/detailed');
  }
}

// Export all APIs
export const API = {
  blockchain: BlockchainAPI,
  health: HealthAPI,
  client: apiClient,
};

export default apiClient;
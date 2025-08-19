/**
 * Smart Rate Limiter for Crypto Data APIs
 * Manages API request limits and prioritizes tasks efficiently
 */

export interface RateLimitConfig {
  requests: number
  window: number // in milliseconds
}

export interface QueuedTask {
  id: string
  task: () => Promise<any>
  priority: number // 1 = highest, 5 = lowest
  api: string
  resolve: (value: any) => void
  reject: (reason?: any) => void
  timestamp: number
}

export class SmartRateLimiter {
  private static instance: SmartRateLimiter
  
  // API configurations
  private readonly API_LIMITS: Record<string, RateLimitConfig> = {
    coingecko: { requests: 2, window: 60000 },      // 2 requests per minute (balanced for dashboard usage)
    glassnode: { requests: 100, window: 3600000 },     // 100 requests per hour
    alternative: { requests: 60, window: 3600000 },   // 60 requests per hour
    ai: { requests: 100, window: 3600000 },          // 100 AI requests per hour
    internal: { requests: 1000, window: 60000 }     // 1000 internal requests per minute
  }
  
  // Request tracking
  private requestCounts: Map<string, { count: number; resetTime: number; windowStart: number }> = new Map()
  
  // Task queues
  private queues: Map<string, QueuedTask[]> = new Map()
  
  // Processing state
  private isProcessing: boolean = false
  private processingInterval: NodeJS.Timeout | null = null
  
  // Statistics
  private stats: Map<string, { totalRequests: number; successfulRequests: number; failedRequests: number }> = new Map()
  
  private constructor() {
    this.initializeStats()
    this.startProcessing()
  }
  
  static getInstance(): SmartRateLimiter {
    if (!SmartRateLimiter.instance) {
      SmartRateLimiter.instance = new SmartRateLimiter()
    }
    return SmartRateLimiter.instance
  }
  
  private initializeStats() {
    Object.keys(this.API_LIMITS).forEach(api => {
      this.stats.set(api, { totalRequests: 0, successfulRequests: 0, failedRequests: 0 })
    })
  }
  
  /**
   * Schedule a request with rate limiting and priority
   */
  async scheduleRequest<T>(
    api: string, 
    task: () => Promise<T>, 
    priority: number = 3,
    timeout: number = 30000
  ): Promise<T> {
    const limit = this.API_LIMITS[api] || this.API_LIMITS.internal
    const now = Date.now()
    
    // Update statistics
    const stats = this.stats.get(api) || { totalRequests: 0, successfulRequests: 0, failedRequests: 0 }
    stats.totalRequests++
    this.stats.set(api, stats)
    
    // Check if we can execute immediately
    if (this.canExecuteImmediately(api, limit)) {
      return this.executeTask(api, task, priority)
    }
    
    // Queue the task for later execution
    return this.queueTask(api, task, priority, timeout)
  }
  
  /**
   * Check if a request can be executed immediately
   */
  private canExecuteImmediately(api: string, limit: RateLimitConfig): boolean {
    const now = Date.now()
    const key = `${api}_${Math.floor(now / limit.window)}`
    const current = this.requestCounts.get(key) || { count: 0, resetTime: now + limit.window, windowStart: now }
    
    // Reset window if time has passed
    if (now > current.resetTime) {
      this.requestCounts.set(key, { count: 0, resetTime: now + limit.window, windowStart: now })
      return true
    }
    
    return current.count < limit.requests
  }
  
  /**
   * Execute a task immediately
   */
  private async executeTask<T>(api: string, task: () => Promise<T>, priority: number): Promise<T> {
    const limit = this.API_LIMITS[api] || this.API_LIMITS.internal
    const now = Date.now()
    const key = `${api}_${Math.floor(now / limit.window)}`
    
    // Update request count
    const current = this.requestCounts.get(key) || { count: 0, resetTime: now + limit.window, windowStart: now }
    current.count++
    this.requestCounts.set(key, current)
    
    try {
      console.log(`🚀 Executing ${api} request (priority ${priority})`)
      const result = await task()
      
      // Update success statistics
      const stats = this.stats.get(api) || { totalRequests: 0, successfulRequests: 0, failedRequests: 0 }
      stats.successfulRequests++
      this.stats.set(api, stats)
      
      return result
    } catch (error) {
      // Update failure statistics
      const stats = this.stats.get(api) || { totalRequests: 0, successfulRequests: 0, failedRequests: 0 }
      stats.failedRequests++
      this.stats.set(api, stats)
      
      console.error(`❌ ${api} request failed:`, error instanceof Error ? error.message : String(error))
      throw error
    }
  }
  
  /**
   * Queue a task for later execution
   */
  private queueTask<T>(api: string, task: () => Promise<T>, priority: number, timeout: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const taskId = `${api}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      if (!this.queues.has(api)) {
        this.queues.set(api, [])
      }
      
      const queuedTask: QueuedTask = {
        id: taskId,
        task,
        priority,
        api,
        resolve,
        reject,
        timestamp: Date.now()
      }
      
      this.queues.get(api)!.push(queuedTask)
      
      // Sort queue by priority (lower number = higher priority)
      this.queues.get(api)!.sort((a, b) => a.priority - b.priority)
      
      console.log(`⏳ Queued ${api} request (priority ${priority}) - Queue size: ${this.queues.get(api)!.length}`)
      
      // Set timeout for the task
      setTimeout(() => {
        this.removeTaskFromQueue(api, taskId)
        reject(new Error(`Task ${taskId} timed out after ${timeout}ms`))
      }, timeout)
    })
  }
  
  /**
   * Remove a task from the queue
   */
  private removeTaskFromQueue(api: string, taskId: string): void {
    const queue = this.queues.get(api)
    if (queue) {
      const index = queue.findIndex(task => task.id === taskId)
      if (index !== -1) {
        queue.splice(index, 1)
      }
    }
  }
  
  /**
   * Start processing queues
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return
    }
    
    this.processingInterval = setInterval(() => {
      this.processQueues()
    }, 1000) // Check every second
    
    console.log('🔄 Smart Rate Limiter started processing queues')
  }
  
  /**
   * Process all queues
   */
  private async processQueues(): Promise<void> {
    if (this.isProcessing) {
      return
    }
    
    this.isProcessing = true
    
    try {
      for (const [api, queue] of this.queues.entries()) {
        if (queue.length === 0) {
          continue
        }
        
        const limit = this.API_LIMITS[api] || this.API_LIMITS.internal
        
        if (this.canExecuteImmediately(api, limit)) {
          const task = queue.shift()!
          
          try {
            const result = await this.executeTask(api, task.task, task.priority)
            task.resolve(result)
          } catch (error) {
            task.reject(error)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing queues:', error)
    } finally {
      this.isProcessing = false
    }
  }
  
  /**
   * Get current statistics
   */
  getStatistics(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    for (const [api, apiStats] of this.stats.entries()) {
      stats[api] = {
        ...apiStats,
        successRate: apiStats.totalRequests > 0 ? (apiStats.successfulRequests / apiStats.totalRequests * 100).toFixed(2) + '%' : '0%',
        queueSize: this.queues.get(api)?.length || 0
      }
    }
    
    return stats
  }
  
  /**
   * Get current queue status
   */
  getQueueStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    
    for (const [api, queue] of this.queues.entries()) {
      const limit = this.API_LIMITS[api] || this.API_LIMITS.internal
      const now = Date.now()
      const key = `${api}_${Math.floor(now / limit.window)}`
      const current = this.requestCounts.get(key) || { count: 0, resetTime: now + limit.window, windowStart: now }
      
      status[api] = {
        queueLength: queue.length,
        currentRequests: current.count,
        maxRequests: limit.requests,
        resetIn: Math.max(0, current.resetTime - now),
        windowSize: limit.window,
        oldestTask: queue.length > 0 ? Date.now() - queue[0].timestamp : 0
      }
    }
    
    return status
  }
  
  /**
   * Clear all queues (for testing or emergency)
   */
  clearQueues(): void {
    for (const [api, queue] of this.queues.entries()) {
      // Reject all queued tasks
      queue.forEach(task => {
        task.reject(new Error('Queue cleared by system'))
      })
      queue.length = 0
    }
    
    console.log('🧹 All queues cleared')
  }
  
  /**
   * Stop processing (for cleanup)
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    
    this.clearQueues()
    console.log('🛑 Smart Rate Limiter stopped')
  }
}

// Export singleton instance
export const rateLimiter = SmartRateLimiter.getInstance()
/**
 * AI Analysis Logger Utility
 * Provides comprehensive logging for AI analysis operations
 */

export interface AILogEntry {
  timestamp: string
  operation: string
  coinId: string
  prompt?: string
  requestData?: any
  zaiResponse?: any
  chatGPTResponse?: any
  finalResult?: any
  executionTime: number
  success: boolean
  error?: string
  metadata?: {
    analysisType?: string
    marketDataPoints?: number
    alertsCount?: number
    cacheUsed?: boolean
    aiModelsUsed?: string[]
  }
}

class AILogger {
  private logs: AILogEntry[] = []
  private readonly maxLogs = 1000 // Keep last 1000 logs in memory
  
  /**
   * Log an AI analysis operation
   */
  logAnalysis(operation: string, data: {
    coinId: string
    prompt?: string
    requestData?: any
    zaiResponse?: any
    chatGPTResponse?: any
    finalResult?: any
    executionTime: number
    success: boolean
    error?: string
    metadata?: AILogEntry['metadata']
  }): void {
    const logEntry: AILogEntry = {
      timestamp: new Date().toISOString(),
      operation,
      coinId: data.coinId,
      prompt: data.prompt,
      requestData: data.requestData,
      zaiResponse: data.zaiResponse,
      chatGPTResponse: data.chatGPTResponse,
      finalResult: data.finalResult,
      executionTime: data.executionTime,
      success: data.success,
      error: data.error,
      metadata: data.metadata
    }
    
    this.addLog(logEntry)
  }
  
  /**
   * Log the start of an AI analysis operation
   */
  logStart(operation: string, coinId: string, requestData?: any): string {
    const logId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`🤖 [${logId}] Starting AI analysis operation: ${operation} for ${coinId}`)
    console.log(`📊 [${logId}] Request data:`, JSON.stringify(requestData, null, 2))
    
    return logId
  }
  
  /**
   * Log the prompt being sent to AI
   */
  logPrompt(logId: string, prompt: string, aiModel: string): void {
    console.log(`💬 [${logId}] Sending prompt to ${aiModel}:`)
    console.log(`📝 [${logId}] Prompt content:`, prompt)
  }
  
  /**
   * Log AI response
   */
  logResponse(logId: string, aiModel: string, response: any, executionTime: number): void {
    console.log(`🤖 [${logId}] Received response from ${aiModel} (${executionTime}ms):`)
    console.log(`📋 [${logId}] Response:`, JSON.stringify(response, null, 2))
  }
  
  /**
   * Log the completion of an AI analysis operation
   */
  logComplete(logId: string, operation: string, result: any, totalExecutionTime: number, success: boolean = true, error?: string): void {
    if (success) {
      console.log(`✅ [${logId}] Completed ${operation} successfully (${totalExecutionTime}ms)`)
      console.log(`🎯 [${logId}] Final result:`, JSON.stringify(result, null, 2))
    } else {
      console.error(`❌ [${logId}] Failed ${operation} (${totalExecutionTime}ms):`, error)
    }
  }
  
  /**
   * Log cache usage
   */
  logCache(logId: string, coinId: string, cacheAge: number): void {
    console.log(`💾 [${logId}] Using cached analysis for ${coinId} (age: ${cacheAge}ms)`)
  }
  
  /**
   * Log database operations
   */
  logDatabase(logId: string, operation: string, data: any, success: boolean = true, error?: string): void {
    if (success) {
      console.log(`💿 [${logId}] Database ${operation} successful:`, JSON.stringify(data, null, 2))
    } else {
      console.error(`💿 [${logId}] Database ${operation} failed:`, error)
    }
  }
  
  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): AILogEntry[] {
    return this.logs.slice(-count)
  }
  
  /**
   * Get logs for a specific coin
   */
  getLogsForCoin(coinId: string, count: number = 50): AILogEntry[] {
    return this.logs
      .filter(log => log.coinId === coinId)
      .slice(-count)
  }
  
  /**
   * Get logs by operation type
   */
  getLogsByOperation(operation: string, count: number = 50): AILogEntry[] {
    return this.logs
      .filter(log => log.operation === operation)
      .slice(-count)
  }
  
  /**
   * Export logs to JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
  
  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
    console.log('🗑️ AI Analysis logs cleared')
  }
  
  /**
   * Get statistics
   */
  getStats(): {
    totalLogs: number
    successfulOperations: number
    failedOperations: number
    averageExecutionTime: number
    operationsByType: Record<string, number>
    coinsAnalyzed: string[]
  } {
    const successful = this.logs.filter(log => log.success).length
    const failed = this.logs.filter(log => !log.success).length
    const avgTime = this.logs.reduce((sum, log) => sum + log.executionTime, 0) / this.logs.length || 0
    
    const operationsByType = this.logs.reduce((acc, log) => {
      acc[log.operation] = (acc[log.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const coinsAnalyzed = [...new Set(this.logs.map(log => log.coinId))]
    
    return {
      totalLogs: this.logs.length,
      successfulOperations: successful,
      failedOperations: failed,
      averageExecutionTime: Math.round(avgTime),
      operationsByType,
      coinsAnalyzed
    }
  }
  
  /**
   * Print summary to console
   */
  printSummary(): void {
    const stats = this.getStats()
    
    console.log('\n📊 AI Analysis Log Summary')
    console.log('==========================')
    console.log(`Total logs: ${stats.totalLogs}`)
    console.log(`Successful operations: ${stats.successfulOperations}`)
    console.log(`Failed operations: ${stats.failedOperations}`)
    console.log(`Average execution time: ${stats.averageExecutionTime}ms`)
    console.log(`Coins analyzed: ${stats.coinsAnalyzed.join(', ')}`)
    console.log('\nOperations by type:')
    Object.entries(stats.operationsByType).forEach(([operation, count]) => {
      console.log(`  ${operation}: ${count}`)
    })
    console.log('==========================\n')
  }
  
  private addLog(logEntry: AILogEntry): void {
    this.logs.push(logEntry)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
    
    // Also log to console with structured format
    this.logToConsole(logEntry)
  }
  
  private logToConsole(logEntry: AILogEntry): void {
    const status = logEntry.success ? '✅' : '❌'
    const time = new Date(logEntry.timestamp).toLocaleTimeString()
    
    console.log(`${status} [${time}] ${logEntry.operation} - ${logEntry.coinId} (${logEntry.executionTime}ms)`)
    
    if (logEntry.error) {
      console.error(`   Error: ${logEntry.error}`)
    }
    
    if (logEntry.metadata) {
      console.log(`   Metadata:`, logEntry.metadata)
    }
  }
}

// Export singleton instance
export const aiLogger = new AILogger()

// Export class with Logger alias for compatibility
export { AILogger as Logger }

// Export convenience functions
export const logAIAnalysis = aiLogger.logAnalysis.bind(aiLogger)
export const logAIStart = aiLogger.logStart.bind(aiLogger)
export const logAIPrompt = aiLogger.logPrompt.bind(aiLogger)
export const logAIResponse = aiLogger.logResponse.bind(aiLogger)
export const logAIComplete = aiLogger.logComplete.bind(aiLogger)
export const logAICache = aiLogger.logCache.bind(aiLogger)
export const logAIDatabase = aiLogger.logDatabase.bind(aiLogger)
// Export all crypto services and utilities
export { DataCollector } from './data-collector'
export { CryptoDataService, CoinGeckoService } from './crypto-service'
export { VolumeService } from './volume-service'
export { rateLimiter } from './rate-limiter'
export { errorHandler } from './error-handler'

// Create singleton instance for easy access
import { DataCollector } from './data-collector'
export const dataCollector = DataCollector.getInstance()
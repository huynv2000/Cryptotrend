/**
 * Data Migration Service
 * Handles database schema changes and data migrations
 */

import { db } from '@/lib/db'

export class DataMigrationService {
  /**
   * Update volume history with price data from price history
   */
  static async updateVolumeHistoryWithPrices(): Promise<void> {
    try {
      console.log('🔄 Starting volume history price data migration...')
      
      // Get all volume history records that have null price
      const volumeHistoryWithoutPrice = await db.volumeHistory.findMany({
        where: {
          price: null
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      console.log(`📊 Found ${volumeHistoryWithoutPrice.length} volume history records without price data`)

      let updatedCount = 0
      let skippedCount = 0

      for (const volumeRecord of volumeHistoryWithoutPrice) {
        try {
          // Find corresponding price history record with a wider time window
          const priceRecord = await db.priceHistory.findFirst({
            where: {
              cryptoId: volumeRecord.cryptoId,
              timestamp: {
                // Look for price records within 6 hours of the volume record
                gte: new Date(volumeRecord.timestamp.getTime() - 6 * 60 * 60 * 1000),
                lte: new Date(volumeRecord.timestamp.getTime() + 6 * 60 * 60 * 1000)
              }
            },
            orderBy: {
              timestamp: 'desc'
            }
          })

          if (priceRecord && priceRecord.price) {
            // Update volume history with price data
            await db.volumeHistory.update({
              where: {
                id: volumeRecord.id
              },
              data: {
                price: priceRecord.price
              }
            })
            updatedCount++
            
            if (updatedCount % 10 === 0) {
              console.log(`📈 Updated ${updatedCount} records so far...`)
            }
          } else {
            // Try to find any price record for this crypto, even if further back in time
            const anyPriceRecord = await db.priceHistory.findFirst({
              where: {
                cryptoId: volumeRecord.cryptoId
              },
              orderBy: {
                timestamp: 'desc'
              }
            })

            if (anyPriceRecord && anyPriceRecord.price) {
              // Update volume history with the most recent available price
              await db.volumeHistory.update({
                where: {
                  id: volumeRecord.id
                },
                data: {
                  price: anyPriceRecord.price
                }
              })
              updatedCount++
              
              if (updatedCount % 10 === 0) {
                console.log(`📈 Updated ${updatedCount} records so far (using latest available price)...`)
              }
            } else {
              skippedCount++
            }
          }
        } catch (error) {
          console.error(`❌ Failed to update volume record ${volumeRecord.id}:`, error)
          skippedCount++
        }
      }

      console.log(`✅ Migration completed: ${updatedCount} records updated, ${skippedCount} records skipped`)
      
    } catch (error) {
      console.error('❌ Error during volume history price migration:', error)
      throw error
    }
  }

  /**
   * Run all pending migrations
   */
  static async runAllMigrations(): Promise<void> {
    try {
      console.log('🚀 Starting data migrations...')
      
      await this.updateVolumeHistoryWithPrices()
      
      console.log('✅ All migrations completed successfully')
      
    } catch (error) {
      console.error('❌ Error during migrations:', error)
      throw error
    }
  }
}
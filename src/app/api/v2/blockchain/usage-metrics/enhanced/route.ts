import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EnhancedDataProvider } from '@/lib/enhanced-data-provider';
import { RollingAverageCalculator } from '@/lib/rolling-average-calculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchain = searchParams.get('blockchain') || 'bitcoin';
    const timeframe = searchParams.get('timeframe') || '24h';

    console.log(`🔍 Fetching enhanced usage metrics for ${blockchain}`);

    // Get cryptocurrency data
    const crypto = await db.cryptocurrency.findFirst({
      where: { coinGeckoId: blockchain }
    });

    if (!crypto) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      );
    }

    // Initialize services
    const enhancedDataProvider = EnhancedDataProvider.getInstance();
    const rollingCalculator = RollingAverageCalculator.getInstance();

    // Get latest price data for market cap and price
    const priceData = await db.priceHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    if (!priceData || !priceData.price || !priceData.marketCap) {
      return NextResponse.json(
        { error: 'No price data available' },
        { status: 404 }
      );
    }

    // Get enhanced on-chain metrics
    const enhancedMetrics = await enhancedDataProvider.getEnhancedOnChainMetrics(
      crypto.coinGeckoId,
      priceData.marketCap,
      priceData.price
    );

    if (!enhancedMetrics) {
      return NextResponse.json(
        { error: 'Failed to fetch enhanced metrics' },
        { status: 500 }
      );
    }

    // Save enhanced metrics to database
    try {
      await db.onChainMetric.upsert({
        where: {
          cryptoId_timestamp: {
            cryptoId: crypto.id,
            timestamp: new Date()
          }
        },
        update: {
          mvrv: enhancedMetrics.mvrv,
          nupl: enhancedMetrics.nupl,
          sopr: enhancedMetrics.sopr,
          activeAddresses: enhancedMetrics.activeAddresses,
          exchangeInflow: enhancedMetrics.exchangeInflow,
          exchangeOutflow: enhancedMetrics.exchangeOutflow,
          transactionVolume: enhancedMetrics.transactionVolume,
          whaleHoldingsPercentage: enhancedMetrics.whaleHoldingsPercentage,
          retailHoldingsPercentage: enhancedMetrics.retailHoldingsPercentage,
          exchangeHoldingsPercentage: enhancedMetrics.exchangeHoldingsPercentage,
          networkRevenue: enhancedMetrics.networkRevenue,
          tvl: enhancedMetrics.tvl,
          stablecoinSupply: enhancedMetrics.stablecoinSupply,
          largeTransactionsVolume: enhancedMetrics.largeTransactionsVolume,
          realizedCap: enhancedMetrics.realizedCap,
          dexVolume: enhancedMetrics.dexVolume,
          stakingInflow: enhancedMetrics.stakingInflow,
          validatorCount: enhancedMetrics.validatorCount,
          hashRate: enhancedMetrics.hashRate,
          confidence: enhancedMetrics.confidence,
          source: enhancedMetrics.source
        },
        create: {
          cryptoId: crypto.id,
          timestamp: new Date(),
          mvrv: enhancedMetrics.mvrv,
          nupl: enhancedMetrics.nupl,
          sopr: enhancedMetrics.sopr,
          activeAddresses: enhancedMetrics.activeAddresses,
          exchangeInflow: enhancedMetrics.exchangeInflow,
          exchangeOutflow: enhancedMetrics.exchangeOutflow,
          transactionVolume: enhancedMetrics.transactionVolume,
          whaleHoldingsPercentage: enhancedMetrics.whaleHoldingsPercentage,
          retailHoldingsPercentage: enhancedMetrics.retailHoldingsPercentage,
          exchangeHoldingsPercentage: enhancedMetrics.exchangeHoldingsPercentage,
          networkRevenue: enhancedMetrics.networkRevenue,
          tvl: enhancedMetrics.tvl,
          stablecoinSupply: enhancedMetrics.stablecoinSupply,
          largeTransactionsVolume: enhancedMetrics.largeTransactionsVolume,
          realizedCap: enhancedMetrics.realizedCap,
          dexVolume: enhancedMetrics.dexVolume,
          stakingInflow: enhancedMetrics.stakingInflow,
          validatorCount: enhancedMetrics.validatorCount,
          hashRate: enhancedMetrics.hashRate,
          confidence: enhancedMetrics.confidence,
          source: enhancedMetrics.source
        }
      });

      console.log(`✅ Enhanced metrics saved to database for ${blockchain}`);
    } catch (dbError) {
      console.error('❌ Error saving enhanced metrics to database:', dbError);
    }

    // Calculate rolling averages for key metrics
    const [daaRolling, newAddressesRolling, transactionsRolling, volumeRolling] = await Promise.all([
      rollingCalculator.calculateRollingAverages(crypto.id, 'activeAddresses'),
      rollingCalculator.calculateRollingAverages(crypto.id, 'newAddresses'),
      rollingCalculator.calculateRollingAverages(crypto.id, 'dailyTransactions'),
      rollingCalculator.calculateRollingAverages(crypto.id, 'transactionVolume')
    ]);

    // Get historical data for change calculations
    const historicalData = await db.onChainMetric.findMany({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' },
      take: 2
    });

    const previousData = historicalData.length > 1 ? historicalData[1] : null;

    // Format enhanced usage metrics
    const now = new Date();
    const enhancedUsageMetrics = {
      id: `enhanced-usage-${blockchain}-${timeframe}-${now.getTime()}`,
      blockchain: blockchain as any,
      timeframe: timeframe as any,
      createdAt: now,
      updatedAt: now,
      
      // Enhanced metrics with absolute values and proper structure
      dailyActiveAddresses: {
        value: enhancedMetrics.activeAddresses,
        absoluteValue: enhancedMetrics.activeAddresses,
        formattedValue: formatNumber(enhancedMetrics.activeAddresses),
        change: previousData ? enhancedMetrics.activeAddresses - (previousData.activeAddresses || 0) : 0,
        changePercent: previousData && previousData.activeAddresses ? 
          ((enhancedMetrics.activeAddresses - previousData.activeAddresses) / previousData.activeAddresses) * 100 : 0,
        trend: enhancedMetrics.activeAddresses > (previousData?.activeAddresses || 0) ? 'up' : 
               enhancedMetrics.activeAddresses < (previousData?.activeAddresses || 0) ? 'down' : 'stable',
        timestamp: now,
        previousValue: previousData?.activeAddresses || 0,
        baselineValues: {
          '7d': daaRolling?.rollingAverages['7d'] || enhancedMetrics.activeAddresses,
          '30d': daaRolling?.rollingAverages['30d'] || enhancedMetrics.activeAddresses,
          '90d': daaRolling?.rollingAverages['90d'] || enhancedMetrics.activeAddresses
        },
        confidence: enhancedMetrics.confidence,
        source: enhancedMetrics.source
      },
      
      newAddresses: {
        value: enhancedMetrics.newAddresses,
        absoluteValue: enhancedMetrics.newAddresses,
        formattedValue: formatNumber(enhancedMetrics.newAddresses),
        change: previousData ? enhancedMetrics.newAddresses - (previousData.newAddresses || 0) : 0,
        changePercent: previousData && previousData.newAddresses ? 
          ((enhancedMetrics.newAddresses - previousData.newAddresses) / previousData.newAddresses) * 100 : 0,
        trend: enhancedMetrics.newAddresses > (previousData?.newAddresses || 0) ? 'up' : 
               enhancedMetrics.newAddresses < (previousData?.newAddresses || 0) ? 'down' : 'stable',
        timestamp: now,
        previousValue: previousData?.newAddresses || 0,
        baselineValues: {
          '7d': newAddressesRolling?.rollingAverages['7d'] || enhancedMetrics.newAddresses,
          '30d': newAddressesRolling?.rollingAverages['30d'] || enhancedMetrics.newAddresses,
          '90d': newAddressesRolling?.rollingAverages['90d'] || enhancedMetrics.newAddresses
        },
        confidence: enhancedMetrics.confidence,
        source: enhancedMetrics.source
      },
      
      dailyTransactions: {
        value: enhancedMetrics.dailyTransactions,
        absoluteValue: enhancedMetrics.dailyTransactions,
        formattedValue: formatNumber(enhancedMetrics.dailyTransactions),
        change: previousData ? enhancedMetrics.dailyTransactions - (previousData.dailyTransactions || 0) : 0,
        changePercent: previousData && previousData.dailyTransactions ? 
          ((enhancedMetrics.dailyTransactions - previousData.dailyTransactions) / previousData.dailyTransactions) * 100 : 0,
        trend: enhancedMetrics.dailyTransactions > (previousData?.dailyTransactions || 0) ? 'up' : 
               enhancedMetrics.dailyTransactions < (previousData?.dailyTransactions || 0) ? 'down' : 'stable',
        timestamp: now,
        previousValue: previousData?.dailyTransactions || 0,
        baselineValues: {
          '7d': transactionsRolling?.rollingAverages['7d'] || enhancedMetrics.dailyTransactions,
          '30d': transactionsRolling?.rollingAverages['30d'] || enhancedMetrics.dailyTransactions,
          '90d': transactionsRolling?.rollingAverages['90d'] || enhancedMetrics.dailyTransactions
        },
        confidence: enhancedMetrics.confidence,
        source: enhancedMetrics.source
      },
      
      transactionVolume: {
        value: enhancedMetrics.transactionVolume,
        absoluteValue: enhancedMetrics.transactionVolume,
        formattedValue: formatCurrency(enhancedMetrics.transactionVolume),
        change: previousData ? enhancedMetrics.transactionVolume - (previousData.transactionVolume || 0) : 0,
        changePercent: previousData && previousData.transactionVolume ? 
          ((enhancedMetrics.transactionVolume - previousData.transactionVolume) / previousData.transactionVolume) * 100 : 0,
        trend: enhancedMetrics.transactionVolume > (previousData?.transactionVolume || 0) ? 'up' : 
               enhancedMetrics.transactionVolume < (previousData?.transactionVolume || 0) ? 'down' : 'stable',
        timestamp: now,
        previousValue: previousData?.transactionVolume || 0,
        baselineValues: {
          '7d': volumeRolling?.rollingAverages['7d'] || enhancedMetrics.transactionVolume,
          '30d': volumeRolling?.rollingAverages['30d'] || enhancedMetrics.transactionVolume,
          '90d': volumeRolling?.rollingAverages['90d'] || enhancedMetrics.transactionVolume
        },
        confidence: enhancedMetrics.confidence,
        source: enhancedMetrics.source
      },
      
      // Additional enhanced metrics
      networkRevenue: {
        value: enhancedMetrics.networkRevenue,
        absoluteValue: enhancedMetrics.networkRevenue,
        formattedValue: formatCurrency(enhancedMetrics.networkRevenue),
        change: previousData ? enhancedMetrics.networkRevenue - (previousData.networkRevenue || 0) : 0,
        changePercent: previousData && previousData.networkRevenue ? 
          ((enhancedMetrics.networkRevenue - previousData.networkRevenue) / previousData.networkRevenue) * 100 : 0,
        trend: enhancedMetrics.networkRevenue > (previousData?.networkRevenue || 0) ? 'up' : 
               enhancedMetrics.networkRevenue < (previousData?.networkRevenue || 0) ? 'down' : 'stable',
        timestamp: now,
        previousValue: previousData?.networkRevenue || 0,
        baselineValues: {
          '7d': enhancedMetrics.networkRevenue * 0.95,
          '30d': enhancedMetrics.networkRevenue * 0.9,
          '90d': enhancedMetrics.networkRevenue * 0.85
        },
        confidence: enhancedMetrics.confidence,
        source: enhancedMetrics.source
      },
      
      tvl: {
        value: enhancedMetrics.tvl,
        absoluteValue: enhancedMetrics.tvl,
        formattedValue: formatCurrency(enhancedMetrics.tvl),
        change: previousData ? enhancedMetrics.tvl - (previousData.tvl || 0) : 0,
        changePercent: previousData && previousData.tvl ? 
          ((enhancedMetrics.tvl - previousData.tvl) / previousData.tvl) * 100 : 0,
        trend: enhancedMetrics.tvl > (previousData?.tvl || 0) ? 'up' : 
               enhancedMetrics.tvl < (previousData?.tvl || 0) ? 'down' : 'stable',
        timestamp: now,
        previousValue: previousData?.tvl || 0,
        baselineValues: {
          '7d': enhancedMetrics.tvl * 0.95,
          '30d': enhancedMetrics.tvl * 0.9,
          '90d': enhancedMetrics.tvl * 0.85
        },
        confidence: enhancedMetrics.confidence,
        source: enhancedMetrics.source
      },
      
      // Spike detection for key metrics
      spikeDetection: {
        dailyActiveAddresses: await rollingCalculator.detectSpike(crypto.id, 'activeAddresses'),
        newAddresses: await rollingCalculator.detectSpike(crypto.id, 'newAddresses'),
        dailyTransactions: await rollingCalculator.detectSpike(crypto.id, 'dailyTransactions'),
        transactionVolume: await rollingCalculator.detectSpike(crypto.id, 'transactionVolume')
      },
      
      // Data quality report
      dataQuality: {
        dailyActiveAddresses: await rollingCalculator.getDataQualityReport(crypto.id, 'activeAddresses'),
        newAddresses: await rollingCalculator.getDataQualityReport(crypto.id, 'newAddresses'),
        dailyTransactions: await rollingCalculator.getDataQualityReport(crypto.id, 'dailyTransactions'),
        transactionVolume: await rollingCalculator.getDataQualityReport(crypto.id, 'transactionVolume')
      },
      
      // Metadata
      metadata: {
        dataFreshness: enhancedMetrics.lastUpdated,
        collectionMethod: enhancedMetrics.source,
        confidence: enhancedMetrics.confidence,
        marketCap: priceData.marketCap,
        price: priceData.price,
        priceChange24h: priceData.priceChange24h
      }
    };

    console.log(`✅ Enhanced usage metrics generated for ${blockchain}`);
    return NextResponse.json(enhancedUsageMetrics);
    
  } catch (error) {
    console.error('❌ Error fetching enhanced usage metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enhanced usage metrics', details: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
function formatNumber(value: number): string {
  if (value === 0) return '0';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}

function formatCurrency(value: number): string {
  if (value === 0) return '$0';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
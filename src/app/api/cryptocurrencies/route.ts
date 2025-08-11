import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { CryptoDataService } from '@/lib/crypto-service'

interface AddCoinRequest {
  symbol: string
  name: string
  coinGeckoId: string
  userId?: string
}

interface CoinSearchResponse {
  id: string
  symbol: string
  name: string
  image?: string
  market_cap_rank?: number
}

// GET /api/cryptocurrencies - Lấy danh sách tất cả coins
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('activeOnly') === 'true'
    
    if (search) {
      // Tìm kiếm coin từ CoinGecko API
      const cryptoService = CryptoDataService.getInstance()
      const searchResults = await searchCoins(search)
      return NextResponse.json(searchResults)
    }
    
    // Lấy danh sách coins từ database
    const whereClause = activeOnly ? { isActive: true } : {}
    const cryptocurrencies = await db.cryptocurrency.findMany({
      where: whereClause,
      include: {
        dataCollection: true,
        addedByUser: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { rank: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    
    return NextResponse.json(cryptocurrencies)
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST /api/cryptocurrencies - Thêm coin mới
export async function POST(request: NextRequest) {
  try {
    const body: AddCoinRequest = await request.json()
    const { symbol, name, coinGeckoId, userId } = body
    
    // Validate input
    if (!symbol || !name || !coinGeckoId) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, name, coinGeckoId' },
        { status: 400 }
      )
    }
    
    // Check if coin already exists
    const existingCoin = await db.cryptocurrency.findFirst({
      where: {
        OR: [
          { symbol: symbol.toUpperCase() },
          { coinGeckoId: coinGeckoId.toLowerCase() }
        ]
      }
    })
    
    if (existingCoin) {
      return NextResponse.json(
        { error: 'Coin already exists in the system' },
        { status: 409 }
      )
    }
    
    // Verify coin exists on CoinGecko
    const cryptoService = CryptoDataService.getInstance()
    let coinDetails
    try {
      coinDetails = await cryptoService.getCoinDetails(coinGeckoId.toLowerCase())
    } catch (error) {
      console.warn('CoinGecko validation failed, using fallback data:', error)
      // For development/testing, create coin with fallback data
      coinDetails = {
        image: {
          large: null,
          small: null
        },
        market_cap_rank: null
      }
    }
    
    // Create new cryptocurrency record
    const newCoin = await db.cryptocurrency.create({
      data: {
        symbol: symbol.toUpperCase(),
        name: name,
        coinGeckoId: coinGeckoId.toLowerCase(),
        logo: coinDetails.image?.large || coinDetails.image?.small,
        rank: coinDetails.market_cap_rank,
        isDefault: false,
        addedBy: userId,
        isActive: true
      },
      include: {
        dataCollection: true,
        addedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    // Create data collection record
    await db.coinDataCollection.create({
      data: {
        cryptoId: newCoin.id,
        status: 'PENDING',
        nextCollection: new Date(Date.now() + 5 * 60 * 1000) // Start collection in 5 minutes
      }
    })
    
    // Trigger initial data collection (async)
    triggerDataCollection(newCoin.id).catch(console.error)
    
    return NextResponse.json({
      message: 'Coin added successfully',
      coin: newCoin
    })
    
  } catch (error) {
    console.error('Error adding cryptocurrency:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// Helper function to search coins on CoinGecko
async function searchCoins(query: string): Promise<CoinSearchResponse[]> {
  try {
    const cryptoService = CryptoDataService.getInstance()
    const markets = await cryptoService.getCoinMarkets('usd', 'market_cap_desc', 100, 1)
    
    // Filter by search query
    const filtered = markets.filter((coin: any) => 
      coin.symbol.toLowerCase().includes(query.toLowerCase()) ||
      coin.name.toLowerCase().includes(query.toLowerCase())
    )
    
    // If we found results in top 100, return them
    if (filtered.length > 0) {
      return filtered.slice(0, 10).map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        market_cap_rank: coin.market_cap_rank
      }))
    }
    
    // If no results found in top 100, try CoinGecko search API
    try {
      const searchResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`)
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.coins && searchData.coins.length > 0) {
          // Get detailed info for first 10 results
          const coinIds = searchData.coins.slice(0, 10).map((coin: any) => coin.id)
          const detailsPromises = coinIds.map((id: string) => 
            cryptoService.getCoinDetails(id).catch(() => null)
          )
          const detailsResults = await Promise.all(detailsPromises)
          
          return detailsResults
            .filter((detail): detail is any => detail !== null)
            .map((coin: any) => ({
              id: coin.id,
              symbol: coin.symbol.toUpperCase(),
              name: coin.name,
              image: coin.image?.large || coin.image?.small,
              market_cap_rank: coin.market_cap_rank
            }))
        }
      }
    } catch (searchError) {
      console.warn('CoinGecko search API failed, continuing with fallback:', searchError)
    }
    
    // If still no results, use fallback
    throw new Error('No results found from CoinGecko APIs')
  } catch (error) {
    console.error('Error searching coins from CoinGecko, using fallback:', error)
    
    // Fallback: search from database and provide some popular coins
    try {
      // Search from database first
      const dbCoins = await db.cryptocurrency.findMany({
        where: {
          OR: [
            { symbol: { contains: query.toUpperCase() } },
            { name: { contains: query } },
            { coinGeckoId: { contains: query.toLowerCase() } }
          ]
        },
        take: 5
      })
      
      const dbResults = dbCoins.map(coin => ({
        id: coin.coinGeckoId,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.logo,
        market_cap_rank: coin.rank
      }))
      
      // Add some popular coins for testing if no results found
      if (dbResults.length === 0) {
        const popularCoins = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: null, market_cap_rank: 1 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: null, market_cap_rank: 2 },
          { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', image: null, market_cap_rank: 3 },
          { id: 'solana', symbol: 'SOL', name: 'Solana', image: null, market_cap_rank: 4 },
          { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: null, market_cap_rank: 5 },
          { id: 'ripple', symbol: 'XRP', name: 'Ripple', image: null, market_cap_rank: 6 },
          { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', image: null, market_cap_rank: 7 },
          { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: null, market_cap_rank: 8 },
          { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: null, market_cap_rank: 9 },
          { id: 'polygon', symbol: 'MATIC', name: 'Polygon', image: null, market_cap_rank: 10 },
          { id: 'ethena', symbol: 'ENA', name: 'Ethena', image: null, market_cap_rank: null }
        ]
        
        const filteredPopular = popularCoins.filter(coin =>
          coin.symbol.toLowerCase().includes(query.toLowerCase()) ||
          coin.name.toLowerCase().includes(query.toLowerCase()) ||
          coin.id.toLowerCase().includes(query.toLowerCase())
        )
        
        return filteredPopular.slice(0, 5)
      }
      
      return dbResults
    } catch (dbError) {
      console.error('Error searching from database:', dbError)
      return []
    }
  }
}

// Helper function to trigger data collection
export async function triggerDataCollection(cryptoId: string) {
  try {
    // Update status to collecting
    await db.coinDataCollection.update({
      where: { cryptoId },
      data: { 
        status: 'COLLECTING',
        lastCollected: new Date()
      }
    })
    
    // Get cryptocurrency details
    const crypto = await db.cryptocurrency.findUnique({
      where: { id: cryptoId }
    })
    
    if (!crypto) {
      throw new Error('Cryptocurrency not found')
    }
    
    // Collect data using CryptoDataService
    const cryptoService = CryptoDataService.getInstance()
    const completeData = await cryptoService.getCompleteCryptoData(crypto.coinGeckoId)
    
    // Save price history
    await db.priceHistory.create({
      data: {
        cryptoId,
        timestamp: new Date(),
        price: completeData.price.usd,
        volume24h: completeData.price.usd_24h_vol,
        marketCap: completeData.price.usd_market_cap,
        priceChange24h: completeData.price.usd_24h_change
      }
    })
    
    // Save on-chain metrics
    await db.onChainMetric.create({
      data: {
        cryptoId,
        timestamp: new Date(),
        mvrv: completeData.onChain.mvrv,
        nupl: completeData.onChain.nupl,
        sopr: completeData.onChain.sopr,
        activeAddresses: completeData.onChain.activeAddresses,
        exchangeInflow: completeData.onChain.exchangeInflow,
        exchangeOutflow: completeData.onChain.exchangeOutflow,
        transactionVolume: completeData.onChain.transactionVolume,
        whaleHoldingsPercentage: completeData.onChain.whaleHoldingsPercentage,
        retailHoldingsPercentage: completeData.onChain.retailHoldingsPercentage,
        exchangeHoldingsPercentage: completeData.onChain.exchangeHoldingsPercentage,
        supplyDistribution: completeData.onChain.supplyDistribution
      }
    })
    
    // Save technical indicators
    await db.technicalIndicator.create({
      data: {
        cryptoId,
        timestamp: new Date(),
        rsi: completeData.technical.rsi,
        ma50: completeData.technical.ma50,
        ma200: completeData.technical.ma200,
        macd: completeData.technical.macd,
        bollingerUpper: completeData.technical.bollingerUpper,
        bollingerLower: completeData.technical.bollingerLower,
        bollingerMiddle: completeData.technical.bollingerMiddle
      }
    })
    
    // Save derivative metrics
    await db.derivativeMetric.create({
      data: {
        cryptoId,
        timestamp: new Date(),
        openInterest: completeData.derivatives.openInterest,
        fundingRate: completeData.derivatives.fundingRate,
        liquidationVolume: completeData.derivatives.liquidationVolume,
        putCallRatio: completeData.derivatives.putCallRatio
      }
    })
    
    // Update collection status to completed
    await db.coinDataCollection.update({
      where: { cryptoId },
      data: { 
        status: 'COMPLETED',
        lastCollected: new Date(),
        nextCollection: new Date(Date.now() + 60 * 60 * 1000), // Next collection in 1 hour
        errorCount: 0,
        lastError: null
      }
    })
    
    console.log(`Data collection completed for ${crypto.symbol}`)
    
  } catch (error) {
    console.error('Error in data collection:', error)
    
    // Update collection status to failed
    await db.coinDataCollection.update({
      where: { cryptoId },
      data: { 
        status: 'FAILED',
        lastError: error instanceof Error ? error.message : String(error),
        errorCount: {
          increment: 1
        }
      }
    })
  }
}
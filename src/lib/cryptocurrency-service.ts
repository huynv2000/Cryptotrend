import { db } from './db'

export interface Cryptocurrency {
  id: string
  symbol: string
  name: string
  coinGeckoId: string
  logo?: string
  rank?: number
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export class CryptocurrencyService {
  static async getAllActiveCryptocurrencies(): Promise<Cryptocurrency[]> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany({
        where: { isActive: true },
        orderBy: [
          { isDefault: 'desc' },
          { rank: 'asc' },
          { createdAt: 'desc' }
        ]
      })
      return cryptocurrencies
    } catch (error) {
      console.error('Error fetching active cryptocurrencies:', error)
      return []
    }
  }

  static async getCryptocurrencyById(id: string): Promise<Cryptocurrency | null> {
    try {
      const cryptocurrency = await db.cryptocurrency.findUnique({
        where: { id }
      })
      return cryptocurrency
    } catch (error) {
      console.error('Error fetching cryptocurrency by ID:', error)
      return null
    }
  }

  static async getCryptocurrencyBySymbol(symbol: string): Promise<Cryptocurrency | null> {
    try {
      const cryptocurrency = await db.cryptocurrency.findFirst({
        where: { symbol: symbol.toUpperCase() }
      })
      return cryptocurrency
    } catch (error) {
      console.error('Error fetching cryptocurrency by symbol:', error)
      return null
    }
  }

  static async getCryptocurrencyByCoinGeckoId(coinGeckoId: string): Promise<Cryptocurrency | null> {
    try {
      const cryptocurrency = await db.cryptocurrency.findUnique({
        where: { coinGeckoId: coinGeckoId.toLowerCase() }
      })
      return cryptocurrency
    } catch (error) {
      console.error('Error fetching cryptocurrency by CoinGecko ID:', error)
      return null
    }
  }

  static async createCryptocurrency(data: {
    symbol: string
    name: string
    coinGeckoId: string
    logo?: string
    rank?: number
    isDefault?: boolean
    isActive?: boolean
    addedBy?: string
  }): Promise<Cryptocurrency> {
    try {
      const cryptocurrency = await db.cryptocurrency.create({
        data: {
          symbol: data.symbol.toUpperCase(),
          name: data.name,
          coinGeckoId: data.coinGeckoId.toLowerCase(),
          logo: data.logo,
          rank: data.rank,
          isDefault: data.isDefault || false,
          isActive: data.isActive ?? true,
          addedBy: data.addedBy
        }
      })
      return cryptocurrency
    } catch (error) {
      console.error('Error creating cryptocurrency:', error)
      throw error
    }
  }

  static async updateCryptocurrency(id: string, data: {
    symbol?: string
    name?: string
    coinGeckoId?: string
    logo?: string
    rank?: number
    isActive?: boolean
  }): Promise<Cryptocurrency> {
    try {
      const cryptocurrency = await db.cryptocurrency.update({
        where: { id },
        data: {
          ...(data.symbol && { symbol: data.symbol.toUpperCase() }),
          ...(data.name && { name: data.name }),
          ...(data.coinGeckoId && { coinGeckoId: data.coinGeckoId.toLowerCase() }),
          ...(data.logo !== undefined && { logo: data.logo }),
          ...(data.rank !== undefined && { rank: data.rank }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          updatedAt: new Date()
        }
      })
      return cryptocurrency
    } catch (error) {
      console.error('Error updating cryptocurrency:', error)
      throw error
    }
  }

  static async deleteCryptocurrency(id: string): Promise<void> {
    try {
      await db.cryptocurrency.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Error deleting cryptocurrency:', error)
      throw error
    }
  }

  static async getCoinGeckoIds(): Promise<string[]> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany({
        where: { isActive: true },
        select: { coinGeckoId: true }
      })
      return cryptocurrencies.map(c => c.coinGeckoId)
    } catch (error) {
      console.error('Error fetching CoinGecko IDs:', error)
      return []
    }
  }

  static async getSymbols(): Promise<string[]> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany({
        where: { isActive: true },
        select: { symbol: true }
      })
      return cryptocurrencies.map(c => c.symbol)
    } catch (error) {
      console.error('Error fetching symbols:', error)
      return []
    }
  }
}
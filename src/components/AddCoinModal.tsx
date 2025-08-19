'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Plus, Loader2 } from 'lucide-react'

interface CoinSearchResult {
  id: string
  symbol: string
  name: string
  image?: string
  market_cap_rank?: number
}

interface AddCoinModalProps {
  isOpen: boolean
  onClose: () => void
  onCoinAdded: (coin: any) => void
  userId?: string
}

export function AddCoinModal({ isOpen, onClose, onCoinAdded, userId }: AddCoinModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CoinSearchResult[]>([])
  const [selectedCoin, setSelectedCoin] = useState<CoinSearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [customSymbol, setCustomSymbol] = useState('')
  const [customName, setCustomName] = useState('')

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchCoins(searchQuery)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchCoins = async (query: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/cryptocurrencies?search=${encodeURIComponent(query)}`)
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      }
    } catch (error) {
      console.error('Error searching coins:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddCoin = async () => {
    if (!selectedCoin) return

    setIsAdding(true)
    try {
      const response = await fetch('/api/cryptocurrencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: customSymbol || selectedCoin.symbol,
          name: customName || selectedCoin.name,
          coinGeckoId: selectedCoin.id,
          userId
        })
      })

      if (response.ok) {
        const result = await response.json()
        onCoinAdded(result.coin)
        onClose()
        // Reset form
        setSelectedCoin(null)
        setCustomSymbol('')
        setCustomName('')
        setSearchQuery('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add coin')
      }
    } catch (error) {
      console.error('Error adding coin:', error)
      alert('Failed to add coin')
    } finally {
      setIsAdding(false)
    }
  }

  const handleCoinSelect = (coin: CoinSearchResult) => {
    setSelectedCoin(coin)
    setCustomSymbol(coin.symbol)
    setCustomName(coin.name)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm Coin Mới</DialogTitle>
          <DialogDescription>
            Tìm kiếm và thêm các đồng coin mới vào hệ thống để phân tích
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-2">
            <Label htmlFor="search">Tìm kiếm coin</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Nhập tên hoặc symbol coin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-600">Đang tìm kiếm...</span>
            </div>
          )}

          {searchResults.length > 0 && !selectedCoin && (
            <div className="space-y-2">
              <Label>Kết quả tìm kiếm</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {searchResults.map((coin) => (
                  <Card 
                    key={coin.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleCoinSelect(coin)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        {coin.image && (
                          <img 
                            src={coin.image} 
                            alt={coin.name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{coin.name}</span>
                            <Badge variant="secondary">{coin.symbol}</Badge>
                            {coin.market_cap_rank && (
                              <Badge variant="outline">#{coin.market_cap_rank}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{coin.id}</div>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Selected Coin Details */}
          {selectedCoin && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedCoin.image && (
                    <img 
                      src={selectedCoin.image} 
                      alt={selectedCoin.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{selectedCoin.name}</h3>
                    <p className="text-sm text-gray-500">{selectedCoin.symbol} • {selectedCoin.id}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedCoin(null)
                    setCustomSymbol('')
                    setCustomName('')
                  }}
                >
                  Thay đổi
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    placeholder="Symbol coin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Tên đầy đủ</Label>
                  <Input
                    id="name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Tên đầy đủ của coin"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            onClick={handleAddCoin}
            disabled={!selectedCoin || !customSymbol || !customName || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang thêm...
              </>
            ) : (
              'Thêm Coin'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
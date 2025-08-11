'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AddCoinModal } from '@/components/AddCoinModal'
import { 
  Plus, 
  Settings, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Database,
  TrendingUp
} from 'lucide-react'

interface Cryptocurrency {
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
  dataCollection?: {
    id: string
    status: 'PENDING' | 'COLLECTING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
    lastCollected?: string
    nextCollection?: string
    errorCount: number
    lastError?: string
  }
  addedByUser?: {
    id: string
    name?: string
    email: string
  }
}

interface CoinManagementPanelProps {
  userId?: string
}

export function CoinManagementPanel({ userId }: CoinManagementPanelProps) {
  const [coins, setCoins] = useState<Cryptocurrency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [updatingCoins, setUpdatingCoins] = useState<Set<string>>(new Set())
  const [collectingCoins, setCollectingCoins] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCoins()
  }, [])

  const loadCoins = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cryptocurrencies')
      if (response.ok) {
        const data = await response.json()
        setCoins(data)
      }
    } catch (error) {
      console.error('Error loading coins:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (coinId: string, isActive: boolean) => {
    setUpdatingCoins(prev => new Set(prev).add(coinId))
    try {
      const response = await fetch(`/api/cryptocurrencies/${coinId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        await loadCoins()
      } else {
        alert('Failed to update coin status')
      }
    } catch (error) {
      console.error('Error updating coin:', error)
      alert('Failed to update coin status')
    } finally {
      setUpdatingCoins(prev => {
        const newSet = new Set(prev)
        newSet.delete(coinId)
        return newSet
      })
    }
  }

  const handleDeleteCoin = async (coinId: string) => {
    if (!confirm('Are you sure you want to delete this coin? This action cannot be undone.')) {
      return
    }

    setUpdatingCoins(prev => new Set(prev).add(coinId))
    try {
      const response = await fetch(`/api/cryptocurrencies/${coinId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadCoins()
      } else {
        alert('Failed to delete coin')
      }
    } catch (error) {
      console.error('Error deleting coin:', error)
      alert('Failed to delete coin')
    } finally {
      setUpdatingCoins(prev => {
        const newSet = new Set(prev)
        newSet.delete(coinId)
        return newSet
      })
    }
  }

  const handleCollectData = async (coinId: string) => {
    setCollectingCoins(prev => new Set(prev).add(coinId))
    try {
      const response = await fetch(`/api/cryptocurrencies/${coinId}/collect-data`, {
        method: 'POST'
      })

      if (response.ok) {
        await loadCoins()
      } else {
        alert('Failed to trigger data collection')
      }
    } catch (error) {
      console.error('Error triggering data collection:', error)
      alert('Failed to trigger data collection')
    } finally {
      setCollectingCoins(prev => {
        const newSet = new Set(prev)
        newSet.delete(coinId)
        return newSet
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'COLLECTING':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'RETRYING':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'COLLECTING':
        return 'bg-blue-100 text-blue-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'RETRYING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('vi-VN')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2">Loading coins...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quản lý Coin
              </CardTitle>
              <CardDescription>
                Thêm, xóa và quản lý các đồng coin trong hệ thống phân tích
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm Coin Mới
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Tổng Coins</p>
                <p className="text-2xl font-bold">{coins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{coins.filter(c => c.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Data Ready</p>
                <p className="text-2xl font-bold">
                  {coins.filter(c => c.dataCollection?.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Need Attention</p>
                <p className="text-2xl font-bold">
                  {coins.filter(c => c.dataCollection?.status === 'FAILED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Coin</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coin</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Data Collection</TableHead>
                <TableHead>Ngày thêm</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coins.map((coin) => (
                <TableRow key={coin.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {coin.logo && (
                        <img 
                          src={coin.logo} 
                          alt={coin.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{coin.name}</span>
                          <Badge variant={coin.isDefault ? "default" : "secondary"}>
                            {coin.symbol}
                          </Badge>
                          {coin.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{coin.coinGeckoId}</div>
                        {coin.addedByUser && (
                          <div className="text-xs text-gray-400">
                            Added by {coin.addedByUser.name || coin.addedByUser.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={coin.isActive}
                        onCheckedChange={(checked) => handleToggleActive(coin.id, checked)}
                        disabled={coin.isDefault || updatingCoins.has(coin.id)}
                      />
                      <Badge variant={coin.isActive ? "default" : "secondary"}>
                        {coin.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {coin.dataCollection ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(coin.dataCollection.status)}
                          <Badge className={getStatusColor(coin.dataCollection.status)}>
                            {coin.dataCollection.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last: {formatDateTime(coin.dataCollection.lastCollected)}
                        </div>
                        {coin.dataCollection.errorCount > 0 && (
                          <div className="text-xs text-red-600">
                            Errors: {coin.dataCollection.errorCount}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No data</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(coin.createdAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCollectData(coin.id)}
                        disabled={collectingCoins.has(coin.id)}
                      >
                        {collectingCoins.has(coin.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {!coin.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCoin(coin.id)}
                          disabled={updatingCoins.has(coin.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          {updatingCoins.has(coin.id) ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Coin Modal */}
      <AddCoinModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCoinAdded={loadCoins}
        userId={userId}
      />
    </div>
  )
}
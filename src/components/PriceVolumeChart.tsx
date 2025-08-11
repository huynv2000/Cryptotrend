'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PriceVolumeChartProps {
  cryptoId: string
  cryptoName: string
  currentPrice: number
}

interface ChartData {
  date: string
  price: number
  volume: number
  movingAverage: number
}

export default function PriceVolumeChart({ cryptoId, cryptoName, currentPrice }: PriceVolumeChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    generateChartData()
  }, [timeRange, currentPrice])

  const generateChartData = () => {
    const data: ChartData[] = []
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let basePrice = currentPrice
    let prevPrice = basePrice

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      // Generate realistic price fluctuations
      const priceChange = (Math.random() - 0.5) * (basePrice * 0.05) // 5% max change
      basePrice = Math.max(basePrice * 0.8, Math.min(basePrice * 1.2, basePrice + priceChange))

      // Generate volume (inverse correlation with price stability)
      const priceVolatility = Math.abs(basePrice - prevPrice) / prevPrice
      const baseVolume = 1000000000 + Math.random() * 2000000000
      const volume = baseVolume * (1 + priceVolatility * 10) // Higher volume with higher volatility

      // Calculate moving average
      const movingAverage = i >= 4 
        ? data.slice(Math.max(0, i - 4), i).reduce((sum, item) => sum + item.price, 0) / Math.min(5, i)
        : basePrice

      prevPrice = basePrice

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: Math.round(basePrice),
        volume: Math.round(volume),
        movingAverage: Math.round(movingAverage)
      })
    }

    setChartData(data)
    setLoading(false)
  }

  const formatVolume = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${(value / 1000).toFixed(0)}K`
  }

  const formatPrice = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{cryptoName} Price & Volume Chart</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              📊 {cryptoName} Price & Volume Chart
            </CardTitle>
            <CardDescription>
              Current Price: {formatPrice(currentPrice)}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#666' }}
                interval={Math.floor(chartData.length / 8)}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                stroke="#666"
                tickFormatter={formatVolume}
                tick={{ fill: '#666' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#666"
                tickFormatter={formatPrice}
                tick={{ fill: '#666' }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'volume') {
                    return [formatVolume(Number(value)), 'Volume']
                  } else if (name === 'price') {
                    return [formatPrice(Number(value)), 'Price']
                  } else if (name === 'movingAverage') {
                    return [formatPrice(Number(value)), 'MA 5 days']
                  }
                  return [value, name]
                }}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="volume" 
                name="Volume" 
                fill="#3b82f6" 
                opacity={0.7}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="price" 
                name="Price" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="movingAverage" 
                name="MA 5 days" 
                stroke="#f97316" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Chart Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Current Price</div>
            <div className="text-lg font-bold text-green-600">
              {formatPrice(currentPrice)}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Avg Volume</div>
            <div className="text-lg font-bold text-blue-600">
              {chartData.length > 0 ? formatVolume(chartData.reduce((sum, d) => sum + d.volume, 0) / chartData.length) : 'N/A'}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Price Range</div>
            <div className="text-lg font-bold text-purple-600">
              {chartData.length > 0 ? 
                `${formatPrice(Math.min(...chartData.map(d => d.price)))} - ${formatPrice(Math.max(...chartData.map(d => d.price)))}` 
                : 'N/A'
              }
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Trend</div>
            <div className="text-lg font-bold">
              <Badge className={chartData.length > 1 && chartData[chartData.length - 1].price > chartData[0].price ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                {chartData.length > 1 && chartData[chartData.length - 1].price > chartData[0].price ? 'Up' : 'Down'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
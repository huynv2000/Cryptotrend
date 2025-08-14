"use client"

import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

interface ChartDataItem {
  date: string
  volume: number
  avg30d: number
  price: number
}

export default function SimpleChartPage() {
  const [chartData, setChartData] = useState<ChartDataItem[]>([])

  useEffect(() => {
    // Fetch real chart data instead of generating mock data
    const fetchChartData = async () => {
      try {
        // For now, set empty data to avoid showing mock data
        // In production, this would fetch real volume and price data from the database
        setChartData([])
      } catch (error) {
        console.error('Error fetching chart data:', error)
        setChartData([])
      }
    }

    fetchChartData()
  }, [])

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(0)}M`
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(0)}K`
    return `$${volume.toFixed(0)}`
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Biểu đồ Khối lượng giao dịch với Đường trung bình động 30 ngày</h1>
        <p className="text-gray-600">Phân tích khối lượng giao dịch 90 ngày với đường trung bình động 30 ngày</p>
        
        {/* Volume Analysis Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatVolume(chartData[chartData.length - 1]?.volume || 0)}</div>
              <div className="text-sm text-gray-600">Khối lượng hiện tại</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatVolume(chartData[chartData.length - 1]?.avg30d || 0)}</div>
              <div className="text-sm text-gray-600">Trung bình 30 ngày</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                +15.2%
              </div>
              <div className="text-sm text-gray-600">so với TB 30 ngày</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  HIGH
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Xu hướng increasing
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="h-[600px]">
            <div className="grid grid-cols-1 gap-6 h-full">
              {/* Volume with Moving Average Chart */}
              <div className="h-[280px]">
                <div className="text-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Khối lượng giao dịch với Đường trung bình động 30 ngày</h3>
                </div>
                <ResponsiveContainer width="100%" height="calc(100% - 40px)">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#666' }}
                      interval={Math.ceil(chartData.length / 6)}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      stroke="#666"
                    />
                    <YAxis 
                      yAxisId="volume"
                      orientation="left"
                      tick={{ fontSize: 11, fill: '#666' }}
                      tickFormatter={formatVolume}
                      stroke="#666"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        fontSize: '12px'
                      }}
                      formatter={(value, name) => {
                        if (name === 'volume') return [formatVolume(Number(value)), 'Khối lượng']
                        return [formatVolume(Number(value)), 'TB 30 ngày']
                      }}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{
                        fontSize: '11px'
                      }}
                    />
                    <Bar 
                      yAxisId="volume"
                      dataKey="volume" 
                      fill="#2563eb" 
                      name="Volume"
                      opacity={0.7}
                      radius={[2, 2, 0, 0]}
                    />
                    <Line 
                      yAxisId="volume"
                      type="monotone" 
                      dataKey="avg30d" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      name="30-Day Average"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Volume with Price Chart */}
              <div className="h-[280px]">
                <div className="text-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-700">Khối lượng giao dịch với Giá</h3>
                </div>
                <ResponsiveContainer width="100%" height="calc(100% - 40px)">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#666' }}
                      interval={Math.ceil(chartData.length / 6)}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      stroke="#666"
                    />
                    <YAxis 
                      yAxisId="volume"
                      orientation="left"
                      tick={{ fontSize: 11, fill: '#666' }}
                      tickFormatter={formatVolume}
                      stroke="#666"
                    />
                    <YAxis 
                      yAxisId="price"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#10b981' }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      stroke="#10b981"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        fontSize: '12px'
                      }}
                      formatter={(value, name) => {
                        if (name === 'volume') return [formatVolume(Number(value)), 'Khối lượng']
                        if (name === 'price') {
                          return [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Giá']
                        }
                        return [value, name]
                      }}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{
                        fontSize: '11px'
                      }}
                    />
                    <Bar 
                      yAxisId="volume"
                      dataKey="volume" 
                      fill="#2563eb" 
                      name="Volume"
                      opacity={0.7}
                      radius={[2, 2, 0, 0]}
                    />
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="price" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Price"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
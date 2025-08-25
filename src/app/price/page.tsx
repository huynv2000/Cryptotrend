'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PriceData {
  date: string;
  price: number;
  volume: number;
  movingAverage: number;
  priceChange: number;
  high: number;
  low: number;
}

interface PriceMetrics {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  avgPrice: number;
  volatility: number;
  priceTrend: string;
  supportLevel: number;
  resistanceLevel: number;
}

export default function PriceAnalysis() {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [metrics, setMetrics] = useState<PriceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real price data from API instead of generating mock data
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        // For now, set empty data to avoid showing mock data
        // In production, this would fetch real price data from the database
        setPriceData([]);
        setMetrics(null);
      } catch (error) {
        console.error('Error fetching price data:', error);
        setPriceData([]);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, []);

  const getTrendColor = (trend: string) => {
    return trend === 'Tăng' ? 'text-green-600' : 'text-red-600';
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu giá...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Price Analysis
              </h1>
              <p className="text-gray-600 mt-1">
                Phân tích giá và xu hướng thị trường
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/">
                <Button variant="outline">← Quay lại Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giá hiện tại</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">💰</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics?.currentPrice.toLocaleString()}
              </div>
              <p className={`text-xs ${getChangeColor(metrics?.priceChange || 0)}`}>
                {(metrics?.priceChange || 0) >= 0 ? '+' : ''}{(metrics?.priceChange || 0).toLocaleString()} ({metrics?.priceChangePercent || 0}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giá trung bình</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📊</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics?.avgPrice.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Trung bình 90 ngày
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Biến động</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📈</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics?.volatility.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Độ biến động giá
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Xu hướng</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📉</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getTrendColor(metrics?.priceTrend || '')}`}>
                {metrics?.priceTrend}
              </div>
              <p className="text-xs text-muted-foreground">
                45 ngày gần nhất
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Price Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Biểu đồ giá 90 ngày</CardTitle>
            <CardDescription>
              Phân tích giá với đường trung bình động 30 ngày
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={priceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    interval={Math.floor(priceData.length / 8)}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#666"
                    domain={[35000, 60000]}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#666"
                    domain={[0, 1200000000]}
                    tickFormatter={(value) => `$${(value / 1000000000).toFixed(1)}B`}
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'volume') {
                        return [`$${(Number(value) / 1000000000).toFixed(2)}B`, 'Khối lượng'];
                      } else if (name === 'price') {
                        return [`$${Number(value).toLocaleString()}`, 'Giá'];
                      } else if (name === 'movingAverage') {
                        return [`$${Number(value).toLocaleString()}`, 'MA 30 ngày'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Ngày: ${label}`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="right" 
                    dataKey="volume" 
                    name="Khối lượng" 
                    fill="#3b82f6" 
                    opacity={0.3}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="price" 
                    name="Giá" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="movingAverage" 
                    name="MA 30 ngày" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Price Range and Support/Resistance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Mức hỗ trợ và kháng cự</CardTitle>
              <CardDescription>
                Các mức giá quan trọng cần theo dõi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium text-red-800">Kháng cự</div>
                    <div className="text-sm text-red-600">Mức giá bán mạnh</div>
                  </div>
                  <div className="text-xl font-bold text-red-800">
                    ${metrics?.resistanceLevel.toLocaleString()}
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-green-800">Hỗ trợ</div>
                    <div className="text-sm text-green-600">Mức giá mua mạnh</div>
                  </div>
                  <div className="text-xl font-bold text-green-800">
                    ${metrics?.supportLevel.toLocaleString()}
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-800">Giá hiện tại</div>
                    <div className="text-sm text-blue-600">Giá thị trường</div>
                  </div>
                  <div className="text-xl font-bold text-blue-800">
                    ${metrics?.currentPrice.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê giá</CardTitle>
              <CardDescription>
                Các chỉ số quan trọng về biến động giá
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Giá cao nhất</span>
                  <span className="font-medium text-green-600">
                    ${metrics?.highPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Giá thấp nhất</span>
                  <span className="font-medium text-red-600">
                    ${metrics?.lowPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Giá trung bình</span>
                  <span className="font-medium">
                    ${metrics?.avgPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Biến động giá</span>
                  <span className="font-medium">
                    ${metrics?.volatility.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Xu hướng giá</span>
                  <Badge className={metrics?.priceTrend === 'Tăng' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                    {metrics?.priceTrend}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Analysis Summary */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Tổng quan phân tích giá</CardTitle>
            <CardDescription>
              Nhận định về biến động giá và xu hướng thị trường
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Phân tích kỹ thuật</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• Giá hiện tại: ${metrics?.currentPrice.toLocaleString()} ({(metrics?.priceChangePercent || 0) >= 0 ? '+' : ''}{metrics?.priceChangePercent || 0}% so với đầu kỳ)</p>
                  <p>• Xu hướng giá {metrics?.priceTrend?.toLowerCase() || 'không xác định'} trong 45 ngày gần nhất</p>
                  <p>• Mức kháng cự quan trọng: ${metrics?.resistanceLevel?.toLocaleString() || 'không xác định'}</p>
                  <p>• Mức hỗ trợ quan trọng: ${metrics?.supportLevel?.toLocaleString() || 'không xác định'}</p>
                  <p>• Độ biến động giá: ${metrics?.volatility?.toLocaleString() || 'không xác định'} (độ rủi ro trung bình)</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Nhận định thị trường</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• Giá đang {(metrics?.currentPrice || 0) > (metrics?.avgPrice || 0) ? 'trên' : 'dưới'} mức trung bình 90 ngày</p>
                  <p>• Biến động giá ở mức {(metrics?.volatility || 0) > 2000 ? 'cao' : (metrics?.volatility || 0) > 1000 ? 'trung bình' : 'thấp'}</p>
                  <p>• Cần theo dõi các mức {metrics?.resistanceLevel?.toLocaleString() || 'không xác định'} (kháng cự) và {metrics?.supportLevel?.toLocaleString() || 'không xác định'} (hỗ trợ)</p>
                  <p>• Xu hướng {metrics?.priceTrend?.toLowerCase() || 'không xác định'} có thể tiếp tục nếu có khối lượng xác nhận</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
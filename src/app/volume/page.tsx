'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface VolumeData {
  date: string;
  volume: number;
  price: number;
  movingAverage: number;
  volumeChange: number;
}

interface VolumeMetrics {
  totalVolume: number;
  avgVolume: number;
  maxVolume: number;
  minVolume: number;
  volumeTrend: string;
  volumeSignal: string;
}

export default function VolumeAnalysis() {
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [metrics, setMetrics] = useState<VolumeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate sample data for 90 days
    const generateData = () => {
      const data: VolumeData[] = [];
      const startDate = new Date('2025-05-08');
      
      let basePrice = 45000;
      let baseVolume = 800000000;
      let prevVolume = baseVolume;
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Generate realistic price fluctuations
        const priceChange = (Math.random() - 0.5) * 2000;
        basePrice = Math.max(35000, Math.min(60000, basePrice + priceChange));
        
        // Generate volume with some correlation to price changes
        const volumeMultiplier = 0.8 + Math.random() * 0.4;
        const volume = baseVolume * volumeMultiplier;
        
        // Calculate volume change
        const volumeChange = ((volume - prevVolume) / prevVolume) * 100;
        prevVolume = volume;
        
        // Calculate 30-day moving average
        const movingAverage = i >= 29 
          ? data.slice(i - 29, i).reduce((sum, item) => sum + item.price, 0) / 30
          : basePrice;
        
        data.push({
          date: date.toLocaleDateString('vi-VN'),
          price: Math.round(basePrice),
          volume: Math.round(volume),
          movingAverage: Math.round(movingAverage),
          volumeChange: Math.round(volumeChange * 100) / 100
        });
      }
      
      return data;
    };

    const calculateMetrics = (data: VolumeData[]): VolumeMetrics => {
      const volumes = data.map(d => d.volume);
      const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
      const avgVolume = totalVolume / volumes.length;
      const maxVolume = Math.max(...volumes);
      const minVolume = Math.min(...volumes);
      
      // Calculate volume trend
      const firstHalf = volumes.slice(0, 45).reduce((sum, vol) => sum + vol, 0) / 45;
      const secondHalf = volumes.slice(45).reduce((sum, vol) => sum + vol, 0) / 45;
      const volumeTrend = secondHalf > firstHalf ? 'Tăng' : 'Giảm';
      
      // Generate volume signal
      const recentVolume = volumes.slice(-7).reduce((sum, vol) => sum + vol, 0) / 7;
      const volumeSignal = recentVolume > avgVolume * 1.2 ? 'Cao' : recentVolume < avgVolume * 0.8 ? 'Thấp' : 'Trung bình';
      
      return {
        totalVolume,
        avgVolume: Math.round(avgVolume),
        maxVolume,
        minVolume,
        volumeTrend,
        volumeSignal
      };
    };

    const data = generateData();
    const volumeMetrics = calculateMetrics(data);
    
    setVolumeData(data);
    setMetrics(volumeMetrics);
    setLoading(false);
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'Cao': return 'bg-green-500 text-white';
      case 'Thấp': return 'bg-red-500 text-white';
      case 'Trung bình': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTrendColor = (trend: string) => {
    return trend === 'Tăng' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu khối lượng...</p>
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
                Volume Analysis
              </h1>
              <p className="text-gray-600 mt-1">
                Phân tích khối lượng giao dịch chuyên sâu
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
              <CardTitle className="text-sm font-medium">Tổng khối lượng</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📊</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(metrics?.totalVolume ? metrics.totalVolume / 1000000000 : 0).toFixed(2)}B
              </div>
              <p className="text-xs text-muted-foreground">
                90 ngày gần nhất
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Khối lượng TB</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📈</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(metrics?.avgVolume ? metrics.avgVolume / 1000000000 : 0).toFixed(2)}B
              </div>
              <p className="text-xs text-muted-foreground">
                Trung bình 90 ngày
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Xu hướng</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📉</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getTrendColor(metrics?.volumeTrend || '')}`}>
                {metrics?.volumeTrend}
              </div>
              <p className="text-xs text-muted-foreground">
                45 ngày gần nhất
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tín hiệu</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">🚨</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge className={getSignalColor(metrics?.volumeSignal || '')}>
                  {metrics?.volumeSignal}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                So với trung bình
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Volume Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Biểu đồ khối lượng giao dịch 90 ngày</CardTitle>
            <CardDescription>
              Phân tích khối lượng giao dịch với đường trung bình động 30 ngày
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volumeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    interval={Math.floor(volumeData.length / 8)}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#666"
                    domain={[0, 1200000000]}
                    tickFormatter={(value) => `$${(value / 1000000000).toFixed(1)}B`}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#666"
                    domain={[0, 60000]}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip 
                    formatter={(value) => {
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
                    yAxisId="left" 
                    dataKey="volume" 
                    name="Khối lượng" 
                    fill="#3b82f6" 
                    opacity={0.7}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="price" 
                    name="Giá" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    yAxisId="right" 
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

        {/* Volume Change Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Biểu đồ thay đổi khối lượng</CardTitle>
              <CardDescription>
                Tỷ lệ thay đổi khối lượng giao dịch hàng ngày (%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#666' }}
                      interval={Math.floor(volumeData.length / 6)}
                    />
                    <YAxis 
                      stroke="#666"
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: '#666' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Thay đổi khối lượng']}
                      labelFormatter={(label) => `Ngày: ${label}`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volumeChange" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê khối lượng</CardTitle>
              <CardDescription>
                Các chỉ số quan trọng về khối lượng giao dịch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Khối lượng tối đa</span>
                  <span className="font-medium">
                    ${(metrics?.maxVolume ? metrics.maxVolume / 1000000000 : 0).toFixed(2)}B
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Khối lượng tối thiểu</span>
                  <span className="font-medium">
                    ${(metrics?.minVolume ? metrics.minVolume / 1000000000 : 0).toFixed(2)}B
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Khối lượng trung bình</span>
                  <span className="font-medium">
                    ${(metrics?.avgVolume ? metrics.avgVolume / 1000000000 : 0).toFixed(2)}B
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Tổng khối lượng</span>
                  <span className="font-medium">
                    ${(metrics?.totalVolume ? metrics.totalVolume / 1000000000 : 0).toFixed(2)}B
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Xu hướng khối lượng</span>
                  <Badge className={metrics?.volumeTrend === 'Tăng' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                    {metrics?.volumeTrend}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volume Analysis Summary */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Tổng quan phân tích khối lượng</CardTitle>
            <CardDescription>
              Nhận định về khối lượng giao dịch và tác động đến giá
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Phân tích kỹ thuật</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• Khối lượng giao dịch trung bình duy trì ở mức ${(metrics?.avgVolume ? metrics.avgVolume / 1000000000 : 0).toFixed(2)}B</p>
                  <p>• Xu hướng khối lượng {metrics?.volumeTrend.toLowerCase()} trong 45 ngày gần nhất</p>
                  <p>• Khối lượng hiện tại được đánh giá là {metrics?.volumeSignal.toLowerCase()} so với trung bình</p>
                  <p>• Biến động khối lượng từ ${(metrics?.minVolume ? metrics.minVolume / 1000000000 : 0).toFixed(2)}B đến ${(metrics?.maxVolume ? metrics.maxVolume / 1000000000 : 0).toFixed(2)}B</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Nhận định thị trường</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• Khối lượng giao dịch là chỉ số quan trọng để xác nhận xu hướng giá</p>
                  <p>• Khối lượng tăng thường đi kèm với sự xác nhận của xu hướng tăng giá</p>
                  <p>• Khối lượng giảm có thể báo hiệu sự suy yếu của xu hướng hiện tại</p>
                  <p>• Cần kết hợp với các chỉ số khác để có cái nhìn toàn diện</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
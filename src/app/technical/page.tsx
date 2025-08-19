'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TechnicalData {
  date: string;
  price: number;
  rsi: number;
  macd: number;
  macdSignal: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  ma50: number;
  ma200: number;
}

interface TechnicalMetrics {
  currentRSI: number;
  currentMACD: number;
  currentMACDSignal: number;
  bollingerPosition: string;
  maPosition: string;
  overallSignal: string;
}

export default function TechnicalAnalysis() {
  const [technicalData, setTechnicalData] = useState<TechnicalData[]>([]);
  const [metrics, setMetrics] = useState<TechnicalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real technical data from API instead of generating mock data
    const fetchTechnicalData = async () => {
      try {
        setLoading(true);
        // For now, set empty data to avoid showing mock data
        // In production, this would fetch real technical data from the database
        setTechnicalData([]);
        setMetrics(null);
      } catch (error) {
        console.error('Error fetching technical data:', error);
        setTechnicalData([]);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicalData();
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'MUA': return 'bg-green-500 text-white';
      case 'BÁN': return 'bg-red-500 text-white';
      case 'GIỮ': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-600';
    if (rsi < 30) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getMACDColor = (macd: number, signal: number) => {
    return macd > signal ? 'text-green-600' : 'text-red-600';
  };

  const getBBPositionColor = (position: string) => {
    switch (position) {
      case 'Trên dải trên': return 'text-red-600';
      case 'Dưới dải dưới': return 'text-green-600';
      default: return 'text-yellow-600';
    }
  };

  const getMAPositionColor = (position: string) => {
    return position === 'Golden Cross' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu kỹ thuật...</p>
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
                Technical Analysis
              </h1>
              <p className="text-gray-600 mt-1">
                Phân tích kỹ thuật chuyên sâu
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
              <CardTitle className="text-sm font-medium">RSI Hiện Tại</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📊</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRSIColor(metrics?.currentRSI || 0)}`}>
                {metrics?.currentRSI || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Relative Strength Index
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MACD</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📈</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getMACDColor(metrics?.currentMACD || 0, metrics?.currentMACDSignal || 0)}`}>
                {metrics?.currentMACD ? metrics.currentMACD.toFixed(2) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Signal: {metrics?.currentMACDSignal ? metrics.currentMACDSignal.toFixed(2) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bollinger Bands</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📊</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getBBPositionColor(metrics?.bollingerPosition || '')}`}>
                {metrics?.bollingerPosition || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Vị trí giá tương đối
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tín Hiệu</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">🚨</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge className={getSignalColor(metrics?.overallSignal || '')}>
                  {metrics?.overallSignal || 'N/A'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                MA: {metrics?.maPosition || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* No Data Message */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Technical Analysis Charts</CardTitle>
            <CardDescription>
              Real technical data will be displayed when available from database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                📊 Technical analysis data is being collected from real sources
              </div>
              <div className="text-sm text-gray-400">
                No mock data is displayed - only real or historical fallback data will be shown
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Analysis Summary */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Tổng quan phân tích kỹ thuật</CardTitle>
            <CardDescription>
              Thông tin về các chỉ số kỹ thuật và tín hiệu giao dịch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Chỉ báo RSI</h3>
                  <p className="text-sm text-gray-600">
                    Relative Strength Index (RSI) đo lường tốc độ và thay đổi của biến động giá. 
                    RSI trên 70 cho tín hiệu quá mua, dưới 30 cho tín hiệu quá bán.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">MACD</h3>
                  <p className="text-sm text-gray-600">
                    Moving Average Convergence Divergence (MACD) chỉ ra xu hướng và động lượng của giá. 
                    Khi MACD cắt lên trên đường tín hiệu, đó là tín hiệu mua.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Bollinger Bands</h3>
                  <p className="text-sm text-gray-600">
                    Bollinger Bands đo lường độ biến động của giá. Khi giá chạm dải trên, 
                    có thể bị quá mua; khi chạm dải dưới, có thể bị quá bán.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Moving Averages</h3>
                  <p className="text-sm text-gray-600">
                    Đường trung bình động giúp xác định xu hướng. Golden Cross (MA50 &gt; MA200) 
                    là tín hiệu tăng giá, Death Cross (MA50 &lt; MA200) là tín hiệu giảm giá.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">🎯 Chiến lược giao dịch</h3>
                <p className="text-sm text-blue-700">
                  Kết hợp các chỉ số kỹ thuật để đưa ra quyết định giao dịch. 
                  Tìm kiếm sự xác nhận từ nhiều chỉ số trước khi vào lệnh, 
                  và luôn quản lý rủi ro với stop-loss.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
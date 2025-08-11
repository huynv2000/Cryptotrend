'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, AreaChart, Area, ReferenceLine } from 'recharts';
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
    // Generate sample data for 90 days
    const generateData = () => {
      const data: TechnicalData[] = [];
      const startDate = new Date('2025-05-08');
      
      let basePrice = 45000;
      let macdLine = 0;
      let signalLine = 0;
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Generate realistic price fluctuations
        const priceChange = (Math.random() - 0.5) * 2000;
        basePrice = Math.max(35000, Math.min(60000, basePrice + priceChange));
        
        // Calculate RSI (simplified)
        const rsi = 30 + Math.random() * 40; // RSI between 30-70
        
        // Calculate MACD (simplified)
        const macdChange = (Math.random() - 0.5) * 100;
        macdLine += macdChange;
        signalLine = signalLine * 0.9 + macdLine * 0.1; // EMA of MACD
        
        // Calculate Bollinger Bands
        const bbPeriod = 20;
        const bbMultiplier = 2;
        const recentPrices = data.slice(-bbPeriod).map(d => d.price);
        const bbMiddle = recentPrices.length > 0 
          ? recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length 
          : basePrice;
        const bbStdDev = Math.sqrt(
          recentPrices.reduce((sum, price) => sum + Math.pow(price - bbMiddle, 2), 0) / recentPrices.length
        );
        const bollingerUpper = bbMiddle + bbMultiplier * bbStdDev;
        const bollingerLower = bbMiddle - bbMultiplier * bbStdDev;
        
        // Calculate Moving Averages
        const ma50 = data.length >= 49 
          ? data.slice(-50).reduce((sum, item) => sum + item.price, 0) / 50
          : basePrice;
        const ma200 = data.length >= 199 
          ? data.slice(-200).reduce((sum, item) => sum + item.price, 0) / 200
          : basePrice;
        
        data.push({
          date: date.toLocaleDateString('vi-VN'),
          price: Math.round(basePrice),
          rsi: Math.round(rsi * 100) / 100,
          macd: Math.round(macdLine * 100) / 100,
          macdSignal: Math.round(signalLine * 100) / 100,
          bollingerUpper: Math.round(bollingerUpper),
          bollingerMiddle: Math.round(bollingerMiddle),
          bollingerLower: Math.round(bollingerLower),
          ma50: Math.round(ma50),
          ma200: Math.round(ma200)
        });
      }
      
      return data;
    };

    const calculateMetrics = (data: TechnicalData[]): TechnicalMetrics => {
      const current = data[data.length - 1];
      
      // Determine Bollinger Bands position
      const bbPosition = current.price > current.bollingerUpper ? 'Trên dải trên' :
                         current.price < current.bollingerLower ? 'Dưới dải dưới' :
                         current.price > current.bollingerMiddle ? 'Giữa dải trên' : 'Giữa dải dưới';
      
      // Determine MA position
      const maPosition = current.ma50 > current.ma200 ? 'Golden Cross' : 'Death Cross';
      
      // Generate overall signal
      const rsiSignal = current.rsi > 70 ? 'Quá mua' : current.rsi < 30 ? 'Quá bán' : 'Trung tính';
      const macdSignal = current.macd > current.macdSignal ? 'Tích cực' : 'Tiêu cực';
      const overallSignal = (rsiSignal === 'Quá mua' || macdSignal === 'Tiêu cực') ? 'BÁN' :
                           (rsiSignal === 'Quá bán' || macdSignal === 'Tích cực') ? 'MUA' : 'GIỮ';
      
      return {
        currentRSI: current.rsi,
        currentMACD: current.macd,
        currentMACDSignal: current.macdSignal,
        bollingerPosition,
        maPosition,
        overallSignal
      };
    };

    const data = generateData();
    const technicalMetrics = calculateMetrics(data);
    
    setTechnicalData(data);
    setMetrics(technicalMetrics);
    setLoading(false);
  }, []);

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'text-red-600';
    if (rsi < 30) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'MUA': return 'bg-green-500 text-white';
      case 'BÁN': return 'bg-red-500 text-white';
      case 'GIỮ': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getMACDColor = (macd: number, signal: number) => {
    return macd > signal ? 'text-green-600' : 'text-red-600';
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
                Technical Indicators
              </h1>
              <p className="text-gray-600 mt-1">
                Các chỉ báo kỹ thuật quan trọng
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
              <CardTitle className="text-sm font-medium">RSI</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📊</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRSIColor(metrics?.currentRSI || 0)}`}>
                {metrics?.currentRSI?.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.currentRSI && metrics.currentRSI > 70 ? 'Quá mua' : 
                 metrics?.currentRSI && metrics.currentRSI < 30 ? 'Quá bán' : 'Trung tính'}
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
                {metrics?.currentMACD?.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Signal: {metrics?.currentMACDSignal?.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bollinger</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📉</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.bollingerPosition === 'Trên dải trên' ? '🔴' :
                 metrics?.bollingerPosition === 'Dưới dải dưới' ? '🟢' : '🟡'}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.bollingerPosition}
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
                <Badge className={getSignalColor(metrics?.overallSignal || '')}>
                  {metrics?.overallSignal}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tổng hợp tín hiệu
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RSI Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>RSI (Relative Strength Index)</CardTitle>
            <CardDescription>
              Chỉ số sức mạnh tương đối - Thước đo động lượng giá
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={technicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    interval={Math.floor(technicalData.length / 8)}
                  />
                  <YAxis 
                    stroke="#666"
                    domain={[0, 100]}
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'RSI']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" />
                  <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="5 5" />
                  <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="rsi" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-600">
              <span>Quá bán (&lt;30)</span>
              <span>Trung tính (30-70)</span>
              <span>Quá mua (&gt;70)</span>
            </div>
          </CardContent>
        </Card>

        {/* MACD Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>MACD (Moving Average Convergence Divergence)</CardTitle>
            <CardDescription>
              Chỉ báo xu hướng dựa trên sự phân kỳ của các đường trung bình động
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={technicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    interval={Math.floor(technicalData.length / 8)}
                  />
                  <YAxis 
                    stroke="#666"
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip 
                    formatter={(value) => {
                      if (name === 'macd') return [value, 'MACD'];
                      if (name === 'macdSignal') return [value, 'Signal'];
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
                  <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="macd" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="macdSignal" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bollinger Bands Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Bollinger Bands</CardTitle>
              <CardDescription>
                Dải Bollinger - Đo lường độ biến động và mức giá quá mua/quá bán
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={technicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#666' }}
                    interval={Math.floor(technicalData.length / 6)}
                    />
                    <YAxis 
                      stroke="#666"
                      domain={[35000, 60000]}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      tick={{ fill: '#666' }}
                    />
                    <Tooltip 
                      formatter={(value) => {
                        if (name === 'bollingerUpper') return [`$${Number(value).toLocaleString()}`, 'Dải trên'];
                        if (name === 'bollingerMiddle') return [`$${Number(value).toLocaleString()}`, 'Dải giữa'];
                        if (name === 'bollingerLower') return [`$${Number(value).toLocaleString()}`, 'Dải dưới'];
                        if (name === 'price') return [`$${Number(value).toLocaleString()}`, 'Giá'];
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
                    <Line 
                      type="monotone" 
                      dataKey="bollingerUpper" 
                      stroke="#ef4444" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bollingerMiddle" 
                      stroke="#6b7280" 
                      strokeWidth={1}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bollingerLower" 
                      stroke="#22c55e" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moving Averages</CardTitle>
              <CardDescription>
                Đường trung bình động 50 và 200 ngày
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={technicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#666' }}
                    interval={Math.floor(technicalData.length / 6)}
                    />
                    <YAxis 
                      stroke="#666"
                      domain={[35000, 60000]}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      tick={{ fill: '#666' }}
                    />
                    <Tooltip 
                      formatter={(value) => {
                        if (name === 'ma50') return [`$${Number(value).toLocaleString()}`, 'MA 50'];
                        if (name === 'ma200') return [`$${Number(value).toLocaleString()}`, 'MA 200'];
                        if (name === 'price') return [`$${Number(value).toLocaleString()}`, 'Giá'];
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
                    <Line 
                      type="monotone" 
                      dataKey="ma50" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ma200" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      strokeWidth={1}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <Badge className={metrics?.maPosition === 'Golden Cross' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                  {metrics?.maPosition}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Analysis Summary */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Tổng quan phân tích kỹ thuật</CardTitle>
            <CardDescription>
              Nhận định tổng thể từ các chỉ báo kỹ thuật
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Chỉ báo hiện tại</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• RSI: {metrics?.currentRSI?.toFixed(1)} ({metrics?.currentRSI && metrics.currentRSI > 70 ? 'Quá mua' : metrics?.currentRSI && metrics.currentRSI < 30 ? 'Quá bán' : 'Trung tính'})</p>
                  <p>• MACD: {metrics?.currentMACD?.toFixed(2)} (Signal: {metrics?.currentMACDSignal?.toFixed(2)})</p>
                  <p>• Bollinger: {metrics?.bollingerPosition}</p>
                  <p>• Moving Averages: {metrics?.maPosition}</p>
                  <p>• Tín hiệu tổng hợp: <Badge className={getSignalColor(metrics?.overallSignal || '')}>{metrics?.overallSignal}</Badge></p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Nhận định thị trường</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• RSI cho thấy thị trường đang ở trạng thái {metrics?.currentRSI && metrics.currentRSI > 70 ? 'quá mua' : metrics?.currentRSI && metrics.currentRSI < 30 ? 'quá bán' : 'cân bằng'}</p>
                  <p>• MACD {metrics?.currentMACD > metrics?.currentMACDSignal ? 'tích cực' : 'tiêu cực'} cho thấy xu hướng {metrics?.currentMACD > metrics?.currentMACDSignal ? 'tăng' : 'giảm'}</p>
                  <p>• Giá đang {metrics?.bollingerPosition?.toLowerCase()} dải Bollinger</p>
                  <p>• {metrics?.maPosition === 'Golden Cross' ? 'Golden Cross' : 'Death Cross'} cho thấy xu hướng dài hạn {metrics?.maPosition === 'Golden Cross' ? 'tích cực' : 'tiêu cực'}</p>
                  <p>• Nên {metrics?.overallSignal?.toLowerCase()} dựa trên tổng hợp các chỉ báo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
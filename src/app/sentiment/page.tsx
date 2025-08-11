'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, AreaChart, Area, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SentimentData {
  date: string;
  fearGreedIndex: number;
  socialSentiment: number;
  newsSentiment: number;
  googleTrends: number;
  overallSentiment: number;
}

interface SentimentMetrics {
  currentFearGreed: number;
  currentSocial: number;
  currentNews: number;
  currentTrends: number;
  overallSentiment: string;
  sentimentTrend: string;
  marketMood: string;
}

export default function SentimentAnalysis() {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [metrics, setMetrics] = useState<SentimentMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate sample data for 90 days
    const generateData = () => {
      const data: SentimentData[] = [];
      const startDate = new Date('2025-05-08');
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Generate sentiment indicators
        const fearGreedIndex = 20 + Math.random() * 60; // 20-80
        const socialSentiment = 30 + Math.random() * 40; // 30-70
        const newsSentiment = 25 + Math.random() * 50; // 25-75
        const googleTrends = 35 + Math.random() * 30; // 35-65
        
        // Calculate overall sentiment
        const overallSentiment = (fearGreedIndex + socialSentiment + newsSentiment + googleTrends) / 4;
        
        data.push({
          date: date.toLocaleDateString('vi-VN'),
          fearGreedIndex: Math.round(fearGreedIndex * 100) / 100,
          socialSentiment: Math.round(socialSentiment * 100) / 100,
          newsSentiment: Math.round(newsSentiment * 100) / 100,
          googleTrends: Math.round(googleTrends * 100) / 100,
          overallSentiment: Math.round(overallSentiment * 100) / 100
        });
      }
      
      return data;
    };

    const calculateMetrics = (data: SentimentData[]): SentimentMetrics => {
      const current = data[data.length - 1];
      const previous = data[data.length - 2];
      
      // Determine sentiment trend
      const sentimentTrend = current.overallSentiment > previous.overallSentiment ? 'Tăng' : 'Giảm';
      
      // Determine overall sentiment
      const overallSentiment = current.overallSentiment > 60 ? 'Tích cực' :
                             current.overallSentiment < 40 ? 'Tiêu cực' : 'Trung tính';
      
      // Determine market mood
      const marketMood = current.fearGreedIndex > 75 ? 'Tham lam cực độ' :
                        current.fearGreedIndex > 55 ? 'Tham lam' :
                        current.fearGreedIndex > 45 ? 'Trung tính' :
                        current.fearGreedIndex > 25 ? 'Sợ hãi' : 'Sợ hãi cực độ';
      
      return {
        currentFearGreed: current.fearGreedIndex,
        currentSocial: current.socialSentiment,
        currentNews: current.newsSentiment,
        currentTrends: current.googleTrends,
        overallSentiment,
        sentimentTrend,
        marketMood
      };
    };

    const data = generateData();
    const sentimentMetrics = calculateMetrics(data);
    
    setSentimentData(data);
    setMetrics(sentimentMetrics);
    setLoading(false);
  }, []);

  const getSentimentColor = (value: number) => {
    if (value <= 25) return 'text-red-600';
    if (value <= 45) return 'text-orange-500';
    if (value <= 55) return 'text-yellow-500';
    if (value <= 75) return 'text-green-500';
    return 'text-green-600';
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Tham lam cực độ': return 'bg-red-600 text-white';
      case 'Tham lam': return 'bg-orange-500 text-white';
      case 'Trung tính': return 'bg-yellow-500 text-white';
      case 'Sợ hãi': return 'bg-blue-500 text-white';
      case 'Sợ hãi cực độ': return 'bg-purple-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getOverallSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Tích cực': return 'bg-green-500 text-white';
      case 'Tiêu cực': return 'bg-red-500 text-white';
      case 'Trung tính': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const pieData = [
    { name: 'Fear & Greed', value: metrics?.currentFearGreed || 0 },
    { name: 'Social', value: metrics?.currentSocial || 0 },
    { name: 'News', value: metrics?.currentNews || 0 },
    { name: 'Google Trends', value: metrics?.currentTrends || 0 }
  ];

  const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu tâm lý thị trường...</p>
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
                Sentiment Analysis
              </h1>
              <p className="text-gray-600 mt-1">
                Phân tích tâm lý thị trường
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
              <CardTitle className="text-sm font-medium">Fear & Greed</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">😊</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSentimentColor(metrics?.currentFearGreed || 0)}`}>
                {metrics?.currentFearGreed?.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.marketMood}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Social Sentiment</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📱</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSentimentColor(metrics?.currentSocial || 0)}`}>
                {metrics?.currentSocial?.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Mạng xã hội
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">News Sentiment</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📰</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSentimentColor(metrics?.currentNews || 0)}`}>
                {metrics?.currentNews?.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tin tức
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng quan</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">🎯</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge className={getOverallSentimentColor(metrics?.overallSentiment || '')}>
                  {metrics?.overallSentiment}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Xu hướng: {metrics?.sentimentTrend}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Fear & Greed Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fear & Greed Index</CardTitle>
            <CardDescription>
              Chỉ số tâm lý thị trường Fear & Greed theo thời gian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sentimentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    interval={Math.floor(sentimentData.length / 8)}
                  />
                  <YAxis 
                    stroke="#666"
                    domain={[0, 100]}
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'Fear & Greed Index']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="5 5" />
                  <ReferenceLine y={45} stroke="#f59e0b" strokeDasharray="5 5" />
                  <ReferenceLine y={55} stroke="#eab308" strokeDasharray="5 5" />
                  <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="5 5" />
                  <Area 
                    type="monotone" 
                    dataKey="fearGreedIndex" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2 text-sm text-center">
              <div className="text-red-600 font-medium">Sợ hãi cực độ</div>
              <div className="text-orange-500 font-medium">Sợ hãi</div>
              <div className="text-yellow-500 font-medium">Trung tính</div>
              <div className="text-green-500 font-medium">Tham lam</div>
              <div className="text-green-600 font-medium">Tham lam cực độ</div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Thành phần tâm lý thị trường</CardTitle>
              <CardDescription>
                Phân bổ các yếu tố tâm lý hiện tại
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toFixed(1), 'Giá trị']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>So sánh các chỉ số tâm lý</CardTitle>
              <CardDescription>
                Các chỉ số tâm lý thị trường qua thời gian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#666' }}
                      interval={Math.floor(sentimentData.length / 6)}
                    />
                    <YAxis 
                      stroke="#666"
                      domain={[0, 100]}
                      tick={{ fill: '#666' }}
                    />
                    <Tooltip 
                      formatter={(value) => {
                        const labels: { [key: string]: string } = {
                          fearGreedIndex: 'Fear & Greed',
                          socialSentiment: 'Social',
                          newsSentiment: 'News',
                          googleTrends: 'Google Trends',
                          overallSentiment: 'Overall'
                        };
                        return [value, labels[name] || name];
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
                      dataKey="fearGreedIndex" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="socialSentiment" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newsSentiment" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="googleTrends" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sentiment Analysis Summary */}
        <Card>
          <CardHeader>
            <CardTitle>😊 Tổng quan phân tích tâm lý</CardTitle>
            <CardDescription>
              Nhận định về tâm lý thị trường và tác động đến giá
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Chỉ số hiện tại</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• Fear & Greed: {metrics?.currentFearGreed?.toFixed(1)} ({metrics?.marketMood})</p>
                  <p>• Social Sentiment: {metrics?.currentSocial?.toFixed(1)}</p>
                  <p>• News Sentiment: {metrics?.currentNews?.toFixed(1)}</p>
                  <p>• Google Trends: {metrics?.currentTrends?.toFixed(1)}</p>
                  <p>• Tổng quan: <Badge className={getOverallSentimentColor(metrics?.overallSentiment || '')}>{metrics?.overallSentiment}</Badge></p>
                  <p>• Xu hướng: {metrics?.sentimentTrend?.toLowerCase()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Nhận định thị trường</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• Thị trường đang trong trạng thái {metrics?.marketMood?.toLowerCase()}</p>
                  <p>• Tâm lý tổng thể {metrics?.overallSentiment?.toLowerCase()} và đang {metrics?.sentimentTrend?.toLowerCase()}</p>
                  <p>• {metrics?.currentFearGreed && metrics.currentFearGreed > 60 ? 'Nhà đầu tư đang quá tự tin, cần cẩn trọng' : 'Nhà đầu tư còn thận trọng, có cơ hội'}</p>
                  <p>• {metrics?.currentSocial && metrics.currentSocial > 60 ? 'Mạng xã hội đang tích cực, có thể tạo FOMO' : 'Mạng xã hội còn tiêu cực, cần theo dõi'}</p>
                  <p>• {metrics?.currentNews && metrics.currentNews > 60 ? 'Tin tức đang tích cực, hỗ trợ giá' : 'Tin tức tiêu cực, có thể áp lực giảm giá'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
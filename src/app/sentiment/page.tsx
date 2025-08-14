'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
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
    // Fetch real sentiment data from API instead of generating mock data
    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        // For now, set empty data to avoid showing mock data
        // In production, this would fetch real sentiment data from the database
        setSentimentData([]);
        setMetrics(null);
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        setSentimentData([]);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentData();
  }, []);

  const getSentimentColor = (value: number) => {
    if (value > 60) return 'text-green-600';
    if (value < 40) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Tham lam cực độ': return 'text-green-600';
      case 'Tham lam': return 'text-green-500';
      case 'Trung tính': return 'text-yellow-600';
      case 'Sợ hãi': return 'text-orange-600';
      case 'Sợ hãi cực độ': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getOverallSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Tích cực': return 'text-green-600';
      case 'Tiêu cực': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

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
                Phân tích tâm lý thị trường và social sentiment
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
              <CardTitle className="text-sm font-medium">Fear & Greed Index</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">😰</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSentimentColor(metrics?.currentFearGreed || 0)}`}>
                {metrics?.currentFearGreed || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Chỉ số tâm lý thị trường
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
                {metrics?.currentSocial || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Twitter, Reddit, Social Media
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
                {metrics?.currentNews || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Tin tức và báo chí
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Xu Hướng</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📈</div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getOverallSentimentColor(metrics?.overallSentiment || '')}`}>
                {metrics?.overallSentiment || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Xu hướng: {metrics?.sentimentTrend || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* No Data Message */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sentiment Analysis Charts</CardTitle>
            <CardDescription>
              Real sentiment data will be displayed when available from database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                😊 Sentiment analysis data is being collected from real sources
              </div>
              <div className="text-sm text-gray-400">
                No mock data is displayed - only real or historical fallback data will be shown
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Mood */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🎭 Tâm Lý Thị Trường</CardTitle>
            <CardDescription>
              Phân tích tâm lý nhà đầu tư và tâm lý thị trường
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className={`text-4xl font-bold mb-4 ${getMoodColor(metrics?.marketMood || '')}`}>
                {metrics?.marketMood || 'N/A'}
              </div>
              <div className="text-gray-600">
                {metrics?.marketMood && (
                  <p className="mb-4">
                    Chỉ số Fear & Greed hiện tại cho thấy thị trường đang trong trạng thái {metrics.marketMood.toLowerCase()}
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  {['Sợ hãi cực độ', 'Sợ hãi', 'Trung tính', 'Tham lam', 'Tham lam cực độ'].map((mood) => (
                    <div key={mood} className={`p-3 rounded-lg border ${
                      metrics?.marketMood === mood ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-sm font-medium">{mood}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {mood === 'Sợ hãi cực độ' ? '0-20' :
                         mood === 'Sợ hãi' ? '21-45' :
                         mood === 'Trung tính' ? '46-55' :
                         mood === 'Tham lam' ? '56-75' : '76-100'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Analysis Summary */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Tổng quan phân tích tâm lý</CardTitle>
            <CardDescription>
              Thông tin về các chỉ số tâm lý thị trường và social sentiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Fear & Greed Index</h3>
                  <p className="text-sm text-gray-600">
                    Chỉ số Fear & Greed đo lường tâm lý nhà đầu tư. 
                    Giá trị thấp cho thấy sự sợ hãi, giá trị cao cho thấy sự tham lam.
                    Đây là chỉ số contrarian: khi sợ hãi cực độ thường là thời điểm mua tốt.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Social Sentiment</h3>
                  <p className="text-sm text-gray-600">
                    Social sentiment phân tích cảm xúc từ Twitter, Reddit, và các mạng xã hội khác. 
                    Tích cực cho thấy sự lạc quan, tiêu cực cho thấy sự bi quan.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">News Sentiment</h3>
                  <p className="text-sm text-gray-600">
                    News sentiment phân tích tông giọng của tin tức crypto. 
                    Tin tức tích cực thường đẩy giá lên, tin tức tiêu cực thường kéo giá xuống.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Google Trends</h3>
                  <p className="text-sm text-gray-600">
                    Google Trends đo lường mức độ quan tâm tìm kiếm. 
                    Lượng tìm kiếm tăng thường cho thấy sự quan tâm tăng, có thể dẫn đến biến động giá.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">🎯 Chiến lược đầu tư dựa trên tâm lý</h3>
                <p className="text-sm text-blue-700">
                  Khi thị trường sợ hãi cực độ (Fear & Greed &lt; 25) thường là thời điểm mua tốt. 
                  Khi thị trường tham lam cực độ (Fear & Greed &gt; 75) nên cẩn trọng với việc mua mới.
                  Hãy là người contrarian - mua khi sợ hãi, bán khi tham lam.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
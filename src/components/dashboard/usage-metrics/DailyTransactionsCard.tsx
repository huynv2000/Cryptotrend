// Daily Transactions Card Component

'use client';

import { TrendingUp } from 'lucide-react';
import EnhancedMetricCard from './EnhancedMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface DailyTransactionsCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  rollingAverages?: {
    '7d': number;
    '30d': number;
    '90d': number;
  };
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function DailyTransactionsCard({
  data,
  spikeDetection,
  rollingAverages,
  isLoading,
  isSelected = false,
  onClick
}: DailyTransactionsCardProps) {
  // Only use real data - no mock data
  const sparklineData = data && data.historicalData ? data.historicalData : null;
  
  return (
    <EnhancedMetricCard
      title="Daily Transactions"
      description="Total transactions per day"
      data={data}
      rollingAverages={rollingAverages}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
      formatType="number"
      isPositiveGood={true}
      showSparkline={!!sparklineData}
      sparklineData={sparklineData}
      className="hover:border-purple-500/30"
    />
  );
}
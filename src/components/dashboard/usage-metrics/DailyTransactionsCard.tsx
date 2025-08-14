// Daily Transactions Card Component

'use client';

import { TrendingUp } from 'lucide-react';
import BaseMetricCard from './BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface DailyTransactionsCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function DailyTransactionsCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: DailyTransactionsCardProps) {
  const sparklineData = [
    250000, 280000, 265000, 310000, 295000, 
    340000, 380000, 360000, 420000, 450000
  ];
  
  return (
    <BaseMetricCard
      title="Daily Transactions"
      description="Total transactions per day"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
      formatType="number"
      isPositiveGood={true}
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-purple-500/30"
    />
  );
}
// Average Fee Card Component

'use client';

import { BarChart3 } from 'lucide-react';
import EnhancedMetricCard from './EnhancedMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface AverageFeeCardProps {
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

export default function AverageFeeCard({
  data,
  spikeDetection,
  rollingAverages,
  isLoading,
  isSelected = false,
  onClick
}: AverageFeeCardProps) {
  // Only use real data - no mock data
  const sparklineData = data && data.historicalData ? data.historicalData : null;
  
  return (
    <EnhancedMetricCard
      title="Average Fee"
      description="Average transaction fee"
      data={data}
      rollingAverages={rollingAverages}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<BarChart3 className="h-5 w-5 text-red-500" />}
      formatType="currency"
      isPositiveGood={false} // Lower fees are better
      showSparkline={!!sparklineData}
      sparklineData={sparklineData}
      className="hover:border-red-500/30"
    />
  );
}
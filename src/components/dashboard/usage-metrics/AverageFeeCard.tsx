// Average Fee Card Component

'use client';

import { BarChart3 } from 'lucide-react';
import BaseMetricCard from './BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface AverageFeeCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function AverageFeeCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: AverageFeeCardProps) {
  const sparklineData = [
    2.5, 3.2, 2.8, 4.1, 3.7, 
    5.2, 6.8, 5.9, 7.2, 8.1
  ];
  
  return (
    <BaseMetricCard
      title="Average Fee"
      description="Average transaction fee"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<BarChart3 className="h-5 w-5 text-red-500" />}
      formatType="currency"
      isPositiveGood={false} // Lower fees are better
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-red-500/30"
    />
  );
}
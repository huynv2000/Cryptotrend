// Staking Metrics Card Component

'use client';

import { PieChart } from 'lucide-react';
import BaseMetricCard from '../usage-metrics/BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface StakingMetricsCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function StakingMetricsCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: StakingMetricsCardProps) {
  const sparklineData = [
    65.2, 66.8, 65.9, 67.5, 68.2, 
    69.1, 70.3, 69.8, 71.2, 72.5
  ];
  
  return (
    <BaseMetricCard
      title="Staking Metrics"
      description="Staking participation and rewards"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<PieChart className="h-5 w-5 text-purple-500" />}
      formatType="percent"
      isPositiveGood={true}
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-purple-500/30"
    />
  );
}
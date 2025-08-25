// Staking Metrics Card Component

'use client';

import { PieChart } from 'lucide-react';
import BaseMetricCard from '../usage-metrics/BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';
import type { TrendAnalysis } from '@/lib/trend-calculator';

interface StakingMetricsCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  trendAnalysis?: TrendAnalysis;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function StakingMetricsCard({
  data,
  spikeDetection,
  trendAnalysis,
  isLoading,
  isSelected = false,
  onClick
}: StakingMetricsCardProps) {
  return (
    <BaseMetricCard
      title="Staking Metrics"
      description="Staking participation and rewards"
      data={data}
      spikeDetection={spikeDetection}
      trendAnalysis={trendAnalysis}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<PieChart className="h-5 w-5 text-purple-500" />}
      formatType="percent"
      isPositiveGood={true}
      className="hover:border-purple-500/30"
    />
  );
}
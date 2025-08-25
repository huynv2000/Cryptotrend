// Exchange Flows Card Component

'use client';

import { TrendingUp } from 'lucide-react';
import BaseMetricCard from '../usage-metrics/BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';
import type { TrendAnalysis } from '@/lib/trend-calculator';

interface ExchangeFlowsCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  trendAnalysis?: TrendAnalysis;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ExchangeFlowsCard({
  data,
  spikeDetection,
  trendAnalysis,
  isLoading,
  isSelected = false,
  onClick
}: ExchangeFlowsCardProps) {
  return (
    <BaseMetricCard
      title="Exchange Flows"
      description="Exchange inflow/outflow"
      data={data}
      spikeDetection={spikeDetection}
      trendAnalysis={trendAnalysis}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<TrendingUp className="h-5 w-5 text-green-500" />}
      formatType="currency"
      isPositiveGood={true}
      className="hover:border-green-500/30"
    />
  );
}
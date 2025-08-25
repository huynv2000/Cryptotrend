// Bridge Flows Card Component

'use client';

import { ArrowRight } from 'lucide-react';
import BaseMetricCard from '../usage-metrics/BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';
import type { TrendAnalysis } from '@/lib/trend-calculator';

interface BridgeFlowsCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  trendAnalysis?: TrendAnalysis;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function BridgeFlowsCard({
  data,
  spikeDetection,
  trendAnalysis,
  isLoading,
  isSelected = false,
  onClick
}: BridgeFlowsCardProps) {
  return (
    <BaseMetricCard
      title="Bridge Flows"
      description="Cross-chain bridge transactions"
      data={data}
      spikeDetection={spikeDetection}
      trendAnalysis={trendAnalysis}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<ArrowRight className="h-5 w-5 text-blue-500" />}
      formatType="currency"
      isPositiveGood={true}
      className="hover:border-blue-500/30"
    />
  );
}
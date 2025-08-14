// Exchange Flows Card Component

'use client';

import { TrendingUp } from 'lucide-react';
import BaseMetricCard from '../usage-metrics/BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface ExchangeFlowsCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ExchangeFlowsCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: ExchangeFlowsCardProps) {
  const sparklineData = [
    85000000, 92000000, 88000000, 105000000, 98000000,
    120000000, 135000000, 125000000, 150000000, 165000000
  ];
  
  return (
    <BaseMetricCard
      title="Exchange Flows"
      description="Exchange inflow/outflow"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<TrendingUp className="h-5 w-5 text-green-500" />}
      formatType="currency"
      isPositiveGood={true}
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-green-500/30"
    />
  );
}
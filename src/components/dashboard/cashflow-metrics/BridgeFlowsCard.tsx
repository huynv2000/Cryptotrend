// Bridge Flows Card Component

'use client';

import { ArrowRight } from 'lucide-react';
import BaseMetricCard from '../usage-metrics/BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface BridgeFlowsCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function BridgeFlowsCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: BridgeFlowsCardProps) {
  const sparklineData = [
    120000000, 150000000, 135000000, 180000000, 165000000,
    210000000, 240000000, 220000000, 280000000, 320000000
  ];
  
  return (
    <BaseMetricCard
      title="Bridge Flows"
      description="Cross-chain bridge transactions"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<ArrowRight className="h-5 w-5 text-blue-500" />}
      formatType="currency"
      isPositiveGood={true}
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-blue-500/30"
    />
  );
}
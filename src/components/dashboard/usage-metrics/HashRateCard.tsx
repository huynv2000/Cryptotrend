// Hash Rate Card Component

'use client';

import { Hash } from 'lucide-react';
import BaseMetricCard from './BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface HashRateCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function HashRateCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: HashRateCardProps) {
  const sparklineData = [
    450000000000000000, 480000000000000000, 465000000000000000, 510000000000000000, 495000000000000000,
    540000000000000000, 580000000000000000, 560000000000000000, 620000000000000000, 650000000000000000
  ];
  
  return (
    <BaseMetricCard
      title="Network Hash Rate"
      description="Current network hash rate"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<Hash className="h-5 w-5 text-yellow-500" />}
      formatType="hashrate"
      isPositiveGood={true}
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-yellow-500/30"
    />
  );
}
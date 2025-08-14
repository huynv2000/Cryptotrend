// Mining Validation Card Component

'use client';

import { BarChart3 } from 'lucide-react';
import BaseMetricCard from '../usage-metrics/BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface MiningValidationCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function MiningValidationCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: MiningValidationCardProps) {
  const sparklineData = [
    450000000000000000, 480000000000000000, 465000000000000000, 510000000000000000, 495000000000000000,
    540000000000000000, 580000000000000000, 560000000000000000, 620000000000000000, 650000000000000000
  ];
  
  return (
    <BaseMetricCard
      title="Mining/Validation"
      description="Network mining and validation"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<BarChart3 className="h-5 w-5 text-orange-500" />}
      formatType="hashrate"
      isPositiveGood={true}
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-orange-500/30"
    />
  );
}
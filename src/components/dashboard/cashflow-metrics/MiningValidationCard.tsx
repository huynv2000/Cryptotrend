// Mining Validation Card Component

'use client';

import { BarChart3 } from 'lucide-react';
import BaseMetricCard from '../usage-metrics/BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';
import type { TrendAnalysis } from '@/lib/trend-calculator';

interface MiningValidationCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  trendAnalysis?: TrendAnalysis;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function MiningValidationCard({
  data,
  spikeDetection,
  trendAnalysis,
  isLoading,
  isSelected = false,
  onClick
}: MiningValidationCardProps) {
  return (
    <BaseMetricCard
      title="Mining/Validation"
      description="Network mining and validation"
      data={data}
      spikeDetection={spikeDetection}
      trendAnalysis={trendAnalysis}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<BarChart3 className="h-5 w-5 text-orange-500" />}
      formatType="hashrate"
      isPositiveGood={true}
      className="hover:border-orange-500/30"
    />
  );
}
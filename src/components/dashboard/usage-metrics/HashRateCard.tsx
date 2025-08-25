// Hash Rate Card Component

'use client';

import { Hash } from 'lucide-react';
import EnhancedMetricCard from './EnhancedMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface HashRateCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  rollingAverages?: {
    '7d': number;
    '30d': number;
    '90d': number;
  };
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function HashRateCard({
  data,
  spikeDetection,
  rollingAverages,
  isLoading,
  isSelected = false,
  onClick
}: HashRateCardProps) {
  // Only use real data - no mock data
  const sparklineData = null; // historicalData is not available in MetricValue type
  
  return (
    <EnhancedMetricCard
      title="Network Hash Rate"
      description="Current network hash rate"
      data={data}
      rollingAverages={rollingAverages}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<Hash className="h-5 w-5 text-yellow-500" />}
      formatType="hashrate"
      isPositiveGood={true}
      showSparkline={false}
      sparklineData={undefined}
      className="hover:border-yellow-500/30"
    />
  );
}
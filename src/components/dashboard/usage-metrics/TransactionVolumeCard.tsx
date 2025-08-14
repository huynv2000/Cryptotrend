// Transaction Volume Card Component

'use client';

import { DollarSign } from 'lucide-react';
import BaseMetricCard from './BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface TransactionVolumeCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function TransactionVolumeCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: TransactionVolumeCardProps) {
  const sparklineData = [
    1500000000, 1800000000, 1650000000, 2100000000, 1950000000,
    2400000000, 2800000000, 2600000000, 3200000000, 3500000000
  ];
  
  return (
    <BaseMetricCard
      title="Transaction Volume"
      description="Total transaction volume in USD"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<DollarSign className="h-5 w-5 text-orange-500" />}
      formatType="currency"
      isPositiveGood={true}
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-orange-500/30"
    />
  );
}
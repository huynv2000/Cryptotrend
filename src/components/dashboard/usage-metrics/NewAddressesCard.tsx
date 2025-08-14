// New Addresses Card Component

'use client';

import { UserPlus } from 'lucide-react';
import BaseMetricCard from './BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface NewAddressesCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function NewAddressesCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: NewAddressesCardProps) {
  const sparklineData = [
    45000, 52000, 48000, 61000, 58000, 
    67000, 72000, 69000, 75000, 82000
  ];
  
  return (
    <BaseMetricCard
      title="New Addresses"
      description="Newly created addresses"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<UserPlus className="h-5 w-5 text-green-500" />}
      formatType="number"
      isPositiveGood={true}
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-green-500/30"
    />
  );
}
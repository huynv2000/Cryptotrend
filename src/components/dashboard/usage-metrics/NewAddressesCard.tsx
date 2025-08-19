// New Addresses Card Component

'use client';

import { UserPlus } from 'lucide-react';
import EnhancedMetricCard from './EnhancedMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface NewAddressesCardProps {
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

export default function NewAddressesCard({
  data,
  spikeDetection,
  rollingAverages,
  isLoading,
  isSelected = false,
  onClick
}: NewAddressesCardProps) {
  // Only use real data - no mock data
  const sparklineData = data && data.historicalData ? data.historicalData : null;
  
  return (
    <EnhancedMetricCard
      title="New Addresses"
      description="Newly created addresses"
      data={data}
      rollingAverages={rollingAverages}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<UserPlus className="h-5 w-5 text-green-500" />}
      formatType="number"
      isPositiveGood={true}
      showSparkline={!!sparklineData}
      sparklineData={sparklineData}
      className="hover:border-green-500/30"
    />
  );
}
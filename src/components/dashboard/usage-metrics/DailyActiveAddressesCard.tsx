// Daily Active Addresses Card Component

'use client';

import { Users } from 'lucide-react';
import EnhancedMetricCard from './EnhancedMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface DailyActiveAddressesCardProps {
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

export default function DailyActiveAddressesCard({
  data,
  spikeDetection,
  rollingAverages,
  isLoading,
  isSelected = false,
  onClick
}: DailyActiveAddressesCardProps) {
  // Only use real data - no mock data
  const sparklineData = data && data.historicalData ? data.historicalData : null;
  
  return (
    <EnhancedMetricCard
      title="Daily Active Addresses"
      description="Number of unique active addresses"
      data={data}
      rollingAverages={rollingAverages}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<Users className="h-5 w-5 text-blue-500" />}
      formatType="number"
      isPositiveGood={true}
      showSparkline={!!sparklineData}
      sparklineData={sparklineData}
      className="hover:border-blue-500/30"
    />
  );
}
// Daily Active Addresses Card Component

'use client';

import { Users } from 'lucide-react';
import BaseMetricCard from './BaseMetricCard';
import type { MetricValue, SpikeDetectionResult } from '@/lib/types';

interface DailyActiveAddressesCardProps {
  data: MetricValue | null;
  spikeDetection?: SpikeDetectionResult;
  isLoading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function DailyActiveAddressesCard({
  data,
  spikeDetection,
  isLoading,
  isSelected = false,
  onClick
}: DailyActiveAddressesCardProps) {
  // Generate sample sparkline data for demonstration
  const sparklineData = [
    1250000, 1180000, 1320000, 1290000, 1410000, 
    1380000, 1450000, 1520000, 1490000, 1560000
  ];
  
  return (
    <BaseMetricCard
      title="Daily Active Addresses"
      description="Number of unique active addresses"
      data={data}
      spikeDetection={spikeDetection}
      isLoading={isLoading}
      isSelected={isSelected}
      onClick={onClick}
      icon={<Users className="h-5 w-5 text-blue-500" />}
      formatType="number"
      isPositiveGood={true}
      showSparkline={true}
      sparklineData={sparklineData}
      className="hover:border-blue-500/30"
    />
  );
}
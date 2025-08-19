// Transaction Volume Card Component

'use client';

import { DollarSign } from 'lucide-react';
import MetricCardWithBaseline from '@/components/dashboard/ui/MetricCardWithBaseline';
import { cn } from '@/lib/utils';
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
  // Transform data to match MetricCardWithBaseline interface
  const metricData = {
    value: data?.value ?? null,
    changePercent: data?.changePercent ?? null,
    trend: data?.trend ?? 'stable',
    isSpike: spikeDetection?.isSpike,
    spikeSeverity: spikeDetection?.severity
  };

  return (
    <MetricCardWithBaseline
      title="Transaction Volume"
      description="Total transaction volume in USD"
      icon={<DollarSign className="h-5 w-5 text-orange-500" />}
      data={metricData}
      formatType="currency"
      isPositiveGood={true}
      isLoading={isLoading}
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        isSelected && "ring-2 ring-blue-500 bg-blue-500/5",
        spikeDetection?.isSpike && "border-orange-500/50"
      )}
      onClick={onClick}
    />
  );
}
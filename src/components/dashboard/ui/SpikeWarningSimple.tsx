// Simple Spike Warning Component for debugging
// Simplified version without Tooltip to isolate the issue

'use client';

import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SpikeWarningSimpleProps {
  isSpike: boolean;
  severity?: 'low' | 'medium' | 'high';
  className?: string;
}

export default function SpikeWarningSimple({
  isSpike,
  severity = 'medium',
  className
}: SpikeWarningSimpleProps) {
  if (!isSpike) {
    return null;
  }

  const getSeverityColor = () => {
    switch (severity) {
      case 'high':
        return 'bg-red-500 text-white border-red-600';
      case 'medium':
        return 'bg-orange-500 text-white border-orange-600';
      case 'low':
        return 'bg-yellow-500 text-gray-900 border-yellow-600';
      default:
        return 'bg-orange-500 text-white border-orange-600';
    }
  };

  const getSeverityText = () => {
    switch (severity) {
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MED';
      case 'low':
        return 'LOW';
      default:
        return 'SPK';
    }
  };

  return (
    <div 
      className={cn(
        "absolute bottom-3 right-3 z-[998]",
        "pointer-events-auto", // Ensure it's clickable
        "!transform-none", // Prevent any transform interference
        "!m-0", // Remove any margin interference
        className
      )}
      style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        zIndex: 998
      }}
    >
      <Badge 
        variant="default"
        className={cn(
          "text-xs font-bold px-2 py-1 border shadow-md",
          "pointer-events-auto", // Ensure it's clickable
          "!transform-none", // Prevent any transform interference
          "!m-0", // Remove any margin interference
          "min-w-fit", // Ensure minimum width
          getSeverityColor()
        )}
        style={{
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          <span className="leading-none font-bold">{getSeverityText()}</span>
        </div>
      </Badge>
    </div>
  );
}
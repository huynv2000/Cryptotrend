// Spike Warning Component
// Displays spike detection warnings in the bottom-right corner of metric cards

'use client';

import { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SpikeWarningProps {
  isSpike: boolean;
  severity?: 'low' | 'medium' | 'high';
  details?: {
    currentValue: number;
    baselineValue: number;
    threshold: number;
    changePercent: number;
    metricName: string;
  };
  className?: string;
}

export default function SpikeWarning({
  isSpike,
  severity = 'medium',
  details,
  className
}: SpikeWarningProps) {
  const [isHovered, setIsHovered] = useState(false);

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

  const getSeverityIcon = () => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-3 w-3" />;
      case 'medium':
        return <AlertTriangle className="h-3 w-3" />;
      case 'low':
        return <Info className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
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

  const getTooltipContent = () => {
    if (!details) {
      return (
        <div className="space-y-2">
          <div className="font-medium">Spike Detected</div>
          <div className="text-sm text-muted-foreground">
            An unusual spike has been detected in this metric.
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-w-xs">
        <div className="font-medium">Spike Analysis</div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Metric:</span>
            <span className="font-medium">{details.metricName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current:</span>
            <span className="font-medium">{details.currentValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Baseline:</span>
            <span className="font-medium">{details.baselineValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Change:</span>
            <span className={cn(
              "font-medium",
              details.changePercent > 0 ? "text-green-500" : "text-red-500"
            )}>
              {details.changePercent > 0 ? '+' : ''}{details.changePercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Threshold:</span>
            <span className="font-medium">{details.threshold}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Severity:</span>
            <span className={cn(
              "font-medium uppercase",
              severity === 'high' ? "text-red-500" : 
              severity === 'medium' ? "text-orange-500" : "text-yellow-500"
            )}>
              {severity}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "absolute bottom-2 right-2 z-10 transition-all duration-200",
              "hover:scale-105 hover:shadow-lg",
              className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Badge 
              variant="destructive"
              className={cn(
                "text-xs font-bold px-2 py-1 cursor-pointer border",
                getSeverityColor(),
                isHovered && "ring-2 ring-white ring-opacity-50"
              )}
            >
              <div className="flex items-center space-x-1">
                {getSeverityIcon()}
                <span>{getSeverityText()}</span>
              </div>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="end"
          className="bg-background border-border shadow-lg"
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrencyDetailed } from '@/lib/utils';

interface FinancialTooltipProps {
  value: number | null | undefined;
  children: React.ReactNode;
  label?: string;
  showCompact?: boolean;
}

/**
 * Professional tooltip for financial values
 * Shows detailed value on hover with compact reference
 */
export default function FinancialTooltip({ 
  value, 
  children, 
  label = "Detailed Value",
  showCompact = true 
}: FinancialTooltipProps) {
  if (value === null || value === undefined || isNaN(value)) {
    return <>{children}</>;
  }

  const detailedValue = formatCurrencyDetailed(value);
  const compactValue = formatCurrencyDetailed(value).replace('$', '').replace(',', '');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="w-80">
          <div className="space-y-2">
            <div className="font-medium text-sm">{label}</div>
            <div className="space-y-1">
              <div className="font-semibold text-lg">{detailedValue}</div>
              {showCompact && (
                <div className="text-xs text-muted-foreground">
                  Compact: {formatCurrencyDetailed(value)}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Raw: {value.toLocaleString('en-US', { maximumFractionDigits: 8 })}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
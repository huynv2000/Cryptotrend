// Timeframe Selector Component

'use client';

import { useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TIMEFRAMES } from '@/lib/constants';
import type { TimeframeValue } from '@/lib/types';

interface TimeframeSelectorProps {
  value: TimeframeValue;
  onChange: (value: TimeframeValue) => void;
}

export default function TimeframeSelector({ 
  value, 
  onChange 
}: TimeframeSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const selectedTimeframe = TIMEFRAMES.find(t => t.value === value);
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-[140px] justify-between font-normal",
            "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {selectedTimeframe?.label || 'Select Timeframe'}
            </span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            open && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-[160px] bg-card border-border"
      >
        <div className="p-2 border-b border-border">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Select Timeframe
          </div>
          <div className="text-xs text-muted-foreground">
            Choose data time range
          </div>
        </div>
        
        <div className="max-h-[250px] overflow-y-auto">
          {TIMEFRAMES.map((timeframe) => {
            const isSelected = timeframe.value === value;
            
            return (
              <DropdownMenuItem
                key={timeframe.value}
                onClick={() => {
                  onChange(timeframe.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center space-x-2 cursor-pointer",
                  isSelected && "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex-1">
                  <div className="font-medium">{timeframe.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {timeframe.minutes} minutes
                  </div>
                </div>
                {isSelected && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
        
        <div className="p-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Data updates every 5 minutes
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
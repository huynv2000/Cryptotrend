// Blockchain Selector Component

'use client';

import { useState } from 'react';
import { ChevronDown, Bitcoin, Zap, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BLOCKCHAINS } from '@/lib/constants';
import type { BlockchainValue } from '@/lib/types';

interface BlockchainSelectorProps {
  value: BlockchainValue;
  onChange: (value: BlockchainValue) => void;
}

const blockchainIcons = {
  bitcoin: Bitcoin,
  ethereum: Layers, // Using Layers as fallback
  solana: Zap,
  'binance-smart-chain': Layers,
  polygon: Layers, // Using Layers as fallback
  avalanche: Layers,
  cardano: Layers,
  polkadot: Layers,
};

const blockchainColors = {
  bitcoin: 'text-orange-500',
  ethereum: 'text-blue-500',
  solana: 'text-purple-500',
  'binance-smart-chain': 'text-yellow-500',
  polygon: 'text-purple-400',
  avalanche: 'text-red-500',
  cardano: 'text-blue-400',
  polkadot: 'text-pink-500',
};

export default function BlockchainSelector({ 
  value, 
  onChange 
}: BlockchainSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const selectedBlockchain = BLOCKCHAINS.find(b => b.value === value);
  const IconComponent = blockchainIcons[value];
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-[180px] justify-between font-normal",
            "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <div className="flex items-center space-x-2">
            {IconComponent && (
              <IconComponent className={cn(
                "h-4 w-4",
                blockchainColors[value]
              )} />
            )}
            <span className="truncate">
              {selectedBlockchain?.label || 'Select Blockchain'}
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
        className="w-[200px] bg-card border-border"
      >
        <div className="p-2 border-b border-border">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Select Blockchain
          </div>
          <div className="text-xs text-muted-foreground">
            Choose network to monitor
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {BLOCKCHAINS.map((blockchain) => {
            const Icon = blockchainIcons[blockchain.value];
            const isSelected = blockchain.value === value;
            
            return (
              <DropdownMenuItem
                key={blockchain.value}
                onClick={() => {
                  onChange(blockchain.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center space-x-2 cursor-pointer",
                  isSelected && "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex items-center space-x-2 flex-1">
                  {Icon && (
                    <Icon className={cn(
                      "h-4 w-4",
                      blockchainColors[blockchain.value]
                    )} />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{blockchain.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {blockchain.symbol}
                    </div>
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
            {BLOCKCHAINS.length} networks available
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
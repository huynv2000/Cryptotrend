'use client';

import { useState } from 'react';
import SpikeWarningSimple from '@/components/dashboard/ui/SpikeWarningSimple';

export default function TestSpikeComponentPage() {
  const [showSpike, setShowSpike] = useState(false);
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Spike Component</h1>
        
        <div className="mb-6">
          <button
            onClick={() => setShowSpike(!showSpike)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md mb-4"
          >
            {showSpike ? 'Hide Spike' : 'Show Spike'}
          </button>
          <p className="text-sm text-muted-foreground">
            Current state: {showSpike ? 'Showing spike' : 'Hiding spike'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Test High Severity */}
          <div className="relative bg-card border border-border rounded-lg p-6 h-40">
            <h3 className="text-lg font-semibold mb-2">High Severity Test</h3>
            <p className="text-sm text-muted-foreground">
              This card should show a red HIGH spike warning
            </p>
            {showSpike && (
              <SpikeWarningSimple
                isSpike={true}
                severity="high"
              />
            )}
          </div>
          
          {/* Test Medium Severity */}
          <div className="relative bg-card border border-border rounded-lg p-6 h-40">
            <h3 className="text-lg font-semibold mb-2">Medium Severity Test</h3>
            <p className="text-sm text-muted-foreground">
              This card should show an orange MED spike warning
            </p>
            {showSpike && (
              <SpikeWarningSimple
                isSpike={true}
                severity="medium"
              />
            )}
          </div>
          
          {/* Test Low Severity */}
          <div className="relative bg-card border border-border rounded-lg p-6 h-40">
            <h3 className="text-lg font-semibold mb-2">Low Severity Test</h3>
            <p className="text-sm text-muted-foreground">
              This card should show a yellow LOW spike warning
            </p>
            {showSpike && (
              <SpikeWarningSimple
                isSpike={true}
                severity="low"
              />
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
          <div className="text-sm space-y-1">
            <p>• Component: SpikeWarningSimple</p>
            <p>• Position: absolute bottom-2 right-2</p>
            <p>• Z-index: 10</p>
            <p>• Badge variant: destructive</p>
          </div>
        </div>
      </div>
    </div>
  );
}
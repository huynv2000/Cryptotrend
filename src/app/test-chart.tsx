"use client"

import VolumeChart from '@/components/VolumeChart'

export default function TestChartPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Test Chart Page</h1>
        <VolumeChart 
          cryptoName="Bitcoin"
          currentPrice={102500}
        />
      </div>
    </div>
  )
}
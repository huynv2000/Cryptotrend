"use client"

import { useState, useEffect } from 'react'
import PriceVolumeChart from '@/components/PriceVolumeChart'

export default function TestVolumePage() {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Volume Chart Test Page</h1>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {isVisible ? 'Hide Chart' : 'Show Chart'}
          </button>
        </div>
        
        {isVisible && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Bitcoin Volume Chart</h2>
            <PriceVolumeChart 
              cryptoId="btc"
              cryptoName="Bitcoin"
              currentPrice={116627.00}
            />
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">Debug Information:</h3>
          <p>Chart Visibility: {isVisible ? 'Visible' : 'Hidden'}</p>
          <p>Crypto ID: btc</p>
          <p>Crypto Name: Bitcoin</p>
          <p>Current Price: $116,627.00</p>
        </div>
      </div>
    </div>
  )
}
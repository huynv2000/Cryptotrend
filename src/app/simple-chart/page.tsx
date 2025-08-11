'use client'

import { useState } from 'react'

export default function SimpleChartPage() {
  const [showChart, setShowChart] = useState(false)

  const openDirectChart = () => {
    window.open('/direct-access-chart.html', '_blank')
  }

  const openPythonChart = () => {
    window.open('http://localhost:8080/direct-access-chart.html', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📊 Volume Chart Access
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Phân tích khối lượng giao dịch 90 ngày với đường trung bình động 30 ngày
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Choose Access Method
              </h2>
              <p className="text-gray-600 mb-6">
                Select one of the following methods to view the chart
              </p>
            </div>

            {/* Method 1: Direct File Access */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800">
                  📁 Method 1: Direct File Access (Recommended)
                </h3>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Most Reliable
                </span>
              </div>
              <p className="text-blue-700 mb-4">
                This method opens the chart file directly without needing any server.
              </p>
              <div className="bg-white p-3 rounded border border-blue-200 mb-4">
                <p className="text-sm font-medium text-gray-800 mb-1">File Location:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  /home/z/my-project/direct-access-chart.html
                </code>
              </div>
              <button
                onClick={openDirectChart}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                📊 Open Chart Directly
              </button>
            </div>

            {/* Method 2: Python Server */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-800">
                  🌐 Method 2: Python Server Access
                </h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Server Required
                </span>
              </div>
              <p className="text-green-700 mb-4">
                This method uses the Python server running on port 8080.
              </p>
              <div className="bg-white p-3 rounded border border-green-200 mb-4">
                <p className="text-sm font-medium text-gray-800 mb-1">Server URL:</p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  http://localhost:8080/direct-access-chart.html
                </code>
              </div>
              <button
                onClick={openPythonChart}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                🚀 Open via Python Server
              </button>
            </div>

            {/* Manual Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                🔧 Manual Access Instructions
              </h3>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-1">Option A: Browser File Menu</h4>
                  <p className="text-sm text-gray-600">
                    1. Open browser → File → Open File<br/>
                    2. Navigate to: /home/z/my-project/direct-access-chart.html<br/>
                    3. Click Open
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-1">Option B: Direct URL</h4>
                  <p className="text-sm text-gray-600">
                    1. Copy this URL: <code className="bg-gray-100 px-1 rounded">http://localhost:8080/direct-access-chart.html</code><br/>
                    2. Paste into browser address bar<br/>
                    3. Press Enter
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-800 mb-1">Option C: File Manager</h4>
                  <p className="text-sm text-gray-600">
                    1. Open file manager<br/>
                    2. Go to: /home/z/my-project/<br/>
                    3. Double-click: direct-access-chart.html
                  </p>
                </div>
              </div>
            </div>

            {/* Chart Preview */}
            {showChart && (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Chart Preview</h3>
                <div className="h-96 bg-white rounded border">
                  <iframe
                    src="/direct-access-chart.html"
                    className="w-full h-full border-0 rounded"
                    title="Chart Preview"
                  />
                </div>
              </div>
            )}

            {/* Toggle Preview */}
            <div className="text-center">
              <button
                onClick={() => setShowChart(!showChart)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {showChart ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            💡 <strong>Tip:</strong> If buttons don't work, use the manual instructions above.
            The chart file is located at <code>/home/z/my-project/direct-access-chart.html</code>
          </p>
        </div>
      </div>
    </div>
  )
}
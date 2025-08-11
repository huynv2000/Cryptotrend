'use client'

import { useState, useEffect } from 'react'

export default function ChartAccessPage() {
  const [chartFiles, setChartFiles] = useState([
    { name: 'Direct Access Chart', path: '/direct-access-chart.html', description: 'Best option - works without server' },
    { name: 'Pure HTML Chart', path: '/pure-html-chart.html', description: 'Chart.js version with full features' },
    { name: 'Final Chart', path: '/final-chart.html', description: 'React + Recharts complete version' },
    { name: 'Status Page', path: '/status.html', description: 'Check system status' },
    { name: 'Chart Index', path: '/chart-index.html', description: 'View all chart options' },
    { name: 'Simple Test', path: '/simple-test.html', description: 'Basic test version' },
    { name: 'Debug Chart', path: '/debug-chart.html', description: 'Debug version with logging' },
  ])

  const [serverStatus, setServerStatus] = useState('checking')
  const [iframeUrl, setIframeUrl] = useState('')

  useEffect(() => {
    // Check if Python server is running
    checkServerStatus()
  }, [])

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:8080/status.html', { 
        method: 'HEAD',
        mode: 'no-cors'
      })
      setServerStatus('running')
    } catch (error) {
      setServerStatus('stopped')
    }
  }

  const openChart = (path: string) => {
    // Try to open in new window
    window.open(`http://localhost:8080${path}`, '_blank')
  }

  const loadInIframe = (path: string) => {
    setIframeUrl(`http://localhost:8080${path}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📊 Volume Chart Access Center
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Phân tích khối lượng giao dịch 90 ngày với đường trung bình động 30 ngày
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              🖥️ Workspace Access Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-blue-700"><strong>Next.js Workspace:</strong></p>
                <p className="text-blue-600">http://localhost:3000</p>
              </div>
              <div>
                <p className="text-blue-700"><strong>Python Chart Server:</strong></p>
                <p className="text-blue-600">http://localhost:8080</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-blue-700"><strong>Server Status:</strong></p>
              <p className={`font-semibold ${serverStatus === 'running' ? 'text-green-600' : 'text-red-600'}`}>
                {serverStatus === 'running' ? '✅ Running' : '❌ Stopped'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart Options */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              📋 Available Charts
            </h2>
            <div className="space-y-4">
              {chartFiles.map((file, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {file.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {file.description}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openChart(file.path)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Open in New Tab
                    </button>
                    <button
                      onClick={() => loadInIframe(file.path)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Preview Here
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Area */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              🔍 Chart Preview
            </h2>
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              {iframeUrl ? (
                <div className="h-[600px]">
                  <iframe
                    src={iframeUrl}
                    className="w-full h-full border-0 rounded-lg"
                    title="Chart Preview"
                  />
                </div>
              ) : (
                <div className="h-[600px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-lg">Select a chart to preview</p>
                    <p className="text-sm">Click "Preview Here" button on any chart</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Access */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                ⚡ Quick Access
              </h3>
              <p className="text-yellow-700 mb-3">
                If the buttons above don't work, try these direct approaches:
              </p>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded border">
                  <p className="font-medium text-gray-800">Method 1: Direct File Access</p>
                  <p className="text-sm text-gray-600">Open file directly in browser:</p>
                  <code className="text-xs bg-gray-100 p-1 rounded">
                    /home/z/my-project/direct-access-chart.html
                  </code>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="font-medium text-gray-800">Method 2: Manual URL</p>
                  <p className="text-sm text-gray-600">Copy this URL to browser:</p>
                  <code className="text-xs bg-gray-100 p-1 rounded">
                    http://localhost:8080/direct-access-chart.html
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            📖 How to Access Charts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium text-gray-800 mb-2">Method 1: Button Click</h4>
              <p className="text-sm text-gray-600">Click "Open in New Tab" or "Preview Here" buttons above</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium text-gray-800 mb-2">Method 2: Direct URL</h4>
              <p className="text-sm text-gray-600">Type URL directly in browser address bar</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h4 className="font-medium text-gray-800 mb-2">Method 3: File Browser</h4>
              <p className="text-sm text-gray-600">Open HTML file directly from file system</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
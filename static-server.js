const { createServer } = require('http');
const { readFileSync } = require('fs');
const { join } = require('path');

const port = 3000;
const hostname = '0.0.0.0';

// Simple static HTML server for testing
const server = createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crypto Analytics Dashboard Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-100">
    <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center">
                        <i class="fas fa-chart-line text-blue-600 text-2xl mr-3"></i>
                        <h1 class="text-2xl font-bold text-gray-900">Crypto Analytics Dashboard Pro</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <i class="fas fa-circle text-green-500 mr-2" style="font-size: 8px;"></i>
                            System Online
                        </span>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Status Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                            <i class="fas fa-bitcoin text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Bitcoin Price</p>
                            <p class="text-2xl font-semibold text-gray-900">$116,627</p>
                            <p class="text-sm text-green-600">+1.46%</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 text-green-600">
                            <i class="fas fa-chart-line text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Market Cap</p>
                            <p class="text-2xl font-semibold text-gray-900">$2.32T</p>
                            <p class="text-sm text-green-600">+2.1%</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                            <i class="fas fa-brain text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">AI Analysis</p>
                            <p class="text-2xl font-semibold text-gray-900">BUY</p>
                            <p class="text-sm text-blue-600">78% Confidence</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-orange-100 text-orange-600">
                            <i class="fas fa-exclamation-triangle text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Risk Level</p>
                            <p class="text-2xl font-semibold text-gray-900">MEDIUM</p>
                            <p class="text-sm text-yellow-600">Monitor</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Analysis Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">
                        <i class="fas fa-robot text-blue-600 mr-2"></i>
                        Z.AI Analysis
                    </h2>
                    <div class="space-y-4">
                        <div class="p-4 bg-blue-50 rounded-lg">
                            <h3 class="font-medium text-blue-900 mb-2">Recommendation</h3>
                            <p class="text-blue-800">MUA - Tích lũy dần với chiến lược DCA</p>
                        </div>
                        <div class="p-4 bg-green-50 rounded-lg">
                            <h3 class="font-medium text-green-900 mb-2">Confidence</h3>
                            <p class="text-green-800">78% - High confidence signal</p>
                        </div>
                        <div class="p-4 bg-yellow-50 rounded-lg">
                            <h3 class="font-medium text-yellow-900 mb-2">Timeframe</h3>
                            <p class="text-yellow-800">Trung hạn (2-4 tuần)</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">
                        <i class="fas fa-chart-area text-green-600 mr-2"></i>
                        Market Indicators
                    </h2>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">RSI (14)</span>
                            <span class="font-medium">58.5</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">Fear & Greed Index</span>
                            <span class="font-medium">67 (Greed)</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">MVRV Ratio</span>
                            <span class="font-medium">1.8</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600">Funding Rate</span>
                            <span class="font-medium">0.0125%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Trading Strategy -->
            <div class="bg-white rounded-lg shadow p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">
                    <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                    Trading Strategy
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center">
                        <div class="p-4 bg-green-100 rounded-lg mb-3">
                            <i class="fas fa-sign-in-alt text-green-600 text-2xl"></i>
                        </div>
                        <h3 class="font-medium text-gray-900 mb-2">Entry Point</h3>
                        <p class="text-sm text-gray-600">Vào lệnh theo đợt khi có tín hiệu xác nhận</p>
                    </div>
                    <div class="text-center">
                        <div class="p-4 bg-red-100 rounded-lg mb-3">
                            <i class="fas fa-sign-out-alt text-red-600 text-2xl"></i>
                        </div>
                        <h3 class="font-medium text-gray-900 mb-2">Stop Loss</h3>
                        <p class="text-sm text-gray-600">-15% từ giá mua hoặc hỗ trợ kỹ thuật</p>
                    </div>
                    <div class="text-center">
                        <div class="p-4 bg-blue-100 rounded-lg mb-3">
                            <i class="fas fa-trophy text-blue-600 text-2xl"></i>
                        </div>
                        <h3 class="font-medium text-gray-900 mb-2">Take Profit</h3>
                        <p class="text-sm text-gray-600">+25% từ giá mua hoặc kháng cự</p>
                    </div>
                </div>
            </div>

            <!-- Status Footer -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-blue-900 mb-1">Dashboard Status</h3>
                        <p class="text-blue-800">Crypto Analytics Dashboard Pro is running in test mode</p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <i class="fas fa-cog fa-spin mr-2"></i>
                            Configuring
                        </span>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Simulate real-time updates
        setInterval(() => {
            const priceElement = document.querySelector('.text-2xl');
            if (priceElement && priceElement.textContent.includes('$116,627')) {
                const variation = (Math.random() - 0.5) * 1000;
                const newPrice = 116627 + variation;
                priceElement.textContent = '$' + Math.floor(newPrice).toLocaleString();
            }
        }, 5000);
    </script>
</body>
</html>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Page Not Found</h1>');
  }
});

server.listen(port, hostname, () => {
  console.log(`🚀 Static Crypto Dashboard Server running at http://${hostname}:${port}`);
  console.log(`📊 Dashboard accessible in browser`);
});
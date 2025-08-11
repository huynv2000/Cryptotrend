#!/bin/bash

echo "🚀 Starting Crypto Analytics Dashboard Development Server..."

# Kill any existing processes on port 3000
echo "🔧 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "node\|npm\|tsx\|nodemon" 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

# Start the development server
echo "🚀 Starting development server..."
npm run dev

echo "✅ Development server started successfully!"
echo "📱 Open http://localhost:3000 in your browser"
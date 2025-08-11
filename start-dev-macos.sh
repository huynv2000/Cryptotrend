#!/bin/bash

echo "=== CryptoTrend Development Server Setup ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please navigate to the project directory."
    exit 1
fi

echo "✅ Found package.json in $(pwd)"
echo ""

# Check Node.js version
echo "📋 Checking Node.js version..."
node --version
npm --version
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

# Check database
echo ""
echo "📋 Checking database..."
if [ ! -d "db" ]; then
    mkdir -p db
    echo "✅ Created db directory"
fi

# Run database push
echo ""
echo "📋 Running database migration..."
npm run db:push
if [ $? -eq 0 ]; then
    echo "✅ Database migration successful"
else
    echo "❌ Database migration failed"
    exit 1
fi

# Check if port 3000 is available
echo ""
echo "📋 Checking port 3000..."
if lsof -ti:3000 > /dev/null; then
    echo "⚠️  Port 3000 is in use. Killing process..."
    lsof -ti:3000 | xargs kill -9
    echo "✅ Port 3000 freed"
else
    echo "✅ Port 3000 is available"
fi

# Start development server
echo ""
echo "🚀 Starting development server..."
echo "Visit http://localhost:3000 in your browser"
echo "Press Ctrl+C to stop the server"
echo ""

# Try to start the server
npm run dev